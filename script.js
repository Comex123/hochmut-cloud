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
  liveGearscore.textContent = `Gearscore: ${calculateGearscore()}`;
};

const setFeedback = (message, tone = "") => {
  formFeedback.textContent = message;
  formFeedback.classList.remove("success", "error");
  if (tone) {
    formFeedback.classList.add(tone);
  }
};

const setEditorMode = (title, text, loadedId = "") => {
  editorModeTitle.textContent = title;
  editorModeText.textContent = text;
  currentLoadedId = loadedId;
  deleteEntryButton.disabled = !loadedId;
};

const releasePreviewObjectUrl = () => {
  if (currentPreviewObjectUrl) {
    URL.revokeObjectURL(currentPreviewObjectUrl);
    currentPreviewObjectUrl = "";
  }
};

const setProofPreview = (content, label) => {
  proofPreviewLabel.textContent = label;
  proofPreviewBody.innerHTML = content;
};

const clearProofPreview = () => {
  releasePreviewObjectUrl();
  setProofPreview("<p>Waehle ein Bild oder lade einen vorhandenen Datensatz.</p>", "Kein Proof geladen");
};

const clearScanResult = () => {
  scanResultCard.classList.add("hidden");
  scanResultTitle.textContent = "Noch kein Foto gelesen";
  scanResultCopy.textContent = "Lade einen Screenshot hoch und lies die Werte direkt ins Formular ein.";
  scanConfidence.textContent = "-";
  scanStatRow.innerHTML = "";
  scanMeta.textContent = "";
  scanWarning.textContent = "";
  scanWarning.classList.add("hidden");
};

const renderScanResult = (result, message) => {
  const items = [
    ["AP", result.ap],
    ["AAP", result.aap],
    ["DP", result.dp],
    ["Gearscore", result.gearscore],
    ["Family", result.familyname],
    ["Charakter", result.character_name],
    ["Stufe", result.character_level ? `St. ${result.character_level}` : ""],
    ["Spielzeit", result.player_time],
    ["Klasse", result.class],
    ["State", result.state],
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");

  const confidenceLabels = {
    high: "klar erkannt",
    medium: "bitte pruefen",
    low: "teilweise erkannt",
  };

  scanResultCard.classList.remove("hidden");
  scanResultTitle.textContent = result.complete ? "Werte uebernommen" : "Teilweise erkannt";
  scanResultCopy.textContent = message;
  scanConfidence.textContent = confidenceLabels[result.confidence] || "bitte pruefen";
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

  const skillChips = normalizeLifeSkills(result.life_skills).map((skill) => [
    skill.name,
    [skill.rank || "", skill.mastery !== null && skill.mastery !== undefined ? `${skill.mastery} Mastery` : ""]
      .filter(Boolean)
      .join(" | "),
  ]);

  if (skillChips.length) {
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

  scanMeta.textContent = result.recognized_text
    ? `Erkannter Text: ${truncateText(result.recognized_text)}`
    : "Kein Zusatztext erkannt.";

  if (result.warnings?.length) {
    scanWarning.textContent = result.warnings.join(" ");
    scanWarning.classList.remove("hidden");
  } else {
    scanWarning.textContent = "";
    scanWarning.classList.add("hidden");
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
    return;
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

  discordLoginLink.href = authSession.login_url;
  discordLogoutLink.href = authSession.logout_url;

  if (!authSession.oauth_ready) {
    const missingFields = authSession.missing_oauth_fields.length
      ? ` Es fehlen in Cloudflare: ${authSession.missing_oauth_fields.join(", ")}.`
      : "";
    authStatusLabel.textContent = "Nicht konfiguriert";
    authDescription.textContent =
      `Discord-Login ist im Cloudflare-Projekt noch nicht voll aktiviert.${missingFields}`;
    discordLoginLink.classList.remove("hidden");
    discordLoginLink.textContent = "Cloudflare Login-Konfiguration pruefen";
    discordLoginLink.href = "#sync";
    discordLogoutLink.classList.add("hidden");
    loadMyEntryButton.disabled = true;
    renderAuthUser(null);
    setDiscordIdentityFields();
    return;
  }

  if (authSession.user) {
    authStatusLabel.textContent = "Verbunden";
    authDescription.textContent =
      "Discord-ID und Name werden jetzt automatisch in den Editor uebernommen. Du musst nur noch deine Gear-Daten pflegen.";
    discordLoginLink.classList.add("hidden");
    discordLogoutLink.classList.remove("hidden");
    loadMyEntryButton.disabled = false;
    renderAuthUser(authSession.user);
  } else {
    authStatusLabel.textContent = "Noch nicht verbunden";
    authDescription.textContent =
      "Melde dich mit Discord an, damit ID und Name automatisch aus Discord gezogen werden.";
    discordLoginLink.classList.remove("hidden");
    discordLoginLink.textContent = "Mit Discord anmelden und ID uebernehmen";
    discordLogoutLink.classList.add("hidden");
    loadMyEntryButton.disabled = true;
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

  statCount.textContent = String(count);
  statTopScore.textContent = topEntry ? String(topEntry.gearscore) : "0";
  statAverageScore.textContent = count ? (scoreTotal / count).toFixed(1) : "0";

  summaryClass.textContent = topEntry?.class || "-";
  summaryUpdated.textContent = newest ? formatTimestamp(newest.updated_at) : "-";
  summaryProofs.textContent = String(proofCount);
};

const renderEntries = (entries) => {
  emptyState.classList.toggle("hidden", entries.length > 0);

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

  dataFileLabel.textContent = meta.data_file_label || "gear_data.json";
  proofsDirLabel.textContent = meta.proofs_dir_label || "proofs";

  if (!appCapabilities.supports_proof_upload) {
    proofFileInput.disabled = true;
    proofFileInput.removeAttribute("name");
    const uploadHelp = proofFileInput.closest("label")?.querySelector("small");
    if (uploadHelp) {
      uploadHelp.textContent =
        "In der kostenlosen Cloud-Version bitte einen Proof-Link verwenden. Datei-Uploads bleiben in der lokalen Python-Version.";
    }
  }

  if (!appCapabilities.supports_scan) {
    scanProofButton.disabled = true;
    scanProofButton.textContent = "Foto-Scan spaeter";
  }

  if (meta.discord_invite) {
    discordCta.href = meta.discord_invite;
    discordCta.target = "_blank";
    discordCta.rel = "noreferrer";
    discordCta.textContent = "Discord oeffnen";
    discordStatusLabel.textContent = "Discord Link gesetzt";
  } else {
    discordCta.href = "#sync";
    discordCta.removeAttribute("target");
    discordCta.removeAttribute("rel");
    discordCta.textContent = "Discord einrichten";
    discordStatusLabel.textContent = "Noch nicht gesetzt";
  }

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
  clearProofInput.checked = false;
  notesInput.value = entry.notes || "";
  proofFileInput.value = "";
  updateLiveGearscore();

  if (entry.proof_url) {
    setProofPreviewFromUrl(entry.proof_url, "Bestehender Proof");
  } else {
    clearProofPreview();
  }
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
  clearProofInput.checked = false;
  notesInput.value = "";
  updateLiveGearscore();
  clearProofPreview();
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
  const formData = new FormData();
  formData.append("image_file", file);

  scanProofButton.disabled = true;
  scanProofButton.textContent = "Foto wird gelesen...";

  try {
    const data = await fetchJson("/api/gear-scan", {
      method: "POST",
      body: formData,
    });

    const result = data.result || {};
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
    const reliableLifeSkills = normalizeLifeSkills(result.life_skills).filter(
      (skill) => skill.mastery !== null && skill.mastery !== undefined
    );
    if (reliableLifeSkills.length >= 2) {
      fillLifeSkillInputs(result.life_skills);
    }

    updateLiveGearscore();
    renderScanResult(result, data.message || "Foto gelesen.");
    const foundUsefulData = Boolean(
      result.ap !== null ||
        result.familyname ||
        result.character_name ||
        result.player_time ||
        result.life_skills?.length
    );
    setFeedback(data.message || "Foto gelesen.", foundUsefulData ? "success" : "");
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

  if (!appCapabilities.supports_proof_upload && proofFileInput.files?.length) {
    setFeedback(
      "In der Cloud-Version bitte einen Proof-Link eintragen. Datei-Uploads bleiben in der lokalen Python-Version.",
      "error"
    );
    return;
  }

  const formData = new FormData(form);

  try {
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

[apInput, aapInput, dpInput].forEach((input) => {
  input.addEventListener("input", updateLiveGearscore);
});

proofFileInput.addEventListener("change", handleLocalFilePreview);
proofLinkInput.addEventListener("input", () => {
  if (!proofFileInput.files?.length && proofLinkInput.value.trim()) {
    clearScanResult();
    setProofPreviewFromUrl(proofLinkInput.value.trim(), "Proof-Link gesetzt");
  } else if (!proofFileInput.files?.length) {
    clearProofPreview();
    clearScanResult();
  }
});

loadEntryButton.addEventListener("click", loadEntry);
deleteEntryButton.addEventListener("click", deleteEntry);
refreshBoardButton.addEventListener("click", loadEntries);
resetFormButton.addEventListener("click", clearFormToDefaults);
loadMyEntryButton.addEventListener("click", loadMyEntry);
scanProofButton.addEventListener("click", scanProofImage);
form.addEventListener("submit", saveEntry);

document.addEventListener("DOMContentLoaded", async () => {
  updateLiveGearscore();
  clearProofPreview();
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
