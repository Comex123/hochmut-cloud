const revealItems = document.querySelectorAll(".reveal");
const currentYear = document.querySelector("#current-year");

const guildNameTargets = [
  document.querySelector("#menu-guild-name"),
  document.querySelector("#menu-footer-guild-name"),
];

const statCount = document.querySelector("#menu-stat-count");
const statTopScore = document.querySelector("#menu-stat-top-score");
const statUpdated = document.querySelector("#menu-stat-updated");
const topEntry = document.querySelector("#menu-top-entry");
const proofCount = document.querySelector("#menu-proof-count");
const discordStatus = document.querySelector("#menu-discord-status");
const authStatus = document.querySelector("#menu-auth-status");
const authAction = document.querySelector("#menu-auth-action");
const overviewList = document.querySelector("#menu-leaderboard-grid");

const setText = (element, value) => {
  if (element) {
    element.textContent = value;
  }
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

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

const fetchJson = async (url) => {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Die Daten konnten nicht geladen werden.");
  }

  return data;
};

const applyMeta = (meta) => {
  guildNameTargets.forEach((target) => {
    if (target) {
      target.textContent = meta.guild_name || "Hochmut";
    }
  });

  setText(discordStatus, meta.discord_invite ? "Discord verbunden" : "Discord offen");
};

const renderOverview = (items) => {
  if (!overviewList) {
    return;
  }

  const entries = items || [];

  if (!entries.length) {
    overviewList.innerHTML = `
      <article class="overview-table-row empty-row">
        <span class="empty-row-copy">Noch keine Gear-Eintraege vorhanden.</span>
      </article>
    `;
    return;
  }

  overviewList.innerHTML = entries
    .map((entry, index) => {
      const displayName = entry.familyname || entry.discord_name || entry.discord_id;
      const portrait = entry.portrait_url
        ? `<img class="overview-player-portrait" src="${escapeHtml(entry.portrait_url)}" alt="${escapeHtml(entry.class || "Klasse")}">`
        : `<span class="overview-player-portrait overview-player-portrait-fallback">${escapeHtml((entry.class || "?").charAt(0))}</span>`;
      const proof = entry.proof_url
        ? `<a class="table-pill" href="${escapeHtml(entry.proof_url)}" target="_blank" rel="noreferrer">Proof</a>`
        : `<span class="table-pill is-muted">-</span>`;

      return `
        <article class="overview-table-row">
          <span class="table-rank">#${index + 1}</span>
          <div class="overview-player">
            ${portrait}
            <div class="overview-player-copy">
              <strong>${escapeHtml(displayName)}</strong>
              <span>${escapeHtml(entry.class || "-")}</span>
            </div>
          </div>
          <span class="table-cell">${escapeHtml(entry.state || "-")}</span>
          <span class="table-cell">${escapeHtml(entry.ap)} / ${escapeHtml(entry.aap)}</span>
          <span class="table-cell">${escapeHtml(entry.dp)}</span>
          <strong class="table-gs">${escapeHtml(entry.gearscore)}</strong>
          ${proof}
        </article>
      `;
    })
    .join("");
};

const applyEntries = (items) => {
  const entries = items || [];
  const newest = [...entries]
    .filter((entry) => entry.updated_at)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
  const featured = entries[0];
  const proofs = entries.filter((entry) => entry.proof_url).length;

  setText(statCount, String(entries.length));
  setText(statTopScore, featured ? String(featured.gearscore) : "0");
  setText(statUpdated, newest ? formatTimestamp(newest.updated_at) : "-");
  setText(proofCount, String(proofs));

  if (featured) {
    const displayName = featured.familyname || featured.discord_name || featured.discord_id;
    setText(topEntry, `Top Eintrag: ${displayName} | GS ${featured.gearscore}`);
  } else {
    setText(topEntry, "Top Eintrag: -");
  }

  renderOverview(entries);
};

const applySession = (session) => {
  if (!session.oauth_ready) {
    setText(authStatus, "Login offen");
    if (authAction) {
      authAction.href = "/archiv/#editor";
      authAction.textContent = "Discord spaeter verbinden";
    }
    return;
  }

  if (session.user) {
    setText(authStatus, "Verbunden");
    if (authAction) {
      authAction.href = "/archiv/#editor";
      authAction.textContent = "Meinen Eintrag oeffnen";
    }
  } else {
    setText(authStatus, "Bereit fuer Login");
    if (authAction) {
      authAction.href = session.login_url || "/auth/discord?next=%2Farchiv%2F%23editor";
      authAction.textContent = "Mit Discord anmelden";
    }
  }
};

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
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
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [meta, gears, session] = await Promise.all([
      fetchJson("/api/meta"),
      fetchJson("/api/gears"),
      fetchJson("/api/auth/session"),
    ]);

    applyMeta(meta);
    applyEntries(gears.items || []);
    applySession(session);
  } catch (error) {
    setText(topEntry, error.message);
  }
});
