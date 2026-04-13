export const VALID_STATES = ["Awakening", "Succession"];

export const BDO_CLASSES = [
  "Archer",
  "Berserker",
  "Corsair",
  "Dark Knight",
  "Deadeye",
  "Dosa",
  "Drakania",
  "Guardian",
  "Hashashin",
  "Kunoichi",
  "Lahn",
  "Maegu",
  "Maehwa",
  "Musa",
  "Mystic",
  "Ninja",
  "Nova",
  "Ranger",
  "Sage",
  "Scholar",
  "Shai",
  "Sorceress",
  "Striker",
  "Tamer",
  "Valkyrie",
  "Warrior",
  "Witch",
  "Wizard",
  "Woosa",
];

export const cleanText = (value) => String(value ?? "").trim();

export const calculateGearscore = (ap, aap, dp) =>
  Math.round((((Number(ap) + Number(aap)) / 2 + Number(dp)) * 100)) / 100;

export const cleanOptionalInt = (value, label) => {
  const cleaned = cleanText(value);
  if (!cleaned) {
    return null;
  }

  const parsed = Number.parseInt(cleaned, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`${label} muss eine ganze Zahl sein.`);
  }

  return parsed;
};

export const cleanRequiredInt = (value, label) => {
  const parsed = cleanOptionalInt(value, label);
  if (parsed === null) {
    throw new Error(`${label} ist erforderlich.`);
  }
  return parsed;
};

export const normalizeState = (value) => {
  const lowered = cleanText(value).toLowerCase();
  if (lowered === "awakening") {
    return "Awakening";
  }
  if (lowered === "succession") {
    return "Succession";
  }
  throw new Error("State muss Awakening oder Succession sein.");
};

export const normalizeLifeSkills = (rawSkills) =>
  (Array.isArray(rawSkills) ? rawSkills : [])
    .map((skill) => {
      if (!skill || typeof skill !== "object") {
        return null;
      }

      const name = cleanText(skill.name);
      const rank = cleanText(skill.rank);
      const mastery =
        typeof skill.mastery === "number"
          ? skill.mastery
          : cleanText(skill.mastery).match(/^\d+$/)
            ? Number.parseInt(cleanText(skill.mastery), 10)
            : null;

      if (!name && !rank && mastery === null) {
        return null;
      }

      return { name, rank, mastery };
    })
    .filter(Boolean);

export const lifeSkillsFromFormData = (formData) => {
  const items = [];

  for (let index = 1; index <= 3; index += 1) {
    const name = cleanText(formData.get(`life_skill_${index}_name`));
    const rank = cleanText(formData.get(`life_skill_${index}_rank`));
    const mastery = cleanOptionalInt(formData.get(`life_skill_${index}_mastery`), `Life Skill ${index} Mastery`);

    if (!name && !rank && mastery === null) {
      continue;
    }

    items.push({ name, rank, mastery });
  }

  return items;
};

export const isHttpUrl = (value) => {
  const text = cleanText(value);
  if (!text) {
    return false;
  }

  try {
    const parsed = new URL(text);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const safeNextUrl = (value) => {
  const text = cleanText(value);
  if (text.startsWith("/")) {
    return text;
  }
  return "/archiv/#editor";
};

export const appendAuthStatus = (targetUrl, status) => {
  const url = new URL(targetUrl, "https://hochmut.local");
  url.searchParams.set("auth", status);
  return `${url.pathname}${url.search}${url.hash}`;
};

export const buildDiscordAvatarUrl = (userData) => {
  const userId = cleanText(userData?.id);
  const avatarHash = cleanText(userData?.avatar);
  if (!userId || !avatarHash) {
    return "";
  }
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=128`;
};

export const normalizeDiscordUser = (userData) => ({
  id: cleanText(userData?.id),
  username: cleanText(userData?.username),
  display_name: cleanText(userData?.global_name) || cleanText(userData?.username),
  avatar_url: buildDiscordAvatarUrl(userData),
});

export const getPortraitUrl = (className) => {
  const normalized = cleanText(className);
  if (!normalized) {
    return "";
  }
  return "";
};
