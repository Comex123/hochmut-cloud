import { getSessionUser } from "../_lib/auth.js";
import { cleanText } from "../_lib/constants.js";
import { jsonError, jsonResponse } from "../_lib/http.js";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const MAX_FILE_SIZE = 8 * 1024 * 1024;

const fileExtensionFromType = (type) => {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpg":
    case "image/jpeg":
    default:
      return "jpg";
  }
};

const buildPublicUrl = (baseUrl, key) => {
  const trimmedBase = String(baseUrl || "").trim().replace(/\/+$/, "");
  const trimmedKey = String(key || "").trim().replace(/^\/+/, "");
  return `${trimmedBase}/${trimmedKey}`;
};

export const onRequestPost = async ({ request, env }) => {
  const sessionUser = await getSessionUser(request, env);
  if (!sessionUser) {
    return jsonError("Bitte zuerst mit Discord anmelden.", 401);
  }

  if (!env.PROOFS) {
    return jsonError("R2-Binding 'PROOFS' fehlt. Bitte in Cloudflare unter Pages > Settings > Bindings hinzufuegen.", 500);
  }

  const publicBaseUrl = cleanText(env.PROOFS_PUBLIC_BASE_URL);
  if (!publicBaseUrl.startsWith("http://") && !publicBaseUrl.startsWith("https://")) {
    return jsonError("Variable PROOFS_PUBLIC_BASE_URL fehlt oder ist ungueltig.", 500);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("Keine Bilddatei empfangen.", 400);
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return jsonError("Nur PNG, JPG oder WEBP sind erlaubt.", 415);
  }

  if (file.size <= 0) {
    return jsonError("Die Datei ist leer.", 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return jsonError("Die Datei ist zu gross. Bitte maximal 8 MB hochladen.", 413);
  }

  const discordId = cleanText(sessionUser.id);
  const safeName = cleanText(file.name)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const extension = fileExtensionFromType(file.type);
  const timestamp = Date.now();
  const key = `${discordId}/${timestamp}-${safeName || "proof"}.${extension}`;

  await env.PROOFS.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type,
    },
    customMetadata: {
      discordId,
    },
  });

  return jsonResponse({
    ok: true,
    key,
    proofUrl: buildPublicUrl(publicBaseUrl, key),
  });
};