import { getGearRecord } from "../../_lib/db.js";

const DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i;

const binaryResponse = (bytes, contentType) =>
  new Response(bytes, {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=300",
    },
  });

const notFound = () =>
  new Response("Proof nicht gefunden.", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=UTF-8",
      "cache-control": "no-store",
    },
  });

const decodeBase64 = (value) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

export const onRequestGet = async ({ params, env }) => {
  const row = await getGearRecord(env.DB, params.discord_id);
  const proofValue = String(row?.proof_url || "").trim();
  const match = proofValue.match(DATA_URL_PATTERN);

  if (!match) {
    return notFound();
  }

  const [, contentType, base64] = match;
  return binaryResponse(decodeBase64(base64), contentType.toLowerCase());
};
