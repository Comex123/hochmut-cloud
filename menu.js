const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
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
const focusTitle = document.querySelector("#menu-focus-title");
const focusCopy = document.querySelector("#menu-focus-copy");
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

  if (meta.discord_invite) {
    setText(discordStatus, "Verbunden");
  } else {
    setText(discordStatus, "Noch offen");
  }
};

const renderOverview = (items) => {
  if (!overviewList) {
    return;
  }

  const entries = items || [];

  if (!entries.length) {
    overviewList.innerHTML = `
      <article class="overview-row">
        <div class="overview-row-main">
          <strong>Noch keine Gear-Eintraege vorhanden.</strong>
          <span>Der erste Eintrag kann direkt ueber den Gear-Button angelegt werden.</span>
        </div>
      </article>
    `;
    return;
  }

  overviewList.innerHTML = entries
    .map((entry, index) => {
      const displayName = entry.familyname || entry.discord_name || entry.discord_id;
      const portrait = entry.portrait_url
        ? `<img class="overview-row-portrait" src="${escapeHtml(entry.portrait_url)}" alt="${escapeHtml(entry.class || "Klasse")}">`
        : `<span class="overview-row-portrait overview-row-portrait-fallback">${escapeHtml((entry.class || "?").charAt(0))}</span>`;

      return `
        <article class="overview-row">
          <div class="overview-row-rank">#${index + 1}</div>
          <div class="overview-row-main">
            <strong>${escapeHtml(displayName)}</strong>
            <span>${escapeHtml(entry.class || "-")} | ${escapeHtml(entry.state || "-")} | Aktualisiert ${escapeHtml(formatTimestamp(entry.updated_at))}</span>
          </div>
          <div class="overview-row-stats">
            <span>AP/AAP ${escapeHtml(entry.ap)} / ${escapeHtml(entry.aap)}</span>
            <strong>DP ${escapeHtml(entry.dp)} | GS ${escapeHtml(entry.gearscore)}</strong>
          </div>
          ${portrait}
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
    setText(topEntry, `${displayName} | GS ${featured.gearscore}`);
    setText(focusTitle, "Aktuelle Gildenlage");
    setText(focusCopy, "Die Gearliste ist live und nach Gearscore sortiert.");
  } else {
    setText(topEntry, "Noch kein Eintrag");
    setText(focusTitle, "Archiv bereit");
    setText(focusCopy, "Sobald Eintraege gespeichert sind, erscheinen sie hier.");
  }

  renderOverview(entries);
};

const applySession = (session) => {
  if (!session.oauth_ready) {
    setText(authStatus, "Discord Login offen");
    if (authAction) {
      authAction.href = "/archiv/#editor";
      authAction.textContent = "Discord spaeter verbinden";
    }
    return;
  }

  if (session.user) {
    setText(authStatus, "Discord verbunden");
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
    setText(focusTitle, "Uebersicht bereit");
    setText(focusCopy, error.message);
  }
});
