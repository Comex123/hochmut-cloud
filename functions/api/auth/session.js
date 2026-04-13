import { getSessionUser } from "../../_lib/auth.js";
import { cleanText } from "../../_lib/constants.js";
import { jsonResponse } from "../../_lib/http.js";
import { oauthReady } from "../../_lib/discord.js";

const requiredOauthFields = [
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "DISCORD_REDIRECT_URI",
  "SESSION_SECRET",
];

export const onRequestGet = async ({ request, env }) => {
  const ready = oauthReady(env);
  const user = ready ? await getSessionUser(request, env) : null;
  const missingOauthFields = requiredOauthFields.filter((fieldName) => !cleanText(env[fieldName]));

  return jsonResponse({
    oauth_ready: ready,
    missing_oauth_fields: missingOauthFields,
    user,
    login_url: "/auth/discord?next=%2Farchiv%2F%23editor",
    logout_url: "/auth/logout?next=%2Farchiv%2F%23editor",
  });
};
