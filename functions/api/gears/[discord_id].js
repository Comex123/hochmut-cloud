import { getSessionUser } from "../../_lib/auth.js";
import { deleteGear, getEntry } from "../../_lib/db.js";
import { jsonError, jsonResponse } from "../../_lib/http.js";

export const onRequestGet = async ({ params, env }) => {
  const item = await getEntry(env.DB, params.discord_id);
  if (!item) {
    return jsonError("Kein Eintrag fuer diese Discord-ID gefunden.", 404);
  }
  return jsonResponse({ item });
};

export const onRequestDelete = async ({ request, params, env }) => {
  const sessionUser = await getSessionUser(request, env);
  if (!sessionUser) {
    return jsonError("Bitte zuerst mit Discord anmelden.", 401);
  }

  if (String(sessionUser.id) !== String(params.discord_id)) {
    return jsonError("In der Cloud-Version darfst du nur deinen eigenen Eintrag loeschen.", 403);
  }

  const item = await getEntry(env.DB, params.discord_id);
  if (!item) {
    return jsonError("Kein Eintrag fuer diese Discord-ID gefunden.", 404);
  }

  await deleteGear(env.DB, params.discord_id);
  return jsonResponse({ message: "Eintrag geloescht." });
};
