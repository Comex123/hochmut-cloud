import { createOAuthStateCookie } from "../_lib/auth.js";
import { buildDiscordLoginUrl, oauthReady, authStatusRedirect } from "../_lib/discord.js";
import { cleanText, safeNextUrl } from "../_lib/constants.js";
import { redirectResponse } from "../_lib/http.js";

export const onRequestGet = async ({ request, env }) => {
  if (!oauthReady(env)) {
    return redirectResponse(authStatusRedirect("not_configured"));
  }

  const url = new URL(request.url);
  const nextUrl = safeNextUrl(url.searchParams.get("next"));
  const state = crypto.randomUUID().replaceAll("-", "");
  const stateCookie = await createOAuthStateCookie(state, nextUrl, env);

  return redirectResponse(buildDiscordLoginUrl(env, cleanText(state)), {
    "Set-Cookie": stateCookie,
  });
};
