import { cleanText, safeNextUrl } from "./constants.js";

const SESSION_COOKIE = "hochmut_session";
const OAUTH_STATE_COOKIE = "hochmut_oauth";
const SESSION_MAX_AGE = 60 * 60 * 24 * 14;
const STATE_MAX_AGE = 60 * 15;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bytesToBase64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const base64UrlToBytes = (value) => {
  const normalized = `${value}`.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const timingSafeEqual = (left, right) => {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
};

const parseCookies = (headerValue) =>
  Object.fromEntries(
    (headerValue || "")
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const separator = item.indexOf("=");
        if (separator === -1) {
          return [item, ""];
        }
        return [item.slice(0, separator), item.slice(separator + 1)];
      })
  );

const getSigningKey = async (env) => {
  const secret = cleanText(env.SESSION_SECRET);
  if (!secret) {
    throw new Error("SESSION_SECRET fehlt.");
  }

  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
};

const signText = async (text, env) => {
  const key = await getSigningKey(env);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(text));
  return bytesToBase64Url(new Uint8Array(signature));
};

const issueSignedToken = async (payload, env) => {
  const body = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await signText(body, env);
  return `${body}.${signature}`;
};

const readSignedToken = async (token, env) => {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [body, signature] = token.split(".", 2);
  const expected = await signText(body, env);
  if (!timingSafeEqual(signature, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(decoder.decode(base64UrlToBytes(body)));
    if (parsed.exp && parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const buildCookie = (name, value, { maxAge = SESSION_MAX_AGE, httpOnly = true } = {}) =>
  `${name}=${value}; Path=/; Max-Age=${maxAge}${httpOnly ? "; HttpOnly" : ""}; Secure; SameSite=Lax`;

export const createSessionCookie = async (user, env) =>
  buildCookie(
    SESSION_COOKIE,
    await issueSignedToken(
      {
        user,
        exp: Date.now() + SESSION_MAX_AGE * 1000,
      },
      env
    )
  );

export const clearSessionCookie = () =>
  `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

export const getSessionUser = async (request, env) => {
  try {
    const cookies = parseCookies(request.headers.get("cookie"));
    const payload = await readSignedToken(cookies[SESSION_COOKIE], env);
    return payload?.user?.id ? payload.user : null;
  } catch {
    return null;
  }
};

export const createOAuthStateCookie = async (state, nextUrl, env) =>
  buildCookie(
    OAUTH_STATE_COOKIE,
    await issueSignedToken(
      {
        state,
        next: safeNextUrl(nextUrl),
        exp: Date.now() + STATE_MAX_AGE * 1000,
      },
      env
    ),
    { maxAge: STATE_MAX_AGE }
  );

export const clearOAuthStateCookie = () =>
  `${OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

export const getOAuthState = async (request, env) => {
  try {
    const cookies = parseCookies(request.headers.get("cookie"));
    return await readSignedToken(cookies[OAUTH_STATE_COOKIE], env);
  } catch {
    return null;
  }
};
