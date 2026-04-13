CREATE TABLE IF NOT EXISTS gears (
    discord_id TEXT PRIMARY KEY,
    discord_name TEXT NOT NULL DEFAULT '',
    discord_avatar_url TEXT NOT NULL DEFAULT '',
    discord_link TEXT NOT NULL DEFAULT '',
    familyname TEXT NOT NULL DEFAULT '',
    player_class TEXT NOT NULL,
    state TEXT NOT NULL,
    ap INTEGER NOT NULL,
    aap INTEGER NOT NULL,
    dp INTEGER NOT NULL,
    gearscore REAL NOT NULL,
    character_name TEXT NOT NULL DEFAULT '',
    character_level INTEGER,
    player_time TEXT NOT NULL DEFAULT '',
    guild_activity TEXT NOT NULL DEFAULT '',
    energy_points TEXT NOT NULL DEFAULT '',
    contribution_points TEXT NOT NULL DEFAULT '',
    life_skills_json TEXT NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT '',
    proof_url TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gears_gearscore_updated
ON gears (gearscore DESC, updated_at DESC);
