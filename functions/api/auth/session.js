import { getSessionUser } from "../../_lib/auth.js";
import { jsonResponse } from "../../_lib/http.js";
import { oauthReady } from "../../_lib/discord.js";

export const onRequestGet = async ({ request, env }) => {
  const ready = oauthReady(env);
  const user = ready ? await getSessionUser(request, env) : null;

  return jsonResponse({
    oauth_ready: ready,
    user,
    login_url: "/auth/discord?next=%2Farchiv%2F%23editor",
    logout_url: "/auth/logout?next=%2Farchiv%2F%23editor",
  });
};
