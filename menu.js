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
const topPreview = document.querySelector("#menu-top-preview");
const discordPreview = document.querySelector("#menu-discord-preview");
const discordCta = document.querySelector("#menu-discord-cta");
const authStatus = document.querySelector("#menu-auth-status");
const authAction = document.querySelector("#menu-auth-action");
const focusTitle = document.querySelector("#menu-focus-title");
const focusCopy = document.querySelector("#menu-focus-copy");

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
    discordCta.href = meta.discord_invite;
    discordCta.target = "_blank";
    discordCta.rel = "noreferrer";
    discordCta.textContent = "Discord oeffnen";
    discordStatus.textContent = "Verbunden";
    discordPreview.textContent = "Invite ist gesetzt";
  } else {
    discordCta.href = "/archiv/#sync";
    discordCta.removeAttribute("target");
    discordCta.removeAttribute("rel");
    discordCta.textContent = "Discord einrichten";
    discordStatus.textContent = "Noch offen";
    discordPreview.textContent = "Invite noch nicht gesetzt";
  }
};

const applyEntries = (items) => {
  const entries = items || [];
  const newest = [...entries]
    .filter((entry) => entry.updated_at)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
  const featured = entries[0];
  const proofs = entries.filter((entry) => entry.proof_url).length;

  statCount.textContent = String(entries.length);
  statTopScore.textContent = featured ? String(featured.gearscore) : "0";
  statUpdated.textContent = newest ? formatTimestamp(newest.updated_at) : "-";
  proofCount.textContent = String(proofs);

  if (featured) {
    const displayName = featured.familyname || featured.discord_name || featured.discord_id;
    topEntry.textContent = `${displayName} | GS ${featured.gearscore}`;
    topPreview.textContent = `${displayName} fuehrt aktuell`;
    focusTitle.textContent = "Archiv mit Live-Daten";
    focusCopy.textContent =
      "Rangliste und Editor greifen auf dieselben Daten wie der Discord-Bot zu.";
  } else {
    topEntry.textContent = "Noch kein Eintrag";
    topPreview.textContent = "Noch keine Daten im Archiv";
  }
};

const applySession = (session) => {
  if (!session.oauth_ready) {
    authStatus.textContent = "Discord Login offen";
    authAction.href = "/archiv/#sync";
    authAction.textContent = "Discord einrichten";
    return;
  }

  if (session.user) {
    authStatus.textContent = "Discord verbunden";
    authAction.href = "/archiv/#editor";
    authAction.textContent = `Weiter als ${session.user.display_name || session.user.username}`;
  } else {
    authStatus.textContent = "Bereit fuer Login";
    authAction.href = session.login_url || "/auth/discord?next=%2Farchiv%2F%23editor";
    authAction.textContent = "Mit Discord anmelden";
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
    focusTitle.textContent = "Menue bereit";
    focusCopy.textContent = error.message;
  }
});
