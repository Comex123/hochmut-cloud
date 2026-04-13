import {
  clearOAuthStateCookie,
  createSessionCookie,
  getOAuthState,
} from "../../_lib/auth.js";
import {
  authStatusRedirect,
  exchangeDiscordCode,
  fetchDiscordUser,
  oauthReady,
} from "../../_lib/discord.js";
import { appendAuthStatus, cleanText } from "../../_lib/constants.js";
import { redirectResponse } from "../../_lib/http.js";

export const onRequestGet = async ({ request, env }) => {
  if (!oauthReady(env)) {
    return redirectResponse(authStatusRedirect("not_configured"));
  }

  const url = new URL(request.url);
  if (url.searchParams.get("error")) {
    return redirectResponse(authStatusRedirect("access_denied"), {
      "Set-Cookie": clearOAuthStateCookie(),
    });
  }

  const stateCookie = await getOAuthState(request, env);
  const incomingState = cleanText(url.searchParams.get("state"));
  const code = cleanText(url.searchParams.get("code"));

  if (!stateCookie?.state || stateCookie.state !== incomingState) {
    return redirectResponse(authStatusRedirect("state_mismatch"), {
      "Set-Cookie": clearOAuthStateCookie(),
    });
  }

  if (!code) {
    return redirectResponse(authStatusRedirect("missing_code"), {
      "Set-Cookie": clearOAuthStateCookie(),
    });
  }

  try {
    const accessToken = await exchangeDiscordCode(code, env);
    const user = await fetchDiscordUser(accessToken);
    const sessionCookie = await createSessionCookie(user, env);
    const nextUrl = appendAuthStatus(stateCookie.next || "/archiv/#editor", "connected");
    const headers = new Headers();
    headers.append("Set-Cookie", clearOAuthStateCookie());
    headers.append("Set-Cookie", sessionCookie);

    return redirectResponse(nextUrl, headers);
  } catch {
    return redirectResponse(authStatusRedirect("discord_unavailable"), {
      "Set-Cookie": clearOAuthStateCookie(),
    });
  }
};
