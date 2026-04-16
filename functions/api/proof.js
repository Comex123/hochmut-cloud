import { getGearRecord } from "../_lib/db.js";

const DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i;
const R2_PROOF_PATTERN = /^r2:(.+)$/i;

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

const r2Missing = () =>
  new Response("Proof-Speicher nicht verbunden.", {
    status: 500,
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

export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const discordId = String(url.searchParams.get("id") || "").trim();
  if (!discordId) {
    return notFound();
  }

  const row = await getGearRecord(env.DB, discordId);
  const proofValue = String(row?.proof_url || "").trim();
  const match = proofValue.match(DATA_URL_PATTERN);
  const r2Match = proofValue.match(R2_PROOF_PATTERN);

  if (!match) {
    if (!r2Match) {
      return notFound();
    }

    if (!env.PROOFS) {
      return r2Missing();
    }

    const object = await env.PROOFS.get(String(r2Match[1] || "").trim());
    if (!object) {
      return notFound();
    }

    return new Response(object.body, {
      status: 200,
      headers: {
        "content-type": object.httpMetadata?.contentType || "application/octet-stream",
        "cache-control": "public, max-age=300",
      },
    });
  }

  const [, contentType, base64] = match;
  return binaryResponse(decodeBase64(base64), contentType.toLowerCase());
};
