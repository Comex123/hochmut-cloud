import {
  BDO_CLASSES,
  calculateGearscore,
  cleanOptionalInt,
  cleanRequiredInt,
  cleanText,
  isHttpUrl,
  lifeSkillsFromFormData,
  normalizeState,
} from "../../_lib/constants.js";
import { getSessionUser } from "../../_lib/auth.js";
import { getEntry, getGearRecord, listEntries, upsertGear } from "../../_lib/db.js";
import { jsonError, jsonResponse } from "../../_lib/http.js";

const publicDbError = (error) =>
  error?.code === "missing_db_binding"
    ? "Cloudflare D1 ist im Pages-Projekt noch nicht als Binding 'DB' verbunden. Bitte unter Einstellungen > Bindungen die D1-Datenbank an 'DB' binden und neu bereitstellen."
    : "Die Geardaten konnten gerade nicht geladen werden.";

export const onRequestGet = async ({ env }) => {
  try {
    const items = await listEntries(env.DB);
    return jsonResponse({ count: items.length, items });
  } catch (error) {
    return jsonError(publicDbError(error), error?.code === "missing_db_binding" ? 500 : 500);
  }
};

export const onRequestPost = async ({ request, env }) => {
  const sessionUser = await getSessionUser(request, env);
  if (!sessionUser) {
    return jsonError("Bitte zuerst mit Discord anmelden, bevor du in der Cloud speichern kannst.", 401);
  }

  const formData = await request.formData();
  const proofFile = formData.get("proof_file");
  if (proofFile instanceof File && proofFile.size > 0) {
    return jsonError(
      "In der kostenlosen Cloud-Version bitte einen Proof-Link verwenden. Datei-Uploads bleiben in der lokalen Python-Version.",
      422
    );
  }

  const discordId = cleanText(sessionUser.id);
  let existing;
  try {
    existing = await getGearRecord(env.DB, discordId);
  } catch (error) {
    return jsonError(publicDbError(error), error?.code === "missing_db_binding" ? 500 : 500);
  }
  const proofLink = cleanText(formData.get("proof_link"));
  const clearProof = ["1", "true", "yes", "on"].includes(cleanText(formData.get("clear_proof")).toLowerCase());

  const playerClass = cleanText(formData.get("player_class"));
  if (!BDO_CLASSES.includes(playerClass)) {
    return jsonError("Bitte eine gueltige BDO-Klasse auswaehlen.");
  }

  if (proofLink && !isHttpUrl(proofLink)) {
    return jsonError("Proof-Link muss mit http:// oder https:// beginnen.");
  }

  let state;
  let ap;
  let aap;
  let dp;
  let characterLevel;
  let lifeSkills;

  try {
    state = normalizeState(formData.get("state"));
    ap = cleanRequiredInt(formData.get("ap"), "AP");
    aap = cleanRequiredInt(formData.get("aap"), "AAP");
    dp = cleanRequiredInt(formData.get("dp"), "DP");
    characterLevel = cleanOptionalInt(formData.get("character_level"), "Stufe");
    lifeSkills = lifeSkillsFromFormData(formData);
  } catch (error) {
    return jsonError(error.message);
  }

  const proofUrl = clearProof ? "" : proofLink || existing?.proof_url || "";
  const payload = {
    discord_id: discordId,
    discord_name: cleanText(sessionUser.display_name || sessionUser.username),
    discord_avatar_url: cleanText(sessionUser.avatar_url),
    discord_link: cleanText(formData.get("discord_link")) || `https://discord.com/users/${discordId}`,
    familyname: cleanText(formData.get("familyname")),
    player_class: playerClass,
    state,
    ap,
    aap,
    dp,
    gearscore: calculateGearscore(ap, aap, dp),
    character_name: cleanText(formData.get("character_name")),
    character_level: characterLevel,
    player_time: cleanText(formData.get("player_time")),
    guild_activity: cleanText(formData.get("guild_activity")),
    energy_points: cleanText(formData.get("energy_points")),
    contribution_points: cleanText(formData.get("contribution_points")),
    life_skills_json: JSON.stringify(lifeSkills),
    notes: cleanText(formData.get("notes")),
    proof_url: proofUrl,
    updated_at: new Date().toISOString(),
  };

  try {
    await upsertGear(env.DB, payload);
    const item = await getEntry(env.DB, discordId);

    return jsonResponse({
      message: "Eintrag gespeichert. Cloudflare D1 und Discord-App sind jetzt im gleichen Stand.",
      item,
    });
  } catch (error) {
    return jsonError(publicDbError(error), error?.code === "missing_db_binding" ? 500 : 500);
  }
};
