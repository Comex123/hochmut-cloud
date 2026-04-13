import {
  appendAuthStatus,
  buildDiscordAvatarUrl,
  cleanText,
  normalizeDiscordUser,
  safeNextUrl,
} from "./constants.js";
import { absoluteUrl } from "./http.js";
import { getEntry, listEntries } from "./db.js";

const encoder = new TextEncoder();

const hexToBytes = (value) =>
  Uint8Array.from((value || "").match(/.{1,2}/g) || [], (pair) => Number.parseInt(pair, 16));

export const oauthReady = (env) =>
  Boolean(
    cleanText(env.DISCORD_CLIENT_ID) &&
      cleanText(env.DISCORD_CLIENT_SECRET) &&
      cleanText(env.DISCORD_REDIRECT_URI) &&
      cleanText(env.SESSION_SECRET)
  );

export const buildDiscordLoginUrl = (env, state) => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.DISCORD_CLIENT_ID,
    scope: "identify",
    redirect_uri: env.DISCORD_REDIRECT_URI,
    state,
    prompt: "consent",
  });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
};

export const exchangeDiscordCode = async (code, env) => {
  const response = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: {
      authorization: `Basic ${btoa(`${env.DISCORD_CLIENT_ID}:${env.DISCORD_CLIENT_SECRET}`)}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: env.DISCORD_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error("discord_oauth_failed");
  }

  const payload = await response.json();
  return cleanText(payload.access_token);
};

export const fetchDiscordUser = async (accessToken) => {
  const response = await fetch("https://discord.com/api/v10/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("discord_user_failed");
  }

  const payload = await response.json();
  return normalizeDiscordUser({
    ...payload,
    avatar_url: buildDiscordAvatarUrl(payload),
  });
};

export const authStatusRedirect = (status) => appendAuthStatus("/archiv/#editor", status);

export const readInteractionPayload = async (request, env) => {
  const signature = cleanText(request.headers.get("X-Signature-Ed25519"));
  const timestamp = cleanText(request.headers.get("X-Signature-Timestamp"));
  const rawBody = await request.text();

  if (!signature || !timestamp || !cleanText(env.DISCORD_PUBLIC_KEY)) {
    throw new Error("missing_signature");
  }

  const verificationKey = await crypto.subtle.importKey(
    "raw",
    hexToBytes(env.DISCORD_PUBLIC_KEY),
    { name: "Ed25519" },
    false,
    ["verify"]
  );

  const isValid = await crypto.subtle.verify(
    { name: "Ed25519" },
    verificationKey,
    hexToBytes(signature),
    encoder.encode(`${timestamp}${rawBody}`)
  );

  if (!isValid) {
    throw new Error("invalid_signature");
  }

  return JSON.parse(rawBody);
};

const buildGearEmbed = (entry, origin) => {
  if (!entry) {
    return null;
  }

  const fields = [
    { name: "Familyname", value: entry.familyname || "-", inline: true },
    { name: "Klasse", value: entry.class || "-", inline: true },
    { name: "State", value: entry.state || "-", inline: true },
    { name: "AP / AAP", value: `${entry.ap ?? "-"} / ${entry.aap ?? "-"}`, inline: true },
    { name: "DP", value: `${entry.dp ?? "-"}`, inline: true },
    { name: "Gearscore", value: `${entry.gearscore ?? "-"}`, inline: true },
  ];

  if (entry.character_name || entry.character_level) {
    fields.push({
      name: "Charakter",
      value: [entry.character_name || "-", entry.character_level ? `St. ${entry.character_level}` : ""]
        .filter(Boolean)
        .join(" | "),
      inline: false,
    });
  }

  if (entry.player_time || entry.guild_activity) {
    fields.push({
      name: "Profil",
      value: [entry.player_time, entry.guild_activity].filter(Boolean).join(" | "),
      inline: false,
    });
  }

  if (entry.life_skills?.length) {
    fields.push({
      name: "Life Skills",
      value: entry.life_skills
        .slice(0, 3)
        .map((skill) =>
          [skill.name, skill.rank, skill.mastery !== null && skill.mastery !== undefined ? `${skill.mastery} Mastery` : ""]
            .filter(Boolean)
            .join(" | ")
        )
        .join("\n"),
      inline: false,
    });
  }

  const embed = {
    title: `Gear von ${entry.familyname || entry.discord_name || entry.discord_id}`,
    color: 0xc39b63,
    fields,
    footer: {
      text: `Aktualisiert ${entry.updated_at || "-"}`,
    },
  };

  const thumbnailUrl = absoluteUrl(origin, entry.portrait_url);
  if (thumbnailUrl) {
    embed.thumbnail = { url: thumbnailUrl };
  }

  if (entry.proof_url) {
    embed.image = { url: entry.proof_url };
  }

  if (entry.notes) {
    embed.description = entry.notes;
  }

  return embed;
};

const interactionResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
    },
  });

const commandOption = (payload, name) =>
  payload?.data?.options?.find((option) => option.name === name)?.value;

const resolveTargetDiscordId = (interaction) =>
  cleanText(commandOption(interaction, "user")) ||
  cleanText(commandOption(interaction, "discord_id")) ||
  cleanText(interaction.member?.user?.id) ||
  cleanText(interaction.user?.id);

export const handleInteraction = async (interaction, env, origin) => {
  if (interaction.type === 1) {
    return interactionResponse({ type: 1 });
  }

  if (interaction.type !== 2) {
    return interactionResponse({
      type: 4,
      data: {
        content: "Diese Discord-Interaktion wird noch nicht unterstuetzt.",
        flags: 64,
      },
    });
  }

  const commandName = interaction.data?.name;

  if (commandName === "gear_show") {
    const discordId = resolveTargetDiscordId(interaction);
    const entry = await getEntry(env.DB, discordId);

    if (!entry) {
      return interactionResponse({
        type: 4,
        data: {
          content: "Fuer diesen Discord-User wurde noch kein Gear-Eintrag gefunden.",
          flags: 64,
        },
      });
    }

    return interactionResponse({
      type: 4,
      data: {
        embeds: [buildGearEmbed(entry, origin)],
      },
    });
  }

  if (commandName === "gear_list") {
    const entries = (await listEntries(env.DB)).slice(0, 10);
    const description = entries.length
      ? entries
          .map(
            (entry, index) =>
              `**#${index + 1} ${entry.familyname || entry.discord_name || entry.discord_id}**\n${entry.class} | ${entry.state} | ${entry.ap}/${entry.aap}/${entry.dp} | GS ${entry.gearscore}`
          )
          .join("\n\n")
      : "Noch keine Geardaten vorhanden.";

    return interactionResponse({
      type: 4,
      data: {
        embeds: [
          {
            title: "Hochmut Rangliste",
            description,
            color: 0x7c5a3a,
          },
        ],
      },
    });
  }

  if (commandName === "gear_link") {
    return interactionResponse({
      type: 4,
      data: {
        content: `${absoluteUrl(origin, safeNextUrl("/archiv/#editor"))} - hier kannst du dein Gear im Web pflegen.`,
      },
    });
  }

  return interactionResponse({
    type: 4,
    data: {
      content: "Dieser Slash-Command ist in der Cloud-Version noch nicht hinterlegt.",
      flags: 64,
    },
  });
};
