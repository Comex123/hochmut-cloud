import { BDO_CLASSES, VALID_STATES, cleanText } from "../_lib/constants.js";
import { jsonResponse } from "../_lib/http.js";

export const onRequestGet = async ({ env }) =>
  jsonResponse({
    guild_name: cleanText(env.GUILD_NAME) || "Hochmut",
    discord_invite: cleanText(env.DISCORD_INVITE),
    states: VALID_STATES,
    classes: BDO_CLASSES,
    data_file_label: "Cloudflare D1",
    proofs_dir_label: env.PROOFS ? "Cloudflare R2 oder Proof-Link" : "Proof-Link oder interner Fallback",
    supports_proof_upload: true,
    proof_storage: env.PROOFS ? "r2" : "inline",
    supports_scan: true,
  });
