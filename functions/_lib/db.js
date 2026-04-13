import { getPortraitUrl, normalizeLifeSkills } from "./constants.js";

const mapRowToEntry = (row) => {
  if (!row) {
    return null;
  }

  let parsedLifeSkills = [];
  try {
    parsedLifeSkills = row.life_skills_json ? JSON.parse(row.life_skills_json) : [];
  } catch {
    parsedLifeSkills = [];
  }

  const lifeSkills = normalizeLifeSkills(parsedLifeSkills);

  return {
    discord_id: String(row.discord_id),
    discord_name: row.discord_name || "",
    discord_avatar_url: row.discord_avatar_url || "",
    discord_link: row.discord_link || "",
    familyname: row.familyname || "",
    class: row.player_class || "",
    state: row.state || "",
    ap: row.ap ?? null,
    aap: row.aap ?? null,
    dp: row.dp ?? null,
    gearscore: row.gearscore ?? null,
    character_name: row.character_name || "",
    character_level: row.character_level ?? null,
    player_time: row.player_time || "",
    guild_activity: row.guild_activity || "",
    energy_points: row.energy_points || "",
    contribution_points: row.contribution_points || "",
    life_skills: lifeSkills,
    notes: row.notes || "",
    proof: row.proof_url || "",
    proof_url: row.proof_url || "",
    portrait_url: getPortraitUrl(row.player_class),
    updated_at: row.updated_at || "",
  };
};

export const listEntries = async (db) => {
  const result = await db
    .prepare("SELECT * FROM gears ORDER BY gearscore DESC, updated_at DESC")
    .all();
  return (result.results || []).map(mapRowToEntry);
};

export const getGearRecord = async (db, discordId) => {
  const result = await db
    .prepare("SELECT * FROM gears WHERE discord_id = ? LIMIT 1")
    .bind(String(discordId))
    .first();
  return result || null;
};

export const getEntry = async (db, discordId) => mapRowToEntry(await getGearRecord(db, discordId));

export const upsertGear = async (db, payload) => {
  await db
    .prepare(
      `INSERT INTO gears (
        discord_id,
        discord_name,
        discord_avatar_url,
        discord_link,
        familyname,
        player_class,
        state,
        ap,
        aap,
        dp,
        gearscore,
        character_name,
        character_level,
        player_time,
        guild_activity,
        energy_points,
        contribution_points,
        life_skills_json,
        notes,
        proof_url,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(discord_id) DO UPDATE SET
        discord_name = excluded.discord_name,
        discord_avatar_url = excluded.discord_avatar_url,
        discord_link = excluded.discord_link,
        familyname = excluded.familyname,
        player_class = excluded.player_class,
        state = excluded.state,
        ap = excluded.ap,
        aap = excluded.aap,
        dp = excluded.dp,
        gearscore = excluded.gearscore,
        character_name = excluded.character_name,
        character_level = excluded.character_level,
        player_time = excluded.player_time,
        guild_activity = excluded.guild_activity,
        energy_points = excluded.energy_points,
        contribution_points = excluded.contribution_points,
        life_skills_json = excluded.life_skills_json,
        notes = excluded.notes,
        proof_url = excluded.proof_url,
        updated_at = excluded.updated_at`
    )
    .bind(
      payload.discord_id,
      payload.discord_name,
      payload.discord_avatar_url,
      payload.discord_link,
      payload.familyname,
      payload.player_class,
      payload.state,
      payload.ap,
      payload.aap,
      payload.dp,
      payload.gearscore,
      payload.character_name,
      payload.character_level,
      payload.player_time,
      payload.guild_activity,
      payload.energy_points,
      payload.contribution_points,
      payload.life_skills_json,
      payload.notes,
      payload.proof_url,
      payload.updated_at
    )
    .run();
};

export const deleteGear = async (db, discordId) =>
  db.prepare("DELETE FROM gears WHERE discord_id = ?").bind(String(discordId)).run();
