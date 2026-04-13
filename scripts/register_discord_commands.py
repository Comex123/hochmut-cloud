from __future__ import annotations

import json
import os
from pathlib import Path

import requests
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]
COMMANDS_FILE = BASE_DIR / "discord-commands.json"


def main() -> None:
    load_dotenv()

    application_id = os.getenv("DISCORD_APPLICATION_ID", "").strip()
    bot_token = os.getenv("DISCORD_BOT_TOKEN", "").strip() or os.getenv("DISCORD_TOKEN", "").strip()
    guild_id = os.getenv("DISCORD_GUILD_ID", "").strip()

    if not application_id:
        raise SystemExit("DISCORD_APPLICATION_ID fehlt.")
    if not bot_token:
        raise SystemExit("DISCORD_BOT_TOKEN oder DISCORD_TOKEN fehlt.")

    commands = json.loads(COMMANDS_FILE.read_text(encoding="utf-8"))

    if guild_id:
        url = f"https://discord.com/api/v10/applications/{application_id}/guilds/{guild_id}/commands"
        scope_label = f"Guild {guild_id}"
    else:
        url = f"https://discord.com/api/v10/applications/{application_id}/commands"
        scope_label = "Global"

    response = requests.put(
        url,
        headers={
            "Authorization": f"Bot {bot_token}",
            "Content-Type": "application/json",
        },
        json=commands,
        timeout=30,
    )
    response.raise_for_status()

    created = response.json()
    print(f"{len(created)} Discord-Commands fuer {scope_label} registriert.")


if __name__ == "__main__":
    main()
