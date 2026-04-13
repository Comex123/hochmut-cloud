# Hochmut Cloudflare Version

Diese Variante ersetzt den dauerhaft verbundenen Discord-Bot durch eine kostenlose Cloud-App:

- statische Website auf Cloudflare Pages
- API und Discord-HTTP-Interactions ueber Pages Functions
- Geardaten in Cloudflare D1
- Discord-Login ueber OAuth

## Was diese Version schon kann

- Rangliste und Top-Eintrag oeffentlich anzeigen
- Eintrag pro Discord-User sicher per Discord-Login speichern
- Loeschen nur fuer den eigenen Discord-User
- Discord Slash-Commands ohne permanenten Gateway-Bot

## Bewusste Unterschiede zur lokalen Python-Version

- kein Datei-Upload fuer Proof-Bilder in der kostenlosen Cloud-Version
- kein serverseitiger Foto-Scan/OCR in dieser Cloud-Version
- Proofs werden als Bild-Link gespeichert

## 1. Cloudflare Pages Projekt anlegen

Lege in Cloudflare ein neues Pages-Projekt an und verbinde dein Repository.

Empfohlene Einstellungen:

- Root Directory: `cloudflare`
- Build command: leer lassen
- Build output directory: `.`

Alternativ lokal mit Wrangler:

```bash
wrangler pages deploy .
```

## 2. D1 Datenbank anlegen

Erstelle eine D1-Datenbank, zum Beispiel `hochmut-gears`.

Danach die IDs in [wrangler.toml](C:/Users/Daniel/Desktop/GearflexWeb/cloudflare/wrangler.toml) eintragen:

- `database_id`
- `preview_database_id`

Wichtig fuer Git-Deploys ueber Pages:

- im Pages-Projekt unter `Einstellungen` -> `Bindungen`
- `Hinzufuegen` -> `D1 database`
- Variablenname exakt `DB`
- deine D1-Datenbank auswaehlen

Wenn `/gear_link` funktioniert, aber `/gear_list` oder `/gear_show` nur ablaufen, fehlt fast immer genau diese `DB`-Bindung.

Migration anwenden:

```bash
wrangler d1 migrations apply DB --remote
```

Das Schema liegt in [0001_init.sql](C:/Users/Daniel/Desktop/GearflexWeb/cloudflare/db/0001_init.sql).

## 3. Cloudflare Variablen und Secrets setzen

Als Vars:

- `GUILD_NAME`
- `DISCORD_INVITE`

Als Secrets:

- `SESSION_SECRET`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `DISCORD_PUBLIC_KEY`

Wichtige Hinweise:

- `DISCORD_REDIRECT_URI` muss spaeter genau auf `https://deine-domain/auth/discord/callback` zeigen
- `DISCORD_PUBLIC_KEY` kommt aus dem Discord Developer Portal

## 4. Discord Developer Portal einstellen

In deiner Discord-App:

- Redirect URI setzen auf `https://deine-domain/auth/discord/callback`
- Interactions Endpoint URL setzen auf `https://deine-domain/api/discord/interactions`

Die Cloud-Version nutzt dann HTTP Interactions statt eines dauerhaften Gateway-Bots.

## 5. Slash-Commands registrieren

Lege lokal folgende Variablen fest:

- `DISCORD_APPLICATION_ID`
- `DISCORD_BOT_TOKEN` oder `DISCORD_TOKEN`
- optional `DISCORD_GUILD_ID` fuer schnelle Guild-Commands

Dann ausfuehren:

```bash
python cloudflare/scripts/register_discord_commands.py
```

Die Command-Definitionen liegen in [discord-commands.json](C:/Users/Daniel/Desktop/GearflexWeb/cloudflare/discord-commands.json).

## 6. Fertig testen

Nach dem Deploy:

- Startseite: `/`
- Archiv: `/archiv/`
- Discord Login: `/auth/discord`
- Interaction Endpoint: `/api/discord/interactions`

Wenn alles stimmt, koennen Mitglieder:

- die Rangliste sehen
- sich mit Discord anmelden
- ihren eigenen Eintrag im Web pflegen
- Slash-Commands in Discord nutzen
