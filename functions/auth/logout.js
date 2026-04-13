import { clearOAuthStateCookie, clearSessionCookie } from "../_lib/auth.js";
import { safeNextUrl } from "../_lib/constants.js";
import { redirectResponse } from "../_lib/http.js";

export const onRequestGet = async ({ request }) => {
  const url = new URL(request.url);
  const nextUrl = safeNextUrl(url.searchParams.get("next"));
  const headers = new Headers();
  headers.append("Set-Cookie", clearSessionCookie());
  headers.append("Set-Cookie", clearOAuthStateCookie());

  return redirectResponse(nextUrl, headers);
};
