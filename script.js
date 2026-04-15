const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const revealItems = document.querySelectorAll(".reveal");
const currentYear = document.querySelector("#current-year");

const guildNameTargets = [
  document.querySelector("#guild-name"),
  document.querySelector("#footer-guild-name"),
];

const discordCta = document.querySelector("#discord-cta");
const refreshBoardButton = document.querySelector("#refresh-board");
const featuredEmbed = document.querySelector("#featured-embed");
const heroPreviewList = document.querySelector("#hero-preview-list");
const leaderboardGrid = document.querySelector("#leaderboard-grid");
const emptyState = document.querySelector("#empty-state");

const statCount = document.querySelector("#stat-count");
const statTopScore = document.querySelector("#stat-top-score");
const statAverageScore = document.querySelector("#stat-average-score");
const summaryClass = document.querySelector("#summary-class");
const summaryUpdated = document.querySelector("#summary-updated");
const summaryProofs = document.querySelector("#summary-proofs");

const dataFileLabel = document.querySelector("#data-file-label");
const proofsDirLabel = document.querySelector("#proofs-dir-label");
const discordStatusLabel = document.querySelector("#discord-status-label");

const form = document.querySelector("#gear-form");
const authStatusLabel = document.querySelector("#auth-status-label");
const authDescription = document.querySelector("#auth-description");
const authUser = document.querySelector("#auth-user");
const discordLoginLink = document.querySelector("#discord-login-link");
const discordLogoutLink = document.querySelector("#discord-logout-link");
const heroLoginLink = document.querySelector("#hero-login-link");
const loadMyEntryButton = document.querySelector("#load-my-entry");
const discordIdInput = document.querySelector("#discord-id");
const discordIdHelp = document.querySelector("#discord-id-help");
const discordNameInput = document.querySelector("#discord-name");
const discordNameHelp = document.querySelector("#discord-name-help");
const discordLinkInput = document.querySelector("#discord-link");
const familynameInput = document.querySelector("#familyname");
const playerClassSelect = document.querySelector("#player-class");
const stateSelect = document.querySelector("#state");
const apInput = document.querySelector("#ap");
const aapInput = document.querySelector("#aap");
const dpInput = document.querySelector("#dp");
const characterNameInput = document.querySelector("#character-name");
const characterLevelInput = document.querySelector("#character-level");
const playerTimeInput = document.querySelector("#player-time");
const guildActivityInput = document.querySelector("#guild-activity");
const energyPointsInput = document.querySelector("#energy-points");
const contributionPointsInput = document.querySelector("#contribution-points");
const proofFileInput = document.querySelector("#proof-file");
const proofDataUrlInput = document.querySelector("#proof-data-url");
const proofDropzone = document.querySelector("#proof-dropzone");
const proofDropStatus = document.querySelector("#proof-drop-status");
const proofUploadHelp = document.querySelector("#proof-upload-help");
const scanProofButton = document.querySelector("#scan-proof");
const proofLinkInput = document.querySelector("#proof-link");
const clearProofInput = document.querySelector("#clear-proof");
const notesInput = document.querySelector("#notes");
const liveGearscore = document.querySelector("#live-gearscore");
const formFeedback = document.querySelector("#form-feedback");
const scanResultCard = document.querySelector("#scan-result-card");
const scanResultTitle = document.querySelector("#scan-result-title");
const scanResultCopy = document.querySelector("#scan-result-copy");
const scanConfidence = document.querySelector("#scan-confidence");
const scanStatRow = document.querySelector("#scan-stat-row");
const scanMeta = document.querySelector("#scan-meta");
const scanWarning = document.querySelector("#scan-warning");

const loadEntryButton = document.querySelector("#load-entry");
const resetFormButton = document.querySelector("#reset-form");
const deleteEntryButton = document.querySelector("#delete-entry");

const editorModeTitle = document.querySelector("#editor-mode-title");
const editorModeText = document.querySelector("#editor-mode-text");

const proofPreviewLabel = document.querySelector("#proof-preview-label");
const proofPreviewBody = document.querySelector("#proof-preview-body");
const lifeSkillInputs = Array.from({ length: 3 }, (_, index) => ({
  name: document.querySelector(`#life-skill-${index + 1}-name`),
  rank: document.querySelector(`#life-skill-${index + 1}-rank`),
  mastery: document.querySelector(`#life-skill-${index + 1}-mastery`),
}));

let entriesCache = [];
let currentLoadedId = "";
let currentPreviewObjectUrl = "";
let appCapabilities = {
  supports_proof_upload: true,
  supports_scan: true,
};
let authSession = {
  oauth_ready: false,
  missing_oauth_fields: [],
  user: null,
  login_url: "/auth/discord?next=%2Farchiv%2F%23editor",
  logout_url: "/auth/logout?next=%2Farchiv%2F%23editor",
};

const authQueryStatus = new URLSearchParams(window.location.search).get("auth");
const MAX_INLINE_PROOF_BYTES = 380 * 1024;
const inlineProofPattern = /^data:image\/(?:png|jpeg|jpg|webp);base64,/i;
const OCR_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
const OCR_LANGUAGE = "deu+eng";
const OCR_MAX_SIDE = 2200;
const LIFE_SKILL_ALIASES = {
  Sammeln: ["Sammeln"],
  Fischfang: ["Fischfang"],
  Jagd: ["Jagd"],
  Kochen: ["Kochen"],
  Alchemie: ["Alchemie"],
  Verarbeitung: ["Verarbeitung", "Verarbeiten"],
  Abrichten: ["Abrichten"],
  Handel: ["Handel"],
  Anbau: ["Anbau"],
  Segeln: ["Segeln"],
  Warentausch: ["Warentausch"],
};
const LIFE_RANK_PATTERN = /\b(Guru|Meister|Fachmann|Kenner|Handwerker|Kunsthandwerker|Lehrling|Anfaenger|Anfänger|Geuebt|Geübt|Professionell)\s*([0-9IVXLC]+)?/i;

let tesseractScriptPromise = null;
let tesseractWorkerPromise = null;

const setText = (element, value) => {
  if (element) {
    element.textContent = value;
  }
};

const getDisplayName = (entry) => entry.familyname || entry.discord_name || entry.discord_id;

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const truncateText = (value, maxLength = 320) => {
  const text = String(value ?? "").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}...`;
};

const normalizeLifeSkills = (skills) =>
  (skills || []).filter((skill) => skill && (skill.name || skill.rank || skill.mastery !== null && skill.mastery !== undefined));

const fillLifeSkillInputs = (skills = []) => {
  lifeSkillInputs.forEach((row, index) => {
    const skill = skills[index] || {};
    row.name.value = skill.name || "";
    row.rank.value = skill.rank || "";
    row.mastery.value = skill.mastery ?? "";
  });
};

const buildProfileDetails = (entry) => {
  const energyContribution =
    entry.energy_points || entry.contribution_points
      ? `${entry.energy_points || "-"} / ${entry.contribution_points || "-"}`
      : "";

  return [
    ["Charakter", entry.character_name],
    ["Stufe", entry.character_level ? `St. ${entry.character_level}` : ""],
    ["Spielzeit", entry.player_time],
    ["Aktivitaet", entry.guild_activity],
    ["En./B.p.", energyContribution],
  ].filter(([, value]) => value);
};

const renderProfileBlock = (entry, modifier = "") => {
  const items = buildProfileDetails(entry);
  if (!items.length) {
    return "";
  }

  return `
    <section class="player-profile-block ${modifier}">
      <span class="player-block-label">Spielerprofil</span>
      <dl class="player-profile-grid">
        ${items
          .map(
            ([label, value]) => `
              <div>
                <dt>${escapeHtml(label)}</dt>
                <dd>${escapeHtml(value)}</dd>
              </div>
            `
          )
          .join("")}
      </dl>
    </section>
  `;
};

const renderLifeSkillBlock = (skills, modifier = "") => {
  const items = normalizeLifeSkills(skills);
  if (!items.length) {
    return "";
  }

  return `
    <section class="player-skill-block ${modifier}">
      <span class="player-block-label">Life Skills</span>
      <div class="player-skill-list">
        ${items
          .map((skill) => {
            const meta = [
              skill.rank || "",
              skill.mastery !== null && skill.mastery !== undefined ? `${skill.mastery} Mastery` : "",
            ]
              .filter(Boolean)
              .join(" | ");

            return `
              <article class="player-skill-chip">
                <strong>${escapeHtml(skill.name || "Skill")}</strong>
                <span>${escapeHtml(meta || "Wert hinterlegen")}</span>
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
};

const calculateGearscore = () => {
  const ap = Number(apInput.value || 0);
  const aap = Number(aapInput.value || 0);
  const dp = Number(dpInput.value || 0);
  return ((ap + aap) / 2 + dp).toFixed(2);
};

const updateLiveGearscore = () => {
  if (liveGearscore) {
    liveGearscore.textContent = `Gearscore: ${calculateGearscore()}`;
  }
};

const setFeedback = (message, tone = "") => {
  if (!formFeedback) {
    return;
  }
  formFeedback.textContent = message;
  formFeedback.classList.remove("success", "error");
  if (tone) {
    formFeedback.classList.add(tone);
  }
};

const setEditorMode = (title, text, loadedId = "") => {
  setText(editorModeTitle, title);
  setText(editorModeText, text);
  currentLoadedId = loadedId;
  if (deleteEntryButton) {
    deleteEntryButton.disabled = !loadedId;
  }
};

const releasePreviewObjectUrl = () => {
  if (currentPreviewObjectUrl) {
    URL.revokeObjectURL(currentPreviewObjectUrl);
    currentPreviewObjectUrl = "";
  }
};

const setProofPreview = (content, label) => {
  if (!proofPreviewLabel || !proofPreviewBody) {
    return;
  }
  proofPreviewLabel.textContent = label;
  proofPreviewBody.innerHTML = content;
};

const clearProofPreview = () => {
  releasePreviewObjectUrl();
  setProofPreview("<p>Waehle ein Bild oder lade einen vorhandenen Datensatz.</p>", "Kein Proof geladen");
};

const resetInlineProofData = () => {
  if (proofDataUrlInput) {
    proofDataUrlInput.value = "";
  }
};

const setProofDropState = (message) => {
  setText(proofDropStatus, message);
};

const syncProofDropState = (entry = null) => {
  if (!proofDropStatus) {
    return;
  }

  const selectedFile = proofFileInput?.files?.[0];
  if (selectedFile) {
    setProofDropState(selectedFile.name);
    return;
  }

  const inlineValue = proofDataUrlInput?.value?.trim();
  if (inlineProofPattern.test(inlineValue)) {
    setProofDropState("Proof-Foto bereit");
    return;
  }

  const proofValue = entry?.proof_url || proofLinkInput?.value?.trim();
  if (proofValue) {
    setProofDropState(proofValue.startsWith("data:image/") ? "Gespeichertes Proof-Foto" : "Proof-Link gesetzt");
    return;
  }

  setProofDropState("Noch kein Bild ausgewaehlt");
};

const dataUrlByteLength = (value) => {
  const text = String(value || "");
  const base64 = text.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
};

const readFileAsOptimizedProof = async (file) => {
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    throw new Error("Bitte ein Bild als PNG, JPG oder WEBP verwenden.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Das Proof-Bild konnte nicht gelesen werden."));
      element.src = objectUrl;
    });

    const targetWidths = [1480, 1260, 1040, 900];
    const qualities = [0.84, 0.76, 0.68, 0.58];
    let bestCandidate = "";

    for (const maxWidth of targetWidths) {
      const scale = Math.min(1, maxWidth / Math.max(image.naturalWidth || image.width, 1));
      const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
      const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Der Browser konnte das Proof-Bild nicht vorbereiten.");
      }
      context.drawImage(image, 0, 0, width, height);

      for (const quality of qualities) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        bestCandidate = dataUrl;
        if (dataUrlByteLength(dataUrl) <= MAX_INLINE_PROOF_BYTES) {
          return dataUrl;
        }
      }
    }

    if (bestCandidate && dataUrlByteLength(bestCandidate) <= MAX_INLINE_PROOF_BYTES * 1.35) {
      return bestCandidate;
    }

    throw new Error("Das Proof-Bild ist noch zu gross. Bitte einen kleineren Screenshot verwenden.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const assignProofFile = (file) => {
  if (!proofFileInput || !(file instanceof File)) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    setFeedback("Bitte nur Bilddateien als Proof hineinziehen.", "error");
    return;
  }

  const transfer = new DataTransfer();
  transfer.items.add(file);
  proofFileInput.files = transfer.files;
  resetInlineProofData();
  if (proofLinkInput) {
    proofLinkInput.value = "";
  }
  if (clearProofInput) {
    clearProofInput.checked = false;
  }
  handleLocalFilePreview();
};

const loadTesseractRuntime = async () => {
  if (window.Tesseract?.createWorker) {
    return window.Tesseract;
  }

  if (!tesseractScriptPromise) {
    tesseractScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-tesseract-runtime="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.Tesseract), { once: true });
        existing.addEventListener("error", () => reject(new Error("Die OCR-Bibliothek konnte nicht geladen werden.")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = OCR_SCRIPT_URL;
      script.async = true;
      script.dataset.tesseractRuntime = "true";
      script.onload = () => resolve(window.Tesseract);
      script.onerror = () => reject(new Error("Die OCR-Bibliothek konnte nicht geladen werden."));
      document.head.append(script);
    });
  }

  const runtime = await tesseractScriptPromise;
  if (!runtime?.createWorker) {
    throw new Error("Die OCR-Bibliothek ist nicht verfuegbar.");
  }
  return runtime;
};

const getOcrWorker = async () => {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = loadTesseractRuntime().then((runtime) => runtime.createWorker(OCR_LANGUAGE));
  }
  return tesseractWorkerPromise;
};

const loadImageElement = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Das Bild konnte nicht geladen werden."));
    };
    image.src = objectUrl;
  });

const buildOcrImage = async (file) => {
  const image = await loadImageElement(file);
  const longestSide = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height, 1);
  const scale = Math.min(2.4, Math.max(1, OCR_MAX_SIDE / longestSide));
  const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Das Bild konnte fuer OCR nicht vorbereitet werden.");
  }
  context.filter = "grayscale(1) contrast(1.35) brightness(1.05)";
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/png");
};

const normalizeOcrText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

const normalizeSearchText = (value) => normalizeOcrText(value).toLowerCase().replace(/[^a-z0-9]+/g, " ");

const getKnownClasses = () =>
  Array.from(playerClassSelect?.options || [])
    .map((option) => option.value)
    .filter(Boolean);

const detectClassFromText = (text) => {
  const normalizedText = normalizeSearchText(text);
  const matches = getKnownClasses().filter((className) => {
    const normalizedClass = normalizeSearchText(className);
    return normalizedClass && normalizedText.includes(normalizedClass);
  });
  return matches.sort((left, right) => right.length - left.length)[0] || "";
};

const detectStateFromText = (text) => {
  const normalizedText = normalizeSearchText(text);
  if (normalizedText.includes("awakening")) {
    return "Awakening";
  }
  if (normalizedText.includes("succession")) {
    return "Succession";
  }
  return "";
};

const extractNumberMatches = (text) => {
  const matches = [];
  const numberPattern = /\b\d{2,4}\b/g;
  let match;
  while ((match = numberPattern.exec(text))) {
    const value = Number.parseInt(match[0], 10);
    if (value >= 150 && value <= 600) {
      matches.push([match.index, value]);
    }
  }
  return matches;
};

const scoreTriplet = (ap, aap, dp) => {
  let score = 0;
  if (ap >= 180 && ap <= 400) {
    score += 3;
  }
  if (aap >= 180 && aap <= 400) {
    score += 3;
  }
  if (dp >= 250 && dp <= 600) {
    score += 3;
  }
  const difference = Math.abs(ap - aap);
  if (difference <= 60) {
    score += 2.5;
  } else if (difference <= 100) {
    score += 1;
  }
  if (dp >= Math.max(ap, aap) - 20) {
    score += 1;
  }
  return score;
};

const tripletContextBoost = (text, start, end) => {
  const windowText = text.slice(Math.max(0, start - 48), Math.min(text.length, end + 48)).toLowerCase();
  let boost = 0;
  if (windowText.includes("ak") || windowText.includes("ap") || windowText.includes("meine werte")) {
    boost += 0.9;
  }
  if (windowText.includes("erweck") || windowText.includes("aap")) {
    boost += 0.9;
  }
  if (windowText.includes("vk") || windowText.includes("dp") || windowText.includes("verteid")) {
    boost += 0.9;
  }
  return boost;
};

const guessGearTriplet = (text) => {
  const pairTripletMatch = text.match(/\b(\d{2,3})\s*\/\s*(\d{2,3})\s*(?:DP|VK)?\s*(\d{2,3})\b/i);
  if (pairTripletMatch) {
    return pairTripletMatch.slice(1, 4).map((value) => Number.parseInt(value, 10));
  }

  const valuesTripletMatch = text.match(/(?:meine werte|ap|ak).{0,40}?(\d{2,3}).{0,30}?(\d{2,3}).{0,30}?(\d{2,3})/i);
  if (valuesTripletMatch) {
    const triplet = valuesTripletMatch.slice(1, 4).map((value) => Number.parseInt(value, 10));
    if (triplet.every((value) => Number.isInteger(value))) {
      return triplet;
    }
  }

  const numberMatches = extractNumberMatches(text);
  const candidates = [];
  for (let index = 0; index <= numberMatches.length - 3; index += 1) {
    const [start, ap] = numberMatches[index];
    const [, aap] = numberMatches[index + 1];
    const [end, dp] = numberMatches[index + 2];
    const score = scoreTriplet(ap, aap, dp) + tripletContextBoost(text, start, end);
    candidates.push([score, [ap, aap, dp]]);
  }
  candidates.sort((left, right) => right[0] - left[0]);
  return candidates[0]?.[0] >= 7 ? candidates[0][1] : null;
};

const normalizePlaytime = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s*D\s*/gi, "D ")
    .replace(/\s*H\s*/gi, "H")
    .trim()
    .toUpperCase();

const extractProfileDetailsFromText = (text) => {
  const details = {
    familyname: "",
    character_name: "",
    character_level: null,
    player_time: "",
    energy_points: "",
    contribution_points: "",
  };

  const familyMatch = text.match(/Famil(?:ie|i[el]e)\s*[:\-]?\s*([A-Za-z0-9_]+)/i);
  if (familyMatch) {
    details.familyname = familyMatch[1].trim();
  }

  const levelNameMatches = Array.from(text.matchAll(/\bSt\.?\s*(\d{1,2})\s+([A-Za-z0-9_ ]{2,32})/gi))
    .map((match) => ({
      level: Number.parseInt(match[1], 10),
      name: String(match[2] || "")
        .replace(/\bFamil(?:ie|i[el]e)\b.*/i, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/ /g, "_"),
    }))
    .filter((item) => item.name && !item.name.toLowerCase().startsWith("famil"));
  if (levelNameMatches.length) {
    const best = levelNameMatches.sort((left, right) => right.name.length - left.name.length)[0];
    details.character_level = best.level;
    details.character_name = best.name;
  }

  const playtimeMatch = text.match(/\b(\d+\s*D\s*\d+\s*H)\b/i);
  if (playtimeMatch) {
    details.player_time = normalizePlaytime(playtimeMatch[1]);
  }

  const pairMatches = Array.from(text.matchAll(/\b(\d{1,4})\s*\/\s*(\d{1,4})\b/g)).map((match) => [
    Number.parseInt(match[1], 10),
    Number.parseInt(match[2], 10),
  ]);

  const energyCandidate = pairMatches
    .filter(([left, right]) => left >= 100 && right >= 100 && left <= 700 && right <= 700 && Math.abs(left - right) <= 60)
    .sort((left, right) => right[1] - left[1])[0];
  if (energyCandidate) {
    details.energy_points = String(Math.max(energyCandidate[0], energyCandidate[1]));
  }

  const contributionCandidate = pairMatches
    .filter(([left, right]) => left <= 100 && right >= 120 && right <= 800)
    .sort((left, right) => right[1] - left[1])[0];
  if (contributionCandidate) {
    details.contribution_points = String(Math.max(contributionCandidate[0], contributionCandidate[1]));
  }

  return details;
};

const normalizeRank = (rawRank, rawLevel) => {
  const title = String(rawRank || "").trim();
  const level = String(rawLevel || "").trim();
  if (!title) {
    return "";
  }
  const replacements = {
    guru: "Guru",
    meister: "Meister",
    fachmann: "Fachmann",
    kenner: "Kenner",
    handwerker: "Handwerker",
    kunsthandwerker: "Kunsthandwerker",
    lehrling: "Lehrling",
    anfaenger: "Anfaenger",
    anfänger: "Anfaenger",
    geuebt: "Geuebt",
    geübt: "Geuebt",
    professionell: "Professionell",
  };
  const normalizedTitle = replacements[title.toLowerCase()] || `${title.slice(0, 1).toUpperCase()}${title.slice(1).toLowerCase()}`;
  return `${normalizedTitle} ${level}`.trim();
};

const extractLifeSkillsFromText = (text) => {
  const normalizedText = normalizeOcrText(text);
  const occurrences = [];

  Object.entries(LIFE_SKILL_ALIASES).forEach(([skillName, aliases]) => {
    aliases.forEach((alias) => {
      const pattern = new RegExp(alias, "gi");
      let match;
      while ((match = pattern.exec(normalizedText))) {
        occurrences.push([match.index, skillName]);
      }
    });
  });

  occurrences.sort((left, right) => left[0] - right[0]);
  const results = [];
  const seen = new Set();

  occurrences.forEach(([start, skillName], index) => {
    if (seen.has(skillName)) {
      return;
    }
    const nextStart = occurrences[index + 1]?.[0] ?? normalizedText.length;
    const snippet = normalizedText.slice(start, Math.min(nextStart, start + 160));
    const rankMatch = snippet.match(LIFE_RANK_PATTERN);
    const masteryMatch = snippet.match(/\b(\d{2,4})\s*%?\b/g) || [];
    const masteryValue = masteryMatch
      .map((value) => Number.parseInt(value.replace("%", ""), 10))
      .find((value) => value >= 100 && value <= 2000) ?? null;

    results.push({
      name: skillName,
      rank: normalizeRank(rankMatch?.[1], rankMatch?.[2]),
      mastery: masteryValue,
    });
    seen.add(skillName);
  });

  return results
    .filter((skill) => skill.name && (skill.rank || skill.mastery !== null))
    .slice(0, 3);
};

const parseBrowserOcrResult = (text) => {
  const recognizedText = normalizeOcrText(text);
  const warnings = [];
  const triplet = guessGearTriplet(recognizedText);
  const details = extractProfileDetailsFromText(recognizedText);
  const lifeSkills = extractLifeSkillsFromText(recognizedText);
  const detectedClass = detectClassFromText(recognizedText);
  const detectedState = detectStateFromText(recognizedText);
  const [ap, aap, dp] = triplet || [null, null, null];
  const foundGear = [ap, aap, dp].every((value) => Number.isInteger(value));
  const confidenceScore = [
    foundGear ? 3 : 0,
    details.familyname ? 1 : 0,
    details.character_name ? 1 : 0,
    lifeSkills.length ? 1 : 0,
    detectedClass ? 1 : 0,
  ].reduce((sum, value) => sum + value, 0);

  if (!foundGear) {
    warnings.push("AP, AAP und DP bitte kurz pruefen oder manuell nachtragen.");
  }
  if (!details.familyname && !details.character_name) {
    warnings.push("Profilwerte wurden nur teilweise erkannt.");
  }

  return {
    ap,
    aap,
    dp,
    gearscore: foundGear ? (((ap + aap) / 2) + dp).toFixed(2) : null,
    familyname: details.familyname,
    class: detectedClass,
    state: detectedState,
    character_name: details.character_name,
    character_level: details.character_level,
    player_time: details.player_time,
    energy_points: details.energy_points,
    contribution_points: details.contribution_points,
    life_skills: lifeSkills,
    recognized_text: recognizedText,
    complete: foundGear,
    confidence: confidenceScore >= 5 ? "high" : confidenceScore >= 3 ? "medium" : "low",
    warnings,
  };
};

const clearScanResult = () => {
  if (!scanResultCard) {
    return;
  }
  scanResultCard.classList.add("hidden");
  setText(scanResultTitle, "Noch kein Foto gelesen");
  setText(scanResultCopy, "Lade einen Screenshot hoch und lies die Werte direkt ins Formular ein.");
  setText(scanConfidence, "-");
  if (scanStatRow) {
    scanStatRow.innerHTML = "";
  }
  setText(scanMeta, "");
  setText(scanWarning, "");
  if (scanWarning) {
    scanWarning.classList.add("hidden");
  }
};

const renderScanResult = (result, message) => {
  if (!scanResultCard || !scanStatRow) {
    return;
  }
  const items = [
    ["AP", result.ap],
    ["AAP", result.aap],
    ["DP", result.dp],
    ["Gearscore", result.gearscore],
    ["Family", result.familyname],
    ["Charakter", result.character_name],
    ["Stufe", result.character_level ? `St. ${result.character_level}` : ""],
    ["Spielzeit", result.player_time],
    ["Energie", result.energy_points],
    ["Beitrag", result.contribution_points],
    ["Klasse", result.class],
    ["State", result.state],
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");

  const confidenceLabels = {
    high: "klar erkannt",
    medium: "bitte pruefen",
    low: "teilweise erkannt",
  };

  scanResultCard.classList.remove("hidden");
  setText(scanResultTitle, result.complete ? "Werte uebernommen" : "Teilweise erkannt");
  setText(scanResultCopy, message);
  setText(scanConfidence, confidenceLabels[result.confidence] || "bitte pruefen");
  if (scanStatRow) {
    scanStatRow.innerHTML = items
    .map(
      ([label, value]) => `
        <div class="scan-stat-chip">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `
    )
    .join("");
  }

  const skillChips = normalizeLifeSkills(result.life_skills).map((skill) => [
    skill.name,
    [skill.rank || "", skill.mastery !== null && skill.mastery !== undefined ? `${skill.mastery} Mastery` : ""]
      .filter(Boolean)
      .join(" | "),
  ]);

  if (skillChips.length && scanStatRow) {
    scanStatRow.innerHTML += skillChips
      .map(
        ([label, value]) => `
          <div class="scan-stat-chip">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value || "Erkannt")}</strong>
          </div>
        `
      )
      .join("");
  }

  setText(
    scanMeta,
    result.recognized_text
    ? `Erkannter Text: ${truncateText(result.recognized_text)}`
    : "Kein Zusatztext erkannt."
  );

  if (result.warnings?.length) {
    setText(scanWarning, result.warnings.join(" "));
    if (scanWarning) {
      scanWarning.classList.remove("hidden");
    }
  } else {
    setText(scanWarning, "");
    if (scanWarning) {
      scanWarning.classList.add("hidden");
    }
  }
};

const setProofPreviewFromUrl = (url, label = "Proof geladen") => {
  releasePreviewObjectUrl();
  if (!url) {
    clearProofPreview();
    return;
  }

  const safeUrl = escapeHtml(url);
  setProofPreview(
    `<div class="preview-stack">
      <img src="${safeUrl}" alt="Proof Vorschau">
      <p><a href="${safeUrl}" target="_blank" rel="noreferrer">Proof in neuem Tab oeffnen</a></p>
    </div>`,
    label
  );
};

const handleLocalFilePreview = () => {
  clearScanResult();
  const file = proofFileInput.files?.[0];
  if (!file) {
    if (proofLinkInput.value.trim()) {
      setProofPreviewFromUrl(proofLinkInput.value.trim(), "Proof-Link gesetzt");
    } else {
      clearProofPreview();
    }
    syncProofDropState();
    return;
  }

  resetInlineProofData();
  if (proofLinkInput) {
    proofLinkInput.value = "";
  }
  releasePreviewObjectUrl();
  currentPreviewObjectUrl = URL.createObjectURL(file);
  setProofPreview(
    `<div class="preview-stack">
      <img src="${escapeHtml(currentPreviewObjectUrl)}" alt="Lokale Proof Vorschau">
      <p>${escapeHtml(file.name)}</p>
    </div>`,
    "Lokaler Upload bereit"
  );
  syncProofDropState();
};

const formatTimestamp = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const authMessageMap = {
  connected: "Discord verbunden. Deine ID wurde automatisch uebernommen.",
  access_denied: "Discord-Login wurde abgebrochen.",
  state_mismatch: "Der Discord-Login konnte nicht sicher bestaetigt werden. Bitte erneut versuchen.",
  missing_code: "Discord hat keinen Login-Code zurueckgegeben.",
  discord_unavailable: "Discord war beim Login gerade nicht erreichbar.",
  not_configured: "Discord-Login ist noch nicht konfiguriert. Es fehlen OAuth-Daten in der .env.",
};

const currentAuthUser = () => authSession.user || null;

const didReturnFromDiscordLogin = () => authQueryStatus === "connected";

const setDiscordIdentityFields = () => {
  if (!discordIdInput || !discordNameInput) {
    return;
  }
  const user = currentAuthUser();
  const isLocked = Boolean(user);

  discordIdInput.readOnly = isLocked;
  discordNameInput.readOnly = isLocked;
  discordIdInput.closest("label")?.classList.toggle("locked-field", isLocked);
  discordNameInput.closest("label")?.classList.toggle("locked-field", isLocked);

  if (user) {
    discordIdInput.value = user.id || "";
    discordNameInput.value = user.display_name || user.username || "";
    if (!discordLinkInput.value.trim()) {
      discordLinkInput.value = `https://discord.com/users/${user.id}`;
    }
    discordIdHelp.textContent = "Automatisch aus deinem Discord-Login uebernommen.";
    discordNameHelp.textContent = "Automatisch aus deinem Discord-Login uebernommen.";
  } else {
    discordIdHelp.textContent = "Manuell oder automatisch per Discord-Login.";
    discordNameHelp.textContent = "Wird bei Discord-Login automatisch gesetzt.";
  }
};

const renderAuthUser = (user) => {
  if (!authUser) {
    return;
  }
  if (!user) {
    authUser.classList.add("hidden");
    authUser.innerHTML = "";
    return;
  }

  const avatarHtml = user.avatar_url
    ? `<img class="auth-avatar" src="${escapeHtml(user.avatar_url)}" alt="${escapeHtml(user.display_name || user.username)}">`
    : `<span class="auth-avatar auth-avatar-fallback">${escapeHtml((user.display_name || user.username || "?").charAt(0))}</span>`;

  authUser.classList.remove("hidden");
  authUser.innerHTML = `
    ${avatarHtml}
    <div class="auth-user-copy">
      <strong>${escapeHtml(user.display_name || user.username || "Discord User")}</strong>
      <span>${escapeHtml(user.username || "")}</span>
      <span>ID ${escapeHtml(user.id || "")}</span>
    </div>
  `;
};

const applyAuthSession = (data) => {
  authSession = {
    oauth_ready: Boolean(data.oauth_ready),
    missing_oauth_fields: Array.isArray(data.missing_oauth_fields) ? data.missing_oauth_fields : [],
    user: data.user || null,
    login_url: data.login_url || "/auth/discord?next=%2Farchiv%2F%23editor",
    logout_url: data.logout_url || "/auth/logout?next=%2Farchiv%2F%23editor",
  };

  if (discordLoginLink) {
    discordLoginLink.href = authSession.login_url;
  }
  if (discordLogoutLink) {
    discordLogoutLink.href = authSession.logout_url;
  }
  if (heroLoginLink) {
    heroLoginLink.href = authSession.login_url;
  }

  if (!authSession.oauth_ready) {
    const missingFields = authSession.missing_oauth_fields.length
      ? ` Es fehlen in Cloudflare: ${authSession.missing_oauth_fields.join(", ")}.`
      : "";
    setText(authStatusLabel, "Nicht konfiguriert");
    setText(
      authDescription,
      `Discord-Login ist im Cloudflare-Projekt noch nicht voll aktiviert.${missingFields}`
    );
    if (discordLoginLink) {
      discordLoginLink.classList.remove("hidden");
      discordLoginLink.textContent = "Cloudflare Login-Konfiguration pruefen";
      discordLoginLink.href = "#editor";
    }
    if (discordLogoutLink) {
      discordLogoutLink.classList.add("hidden");
    }
    if (loadMyEntryButton) {
      loadMyEntryButton.disabled = true;
    }
    if (heroLoginLink) {
      heroLoginLink.textContent = "Discord spaeter verbinden";
      heroLoginLink.href = "#editor";
    }
    renderAuthUser(null);
    setDiscordIdentityFields();
    return;
  }

  if (authSession.user) {
    setText(authStatusLabel, "Verbunden");
    setText(
      authDescription,
      "Discord-ID und Name werden jetzt automatisch in den Editor uebernommen. Du musst nur noch deine Gear-Daten pflegen."
    );
    if (discordLoginLink) {
      discordLoginLink.classList.add("hidden");
    }
    if (discordLogoutLink) {
      discordLogoutLink.classList.remove("hidden");
    }
    if (loadMyEntryButton) {
      loadMyEntryButton.disabled = false;
    }
    if (heroLoginLink) {
      heroLoginLink.textContent = "Meinen Eintrag oeffnen";
      heroLoginLink.href = "#editor";
    }
    renderAuthUser(authSession.user);
  } else {
    setText(authStatusLabel, "Noch nicht verbunden");
    setText(
      authDescription,
      "Melde dich mit Discord an, damit ID und Name automatisch aus Discord gezogen werden."
    );
    if (discordLoginLink) {
      discordLoginLink.classList.remove("hidden");
      discordLoginLink.textContent = "Mit Discord anmelden und ID uebernehmen";
    }
    if (discordLogoutLink) {
      discordLogoutLink.classList.add("hidden");
    }
    if (loadMyEntryButton) {
      loadMyEntryButton.disabled = true;
    }
    if (heroLoginLink) {
      heroLoginLink.textContent = "Mit Discord anmelden";
      heroLoginLink.href = authSession.login_url || "/auth/discord?next=%2Farchiv%2F%23editor";
    }
    renderAuthUser(null);
  }

  setDiscordIdentityFields();
};

const syncEditorWithLoggedInUser = async () => {
  const user = currentAuthUser();
  if (!user) {
    return;
  }

  discordIdInput.value = user.id || "";
  discordNameInput.value = user.display_name || user.username || "";
  setDiscordIdentityFields();

  try {
    const data = await fetchJson(`/api/gears/${encodeURIComponent(user.id)}`);
    hydrateForm(data.item);
    setEditorMode(
      "Discord verbunden und Eintrag geladen",
      "Deine Discord-ID wurde automatisch gesetzt und dein vorhandener Eintrag direkt geladen.",
      data.item.discord_id
    );
    setFeedback("Discord verbunden. Dein Eintrag wurde automatisch geladen.", "success");
  } catch (_error) {
    setEditorMode(
      "Discord verbunden",
      "Deine Discord-ID wurde automatisch gesetzt. Du kannst jetzt direkt einen neuen Eintrag anlegen.",
      ""
    );
    setFeedback("Discord verbunden. Deine Discord-ID wurde automatisch eingetragen.", "success");
  }
};

const renderFeaturedEntry = (entry) => {
  if (!featuredEmbed) {
    return;
  }
  if (!entry) {
    featuredEmbed.innerHTML = "<p>Noch kein Top-Eintrag vorhanden.</p>";
    return;
  }

  const displayName = getDisplayName(entry);
  const portraitHtml = entry.portrait_url
    ? `<img class="discord-embed-portrait" src="${escapeHtml(entry.portrait_url)}" alt="${escapeHtml(entry.class)} Portrait">`
    : `<div class="discord-embed-portrait discord-embed-portrait-fallback">${escapeHtml((entry.class || "?").charAt(0))}</div>`;

  const proofHtml = entry.proof_url
    ? `
      <div class="discord-proof-card">
        <div class="discord-proof-bar">
          <span>Inventar ansehen</span>
          <a href="${escapeHtml(entry.proof_url)}" target="_blank" rel="noreferrer">Original</a>
        </div>
        <img class="discord-proof-image" src="${escapeHtml(entry.proof_url)}" alt="Proof von ${escapeHtml(displayName)}">
      </div>
    `
    : `
      <div class="discord-proof-card discord-proof-card-empty">
        <div class="discord-proof-bar">
          <span>Kein Proof hinterlegt</span>
        </div>
      </div>
    `;

  const discordLinkHtml = entry.discord_link
    ? `<a class="discord-embed-link" href="${escapeHtml(entry.discord_link)}" target="_blank" rel="noreferrer">Discord Link</a>`
    : "";

  const notesHtml = entry.notes
    ? `<p class="discord-embed-note-line">${escapeHtml(entry.notes)}</p>`
    : "";
  const profileHtml = renderProfileBlock(entry, "player-profile-block-embed");
  const lifeSkillHtml = renderLifeSkillBlock(entry.life_skills, "player-skill-block-embed");

  featuredEmbed.innerHTML = `
    <article class="discord-embed-card">
      <span class="discord-embed-accent"></span>
      <div class="discord-embed-main">
        <div class="discord-embed-header">
          <div class="discord-embed-copy">
            <p class="discord-embed-label">Gear von ${escapeHtml(displayName)}</p>
            <h3>${escapeHtml(entry.familyname || displayName)}</h3>
            <p class="discord-embed-subline">${escapeHtml(entry.class)} | ${escapeHtml(entry.state)} | GS ${escapeHtml(entry.gearscore)}</p>
          </div>
          ${portraitHtml}
        </div>

        <dl class="discord-stat-grid">
          <div>
            <dt>Familyname</dt>
            <dd>${escapeHtml(entry.familyname || "-")}</dd>
          </div>
          <div>
            <dt>Klasse</dt>
            <dd>${escapeHtml(entry.class || "-")}</dd>
          </div>
          <div>
            <dt>State</dt>
            <dd>${escapeHtml(entry.state || "-")}</dd>
          </div>
          <div>
            <dt>AP / AAP</dt>
            <dd>${escapeHtml(entry.ap)} / ${escapeHtml(entry.aap)}</dd>
          </div>
          <div>
            <dt>DP</dt>
            <dd>${escapeHtml(entry.dp)}</dd>
          </div>
          <div>
            <dt>Gearscore</dt>
            <dd>${escapeHtml(entry.gearscore)}</dd>
          </div>
        </dl>

        ${profileHtml}
        ${lifeSkillHtml}

        ${proofHtml}

        <div class="discord-embed-footer">
          <span>Aktualisiert: ${escapeHtml(formatTimestamp(entry.updated_at))}</span>
          ${discordLinkHtml}
        </div>
        ${notesHtml}
      </div>
    </article>
  `;
};

const renderHeroPreview = (entries) => {
  if (!heroPreviewList) {
    return;
  }
  if (!entries.length) {
    heroPreviewList.innerHTML = `
      <div class="mini-entry">
        <div class="mini-entry-copy">
          <strong>Noch keine Eintraege</strong>
          <span class="mini-entry-meta">Nutze den Editor fuer den ersten Datensatz.</span>
        </div>
      </div>
    `;
    return;
  }

  heroPreviewList.innerHTML = entries
    .slice(0, 5)
    .map(
      (entry, index) => `
        <article class="mini-entry">
          <span class="mini-entry-rank">#${index + 1}</span>
          <div class="mini-entry-copy">
            <strong>${escapeHtml(getDisplayName(entry))}</strong>
            <span class="mini-entry-meta">${escapeHtml(entry.class)} | GS ${escapeHtml(entry.gearscore)}</span>
          </div>
          ${
            entry.portrait_url
              ? `<img class="mini-entry-thumb" src="${escapeHtml(entry.portrait_url)}" alt="${escapeHtml(entry.class)}">`
              : `<span class="mini-entry-thumb mini-entry-thumb-fallback">${escapeHtml((entry.class || "?").charAt(0))}</span>`
          }
        </article>
      `
    )
    .join("");
};

const renderStats = (entries) => {
  const count = entries.length;
  const topEntry = entries[0];
  const scoreTotal = entries.reduce((sum, entry) => sum + Number(entry.gearscore || 0), 0);
  const proofCount = entries.filter((entry) => entry.proof_url).length;
  const newest = [...entries]
    .filter((entry) => entry.updated_at)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];

  setText(statCount, String(count));
  setText(statTopScore, topEntry ? String(topEntry.gearscore) : "0");
  setText(statAverageScore, count ? (scoreTotal / count).toFixed(1) : "0");

  setText(summaryClass, topEntry?.class || "-");
  setText(summaryUpdated, newest ? formatTimestamp(newest.updated_at) : "-");
  setText(summaryProofs, String(proofCount));
};

const renderEntries = (entries) => {
  if (!leaderboardGrid) {
    return;
  }
  if (emptyState) {
    emptyState.classList.toggle("hidden", entries.length > 0);
  }

  if (!entries.length) {
    leaderboardGrid.innerHTML = "";
    return;
  }

  leaderboardGrid.innerHTML = entries
    .map((entry, index) => {
      const displayName = getDisplayName(entry);
      const proofLinkHtml = entry.proof_url
        ? `<a class="text-link leader-link-pill" href="${escapeHtml(entry.proof_url)}" target="_blank" rel="noreferrer">Proof</a>`
        : "";
      const discordLinkHtml = entry.discord_link
        ? `<a class="text-link leader-link-pill" href="${escapeHtml(entry.discord_link)}" target="_blank" rel="noreferrer">Discord</a>`
        : "";
      const portraitHtml = entry.portrait_url
        ? `<img class="leader-portrait" src="${escapeHtml(entry.portrait_url)}" alt="${escapeHtml(entry.class)} Portrait">`
        : `<div class="leader-portrait leader-portrait-fallback">${escapeHtml((entry.class || "?").charAt(0))}</div>`;
      const noteHtml = entry.notes
        ? `<p class="leader-note">${escapeHtml(entry.notes)}</p>`
        : "";
      const profileHtml = renderProfileBlock(entry, "player-profile-block-leader");
      const lifeSkillHtml = renderLifeSkillBlock(entry.life_skills, "player-skill-block-leader");
      const proofPreviewHtml = entry.proof_url
        ? `
          <a class="leader-proof-card" href="${escapeHtml(entry.proof_url)}" target="_blank" rel="noreferrer">
            <span class="leader-proof-label">Proof Bild</span>
            <img class="leader-proof-image" src="${escapeHtml(entry.proof_url)}" alt="Proof von ${escapeHtml(displayName)}">
          </a>
        `
        : "";

      return `
        <article class="leader-card ${index < 3 ? "top-three" : ""}">
          <span class="leader-accent"></span>
          <div class="leader-shell">
            <div class="leader-copy">
              <div class="leader-topline">
                <span class="leader-rank">#${index + 1}</span>
                <span class="leader-state-pill">${escapeHtml(entry.state)}</span>
              </div>
              <h3>${escapeHtml(displayName)} <span class="leader-inline-class">(${escapeHtml(entry.class)})</span></h3>
              <p class="leader-subline">Discord ID ${escapeHtml(entry.discord_id)}</p>

              <dl class="leader-stat-grid">
                <div>
                  <dt>State</dt>
                  <dd>${escapeHtml(entry.state)}</dd>
                </div>
                <div>
                  <dt>AP / AAP</dt>
                  <dd>${escapeHtml(entry.ap)} / ${escapeHtml(entry.aap)}</dd>
                </div>
                <div>
                  <dt>DP</dt>
                  <dd>${escapeHtml(entry.dp)}</dd>
                </div>
                <div class="leader-score-box">
                  <dt>Gearscore</dt>
                  <dd>${escapeHtml(entry.gearscore)}</dd>
                </div>
              </dl>

              ${profileHtml}
              ${lifeSkillHtml}

              ${proofPreviewHtml}

              <div class="leader-links">
                ${proofLinkHtml}
                ${discordLinkHtml}
              </div>

              ${noteHtml}

              <p class="leader-subline">Aktualisiert: ${escapeHtml(formatTimestamp(entry.updated_at))}</p>
            </div>
            <div class="leader-side">
              <div class="leader-score">
                <span>Gearscore</span>
                <strong>${escapeHtml(entry.gearscore)}</strong>
              </div>
              ${portraitHtml}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
};

const populateClasses = (classes) => {
  if (!playerClassSelect) {
    return;
  }
  const currentValue = playerClassSelect.value;
  playerClassSelect.innerHTML = `
    <option value="">Klasse auswaehlen</option>
    ${classes
      .map((entryClass) => `<option value="${escapeHtml(entryClass)}">${escapeHtml(entryClass)}</option>`)
      .join("")}
  `;

  if (classes.includes(currentValue)) {
    playerClassSelect.value = currentValue;
  }
};

const applyMeta = (meta) => {
  appCapabilities = {
    supports_proof_upload: meta.supports_proof_upload !== false,
    supports_scan: meta.supports_scan !== false,
  };

  guildNameTargets.forEach((target) => {
    if (target) {
      target.textContent = meta.guild_name || "Hochmut";
    }
  });

  setText(dataFileLabel, meta.data_file_label || "gear_data.json");
  setText(proofsDirLabel, meta.proofs_dir_label || "proofs");

  if (!appCapabilities.supports_proof_upload) {
    proofFileInput.disabled = true;
    if (proofDropzone) {
      proofDropzone.disabled = true;
      proofDropzone.classList.add("is-disabled");
    }
    if (proofUploadHelp) {
      proofUploadHelp.textContent =
        "Hier ist nur ein Proof-Link moeglich. Datei-Uploads sind in dieser Version ausgeschaltet.";
    }
  } else if (proofDropzone) {
    proofFileInput.disabled = false;
    proofDropzone.disabled = false;
    proofDropzone.classList.remove("is-disabled");
    if (proofUploadHelp) {
      proofUploadHelp.textContent = "Zieh dein Proof-Foto einfach hinein oder nutze weiter einen Proof-Link.";
    }
  }

  if (!appCapabilities.supports_scan) {
    scanProofButton.disabled = true;
    scanProofButton.textContent = "Foto-Scan spaeter";
    scanProofButton.closest(".scan-shell")?.classList.add("hidden");
  } else if (scanProofButton) {
    scanProofButton.disabled = false;
    scanProofButton.textContent = "Bild jetzt auslesen";
    scanProofButton.closest(".scan-shell")?.classList.remove("hidden");
    const scanHelp = scanProofButton.closest(".scan-shell")?.querySelector(".scan-shell-copy span");
    if (scanHelp) {
      scanHelp.textContent = "Browser-OCR fuer AP, AAP, DP, Profil und Life Skills.";
    }
  }

  if (discordCta) {
    if (meta.discord_invite) {
      discordCta.href = meta.discord_invite;
      discordCta.target = "_blank";
      discordCta.rel = "noreferrer";
      discordCta.textContent = "Discord oeffnen";
    } else {
      discordCta.href = "#editor";
      discordCta.removeAttribute("target");
      discordCta.removeAttribute("rel");
      discordCta.textContent = "Discord einrichten";
    }
  }
  setText(discordStatusLabel, meta.discord_invite ? "Discord Link gesetzt" : "Noch nicht gesetzt");

  populateClasses(meta.classes || []);
};

const hydrateForm = (entry) => {
  discordIdInput.value = entry.discord_id || "";
  discordNameInput.value = entry.discord_name || "";
  discordLinkInput.value = entry.discord_link || "";
  familynameInput.value = entry.familyname || "";
  playerClassSelect.value = entry.class || "";
  stateSelect.value = entry.state || "Awakening";
  apInput.value = entry.ap ?? "";
  aapInput.value = entry.aap ?? "";
  dpInput.value = entry.dp ?? "";
  characterNameInput.value = entry.character_name || "";
  characterLevelInput.value = entry.character_level ?? "";
  playerTimeInput.value = entry.player_time || "";
  guildActivityInput.value = entry.guild_activity || "";
  energyPointsInput.value = entry.energy_points || "";
  contributionPointsInput.value = entry.contribution_points || "";
  fillLifeSkillInputs(entry.life_skills || []);
  proofLinkInput.value = entry.proof?.startsWith("http") ? entry.proof : "";
  resetInlineProofData();
  clearProofInput.checked = false;
  notesInput.value = entry.notes || "";
  proofFileInput.value = "";
  updateLiveGearscore();

  if (entry.proof_url) {
    setProofPreviewFromUrl(entry.proof_url, "Bestehender Proof");
  } else {
    clearProofPreview();
  }
  syncProofDropState(entry);
  clearScanResult();
};

const clearFormToDefaults = () => {
  const user = currentAuthUser();
  discordIdInput.value = user?.id || "";
  discordNameInput.value = user?.display_name || user?.username || "";
  discordLinkInput.value = "";
  familynameInput.value = "";
  playerClassSelect.value = "";
  stateSelect.value = "Awakening";
  apInput.value = "";
  aapInput.value = "";
  dpInput.value = "";
  characterNameInput.value = "";
  characterLevelInput.value = "";
  playerTimeInput.value = "";
  guildActivityInput.value = "";
  energyPointsInput.value = "";
  contributionPointsInput.value = "";
  fillLifeSkillInputs();
  proofFileInput.value = "";
  proofLinkInput.value = "";
  resetInlineProofData();
  clearProofInput.checked = false;
  notesInput.value = "";
  updateLiveGearscore();
  clearProofPreview();
  syncProofDropState();
  clearScanResult();
  setDiscordIdentityFields();
  setFeedback("Noch nichts gespeichert.");
  setEditorMode(
    "Bereit fuer einen neuen Eintrag",
    "Melde dich mit Discord an. Danach wird deine ID automatisch gesetzt und du kannst deinen eigenen Datensatz speichern."
  );
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Die Anfrage konnte nicht verarbeitet werden.");
  }

  return data;
};

const loadMeta = async () => {
  const data = await fetchJson("/api/meta");
  applyMeta(data);
};

const loadAuthSession = async () => {
  const data = await fetchJson("/api/auth/session");
  applyAuthSession(data);
};

const loadEntries = async () => {
  const data = await fetchJson("/api/gears");
  entriesCache = data.items || [];
  renderFeaturedEntry(entriesCache[0]);
  renderHeroPreview(entriesCache);
  renderStats(entriesCache);
  renderEntries(entriesCache);
};

const loadEntry = async () => {
  const discordId = discordIdInput.value.trim();

  if (!discordId) {
    setFeedback("Bitte zuerst eine Discord-ID eingeben.", "error");
    return;
  }

  try {
    const data = await fetchJson(`/api/gears/${encodeURIComponent(discordId)}`);
    hydrateForm(data.item);
    setEditorMode(
      "Vorhandener Eintrag geladen",
      "Die Werte stammen bereits aus der gemeinsamen gear_data.json und koennen jetzt bearbeitet werden.",
      data.item.discord_id
    );
    setFeedback("Eintrag erfolgreich geladen.", "success");
  } catch (error) {
    clearFormToDefaults();
    discordIdInput.value = discordId;
    setEditorMode(
      "Neuer Eintrag fuer diese Discord-ID",
      "Zu dieser Discord-ID existiert noch kein Datensatz. Du kannst jetzt einen neuen Eintrag anlegen.",
      ""
    );
    setFeedback(error.message, "error");
    clearProofPreview();
  }
};

const loadMyEntry = async () => {
  const user = currentAuthUser();
  if (!user) {
    setFeedback("Bitte zuerst mit Discord anmelden.", "error");
    return;
  }

  discordIdInput.value = user.id;
  setDiscordIdentityFields();
  await loadEntry();
};

const scanProofImage = async () => {
  const file = proofFileInput.files?.[0];
  if (!file) {
    setFeedback("Bitte zuerst einen Screenshot oder ein Foto als Proof auswaehlen.", "error");
    return;
  }

  const originalLabel = scanProofButton.textContent;
  scanProofButton.disabled = true;
  scanProofButton.textContent = "Bild wird gelesen...";

  try {
    setFeedback("OCR wird geladen und das Bild analysiert...", "");
    const worker = await getOcrWorker();
    const preparedImage = await buildOcrImage(file);
    const ocrResult = await worker.recognize(preparedImage);
    const result = parseBrowserOcrResult(ocrResult?.data?.text || "");

    if (result.ap !== null && result.ap !== undefined) {
      apInput.value = result.ap;
    }
    if (result.aap !== null && result.aap !== undefined) {
      aapInput.value = result.aap;
    }
    if (result.dp !== null && result.dp !== undefined) {
      dpInput.value = result.dp;
    }
    if (result.class) {
      playerClassSelect.value = result.class;
    }
    if (result.state) {
      stateSelect.value = result.state;
    }
    if (result.familyname) {
      familynameInput.value = result.familyname;
    }
    if (result.character_name) {
      characterNameInput.value = result.character_name;
    }
    if (result.character_level !== null && result.character_level !== undefined) {
      characterLevelInput.value = result.character_level;
    }
    if (result.player_time) {
      playerTimeInput.value = result.player_time;
    }
    if (result.energy_points) {
      energyPointsInput.value = result.energy_points;
    }
    if (result.contribution_points) {
      contributionPointsInput.value = result.contribution_points;
    }
    const reliableLifeSkills = normalizeLifeSkills(result.life_skills).filter(
      (skill) => skill.rank || skill.mastery !== null && skill.mastery !== undefined
    );
    if (reliableLifeSkills.length) {
      fillLifeSkillInputs(result.life_skills);
    }

    updateLiveGearscore();
    renderScanResult(
      result,
      result.complete
        ? "Bild gelesen. Die wichtigsten Werte wurden direkt ins Formular uebernommen."
        : "Bild teilweise gelesen. Bitte die vorgeschlagenen Werte kurz pruefen."
    );
    const foundUsefulData = Boolean(
      result.ap !== null ||
        result.familyname ||
        result.character_name ||
        result.player_time ||
        result.energy_points ||
        result.contribution_points ||
        result.life_skills?.length
    );
    setFeedback(
      foundUsefulData
        ? "Bild erkannt. Bitte die uebernommenen Werte kurz gegenpruefen."
        : "Das Bild wurde gelesen, aber es konnte nur wenig sicher erkannt werden.",
      foundUsefulData ? "success" : "error"
    );
  } catch (error) {
    clearScanResult();
    setFeedback(error.message, "error");
  } finally {
    scanProofButton.disabled = false;
    scanProofButton.textContent = originalLabel;
  }
};

const saveEntry = async (event) => {
  event.preventDefault();

  if (!currentAuthUser()) {
    setFeedback("Bitte zuerst mit Discord anmelden. In der Cloud-Version sind Schreibzugriffe nur fuer den eigenen Account erlaubt.", "error");
    return;
  }

  const formData = new FormData(form);

  try {
    const selectedProofFile = proofFileInput?.files?.[0];
    if (selectedProofFile) {
      setFeedback("Proof-Bild wird vorbereitet...", "info");
      const inlineProofData = await readFileAsOptimizedProof(selectedProofFile);
      formData.delete("proof_file");
      formData.set("proof_data_url", inlineProofData);
      if (proofDataUrlInput) {
        proofDataUrlInput.value = inlineProofData;
      }
    }

    const data = await fetchJson("/api/gears", {
      method: "POST",
      body: formData,
    });

    hydrateForm(data.item);
    setEditorMode(
      "Eintrag gespeichert",
      "Der Datensatz wurde gespeichert und bleibt mit dem Discord-Bot kompatibel.",
      data.item.discord_id
    );
    setFeedback(data.message, "success");
    await loadEntries();
  } catch (error) {
    setFeedback(error.message, "error");
  }
};

const deleteEntry = async () => {
  const discordId = discordIdInput.value.trim();
  if (!discordId) {
    setFeedback("Es ist keine Discord-ID geladen.", "error");
    return;
  }

  const confirmed = window.confirm("Diesen Eintrag wirklich loeschen?");
  if (!confirmed) {
    return;
  }

  try {
    const data = await fetchJson(`/api/gears/${encodeURIComponent(discordId)}`, {
      method: "DELETE",
    });
    clearFormToDefaults();
    setFeedback(data.message, "success");
    await loadEntries();
  } catch (error) {
    setFeedback(error.message, "error");
  }
};

const uploadProofFile = async (file) => {
  const uploadFormData = new FormData();
  uploadFormData.set("file", file);

  const data = await fetchJson("/api/proof-upload", {
    method: "POST",
    body: uploadFormData,
  });

  if (!data?.proofUrl) {
    throw new Error("Der Proof-Upload hat keine URL zurueckgegeben.");
  }

  return data.proofUrl;
};

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isExpanded));
    siteNav.classList.toggle("is-open", !isExpanded);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
    });
  });
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

[apInput, aapInput, dpInput].filter(Boolean).forEach((input) => {
  input.addEventListener("input", updateLiveGearscore);
});

if (proofFileInput) {
  proofFileInput.addEventListener("change", handleLocalFilePreview);
}

if (proofLinkInput) {
  proofLinkInput.addEventListener("input", () => {
    if (proofLinkInput.value.trim()) {
      if (proofFileInput) {
        proofFileInput.value = "";
      }
      resetInlineProofData();
      clearScanResult();
      setProofPreviewFromUrl(proofLinkInput.value.trim(), "Proof-Link gesetzt");
      syncProofDropState();
    } else if (!proofFileInput?.files?.length) {
      clearProofPreview();
      clearScanResult();
      syncProofDropState();
    }
  });
}

if (proofDropzone && proofFileInput) {
  proofDropzone.addEventListener("click", () => {
    if (!proofFileInput.disabled) {
      proofFileInput.click();
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    proofDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!proofFileInput.disabled) {
        proofDropzone.classList.add("is-dragover");
      }
    });
  });

  ["dragleave", "dragend"].forEach((eventName) => {
    proofDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      proofDropzone.classList.remove("is-dragover");
    });
  });

  proofDropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();
    proofDropzone.classList.remove("is-dragover");
    if (proofFileInput.disabled) {
      return;
    }
    const droppedFile = Array.from(event.dataTransfer?.files || []).find((file) => file.type.startsWith("image/"));
    if (!droppedFile) {
      setFeedback("Bitte ein Bild als Proof in die Drop-Zone ziehen.", "error");
      return;
    }
    assignProofFile(droppedFile);
  });
}

if (loadEntryButton) {
  loadEntryButton.addEventListener("click", loadEntry);
}
if (deleteEntryButton) {
  deleteEntryButton.addEventListener("click", deleteEntry);
}
if (refreshBoardButton) {
  refreshBoardButton.addEventListener("click", loadEntries);
}
if (resetFormButton) {
  resetFormButton.addEventListener("click", clearFormToDefaults);
}
if (loadMyEntryButton) {
  loadMyEntryButton.addEventListener("click", loadMyEntry);
}
if (scanProofButton) {
  scanProofButton.addEventListener("click", scanProofImage);
}
if (form) {
  form.addEventListener("submit", saveEntry);
}

document.addEventListener("DOMContentLoaded", async () => {
  updateLiveGearscore();
  clearProofPreview();
  syncProofDropState();
  clearScanResult();

  try {
    await loadAuthSession();
    await loadMeta();
    await loadEntries();
    if (didReturnFromDiscordLogin() && currentAuthUser()) {
      await syncEditorWithLoggedInUser();
    } else if (authQueryStatus && authMessageMap[authQueryStatus]) {
      setFeedback(authMessageMap[authQueryStatus], authQueryStatus === "access_denied" ? "error" : "error");
    } else {
      setFeedback("Noch nichts gespeichert.");
    }
  } catch (error) {
    setFeedback(error.message, "error");
  }
});
