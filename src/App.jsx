import { useState, useEffect, useMemo, useRef } from "react";
import { Menu, Shuffle, ChevronLeft, ChevronRight, Pencil, Trash2, Star, Film, Clock, X, Search, Rocket, Minus, Plus, Check, RefreshCw, ExternalLink, Info, PlusCircle, CalendarDays, Play, FileText } from "lucide-react";

/* ------------------------------------------------------------------ */
/* THÈMES — deux palettes disponibles, sélectionnables dans Réglages.  */
/* T et F sont volontairement des `let` (pas `const`) : changer de     */
/* thème mute leurs propriétés en place plutôt que de les remplacer,   */
/* pour que tous les composants (qui lisent T.xxx / F.xxx au moment du */
/* rendu) captent la nouvelle valeur sans avoir besoin d'un Context.   */
/* ------------------------------------------------------------------ */
const THEMES = {
  ticket: {
    label: "Ticket de cinéma",
    groupe: "Originaux",
    colors: {
      bg: "#14100C",
      surface: "#1F1912",
      surfaceRaised: "#2A2216",
      accent: "#C58D29",
      accentSoft: "#3A2C13",
      accentSecondary: "#56929F",
      accentSecondarySoft: "#16262A",
      cream: "#F3EEE3",
      muted: "#9C9284",
      mutedDim: "#6B6355",
      line: "#332B22",
      alert: "#B85C4A",
      alertSoft: "#2E1A15",
      radius: 16,
      radiusSm: 8,
      shadow: "none",
      borderWidth: 1,
    },
    fonts: { marquee: "'Bebas Neue', sans-serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Mono', monospace" },
  },
  bleu: {
    label: "Bleu moderne",
    groupe: "Originaux",
    colors: {
      bg: "#0B0E14",
      surface: "#131720",
      surfaceRaised: "#1B212C",
      accent: "#3D7DFF",
      accentSoft: "#152244",
      accentSecondary: "#7FB4FF",
      accentSecondarySoft: "#16223F",
      cream: "#EDEFF3",
      muted: "#7C8494",
      mutedDim: "#4E5666",
      line: "#1F2530",
      alert: "#E85D6E",
      alertSoft: "#301A20",
      radius: 16,
      radiusSm: 8,
      shadow: "none",
      borderWidth: 1,
    },
    fonts: { marquee: "'Sora', sans-serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Mono', monospace" },
  },
  table: {
    label: "Table lumineuse",
    groupe: "Signature",
    colors: {
      bg: "#EDEEE8",
      surface: "#FFFFFF",
      surfaceRaised: "#E2E3DB",
      accent: "#E8432F",
      accentSoft: "#F5D9D4",
      accentSecondary: "#6B6E64",
      accentSecondarySoft: "#DEDFD8",
      cream: "#14171C",
      muted: "#4A4D45",
      mutedDim: "#7A7D75",
      line: "#14171C22",
      alert: "#E8432F",
      alertSoft: "#F5D9D4",
      radius: 2,
      radiusSm: 2,
      shadow: "none",
      borderWidth: 2,
    },
    fonts: { marquee: "'Source Serif 4', serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Mono', monospace" },
  },
  affiche: {
    label: "Affiche de festival",
    groupe: "Signature",
    colors: {
      bg: "#F2F0E8",
      surface: "#FFFFFF",
      surfaceRaised: "#F0F0EA",
      accent: "#00D9C0",
      accentSoft: "#FF7A1A",
      accentSecondary: "#2F6BFF",
      accentSecondarySoft: "#FFF1DC",
      gold: "#FFD400",
      cream: "#0D0D0D",
      muted: "#0D0D0DB3",
      mutedDim: "#0D0D0D80",
      line: "#0D0D0D33",
      alert: "#FF7A1A",
      alertSoft: "#FFE9D6",
      radius: 0,
      radiusSm: 0,
      shadow: "4px 4px 0 #0D0D0D",
      borderWidth: 3,
    },
    fonts: { marquee: "'Archivo Black', sans-serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Mono', monospace" },
  },
  minitel: {
    label: "Minitel",
    groupe: "Signature",
    colors: {
      bg: "#000000",
      surface: "#000000",
      surfaceRaised: "#0A0A0A",
      accent: "#00D9C0",
      accentSoft: "#FF7A1A",
      accentSecondary: "#2F6BFF",
      accentSecondarySoft: "#0A1830",
      gold: "#FFD400",
      cream: "#F0F0F0",
      muted: "#F0F0F099",
      mutedDim: "#F0F0F066",
      line: "#F0F0F033",
      alert: "#FF7A1A",
      alertSoft: "#2A1400",
      radius: 0,
      radiusSm: 0,
      shadow: "none",
      borderWidth: 1,
    },
    fonts: { marquee: "'IBM Plex Mono', monospace", serif: "'IBM Plex Mono', monospace", mono: "'IBM Plex Mono', monospace" },
  },
  salle: {
    label: "Salle privée",
    groupe: "Signature",
    colors: {
      bg: "#1B1720",
      surface: "#241F2C",
      surfaceRaised: "#2E2836",
      accent: "#C9A876",
      accentSoft: "#3A3226",
      accentSecondary: "#8E7F9E",
      accentSecondarySoft: "#332C42",
      cream: "#F0EAE2",
      muted: "#A69AAE",
      mutedDim: "#6E637A",
      line: "#332C3D",
      alert: "#C97C6E",
      alertSoft: "#3A2620",
      radius: 20,
      radiusSm: 16,
      shadow: "0 8px 20px rgba(0,0,0,0.35)",
      borderWidth: 1,
    },
    fonts: { marquee: "'Playfair Display', serif", serif: "'Source Serif 4', serif", mono: "'Inter', sans-serif" },
  },
  letterboxd: {
    label: "Letterboxd",
    groupe: "Signature",
    colors: {
      bg: "#14181C",
      surface: "#1C2228",
      surfaceRaised: "#242C33",
      accent: "#00E054",
      accentSoft: "#0F2A1C",
      accentSecondary: "#40BCF4",
      accentSecondarySoft: "#0F222E",
      gold: "#FF8000",
      cream: "#F5F5F5",
      muted: "#8CA3B3",
      mutedDim: "#5A6E7B",
      line: "#2A333A",
      alert: "#FF8000",
      alertSoft: "#2E1F0A",
      radius: 6,
      radiusSm: 4,
      shadow: "none",
      borderWidth: 1,
    },
    fonts: { marquee: "'Inter', sans-serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Mono', monospace" },
  },
  // ---- Importés de CinéRadar (même mécanisme T/F, purement palette/forme —
  // pas de branche CURRENT_THEME dédiée, rendu par défaut comme Ticket/Bleu) ----
  sombre: {
    label: "Guichet Nocturne",
    groupe: "Ambiances CinéRadar",
    colors: {
      bg: "#13100C",
      surface: "#1D1812",
      surfaceRaised: "#241D16",
      accent: "#E7A23A",
      accentDim: "#8A6A34",
      accentSoft: "rgba(231,162,58,0.12)",
      accentSecondary: "#B23A32",
      accentSecondarySoft: "rgba(178,58,50,0.14)",
      cream: "#F3ECDF",
      muted: "#93877A",
      mutedDim: "#5F5648",
      line: "#37301F",
      alert: "#B23A32",
      alertSoft: "rgba(178,58,50,0.14)",
      radius: 8,
      radiusSm: 4,
      shadow: "none",
      borderWidth: 1,
    },
    fonts: { marquee: "'Bebas Neue', sans-serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Mono', monospace" },
  },
  clair: {
    label: "Matinée",
    groupe: "Ambiances CinéRadar",
    colors: {
      bg: "#F5F1E8",
      surface: "#FFFFFF",
      surfaceRaised: "#EFE8D8",
      accent: "#B8792E",
      accentDim: "#D8B98A",
      accentSoft: "rgba(184,121,46,0.10)",
      accentSecondary: "#A83232",
      accentSecondarySoft: "rgba(168,50,50,0.10)",
      cream: "#241D16",
      muted: "#8A7F70",
      mutedDim: "#C7BFAF",
      line: "#E3DACB",
      alert: "#C23B3B",
      alertSoft: "rgba(194,59,59,0.10)",
      radius: 10,
      radiusSm: 6,
      shadow: "0 1px 3px rgba(0,0,0,0.08)",
      borderWidth: 1,
    },
    fonts: { marquee: "'Bebas Neue', sans-serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Mono', monospace" },
  },
  neon: {
    label: "Vidéoclub 88",
    groupe: "Ambiances CinéRadar",
    colors: {
      bg: "#0D0620",
      surface: "#1A0E33",
      surfaceRaised: "#241442",
      accent: "#FF2E88",
      accentDim: "#7A1A48",
      accentSoft: "rgba(255,46,136,0.14)",
      accentSecondary: "#2EE6D6",
      accentSecondarySoft: "rgba(46,230,214,0.14)",
      cream: "#F5E9FF",
      muted: "#8A79B8",
      mutedDim: "#4E4380",
      line: "#3D2A66",
      alert: "#FF3B5C",
      alertSoft: "rgba(255,59,92,0.16)",
      radius: 4,
      radiusSm: 3,
      shadow: "0 0 14px rgba(255,46,136,0.30)",
      borderWidth: 2,
    },
    fonts: { marquee: "'Bebas Neue', sans-serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Mono', monospace" },
  },
  noir: {
    label: "Film Noir",
    groupe: "Ambiances CinéRadar",
    colors: {
      bg: "#0A0A0A",
      surface: "#161616",
      surfaceRaised: "#1F1F1F",
      accent: "#E8E8E8",
      accentDim: "#5C5C5C",
      accentSoft: "rgba(232,232,232,0.10)",
      accentSecondary: "#8B1E1E",
      accentSecondarySoft: "rgba(139,30,30,0.16)",
      cream: "#EDEDED",
      muted: "#8C8C8C",
      mutedDim: "#4A4A4A",
      line: "#2E2E2E",
      alert: "#8B1E1E",
      alertSoft: "rgba(139,30,30,0.16)",
      radius: 0,
      radiusSm: 0,
      shadow: "0 2px 10px rgba(0,0,0,0.6)",
      borderWidth: 1,
    },
    fonts: { marquee: "'Bebas Neue', sans-serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Mono', monospace" },
  },
  sepia: {
    label: "Pellicule Vintage",
    groupe: "Ambiances CinéRadar",
    colors: {
      bg: "#2B2013",
      surface: "#3A2C1A",
      surfaceRaised: "#453520",
      accent: "#C08A3E",
      accentDim: "#7A5C2E",
      accentSoft: "rgba(192,138,62,0.14)",
      accentSecondary: "#9C4A35",
      accentSecondarySoft: "rgba(156,74,53,0.16)",
      cream: "#EDE0C8",
      muted: "#A08C6D",
      mutedDim: "#5E5138",
      line: "#57452C",
      alert: "#9C4A35",
      alertSoft: "rgba(156,74,53,0.16)",
      radius: 6,
      radiusSm: 4,
      shadow: "none",
      borderWidth: 1,
    },
    fonts: { marquee: "'Bebas Neue', sans-serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Mono', monospace" },
  },
  imax: {
    label: "Salle IMAX",
    groupe: "Ambiances CinéRadar",
    colors: {
      bg: "#060B14",
      surface: "#0E1826",
      surfaceRaised: "#142234",
      accent: "#3FA9F5",
      accentDim: "#1E4A6B",
      accentSoft: "rgba(63,169,245,0.14)",
      accentSecondary: "#F5A623",
      accentSecondarySoft: "rgba(245,166,35,0.14)",
      cream: "#E8F1FA",
      muted: "#7C93AC",
      mutedDim: "#3D5066",
      line: "#1D3048",
      alert: "#E5484D",
      alertSoft: "rgba(229,72,77,0.16)",
      radius: 10,
      radiusSm: 6,
      shadow: "0 0 18px rgba(63,169,245,0.22)",
      borderWidth: 1,
    },
    fonts: { marquee: "'Bebas Neue', sans-serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Mono', monospace" },
  },
  drivein: {
    label: "Ciné Plein Air",
    groupe: "Ambiances CinéRadar",
    colors: {
      bg: "#1B1B3A",
      surface: "#262650",
      surfaceRaised: "#303066",
      accent: "#FF6F59",
      accentDim: "#8A3B30",
      accentSoft: "rgba(255,111,89,0.14)",
      accentSecondary: "#2FBFA6",
      accentSecondarySoft: "rgba(47,191,166,0.14)",
      cream: "#FCEEDD",
      muted: "#9B93C9",
      mutedDim: "#524C87",
      line: "#3A3A6E",
      alert: "#FF4D6A",
      alertSoft: "rgba(255,77,106,0.16)",
      radius: 16,
      radiusSm: 10,
      shadow: "none",
      borderWidth: 2,
    },
    fonts: { marquee: "'Bebas Neue', sans-serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Mono', monospace" },
  },
  cannes: {
    label: "Tapis Rouge",
    groupe: "Ambiances CinéRadar",
    colors: {
      bg: "#1A0A0C",
      surface: "#240F13",
      surfaceRaised: "#2E1418",
      accent: "#D4AF37",
      accentDim: "#7A6420",
      accentSoft: "rgba(212,175,55,0.14)",
      accentSecondary: "#7A1128",
      accentSecondarySoft: "rgba(122,17,40,0.18)",
      cream: "#F5E9D8",
      muted: "#9C837A",
      mutedDim: "#553F3A",
      line: "#3D1D22",
      alert: "#7A1128",
      alertSoft: "rgba(122,17,40,0.18)",
      radius: 4,
      radiusSm: 3,
      shadow: "0 4px 14px rgba(0,0,0,0.5)",
      borderWidth: 1,
    },
    fonts: { marquee: "'Bebas Neue', sans-serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Mono', monospace" },
  },
  // ---- 4 nouvelles directions : couleurs/police/forme intégrées, les     ----
  // ---- inventions structurelles (grille bento, JSON, BD, blobs) restent  ----
  // ---- propres aux aperçus — non reproduites sur tous les écrans ici.    ----
  bento: {
    label: "Bento Moderne",
    groupe: "Mises en page réinventées",
    colors: {
      bg: "#EDE7FF",
      surface: "rgba(255,255,255,0.6)",
      surfaceRaised: "rgba(255,255,255,0.85)",
      accent: "#9B7EF5",
      accentSoft: "#EDE7FF",
      accentSecondary: "#FF8FA3",
      accentSecondarySoft: "#FFE8EE",
      gold: "#4ED8B0",
      cream: "#2B2140",
      muted: "#6B6082",
      mutedDim: "#9A91AC",
      line: "rgba(255,255,255,0.9)",
      alert: "#FF8FA3",
      alertSoft: "#FFE8EE",
      radius: 24,
      radiusSm: 18,
      shadow: "0 8px 24px rgba(155,126,245,0.15)",
      borderWidth: 1,
    },
    fonts: { marquee: "'Inter', sans-serif", serif: "'Inter', sans-serif", mono: "'IBM Plex Mono', monospace" },
  },
  terminal: {
    label: "Terminal Sombre",
    groupe: "Mises en page réinventées",
    colors: {
      bg: "#1E1E1E",
      surface: "#252526",
      surfaceRaised: "#2D2D2D",
      accent: "#569CD6",
      accentSoft: "#1B2A38",
      accentSecondary: "#CE9178",
      accentSecondarySoft: "#2E2622",
      gold: "#B5CEA8",
      cream: "#D4D4D4",
      muted: "#8A8A8A",
      mutedDim: "#6A6A6A",
      line: "#333333",
      alert: "#CE9178",
      alertSoft: "#2E2622",
      radius: 0,
      radiusSm: 0,
      shadow: "none",
      borderWidth: 1,
    },
    fonts: { marquee: "'IBM Plex Mono', monospace", serif: "'IBM Plex Mono', monospace", mono: "'IBM Plex Mono', monospace" },
  },
  bd: {
    label: "Bulle BD",
    groupe: "Mises en page réinventées",
    colors: {
      bg: "#FFF8E7",
      surface: "#FFFFFF",
      surfaceRaised: "#FFF3D0",
      accent: "#E8394A",
      accentSoft: "#FFC93C",
      accentSecondary: "#2E6FE0",
      accentSecondarySoft: "#E0EBFF",
      gold: "#FFC93C",
      cream: "#161414",
      muted: "#161414B3",
      mutedDim: "#16141480",
      line: "#16141433",
      alert: "#E8394A",
      alertSoft: "#FFE1E4",
      radius: 4,
      radiusSm: 4,
      shadow: "5px 5px 0 #161414",
      borderWidth: 3,
    },
    fonts: { marquee: "'Archivo Black', sans-serif", serif: "'Inter', sans-serif", mono: "'IBM Plex Mono', monospace" },
  },
  jardin: {
    label: "Jardin d'Hiver",
    groupe: "Mises en page réinventées",
    colors: {
      bg: "#F4EFE6",
      surface: "#FFFDF8",
      surfaceRaised: "#EDE6D8",
      accent: "#8A9A80",
      accentSoft: "#E6EAE0",
      accentSecondary: "#C97C5D",
      accentSecondarySoft: "#F5E4DC",
      gold: "#C97C5D",
      cream: "#3A3630",
      muted: "#8A8377",
      mutedDim: "#B0AA9C",
      line: "#8A9A8033",
      alert: "#C97C5D",
      alertSoft: "#F5E4DC",
      radius: 32,
      radiusSm: 24,
      shadow: "none",
      borderWidth: 1,
    },
    fonts: { marquee: "'Source Serif 4', serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Mono', monospace" },
  },
};

let T = { ...THEMES.ticket.colors };
let F = { ...THEMES.ticket.fonts };
let CURRENT_THEME = "ticket"; // nom du thème actif — lu directement par les composants qui ont besoin d'un rendu spécifique (ex: SectionTitle, Poster) au-delà d'un simple changement de couleur/police.

// Applique un thème en mutant T et F en place (voir note ci-dessus).
// Le composant appelant doit ensuite forcer un nouveau rendu (voir
// App() plus bas, qui expose ça via onChangeTheme).
function applyTheme_(name) {
  const theme = THEMES[name] || THEMES.ticket;
  Object.assign(T, theme.colors);
  Object.assign(F, theme.fonts);
  CURRENT_THEME = THEMES[name] ? name : "ticket";
  try { localStorage.setItem("cinemaison_theme", name); } catch {}
}

function getStoredTheme_() {
  try { return localStorage.getItem("cinemaison_theme") || "ticket"; } catch { return "ticket"; }
}

function getStoredNbAccueil_() {
  try {
    const v = parseInt(localStorage.getItem("cinemaison_nbAccueil"), 10);
    return Number.isFinite(v) && v >= 3 && v <= 15 ? v : 8;
  } catch { return 8; }
}

/* ------------------------------------------------------------------ */
/* ECRITURES PROTÉGÉES — add-film / update-film / delete-film          */
/* Le mot de passe est demandé une seule fois puis mémorisé sur cet    */
/* appareil (localStorage) pour ne pas le retaper à chaque action.     */
/* ------------------------------------------------------------------ */
function getStoredPassword() {
  try { return localStorage.getItem("cinemaison_pwd") || ""; } catch { return ""; }
}
function askAndStorePassword() {
  const pwd = window.prompt("Mot de passe (modification/ajout) :");
  if (pwd) { try { localStorage.setItem("cinemaison_pwd", pwd); } catch {} }
  return pwd || "";
}

async function apiWrite(url, body) {
  let password = getStoredPassword();
  if (!password) password = askAndStorePassword();
  if (!password) return { ok: false, error: "Mot de passe requis" };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, password }),
  });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    // Mauvais mot de passe : on l'efface pour le redemander la prochaine fois
    try { localStorage.removeItem("cinemaison_pwd"); } catch {}
    return { ok: false, error: "Mot de passe incorrect" };
  }
  if (!res.ok) return { ok: false, error: data.error || "Erreur serveur" };
  return { ok: true, data };
}

/* ------------------------------------------------------------------ */
/* UTILITAIRES DATES                                                   */
/* ------------------------------------------------------------------ */
// Les dates du Sheet sont au format JJ/MM/AAAA
function parseDateFR(str) {
  if (!str) return null;
  const m = String(str).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  return isNaN(date.getTime()) ? null : date;
}

function daysUntil(date) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

// Priorité à la date saisie manuellement ; à défaut la date automatique
function computeExpiryDays(film) {
  const manuelle = parseDateFR(film.dateManuelle);
  const auto = parseDateFR(film.dateAuto);
  const days = daysUntil(manuelle) ?? daysUntil(auto);
  return days;
}

// Une fiche est archivée uniquement si dateManuelle est renseignée ET dépassée.
// Sans dateManuelle, la fiche reste toujours visible dans sa bibliothèque,
// quoi que dise dateAuto.
function isArchived(film) {
  const manuelle = parseDateFR(film.dateManuelle);
  if (!manuelle) return false;
  return daysUntil(manuelle) < 0;
}

// Ignore les valeurs texte non-numériques du Sheet (ex. "PAS DE NOTE")
function parseRating(v) {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/* ------------------------------------------------------------------ */
/* PLATEFORMES — logos réels si présents dans /public/logos/,          */
/* sinon repli automatique sur une pastille avec l'initiale            */
/* ------------------------------------------------------------------ */
const PLATFORM_SLUGS = {
  "Canal+": "canal",
  "Netflix": "netflix",
  "Prime Video": "prime",
  "Disney+": "disney",
};
const PLATFORM_SLUGS_UPPER = Object.fromEntries(Object.entries(PLATFORM_SLUGS).map(([k, v]) => [k.toUpperCase(), v]));

function PlatformIcon({ label }) {
  const [failed, setFailed] = useState(false);
  const slug = PLATFORM_SLUGS_UPPER[(label || "").toUpperCase()];
  const showImg = slug && !failed;

  if (CURRENT_THEME === "affiche") {
    // Bloc plein encre, comme sur l'affiche validée
    return (
      <span className="inline-flex items-center px-3 py-1.5" style={{ background: T.cream }}>
        <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 0.6, color: T.surface, fontWeight: 700 }}>{(label || "").toUpperCase()}</span>
      </span>
    );
  }
  if (CURRENT_THEME === "minitel") {
    // Bloc plein couleur (turquoise), texte noir, comme sur le Minitel
    return (
      <span className="inline-flex items-center px-2" style={{ background: T.accent, padding: "2px 8px" }}>
        <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 0.6, color: "#000000", fontWeight: 700 }}>{(label || "").toUpperCase()}</span>
      </span>
    );
  }
  if (CURRENT_THEME === "bd") {
    // Pastille blanche à contour encre épais, comme les cases de la planche
    return (
      <span className="inline-flex items-center px-3 py-1.5" style={{ background: T.surface, border: `2px solid ${T.cream}`, borderRadius: 6 }}>
        <span style={{ fontFamily: F.marquee, fontSize: 10, color: T.cream }}>{(label || "").toUpperCase()}</span>
      </span>
    );
  }
  if (CURRENT_THEME === "salle") {
    // Pastille douce teintée mauve, plus discrète que le pilulier logo+texte
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full" style={{ background: `${T.accentSecondary}22`, border: `1px solid ${T.accentSecondary}44` }}>
        <span style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: 0.8, color: T.accentSecondary, fontWeight: 500, textTransform: "uppercase" }}>{label}</span>
      </span>
    );
  }
  if (CURRENT_THEME === "jardin") {
    // Pastille pleine, sans bordure — esprit galet posé, pas de contour dur
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full" style={{ background: T.surface }}>
        <span style={{ fontFamily: F.serif, fontSize: 11, color: T.accent, fontWeight: 600 }}>{label}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      {showImg ? (
        <img
          src={`/logos/${slug}.png`}
          alt={label}
          className="flex-shrink-0 rounded-md"
          style={{ width: 22, height: 22, objectFit: "contain", background: "#0A0A0A" }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="flex items-center justify-center flex-shrink-0 rounded-md" style={{ width: 22, height: 22, background: T.surfaceRaised, fontSize: 10, color: T.muted }}>
          {(label || "?")[0]}
        </span>
      )}
      <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 0.6, color: T.cream, fontWeight: 600 }}>{(label || "").toUpperCase()}</span>
    </span>
  );
}

// Petites perforations façon pellicule 35mm, utilisées uniquement par
// TrailerButton (variante B validée). Purement décoratif.
function FilmSprockets({ count = 7 }) {
  return (
    <div className="flex items-center justify-between px-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ width: 3.5, height: 3.5, borderRadius: 1, background: T.accent, opacity: 0.55, flexShrink: 0 }} />
      ))}
    </div>
  );
}

// Bouton "Bande-annonce" — n'apparaît que si film.urlBandeAnnonce est
// renseigné (rempli par le script d'enrichissement via TMDb). Ouvre le
// lien YouTube dans un nouvel onglet.
function TrailerButton({ url }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="relative inline-flex flex-col rounded-lg overflow-hidden flex-shrink-0"
      style={{ border: `1.5px solid ${T.accent}` }}
    >
      <div className="px-1 pt-1" style={{ background: `${T.accent}22` }}><FilmSprockets /></div>
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Play size={13} color={T.accent} fill={T.accent} strokeWidth={0} />
        <span style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: 0.5, color: T.accent, fontWeight: 600 }}>TRAILER</span>
      </div>
      <div className="px-1 pb-1" style={{ background: `${T.accent}22` }}><FilmSprockets /></div>
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* ELEMENTS SIGNATURE                                                  */
/* ------------------------------------------------------------------ */
// Couleurs plates qui tournent selon le titre — évite que tous les
// posters de repli des thèmes festival/minitel soient identiques.
const AFFICHE_BLOCKS = ["accent", "accentSoft", "accentSecondary", "gold"];
function afficheBlockColor_(titre) {
  const i = (titre || "").split("").reduce((s, c) => s + c.charCodeAt(0), 0) % AFFICHE_BLOCKS.length;
  return T[AFFICHE_BLOCKS[i]];
}

// Curseur bloc clignotant, clin d'œil Minitel — utilisé uniquement quand
// CURRENT_THEME === "minitel" (voir la barre de recherche de l'Accueil).
function MinitelCursor() {
  return (
    <span style={{ width: 7, height: 13, background: T.cream, display: "inline-block", animation: "minitelBlink 1s step-end infinite", marginLeft: 2 }} />
  );
}

// Petites perforations façon pellicule négative, utilisées uniquement en
// thème "table" (Table lumineuse). Superposées en absolu par-dessus le
// cadre du poster, sans modifier sa taille/position propre.
function NegativeSprockets({ side }) {
  return (
    <div className="absolute left-0 right-0 flex justify-between px-1.5 z-10" style={{ [side]: -4 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ width: 4, height: 4, background: T.bg, border: `1.5px solid ${T.cream}`, flexShrink: 0 }} />
      ))}
    </div>
  );
}

function Poster({ film, className, style }) {
  const [failed, setFailed] = useState(false);
  const isTable = CURRENT_THEME === "table";
  const isJardin = CURRENT_THEME === "jardin";
  // Coins asymétriques façon galet — remplace l'arrondi standard uniquement
  // pour ce thème, quelle que soit la taille de l'affiche (mini-carte,
  // grande affiche de fiche détail...).
  const jardinRadius = "38% 62% 63% 37% / 41% 44% 56% 59%";
  let content;

  if (!film.affiche || failed) {
    const flatBlockThemes = CURRENT_THEME === "affiche" || CURRENT_THEME === "minitel" || CURRENT_THEME === "bd";
    const isBD = CURRENT_THEME === "bd";
    const flatColor = flatBlockThemes ? afficheBlockColor_(film.titre) : null;
    const background = isBD
      // Trame de points par-dessus l'aplat de couleur, façon impression BD
      ? `radial-gradient(${T.cream}33 1px, transparent 1px), ${flatColor}`
      : flatBlockThemes
      ? flatColor
      : `linear-gradient(160deg, ${T.accentSoft}, ${T.surfaceRaised})`;
    const textColor = CURRENT_THEME === "affiche" || isBD ? T.cream : CURRENT_THEME === "minitel" ? "#000000" : T.accent;
    content = (
      <div
        className={isTable ? "w-full h-full" : className}
        style={{
          ...(isTable ? { border: `2px solid ${T.cream}`, boxSizing: "border-box" } : style),
          ...(isBD ? { border: `${T.borderWidth}px solid ${T.cream}`, boxSizing: "border-box", backgroundSize: "7px 7px, auto" } : {}),
          ...(isJardin ? { borderRadius: jardinRadius, overflow: "hidden" } : {}),
          background, display: "flex", alignItems: "center", justifyContent: "center", padding: 6,
        }}
      >
        <span style={{ fontFamily: isJardin ? F.serif : F.marquee, fontStyle: isJardin ? "italic" : "normal", fontSize: 12, color: textColor, letterSpacing: 0.5, textAlign: "center", lineHeight: 1.15, fontWeight: CURRENT_THEME === "minitel" || isBD ? 700 : 400 }}>
          {(film.titre || "").slice(0, 22).toUpperCase()}
        </span>
      </div>
    );
  } else {
    content = (
      <img
        src={film.affiche} alt={film.titre}
        className={isTable ? "w-full h-full" : className}
        style={{
          ...(isTable ? { border: `2px solid ${T.cream}`, boxSizing: "border-box" } : style),
          ...(CURRENT_THEME === "bd" ? { border: `${T.borderWidth}px solid ${T.cream}`, boxSizing: "border-box" } : {}),
          ...(isJardin ? { borderRadius: jardinRadius } : {}),
          objectFit: "cover", objectPosition: "top",
        }}
        onError={() => setFailed(true)}
      />
    );
  }

  if (isTable) {
    return (
      <div className={`relative ${className || ""}`} style={style}>
        <NegativeSprockets side="top" />
        {content}
        <NegativeSprockets side="bottom" />
      </div>
    );
  }
  return content;
}

function RatingStamp({ value, size = 58 }) {
  const rating = parseRating(value);
  if (rating == null) return null;

  if (CURRENT_THEME === "letterboxd") {
    // Signature Letterboxd : étoiles pleines/demies, pas de pastille
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return (
      <div className="text-right flex-shrink-0">
        <span style={{ color: T.gold, fontSize: size * 0.28, letterSpacing: -1 }}>{"★".repeat(full)}{half ? "½" : ""}</span>
        <p style={{ fontFamily: F.mono, fontSize: size * 0.15, color: T.mutedDim, marginTop: 2 }}>{rating.toFixed(1)}</p>
      </div>
    );
  }
  if (CURRENT_THEME === "salle") {
    // Pastille douce plutôt que le cachet pivoté façon ticket
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full flex-shrink-0" style={{ padding: `${size * 0.1}px ${size * 0.18}px`, background: T.accentSoft }}>
        <Star size={size * 0.2} color={T.accent} fill={T.accent} strokeWidth={0} />
        <span style={{ fontFamily: F.mono, fontSize: size * 0.2, color: T.accent, fontWeight: 600 }}>{rating.toFixed(1)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${T.accent}`,
        boxShadow: `inset 0 0 0 2px ${T.bg}, inset 0 0 0 4px ${T.accent}`, transform: "rotate(-6deg)", background: "rgba(197,141,41,0.06)" }}>
      <Star size={size * 0.26} color={T.accent} fill={T.accent} strokeWidth={0} style={{ marginBottom: 2 }} />
      <span style={{ fontFamily: F.marquee, fontSize: size * 0.38, color: T.accent, lineHeight: 1 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

function DateStamp({ days }) {
  return (
    <div className="absolute flex flex-col items-center justify-center"
      style={{
        top: 6, right: 6, width: 40, height: 40, borderRadius: "50%",
        border: `2px solid ${T.accent}`, background: "rgba(20,16,12,0.72)",
        boxShadow: `0 0 0 2px ${T.bg}`, transform: "rotate(-10deg)",
      }}>
      <span style={{ fontFamily: F.marquee, fontSize: 15, color: T.accent, lineHeight: 1 }}>J-{days}</span>
    </div>
  );
}

function SectionTitle({ children, icon: Icon = Film, onMore }) {
  if (CURRENT_THEME === "affiche") {
    // Thème festival : titre encadré en bloc plat turquoise (couleur principale validée)
    return (
      <div className="flex items-center gap-2 px-4 mb-2.5">
        <span style={{ fontFamily: F.marquee, fontSize: 13, color: T.cream, background: T.accent, padding: "2px 8px", boxShadow: T.shadow, border: `${T.borderWidth}px solid ${T.cream}` }}>
          {children}
        </span>
      </div>
    );
  }
  if (CURRENT_THEME === "minitel") {
    // Thème Minitel : barre bloc pleine couleur façon "■ SECTION", comme le visuel validé
    return (
      <div className="mb-2 px-4">
        <span style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: 1.5, color: "#000", background: T.accentSecondary, padding: "3px 8px", fontWeight: 700 }}>
          ■ {children}
        </span>
      </div>
    );
  }
  if (CURRENT_THEME === "salle") {
    // Titre éditorial + "Voir tout", sans barre ni encadré — plus posé
    return (
      <div className="flex items-center justify-between px-5 mb-3.5">
        <span style={{ fontFamily: F.marquee, fontSize: 17, color: T.cream, fontWeight: 500 }}>{children}</span>
        {onMore ? (
          <button onClick={onMore} style={{ fontFamily: F.mono, fontSize: 10.5, color: T.accent, letterSpacing: 0.3 }}>Voir tout</button>
        ) : (
          <span style={{ fontFamily: F.mono, fontSize: 10.5, color: T.accent, letterSpacing: 0.3 }}>Voir tout</span>
        )}
      </div>
    );
  }
  if (CURRENT_THEME === "letterboxd") {
    // Tri-point du logo Letterboxd en repère de section
    return (
      <div className="flex items-center gap-2 px-4 mb-3">
        <span className="inline-flex items-center">
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.gold, display: "inline-block" }} />
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.accent, display: "inline-block", marginLeft: -2.5 }} />
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.accentSecondary, display: "inline-block", marginLeft: -2.5 }} />
        </span>
        <span style={{ fontFamily: F.marquee, fontSize: 12.5, letterSpacing: 0.3, color: T.cream, fontWeight: 700 }}>{children}</span>
      </div>
    );
  }
  if (CURRENT_THEME === "bento") {
    // Étiquette "pilule" façon dashboard, avec petit lien discret — l'esprit tuile
    return (
      <div className="flex items-center justify-between px-4 mb-3">
        <span className="px-3 py-1.5" style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 999, fontFamily: F.marquee, fontSize: 12, color: T.cream, fontWeight: 700, boxShadow: T.shadow }}>{children}</span>
      </div>
    );
  }
  if (CURRENT_THEME === "terminal") {
    // Commentaire de code, comme dans l'aperçu
    return (
      <div className="px-4 mb-2">
        <span style={{ fontFamily: F.mono, fontSize: 11, color: "#6A9955" }}>{"// " + String(children).toLowerCase()}</span>
      </div>
    );
  }
  if (CURRENT_THEME === "bd") {
    // Vraie bulle de dialogue, avec la pointe qui pointe vers le bas
    return (
      <div className="px-4 mb-5">
        <div className="relative inline-block px-3 py-1.5" style={{ background: T.accentSoft, border: `${T.borderWidth}px solid ${T.cream}`, borderRadius: 14 }}>
          <span style={{ fontFamily: F.marquee, fontSize: 10, color: T.cream }}>{children}</span>
          <div className="absolute" style={{ left: 14, bottom: -9, width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: `9px solid ${T.cream}` }} />
          <div className="absolute" style={{ left: 17, bottom: -5.5, width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `6px solid ${T.accentSoft}` }} />
        </div>
      </div>
    );
  }
  if (CURRENT_THEME === "jardin") {
    // Titre italique posé, simple filet fin — esprit "jardin", pas de bloc
    return (
      <div className="flex items-center gap-2 px-6 mb-4">
        <span style={{ fontFamily: F.serif, fontSize: 16, color: T.cream, fontStyle: "italic" }}>{children}</span>
        <div style={{ flex: 1, height: 1, background: `${T.accent}55` }} />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-4 mb-2">
      <Icon size={13} color={T.accent} style={{ flexShrink: 0 }} />
      <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 1.4, color: T.cream, fontWeight: 600, whiteSpace: "nowrap" }}>{children}</span>
      <span style={{ height: 1, flex: 1, background: T.accent, opacity: 0.5 }} />
    </div>
  );
}

function Perforation() {
  return (
    <div className="relative w-px self-stretch flex-shrink-0">
      <div className="absolute inset-y-0 left-0 w-px" style={{ borderLeft: `2px dashed ${T.mutedDim}`, opacity: 0.5 }} />
      <div className="absolute rounded-full" style={{ width: 12, height: 12, left: -6, top: -6, background: T.bg }} />
      <div className="absolute rounded-full" style={{ width: 12, height: 12, left: -6, bottom: -6, background: T.bg }} />
    </div>
  );
}

function LogoMark({ size = 32 }) {
  return (
    <div className="flex-shrink-0 flex items-center justify-center"
      style={{ width: size, height: size, borderRadius: size * 0.22, background: T.accentSoft, border: `1px solid ${T.accent}55` }}>
      <span style={{ fontFamily: F.marquee, fontSize: size * 0.5, color: T.accent }}>C</span>
    </div>
  );
}

function LetterboxdMark({ size = 9 }) {
  const dot = { width: size, height: size, borderRadius: "50%", display: "inline-block" };
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex" style={{ marginRight: -size * 0.5 }}>
        <span style={{ ...dot, background: "#FF8000" }} />
        <span style={{ ...dot, background: "#00E054", marginLeft: -size * 0.45 }} />
        <span style={{ ...dot, background: "#40BCF4", marginLeft: -size * 0.45 }} />
      </span>
      <span style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: 0.6, color: T.muted }}>via Letterboxd</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* CARTES                                                              */
/* ------------------------------------------------------------------ */
function TicketCard({ film, onOpen }) {
  const expiryDays = computeExpiryDays(film);
  const rating = parseRating(film.noteLetterboxd);
  return (
    <button onClick={() => onOpen(film)} className="flex text-left overflow-hidden w-full"
      style={{ background: T.surface, border: `${T.borderWidth}px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow }}>
      <Poster film={film} className="w-20 h-28 flex-shrink-0" />
      <Perforation />
      <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
        <div>
          <p className="truncate" style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 15, color: T.cream }}>{film.titre}</p>
          <p style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.4 }}>
            {film.annee} · {(film.type || "").toUpperCase()}{film.duree ? ` · ${film.duree}` : ""}
          </p>
          {rating != null && <p style={{ fontFamily: F.mono, fontSize: 10, color: T.accent, fontWeight: 600, marginTop: 3 }}>★ {rating.toFixed(1)}</p>}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 0.5, color: T.muted }}>{(film.plateforme || "").toUpperCase()}</span>
          {expiryDays != null && expiryDays >= 0 && <span style={{ fontFamily: F.mono, fontSize: 10, color: T.alert, fontWeight: 600 }}>{`J-${expiryDays}`}</span>}
        </div>
      </div>
    </button>
  );
}

function MiniCard({ film, onOpen, sub, showStamp }) {
  const expiryDays = computeExpiryDays(film);
  return (
    <button onClick={() => onOpen(film)} className="flex-shrink-0 text-left" style={{ width: 108 }}>
      <div className="relative">
        <Poster film={film} className="w-full" style={{ height: 152, borderRadius: T.radiusSm }} />
        {showStamp && expiryDays != null && <DateStamp days={expiryDays} />}
      </div>
      <p className="truncate mt-1.5" style={{ fontFamily: F.serif, fontSize: 12, fontWeight: 600, color: T.cream }}>{film.titre}</p>
      <p style={{ fontFamily: F.mono, fontSize: 9.5, color: T.mutedDim }}>{film.plateforme}{film.duree ? ` · ${film.duree}` : ""}</p>
      <p style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accent }}>{sub}</p>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* ECRAN ACCUEIL                                                       */
/* ------------------------------------------------------------------ */
function AccueilScreen({ films, onOpen, onSearch, onMenu, onAdd, onNavigate, nbAccueil }) {
  const bientot = useMemo(() => {
    return films
      .map((f) => ({ f, days: computeExpiryDays(f) }))
      .filter((x) => x.days != null && x.days >= 0)
      .sort((a, b) => a.days - b.days)
      .slice(0, nbAccueil)
      .map((x) => x.f);
  }, [films, nbAccueil]);

  // L'API renvoie les films dans l'ordre des lignes du Sheet, qui est
  // fiable pour l'ordre d'ajout (les nouvelles fiches sont ajoutées en bas).
  // Les ID ne sont volontairement pas utilisés pour ce tri : certains sont
  // séquentiels (FILM0001...) mais d'autres, issus d'anciens imports, sont
  // des identifiants aléatoires — les mélanger fausse le classement.
  const derniers = useMemo(() => {
    return [...films].reverse().slice(0, nbAccueil);
  }, [films, nbAccueil]);

  const [suggestion] = useState(() => {
    // Ne jamais suggérer une fiche déjà expirée (dateManuelle dépassée) —
    // évite un badge J-X négatif absurde sur la carte suggestion.
    const nonArchives = films.filter((f) => !isArchived(f));
    const eligibles = nonArchives.filter((f) => f.type === "Film");
    const pool = eligibles.length > 0 ? eligibles : nonArchives.length > 0 ? nonArchives : films;
    return pool[Math.floor(Math.random() * pool.length)];
  });

  return (
    <div className="flex-1 overflow-y-auto pull-scroll pb-4">
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 pb-4" style={{ background: T.bg, paddingTop: "max(16px, env(safe-area-inset-top))" }}>
        <button onClick={onMenu} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: T.surface, border: `1px solid ${T.accentSecondary}55` }}>
          <Menu size={16} color={T.accentSecondary} />
        </button>
        <div className="flex items-center gap-2">
          <LogoMark />
          <h1 style={{ fontFamily: F.marquee, fontSize: 26, color: T.accent, letterSpacing: 1 }}>CINÉMAISON</h1>
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div className="px-4 mb-5">
        <button
          onClick={onSearch}
          className="w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
          style={{ background: T.surface, border: `${T.borderWidth}px solid ${T.line}`, borderRadius: T.radius }}
        >
          <Search size={15} color={T.mutedDim} />
          <span style={{ fontFamily: F.serif, fontSize: 13.5, color: T.mutedDim }}>Titre, réalisateur, acteur…</span>
          {CURRENT_THEME === "minitel" && <MinitelCursor />}
        </button>
      </div>

      {/* Salle Privée : bandeau vedette pleine largeur en haut, façon */}
      {/* Netflix/Apple TV+, à la place du ticket classique en bas de page. */}
      {suggestion && CURRENT_THEME === "salle" && (
        <div className="px-4 mb-8">
          <button onClick={() => onOpen(suggestion)} className="relative w-full text-left rounded-2xl overflow-hidden block" style={{ height: 220 }}>
            <Poster film={suggestion} className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
            {/* Dégradé renforcé : la zone de texte doit rester lisible même sur */}
            {/* une affiche très claire (ex. fond blanc/brumeux). */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,17,24,0.97) 35%, rgba(20,17,24,0.55) 65%, transparent 100%)" }} />
            <div className="absolute left-5 right-5 bottom-5">
              <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accent, letterSpacing: 1.5, fontWeight: 600, textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>SUGGESTION DU SOIR</span>
              <h2 className="mt-1.5" style={{ fontFamily: F.marquee, fontSize: 26, color: T.cream, lineHeight: 1.05, textShadow: "0 2px 10px rgba(0,0,0,0.85)" }}>{suggestion.titre}</h2>
              <div className="flex items-center gap-2 mt-2.5">
                <PlatformIcon label={suggestion.plateforme} />
                {parseRating(suggestion.noteLetterboxd) != null && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: T.accentSoft }}>
                    <Star size={11} color={T.accent} fill={T.accent} strokeWidth={0} />
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: T.accent, fontWeight: 600 }}>{parseRating(suggestion.noteLetterboxd).toFixed(2)}</span>
                  </span>
                )}
                {suggestion.duree && (
                  <span style={{ fontFamily: F.mono, fontSize: 11, color: T.cream, textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>{suggestion.duree}</span>
                )}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Jardin d'Hiver : bandeau vedette en forme de galet, teinte pleine    */}
      {/* (pas de photo pleine largeur) — esprit carte postale posée.         */}
      {suggestion && CURRENT_THEME === "jardin" && (
        <div className="px-6 mb-8">
          <button onClick={() => onOpen(suggestion)} className="relative w-full text-left p-5 block"
            style={{ background: `linear-gradient(155deg, ${T.accent}, ${T.accentSecondary})`, borderRadius: "38% 62% 63% 37% / 41% 44% 56% 59%", minHeight: 190 }}>
            <span style={{ fontFamily: F.mono, fontSize: 9.5, color: "#fff", letterSpacing: 1, opacity: 0.85 }}>CE SOIR, ON REGARDE</span>
            <p className="mt-2" style={{ fontFamily: F.serif, fontSize: 26, color: "#fff", fontStyle: "italic", lineHeight: 1.1 }}>{suggestion.titre}</p>
            <div className="flex items-center gap-2 mt-4">
              <span className="px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.25)" }}>
                <span style={{ fontFamily: F.mono, fontSize: 9.5, color: "#fff" }}>{suggestion.plateforme}</span>
              </span>
              {parseRating(suggestion.noteLetterboxd) != null && (
                <span className="flex items-center gap-1">
                  <Star size={10} color="#fff" fill="#fff" />
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: "#fff" }}>{parseRating(suggestion.noteLetterboxd).toFixed(1)}</span>
                </span>
              )}
            </div>
          </button>
        </div>
      )}

      {bientot.length > 0 && CURRENT_THEME !== "bento" && CURRENT_THEME !== "terminal" && (
        <>
          <SectionTitle icon={Clock} onMore={() => onNavigate({ name: "alertes", params: { mode: "manuel" } })}>ÇA PART BIENTÔT</SectionTitle>
          <div className="flex gap-3 px-4 overflow-x-auto mb-5">
            {bientot.map((f) => (
              <MiniCard key={f.id} film={f} onOpen={onOpen}
                sub={parseRating(f.noteLetterboxd) != null ? `★ ${parseRating(f.noteLetterboxd).toFixed(1)}` : "pas de note"} showStamp />
            ))}
          </div>
        </>
      )}

      {CURRENT_THEME !== "bento" && CURRENT_THEME !== "terminal" && (
        <>
          <SectionTitle icon={Film} onMore={() => onNavigate({ name: "biblio", params: { type: "Film" } })}>DERNIERS AJOUTS</SectionTitle>
          <div className="flex gap-3 px-4 overflow-x-auto mb-5">
            {derniers.map((f) => (
              <MiniCard key={f.id} film={f} onOpen={onOpen}
                sub={parseRating(f.noteLetterboxd) != null ? `★ ${parseRating(f.noteLetterboxd).toFixed(1)}` : "pas de note"} />
            ))}
          </div>
        </>
      )}

      {/* Bento Moderne : grille asymétrique unique (vedette + bientôt + */}
      {/* ajouts), à la place des rangées horizontales classiques. */}
      {CURRENT_THEME === "bento" && (
        <div className="px-4 grid grid-cols-2 gap-3 mb-6" style={{ gridAutoRows: 84 }}>
          {suggestion && (
            <button onClick={() => onOpen(suggestion)} className="col-span-2 row-span-2 relative overflow-hidden text-left p-4"
              style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow, backdropFilter: "blur(10px)" }}>
              <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accent, fontWeight: 700, letterSpacing: 0.5 }}>SUGGESTION DU SOIR</span>
              <p className="mt-1 truncate" style={{ fontFamily: F.marquee, fontSize: 21, fontWeight: 800, color: T.cream }}>{suggestion.titre}</p>
              <div className="flex items-center gap-2 mt-2">
                <PlatformIcon label={suggestion.plateforme} />
                {parseRating(suggestion.noteLetterboxd) != null && (
                  <span className="flex items-center gap-1">
                    <Star size={10} color={T.gold} fill={T.gold} />
                    <span style={{ fontFamily: F.mono, fontSize: 10, color: T.cream, fontWeight: 700 }}>{parseRating(suggestion.noteLetterboxd).toFixed(1)}</span>
                  </span>
                )}
              </div>
              <div className="absolute" style={{ right: -24, bottom: -24, width: 100, height: 100, borderRadius: "50%", background: `${T.accent}22` }} />
            </button>
          )}

          {bientot.slice(0, 2).map((f) => {
            const days = computeExpiryDays(f);
            return (
              <button key={f.id} onClick={() => onOpen(f)} className="p-3 flex flex-col justify-between text-left"
                style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radiusSm, boxShadow: T.shadow }}>
                <span style={{ fontFamily: F.mono, fontSize: 8.5, color: T.accentSecondary, fontWeight: 700 }}>J-{days}</span>
                <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 11, fontWeight: 700, color: T.cream, lineHeight: 1.2 }}>{f.titre}</p>
              </button>
            );
          })}

          <button onClick={() => onNavigate({ name: "biblio", params: { type: "Film" } })} className="col-span-2 flex items-center justify-between p-3 text-left"
            style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radiusSm, boxShadow: T.shadow }}>
            <span style={{ fontFamily: F.marquee, fontSize: 12.5, fontWeight: 800, color: T.cream }}>Derniers ajouts</span>
            <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accent, fontWeight: 700 }}>Voir tout →</span>
          </button>

          {derniers.slice(0, 3).map((f, i) => (
            <div key={f.id} className={i === 2 ? "col-span-2 p-2" : "p-2"} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radiusSm, boxShadow: T.shadow }}>
              <button onClick={() => onOpen(f)} className="block w-full h-full text-left">
                <Poster film={f} className="w-full" style={{ height: 64, borderRadius: T.radiusSm - 6, objectFit: "cover" }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Terminal Sombre : listes façon déclaration JS syntax-highlightée, */}
      {/* à la place des vignettes. */}
      {CURRENT_THEME === "terminal" && (
        <div className="px-4 pb-6">
          {bientot.length > 0 && (
            <>
              <p style={{ color: "#569CD6", fontSize: 11 }}>const <span style={{ color: "#DCDCAA" }}>caPartBientot</span> = [</p>
              {bientot.map((f) => {
                const days = computeExpiryDays(f);
                return (
                  <button key={f.id} onClick={() => onOpen(f)} className="w-full pl-4 py-1.5 flex items-center justify-between text-left" style={{ borderLeft: `2px solid ${T.line}` }}>
                    <span className="truncate">
                      <span style={{ color: "#CE9178", fontSize: 11 }}>"{f.titre}"</span>
                      <span style={{ color: T.mutedDim, fontSize: 10 }}>{"  //"} {f.plateforme}</span>
                    </span>
                    <span style={{ color: "#B5CEA8", fontSize: 11, flexShrink: 0, marginLeft: 8 }}>J-{days}</span>
                  </button>
                );
              })}
              <p style={{ color: "#569CD6", fontSize: 11 }}>];</p>
            </>
          )}

          <p className="mt-5" style={{ color: "#569CD6", fontSize: 11 }}>const <span style={{ color: "#DCDCAA" }}>derniersAjouts</span> = [</p>
          {derniers.map((f) => (
            <button key={f.id} onClick={() => onOpen(f)} className="w-full pl-4 py-1.5 flex items-center justify-between text-left" style={{ borderLeft: `2px solid ${T.line}` }}>
              <span className="truncate" style={{ color: "#CE9178", fontSize: 11 }}>"{f.titre}"</span>
              {parseRating(f.noteLetterboxd) != null && (
                <span className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <Star size={9} color="#B5CEA8" fill="#B5CEA8" />
                  <span style={{ color: "#B5CEA8", fontSize: 10 }}>{parseRating(f.noteLetterboxd).toFixed(1)}</span>
                </span>
              )}
            </button>
          ))}
          <p style={{ color: "#569CD6", fontSize: 11 }}>];</p>

          {suggestion && (
            <>
              <p className="mt-6" style={{ color: "#6A9955", fontSize: 11 }}>{"/* suggestion du soir */"}</p>
              <button onClick={() => onOpen(suggestion)} className="w-full mt-1.5 p-3 text-left" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
                <p><span style={{ color: "#569CD6", fontSize: 11 }}>return</span> <span style={{ color: "#DCDCAA", fontSize: 12 }}>{(suggestion.titre || "").replace(/\s+/g, "")}</span><span style={{ color: T.cream, fontSize: 11 }}>()</span></p>
                <p className="mt-1" style={{ color: T.mutedDim, fontSize: 10 }}>// {suggestion.plateforme}{parseRating(suggestion.noteLetterboxd) != null ? ` · ★ ${parseRating(suggestion.noteLetterboxd).toFixed(1)}` : ""}{suggestion.duree ? ` · ${suggestion.duree}` : ""}</p>
              </button>
            </>
          )}
        </div>
      )}

      {suggestion && CURRENT_THEME !== "salle" && CURRENT_THEME !== "bento" && CURRENT_THEME !== "terminal" && CURRENT_THEME !== "jardin" && (
        <>
          <SectionTitle icon={Shuffle}>SUGGESTION DU SOIR</SectionTitle>
          <div className="px-4">
            <TicketCard film={suggestion} onOpen={onOpen} />
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ECRAN FICHE DETAIL                                                  */
/* ------------------------------------------------------------------ */
function Row({ label, value, onClick }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.line}` }}>
      <span style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.5 }}>{label.toUpperCase()}</span>
      {onClick ? (
        <button onClick={onClick} style={{ fontFamily: F.serif, fontSize: 12.5, color: T.accentSecondary, textAlign: "right", textDecoration: "underline", textUnderlineOffset: 3 }}>{value}</button>
      ) : (
        <span style={{ fontFamily: F.serif, fontSize: 12.5, color: T.cream, textAlign: "right" }}>{value}</span>
      )}
    </div>
  );
}

function TAG_LIST() {
  return [
    { id: "Romy", label: "Romy" },
    { id: "Benoit", label: "Benoit" },
    { id: "À deux", label: "À deux" },
    { id: "En famille", label: "En famille" },
  ];
}

function activeTag(film) {
  if (film.romy) return "Romy";
  if (film.benoit) return "Benoit";
  if (film.aDeux) return "À deux";
  if (film.enFamille) return "En famille";
  return null;
}

function TagSelector({ film, onSaved }) {
  const [tag, setTag] = useState(() => activeTag(film));
  const [saving, setSaving] = useState(false);

  const handlePick = async (t) => {
    const newTag = tag === t.id ? null : t.id;
    setTag(newTag); // optimiste
    setSaving(true);
    const fields = { benoit: false, romy: false, aDeux: false, enFamille: false };
    if (newTag) {
      const key = newTag === "Romy" ? "romy" : newTag === "Benoit" ? "benoit" : newTag === "À deux" ? "aDeux" : "enFamille";
      fields[key] = true;
    }
    const result = await apiWrite("/api/update-film", { id: film.id, fields });
    setSaving(false);
    if (!result.ok) {
      setTag(tag); // on annule si ça a échoué
      window.alert(result.error || "Impossible d'enregistrer le tag");
    } else if (onSaved) {
      onSaved(film.id, fields);
    }
  };

  return (
    <div className="mt-5">
      <h4 className="mb-2" style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: 1.4, color: T.mutedDim }}>À VOIR</h4>
      <div className="flex gap-2 flex-wrap">
        {TAG_LIST().map((t) => {
          const active = tag === t.id;
          return (
            <button key={t.id} onClick={() => handlePick(t)} disabled={saving}
              className="rounded-full px-3 py-2"
              style={{ background: active ? T.accentSoft : T.surface, border: `1px solid ${active ? T.accent + "66" : T.line}`, fontFamily: F.serif, fontSize: 12.5, color: active ? T.accent : T.muted, opacity: saving ? 0.6 : 1 }}>
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EditFilmScreen({ film, onCancel, onSaved }) {
  const [titre, setTitre] = useState(film.titre || "");
  const [annee, setAnnee] = useState(film.annee || "");
  const [type, setType] = useState(film.type || "");
  const [plateforme, setPlateforme] = useState(film.plateforme || "");
  const [dateManuelle, setDateManuelle] = useState(film.dateManuelle || "");
  const [urlLetterboxd, setUrlLetterboxd] = useState(film.urlLetterboxd || "");
  const [tag, setTag] = useState(() => activeTag(film));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const canSave = titre.trim() && annee.trim() && plateforme;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);

    const fields = {
      titre: titre.trim(),
      annee: annee.trim(),
      type,
      plateforme,
      dateManuelle: dateManuelle.trim(),
      urlLetterboxd: urlLetterboxd.trim(),
      benoit: tag === "Benoit",
      romy: tag === "Romy",
      aDeux: tag === "À deux",
      enFamille: tag === "En famille",
    };

    const result = await apiWrite("/api/update-film", { id: film.id, fields });
    setSaving(false);
    if (!result.ok) {
      setError(result.error || "Impossible d'enregistrer les modifications");
      return;
    }
    onSaved({ ...film, ...fields });
  };

  return (
    <div className="flex-1 overflow-y-auto pull-scroll pb-6 px-5">
      <ScreenHeader title="MODIFIER" onBack={onCancel} />

      <SectionLabel>IDENTIFICATION</SectionLabel>
      <label className="block mb-4">
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accentSecondary, letterSpacing: 1 }}>TITRE *</span>
        <input value={titre} onChange={(e) => setTitre(e.target.value)} className="w-full mt-1.5 rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.serif, fontSize: 16, color: T.cream }} />
      </label>
      <label className="block mb-4">
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accentSecondary, letterSpacing: 1 }}>ANNÉE *</span>
        <input value={annee} onChange={(e) => setAnnee(e.target.value)} className="w-full mt-1.5 rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.mono, fontSize: 16, color: T.cream }} />
      </label>

      <p className="mb-2" style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.2, color: T.accentSecondary }}>TYPE</p>
      <div className="flex gap-2 flex-wrap mb-5">
        {AJOUT_TYPES.map((t) => (
          <button key={t.id} onClick={() => setType(t.id)} className="rounded-full px-3 py-1.5"
            style={{ background: type === t.id ? T.accentSoft : T.surface, border: `1px solid ${type === t.id ? T.accent + "66" : T.line}` }}>
            <span style={{ fontFamily: F.mono, fontSize: 10.5, color: type === t.id ? T.accent : T.muted }}>{t.label}</span>
          </button>
        ))}
      </div>

      <SectionLabel>OÙ LE REGARDER</SectionLabel>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {PLATFORMS_LIST.map((p) => (
          <button key={p} onClick={() => setPlateforme(p)} className="rounded-lg py-2.5 text-center"
            style={{ fontFamily: F.serif, fontSize: 13, background: plateforme.toUpperCase() === p.toUpperCase() ? T.accentSoft : T.surface, color: plateforme.toUpperCase() === p.toUpperCase() ? T.accent : T.muted, border: `1px solid ${plateforme.toUpperCase() === p.toUpperCase() ? T.accent + "55" : T.line}` }}>
            {p}
          </button>
        ))}
      </div>

      <SectionLabel>À VOIR</SectionLabel>
      <div className="flex gap-2 flex-wrap mb-5">
        {TAG_LIST().map((t) => {
          const active = tag === t.id;
          return (
            <button key={t.id} onClick={() => setTag(active ? null : t.id)}
              className="rounded-full px-3 py-2"
              style={{ background: active ? T.accentSoft : T.surface, border: `1px solid ${active ? T.accent + "66" : T.line}`, fontFamily: F.serif, fontSize: 12.5, color: active ? T.accent : T.muted }}>
              {t.label}
            </button>
          );
        })}
      </div>

      <SectionLabel>FACULTATIF</SectionLabel>
      <label className="block mb-4">
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.mutedDim, letterSpacing: 1 }}>DATE DE DISPONIBILITÉ (JJ/MM/AAAA)</span>
        <input value={dateManuelle} onChange={(e) => setDateManuelle(e.target.value)} placeholder="14/08/2026"
          className="w-full mt-1.5 rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.mono, fontSize: 16, color: T.cream }} />
      </label>
      <label className="block mb-5">
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.mutedDim, letterSpacing: 1 }}>URL LETTERBOXD</span>
        <input value={urlLetterboxd} onChange={(e) => setUrlLetterboxd(e.target.value)} placeholder="https://letterboxd.com/film/…"
          className="w-full mt-1.5 rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.mono, fontSize: 16, color: T.cream }} />
      </label>

      {error && (
        <div className="rounded-lg p-3 mb-3" style={{ background: T.alertSoft, border: `1px solid ${T.alert}44` }}>
          <p style={{ fontFamily: F.mono, fontSize: 10.5, color: T.alert }}>{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 rounded-lg py-3" style={{ background: T.surface, fontFamily: F.mono, fontSize: 11, color: T.muted }}>ANNULER</button>
        <button onClick={handleSave} disabled={!canSave || saving} className="flex-1 rounded-lg py-3"
          style={{ background: canSave ? T.accent : T.surfaceRaised, fontFamily: F.mono, fontSize: 11, letterSpacing: 0.5, color: canSave ? T.bg : T.mutedDim, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
          {saving ? "ENREGISTREMENT…" : "ENREGISTRER"}
        </button>
      </div>
      <p className="mt-3 text-center" style={{ fontFamily: F.mono, fontSize: 8.5, color: T.mutedDim }}>
        Modifier le titre, l'année, le type ou l'URL Letterboxd relancera l'enrichissement automatique une fois le script rattaché à ce Sheet.
      </p>
    </div>
  );
}

// Petit label de section dans la fiche détail (SYNOPSIS, DISTRIBUTION...).
// En Minitel, préfixe "▸" bleu au lieu des petites majuscules grises.
function FicheLabel({ children, className }) {
  if (CURRENT_THEME === "minitel") {
    return <p className={className} style={{ fontFamily: F.mono, fontSize: 10, color: T.accentSecondary, letterSpacing: 1 }}>▸ {children}</p>;
  }
  return <h4 className={className} style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: 1.4, color: T.mutedDim }}>{children}</h4>;
}

// Fiche détail en JSON syntax-highlighté, pour le thème "terminal" uniquement.
// Mêmes données/actions que la fiche classique (édition, suppression, filmographie,
// bande-annonce), présentées comme un fichier de code plutôt qu'une carte.
const TERM = { key: "#569CD6", str: "#CE9178", num: "#B5CEA8", func: "#DCDCAA", comment: "#6A9955" };

function FicheTerminal({ film, cast, expiryDays, archived, onBack, onOpenPerson, onEdit, confirmDelete, setConfirmDelete, deleting, onDelete, revising, revised, onAskReview }) {
  const Ligne = ({ cle, valeur, commentaire, clickable, onClick }) => (
    <p style={{ fontSize: 11.5 }}>
      <span style={{ color: TERM.key }}>"{cle}"</span>
      <span style={{ color: T.cream }}>: </span>
      {clickable ? (
        <button onClick={onClick} style={{ color: TERM.func, textDecoration: "underline" }}>"{valeur}"</button>
      ) : typeof valeur === "number" ? (
        <span style={{ color: TERM.num }}>{valeur}</span>
      ) : (
        <span style={{ color: TERM.str }}>"{valeur}"</span>
      )}
      <span style={{ color: T.cream }}>,</span>
      {commentaire && <span style={{ color: TERM.comment }}> {"// " + commentaire}</span>}
    </p>
  );

  return (
    <div className="flex-1 overflow-y-auto pull-scroll" style={{ fontFamily: F.mono }}>
      <div className="flex items-center justify-between px-4 pt-6 pb-3" style={{ borderBottom: `1px solid ${T.line}` }}>
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onBack}><ChevronLeft size={14} color={T.cream} /></button>
          <span style={{ color: T.mutedDim, fontSize: 11 }}>films/</span>
          <span className="truncate" style={{ color: T.cream, fontSize: 11 }}>{(film.titre || "").toLowerCase().replace(/\s+/g, "-")}.json</span>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button onClick={onEdit}><Pencil size={13} color={TERM.key} /></button>
          <button onClick={() => setConfirmDelete(true)}><Trash2 size={13} color={TERM.str} /></button>
        </div>
      </div>

      <div className="p-4">
        <p style={{ color: T.cream, fontSize: 12 }}>{"{"}</p>
        <div className="pl-3" style={{ borderLeft: `2px solid ${T.line}` }}>
          <Ligne cle="titre" valeur={film.titre} />
          <Ligne cle="annee" valeur={Number(film.annee)} />
          {film.duree && <Ligne cle="duree" valeur={film.duree} />}
          <Ligne cle="plateforme" valeur={film.plateforme} />
          {parseRating(film.noteLetterboxd) != null && <Ligne cle="note" valeur={parseRating(film.noteLetterboxd)} />}
          {archived ? (
            <Ligne cle="statut" valeur="archivé" commentaire={`dépassé depuis ${Math.abs(daysUntil(parseDateFR(film.dateManuelle)))}j`} />
          ) : expiryDays != null && expiryDays >= 0 ? (
            <Ligne cle="disponibleEncore" valeur={expiryDays} commentaire="jours" />
          ) : null}

          {film.synopsis && (
            <>
              <p className="mt-2" style={{ fontSize: 11.5 }}><span style={{ color: TERM.key }}>"synopsis"</span><span style={{ color: T.cream }}>:</span></p>
              <p style={{ fontSize: 11, color: TERM.str, lineHeight: 1.6, paddingLeft: 8 }}>"{film.synopsis}"<span style={{ color: T.cream }}>,</span></p>
            </>
          )}

          {cast.length > 0 && (
            <>
              <p className="mt-2" style={{ fontSize: 11.5 }}><span style={{ color: TERM.key }}>"distribution"</span><span style={{ color: T.cream }}>: [</span></p>
              {cast.map((c, i) => (
                <p key={c} style={{ fontSize: 11, paddingLeft: 12 }}>
                  <button onClick={() => onOpenPerson(c)} style={{ color: TERM.str, textDecoration: "underline" }}>"{c}"</button>
                  {i < cast.length - 1 && <span style={{ color: T.cream }}>,</span>}
                </p>
              ))}
              <p style={{ fontSize: 11.5, color: T.cream }}>],</p>
            </>
          )}

          {film.realisateur && <Ligne cle="realisateur" valeur={film.realisateur} clickable onClick={() => onOpenPerson(film.realisateur)} />}
          {film.genre && <Ligne cle="genre" valeur={film.genre} />}
        </div>
        <p style={{ color: T.cream, fontSize: 12 }}>{"}"}</p>

        {film.urlBandeAnnonce && (
          <a href={film.urlBandeAnnonce} target="_blank" rel="noreferrer" className="flex items-center gap-2 mt-5 px-3 py-2" style={{ background: T.surface, border: `1px solid ${TERM.key}` }}>
            <Play size={11} color={TERM.key} fill={TERM.key} />
            <span style={{ color: TERM.key, fontSize: 10.5 }}>./lancer-bande-annonce.sh</span>
          </a>
        )}

        <button onClick={onAskReview} disabled={revising} className="flex items-center gap-2 mt-3 px-3 py-2" style={{ background: T.surface, border: `1px solid ${T.line}`, opacity: revising ? 0.6 : 1 }}>
          <RefreshCw size={11} color={T.accentSecondary} style={{ animation: revising ? "spin 0.8s linear infinite" : "none" }} />
          <span style={{ color: T.accentSecondary, fontSize: 10.5 }}>
            {revised ? "// vérification demandée" : revising ? "// envoi…" : "./redemander-verification.sh"}
          </span>
        </button>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full p-5" style={{ maxWidth: 460, background: T.surface, border: `1px solid ${T.line}`, paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>
            <p style={{ color: TERM.str, fontSize: 13 }}>{"// supprimer " + film.titre + " ?"}</p>
            <p className="mt-1 mb-4" style={{ color: T.mutedDim, fontSize: 10.5 }}>Action irréversible — la ligne sera retirée du Sheet.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} disabled={deleting} className="flex-1 py-2.5" style={{ background: T.surfaceRaised, color: T.cream, fontSize: 11 }}>annuler()</button>
              <button onClick={onDelete} disabled={deleting} className="flex-1 py-2.5" style={{ background: TERM.str, color: "#1E1E1E", fontSize: 11, opacity: deleting ? 0.7 : 1 }}>{deleting ? "suppression…" : "confirmer()"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FicheDetailScreen({ film: filmProp, onBack, onFilmUpdated, onDelete, onOpenPerson }) {
  const [film, setFilm] = useState(filmProp);
  const [editing, setEditing] = useState(false);
  const expiryDays = computeExpiryDays(film);
  const archived = isArchived(film);
  const cast = (film.casting || "").split(",").map((s) => s.trim()).filter(Boolean);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [revising, setRevising] = useState(false);
  const [revised, setRevised] = useState(false);

  // "Redemander une vérification" — remplace le Mode Vacances de la V1.
  // Vide EtatEnrichissement/StatutEnrichissement : le script d'enrichissement
  // (module 05, déjà actif) reprend la fiche tout seul au cycle suivant,
  // sans effacer l'affiche/synopsis déjà récupérés entre-temps.
  const handleAskReview = async () => {
    setRevising(true);
    const result = await apiWrite("/api/update-film", { id: film.id, fields: { etatEnrichissement: "", statutEnrichissement: "" } });
    setRevising(false);
    if (!result.ok) {
      window.alert(result.error || "Impossible de redemander une vérification");
      return;
    }
    setRevised(true);
    setTimeout(() => setRevised(false), 4000);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await apiWrite("/api/delete-film", { id: film.id });
    setDeleting(false);
    if (!result.ok) {
      window.alert(result.error || "Impossible de supprimer cette fiche");
      return;
    }
    setConfirmDelete(false);
    onDelete(film.id);
  };
  const [posterOpen, setPosterOpen] = useState(false);

  if (editing) {
    return (
      <EditFilmScreen
        film={film}
        onCancel={() => setEditing(false)}
        onSaved={(updatedFilm) => {
          setFilm(updatedFilm);
          setEditing(false);
          if (onFilmUpdated) onFilmUpdated(film.id, updatedFilm);
        }}
      />
    );
  }

  if (CURRENT_THEME === "terminal") {
    return (
      <FicheTerminal
        film={film} cast={cast} expiryDays={expiryDays} archived={archived}
        onBack={onBack} onOpenPerson={onOpenPerson} onEdit={() => setEditing(true)}
        confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete} deleting={deleting} onDelete={handleDelete}
        revising={revising} revised={revised} onAskReview={handleAskReview}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pull-scroll relative pb-6">
      <div onClick={() => setPosterOpen(true)} className="relative" style={{ height: 340, cursor: "pointer" }}>
        <Poster film={film} className="w-full h-full" style={archived ? { filter: "grayscale(45%)" } : undefined} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(20,16,12,0.1) 40%, ${T.bg} 100%)` }} />
        <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="absolute left-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ top: "max(16px, env(safe-area-inset-top))", background: "rgba(20,16,12,0.55)" }}>
          <ChevronLeft size={18} color="#F3EEE3" />
        </button>
        <div className="absolute right-4 flex gap-2" style={{ top: "max(16px, env(safe-area-inset-top))" }}>
          <button onClick={(e) => { e.stopPropagation(); setEditing(true); }} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(20,16,12,0.55)" }}><Pencil size={15} color={T.accentSecondary} /></button>
          <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(20,16,12,0.55)" }}><Trash2 size={16} color={T.alert} /></button>
        </div>
      </div>

      <div className="px-5 -mt-10 relative">
        <div className="flex items-end justify-between mb-1">
          <h2 style={{ fontFamily: F.marquee, fontSize: 27, color: T.cream, letterSpacing: 0.5, lineHeight: 1 }}>{film.titre}</h2>
          <RatingStamp value={film.noteLetterboxd} />
        </div>
        <p style={{ fontFamily: F.mono, fontSize: 12, color: T.muted, letterSpacing: 0.6, fontWeight: 600 }}>
          {(film.type || "").toUpperCase()} · {film.annee} · {film.duree || "—"}
        </p>
        <div className="flex items-center gap-2.5 mt-2 flex-wrap">
          <PlatformIcon label={film.plateforme} />
          <TrailerButton url={film.urlBandeAnnonce} />
        </div>

        {archived ? (
          <div className="rounded-xl p-3 mt-4" style={{ background: T.surfaceRaised, border: `1px solid ${T.line}` }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.5 }}>
              ARCHIVÉ — DATE DÉPASSÉE DEPUIS {Math.abs(daysUntil(parseDateFR(film.dateManuelle)))} JOURS
            </span>
          </div>
        ) : expiryDays != null && expiryDays >= 0 && (
          CURRENT_THEME === "affiche" ? (
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-2" style={{ background: T.gold, border: `${T.borderWidth}px solid ${T.cream}`, boxShadow: T.shadow, transform: "rotate(-1deg)" }}>
              <span style={{ fontFamily: F.marquee, fontSize: 15, color: T.cream }}>J−{expiryDays} · DERNIÈRE SÉANCE</span>
            </div>
          ) : CURRENT_THEME === "minitel" ? (
            <div className="inline-flex items-center mt-4 px-3 py-2" style={{ background: T.gold }}>
              <span style={{ fontFamily: F.mono, fontSize: 14, color: "#000000", fontWeight: 700 }}>J-{expiryDays} · DERNIÈRE SÉANCE</span>
            </div>
          ) : CURRENT_THEME === "table" ? (
            <div className="relative inline-block mt-4">
              <span style={{ fontFamily: F.serif, fontSize: 18, fontWeight: 700, color: T.cream }}>Expire dans {expiryDays} jours</span>
              <div className="absolute" style={{ left: -6, right: -6, bottom: -2, height: 2, background: T.accent, transform: "rotate(-1deg)" }} />
            </div>
          ) : CURRENT_THEME === "salle" ? (
            <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3 mt-5" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.alert, flexShrink: 0 }} />
              <span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.cream }}>Disponible encore <span style={{ color: T.alert, fontWeight: 600 }}>{expiryDays} jours</span></span>
            </div>
          ) : CURRENT_THEME === "letterboxd" ? (
            <span className="inline-flex items-center rounded px-2.5 py-1 mt-4" style={{ background: `${T.alert}1F` }}>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: T.alert, fontWeight: 700 }}>J-{expiryDays} · dernière séance</span>
            </span>
          ) : CURRENT_THEME === "bd" ? (
            <div className="relative inline-block mt-5 px-3.5 py-2" style={{ background: T.alert, border: `${T.borderWidth}px solid ${T.cream}`, borderRadius: 16 }}>
              <span style={{ fontFamily: F.marquee, fontSize: 13, color: "#fff" }}>DISPO ENCORE {expiryDays} JOURS !</span>
              <div className="absolute" style={{ left: 18, bottom: -11, width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: `11px solid ${T.cream}` }} />
              <div className="absolute" style={{ left: 21.5, bottom: -6.5, width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `7px solid ${T.alert}` }} />
            </div>
          ) : CURRENT_THEME === "jardin" ? (
            <div className="mt-5 p-4" style={{ background: T.alertSoft, borderRadius: "32px 48px 32px 48px" }}>
              <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accentSecondary, fontWeight: 700 }}>ENCORE DISPONIBLE</span>
              <p style={{ fontFamily: F.serif, fontSize: 20, color: T.cream, fontStyle: "italic" }}>{expiryDays} jours</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl p-3 mt-4" style={{ background: T.alertSoft, border: `1px solid ${T.alert}44` }}>
              <span style={{ fontFamily: F.marquee, fontSize: 22, color: T.alert }}>J-{expiryDays}</span>
              <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.alert }}>DERNIÈRE SÉANCE PRÉVUE</span>
            </div>
          )
        )}

        {film.synopsis && (
          <>
            <FicheLabel className="mt-5 mb-1">SYNOPSIS</FicheLabel>
            <p style={{ fontFamily: F.serif, fontSize: 13.5, lineHeight: 1.6, color: T.muted }}>{film.synopsis}</p>
          </>
        )}

        {cast.length > 0 && (
          <>
            <FicheLabel className="mt-5 mb-2">DISTRIBUTION</FicheLabel>
            {CURRENT_THEME === "minitel" ? (
              <div className="flex flex-col gap-1 mb-2">
                {cast.map((c) => (
                  <button key={c} onClick={() => onOpenPerson(c)} className="text-left" style={{ fontFamily: F.mono, fontSize: 11, color: T.cream }}>· {c.toUpperCase()}</button>
                ))}
              </div>
            ) : CURRENT_THEME === "letterboxd" ? (
              <div className="flex gap-3 overflow-x-auto mb-2 pb-1">
                {cast.map((c) => {
                  const initials = c.split(" ").map((n) => n[0]).join("").slice(0, 2);
                  return (
                    <button key={c} onClick={() => onOpenPerson(c)} className="flex-shrink-0 text-center" style={{ width: 64 }}>
                      <div className="rounded-full mx-auto flex items-center justify-center" style={{ width: 52, height: 52, background: T.surfaceRaised, border: `1.5px solid ${T.line}` }}>
                        <span style={{ fontFamily: F.mono, fontSize: 14, color: T.muted, fontWeight: 700 }}>{initials}</span>
                      </div>
                      <p className="mt-1.5 truncate" style={{ fontFamily: F.marquee, fontSize: 9.5, color: T.cream }}>{c}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap mb-2">
                {cast.map((c, i) =>
                  CURRENT_THEME === "affiche" ? (
                    <button key={c} onClick={() => onOpenPerson(c)} className="px-3 py-1.5" style={{ background: T[AFFICHE_BLOCKS[i % AFFICHE_BLOCKS.length]], border: `2px solid ${T.cream}`, fontFamily: F.mono, fontSize: 10.5, color: T.cream, fontWeight: 700 }}>{c}</button>
                  ) : (
                    <button key={c} onClick={() => onOpenPerson(c)} className="rounded-full px-3 py-1.5" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.serif, fontSize: 12, color: T.muted }}>{c}</button>
                  )
                )}
              </div>
            )}
          </>
        )}

        <FicheLabel className="mt-4 mb-1">FICHE TECHNIQUE</FicheLabel>
        <Row label="Réalisateur" value={film.realisateur} onClick={film.realisateur ? () => onOpenPerson(film.realisateur) : undefined} />
        <Row label="Genre" value={film.genre} />
        <Row label="Date de dispo. (saisie)" value={film.dateManuelle} />
        <Row label="Date de dispo. (auto)" value={film.dateAuto} />
        <Row label="Votes Letterboxd" value={film.votesLetterboxd} />

        {film.urlLetterboxd && (
          <div className="mt-4">
            <a href={film.urlLetterboxd} target="_blank" rel="noreferrer"><LetterboxdMark /></a>
          </div>
        )}

        {activeTag(film) && (
          <div className="mt-4">
            <span className="rounded-full px-3 py-1.5" style={{ background: T.accentSoft, border: `1px solid ${T.accent}66`, fontFamily: F.serif, fontSize: 12.5, color: T.accent }}>
              À voir : {activeTag(film)}
            </span>
          </div>
        )}

        <button onClick={handleAskReview} disabled={revising} className="flex items-center justify-center gap-2 w-full rounded-lg py-3 mt-6"
          style={{ background: T.surface, border: `1px solid ${T.line}`, opacity: revising ? 0.6 : 1 }}>
          <RefreshCw size={13} color={T.accentSecondary} style={{ animation: revising ? "spin 0.8s linear infinite" : "none" }} />
          <span style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: 0.5, color: T.accentSecondary, fontWeight: 600 }}>
            {revised ? "DEMANDE ENVOYÉE — REPRISE AU PROCHAIN CYCLE" : revising ? "ENVOI…" : "REDEMANDER UNE VÉRIFICATION"}
          </span>
        </button>
        <p className="mt-2 text-center" style={{ fontFamily: F.mono, fontSize: 8.5, color: T.mutedDim }}>
          Si l'affiche, le synopsis ou la note te semblent faux — le script les recalculera d'ici quelques minutes.
        </p>
      </div>

      {posterOpen && (
        <div onClick={() => setPosterOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(10,8,6,0.92)", padding: 20 }}>
          <button onClick={() => setPosterOpen(false)} className="absolute right-4 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ top: "max(16px, env(safe-area-inset-top))", background: "rgba(255,255,255,0.12)" }}>
            <X size={18} color={T.cream} />
          </button>
          {film.affiche ? (
            <img src={film.affiche} alt={film.titre} className="max-w-full max-h-full rounded-lg" style={{ objectFit: "contain" }} />
          ) : (
            <span style={{ fontFamily: F.marquee, fontSize: 16, color: T.accent, textAlign: "center" }}>{film.titre}</span>
          )}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: "rgba(20,16,12,0.7)" }}>
          <div className="w-full rounded-t-2xl p-5" style={{ maxWidth: 460, background: T.surfaceRaised, paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>
            <p style={{ fontFamily: F.marquee, fontSize: 20, color: T.cream, letterSpacing: 0.5 }}>SUPPRIMER CETTE FICHE ?</p>
            <p className="mt-1 mb-4" style={{ fontFamily: F.serif, fontSize: 13, color: T.muted }}>
              « {film.titre} » sera retiré définitivement du Sheet. Cette action est irréversible.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} disabled={deleting} className="flex-1 rounded-lg py-2.5" style={{ background: T.surface, fontFamily: F.mono, fontSize: 11, color: T.muted }}>ANNULER</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 rounded-lg py-2.5" style={{ background: T.alert, fontFamily: F.mono, fontSize: 11, color: T.cream, opacity: deleting ? 0.7 : 1 }}>
                {deleting ? "SUPPRESSION…" : "SUPPRIMER"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ECRAN RECHERCHE — titre, réalisateur, casting                       */
/* ------------------------------------------------------------------ */
function normalizeSearch(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matchFilm(film, query) {
  const q = normalizeSearch(query);
  if (!q) return null;
  if (normalizeSearch(film.titre).includes(q)) return { field: "titre" };
  if (normalizeSearch(film.realisateur).includes(q)) return { field: "realisateur", value: film.realisateur };
  const castHit = (film.casting || "").split(",").map((c) => c.trim()).find((c) => normalizeSearch(c).includes(q));
  if (castHit) return { field: "casting", value: castHit };
  return null;
}

function MatchTag({ match }) {
  if (!match || match.field === "titre") return null;
  const label = match.field === "realisateur" ? "RÉALISATEUR" : "CASTING";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 mt-1.5" style={{ background: T.accentSecondarySoft, width: "fit-content" }}>
      <span style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: 0.6, color: T.accentSecondary, fontWeight: 600 }}>
        {label} · {match.value}
      </span>
    </span>
  );
}

function SearchResultCard({ film, match, onOpen }) {
  return (
    <button onClick={() => onOpen(film)} className="flex text-left overflow-hidden w-full" style={{ background: T.surface, border: `${T.borderWidth}px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow }}>
      <Poster film={film} className="w-20 h-28 flex-shrink-0" />
      <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
        <p className="truncate" style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 15, color: T.cream }}>{film.titre}</p>
        <p style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.4 }}>
          {film.annee} · {(film.plateforme || "").toUpperCase()}{film.duree ? ` · ${film.duree}` : ""}
        </p>
        <MatchTag match={match} />
      </div>
    </button>
  );
}

function RechercheScreen({ films, onOpen, onBack, onMenu }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return films.map((f) => ({ film: f, match: matchFilm(f, query) })).filter((r) => r.match);
  }, [films, query]);

  return (
    <div className="flex-1 overflow-y-auto pull-scroll pb-6 px-5">
      <div className="sticky top-0 z-20 -mx-5 px-5 flex items-center justify-between" style={{ background: T.bg, paddingTop: "max(16px, env(safe-area-inset-top))", paddingBottom: 16 }}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
            <ChevronLeft size={16} color={T.muted} />
          </button>
          <h1 style={{ fontFamily: F.marquee, fontSize: 24, color: T.cream, letterSpacing: 0.5, lineHeight: 1 }}>RECHERCHE</h1>
        </div>
        {onMenu && (
          <button onClick={onMenu} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.surface, border: `1px solid ${T.accentSecondary}55` }}>
            <Menu size={16} color={T.accentSecondary} />
          </button>
        )}
      </div>

      <div className="relative mb-4">
        <Search size={16} color={T.mutedDim} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Titre, réalisateur, acteur…"
          className="w-full rounded-xl pl-10 pr-9 py-3 outline-none"
          style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.serif, fontSize: 16, color: T.cream }}
        />
        {query && (
          <button onClick={() => setQuery("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
            <X size={15} color={T.mutedDim} />
          </button>
        )}
      </div>

      {!query.trim() && (
        <p className="text-center mt-16 px-6" style={{ fontFamily: F.serif, fontSize: 13.5, color: T.mutedDim, fontStyle: "italic", lineHeight: 1.5 }}>
          Tapez un titre, un nom de réalisateur, ou un acteur pour retrouver une fiche.
        </p>
      )}

      {query.trim() && results.length === 0 && (
        <p className="text-center mt-10" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>
          Aucune fiche ne correspond à « {query} ».
        </p>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map(({ film, match }) => (
            <SearchResultCard key={film.id} film={film} match={match} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ECRAN FILMOGRAPHIE — tous les films/séries de la bibliothèque où     */
/* cette personne apparaît (casting ou réalisateur). Ouvert en tapant   */
/* un nom dans une fiche détail — voir onOpenPerson dans App().        */
/* ------------------------------------------------------------------ */
function personneMatch_(film, nomNormalise) {
  if (normalizeSearch(film.realisateur || "") === nomNormalise) return true;
  return (film.casting || "").split(",").map((c) => normalizeSearch(c.trim())).includes(nomNormalise);
}

function PersonScreen({ films, nom, onOpen, onBack, onMenu }) {
  const list = useMemo(() => {
    const q = normalizeSearch(nom);
    return films.filter((f) => personneMatch_(f, q));
  }, [films, nom]);
  const asRealisateur = useMemo(() => list.filter((f) => normalizeSearch(f.realisateur || "") === normalizeSearch(nom)).length, [list, nom]);

  return (
    <div className="flex-1 overflow-y-auto pull-scroll pb-6 px-5">
      <ScreenHeader title={nom} onBack={onBack} onMenu={onMenu} />
      <p className="mb-3" style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.5 }}>
        {list.length} FICHE{list.length > 1 ? "S" : ""} DANS TA BIBLIOTHÈQUE{asRealisateur > 0 ? ` · ${asRealisateur} EN TANT QUE RÉALISATEUR` : ""}
      </p>
      <div className="flex flex-col gap-2">
        {list.map((f) => <ListResultCard key={f.id} film={f} onOpen={onOpen} />)}
        {list.length === 0 && (
          <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>
            Aucune autre fiche avec « {nom} » pour l'instant.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AIDE — libellé générique de section (écrans filtres / réglages)     */
/* ------------------------------------------------------------------ */
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mb-2.5 mt-5">
      <span style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: 1.4, color: T.mutedDim, whiteSpace: "nowrap" }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: T.line }} />
    </div>
  );
}

// Sticky : reste visible en haut de l'écran pendant le défilement de la
// liste (via -mx-5 px-5, le fond couvre toute la largeur malgré le padding
// horizontal du conteneur parent). Le bouton menu (GUICHET) est optionnel :
// il n'apparaît que si onMenu est fourni par l'écran appelant.
function ScreenHeader({ title, onBack, onMenu, right }) {
  return (
    <div className="sticky top-0 z-20 -mx-5 px-5 flex items-center justify-between" style={{ background: T.bg, paddingTop: "max(16px, env(safe-area-inset-top))", paddingBottom: 16 }}>
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <ChevronLeft size={16} color={T.muted} />
        </button>
        <h1 style={{ fontFamily: F.marquee, fontSize: 24, color: T.cream, letterSpacing: 0.5, lineHeight: 1 }}>{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {right}
        {onMenu && (
          <button onClick={onMenu} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.surface, border: `1px solid ${T.accentSecondary}55` }}>
            <Menu size={16} color={T.accentSecondary} />
          </button>
        )}
      </div>
    </div>
  );
}

function ListResultCard({ film, onOpen, right }) {
  return (
    <button onClick={() => onOpen(film)} className="flex text-left overflow-hidden w-full" style={{ background: T.surface, border: `${T.borderWidth}px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow }}>
      <Poster film={film} className="w-20 h-28 flex-shrink-0" style={isArchived(film) ? { filter: "grayscale(55%)", opacity: 0.75 } : undefined} />
      <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
        <p className="truncate" style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 15, color: isArchived(film) ? T.muted : T.cream }}>{film.titre}</p>
        <p style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.4 }}>{film.annee} · {(film.plateforme || "").toUpperCase()}{film.duree ? ` · ${film.duree}` : ""}</p>
        <p style={{ fontFamily: F.mono, fontSize: 10, color: T.accent, marginTop: 2 }}>
          {parseRating(film.noteLetterboxd) != null ? `★ ${parseRating(film.noteLetterboxd).toFixed(1)}` : "pas de note"}
        </p>
      </div>
      {right}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* ECRAN BIBLIOTHÈQUE — une par Type, avec tri                         */
/* ------------------------------------------------------------------ */
const SORTS = [
  { id: "az", label: "A → Z" },
  { id: "za", label: "Z → A" },
  { id: "note_desc", label: "Note ↓" },
  { id: "note_asc", label: "Note ↑" },
];

function BibliothequeScreen({ films, type, onOpen, onBack, onMenu }) {
  const [sort, setSort] = useState("az");

  const list = useMemo(() => {
    const arr = films.filter((f) => f.type === type && !isArchived(f));
    if (sort === "az") arr.sort((a, b) => (a.titre || "").localeCompare(b.titre || ""));
    if (sort === "za") arr.sort((a, b) => (b.titre || "").localeCompare(a.titre || ""));
    if (sort === "note_desc") arr.sort((a, b) => (parseRating(b.noteLetterboxd) ?? -1) - (parseRating(a.noteLetterboxd) ?? -1));
    if (sort === "note_asc") arr.sort((a, b) => (parseRating(a.noteLetterboxd) ?? 99) - (parseRating(b.noteLetterboxd) ?? 99));
    return arr;
  }, [films, type, sort]);

  return (
    <div className="flex-1 overflow-y-auto pull-scroll pb-6 px-5">
      <ScreenHeader title={(type || "").toUpperCase()} onBack={onBack} onMenu={onMenu} />
      <div className="flex gap-1.5 mb-4">
        {SORTS.map((s) => {
          const active = sort === s.id;
          return (
            <button key={s.id} onClick={() => setSort(s.id)} className="flex-1 rounded-lg py-2"
              style={{ background: active ? T.accentSoft : T.surface, border: `1px solid ${active ? T.accent + "55" : T.line}` }}>
              <span style={{ fontFamily: F.mono, fontSize: 9.5, color: active ? T.accent : T.mutedDim, letterSpacing: 0.3 }}>{s.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mb-3" style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.5 }}>{list.length} FICHE{list.length > 1 ? "S" : ""}</p>
      <div className="flex flex-col gap-2">
        {list.map((f) => <ListResultCard key={f.id} film={f} onOpen={onOpen} />)}
        {list.length === 0 && <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Aucune fiche pour l'instant.</p>}
      </div>
    </div>
  );
}

const MOIS_LABELS = ["JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"];
const JOURS_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

/* ------------------------------------------------------------------ */
/* ECRAN ALERTES — calendrier mensuel, disparaît bientôt (manuel) / sortie théorique (auto) */
/* ------------------------------------------------------------------ */
function AlertesListe({ films, field, onOpen }) {
  const groups = useMemo(() => {
    const list = films
      .map((f) => {
        const raw = f[field];
        const date = parseDateFR(raw);
        const days = daysUntil(date);
        return { f, days, date, raw };
      })
      .filter((x) => x.days != null && x.days >= 0)
      .sort((a, b) => a.date - b.date);

    const m = [];
    list.forEach((item) => {
      const last = m[m.length - 1];
      if (last && last.label === item.raw) last.items.push(item);
      else m.push({ label: item.raw, items: [item] });
    });
    return m;
  }, [films, field]);

  return (
    <>
      {groups.map((g) => (
        <div key={g.label} className="mb-4">
          <p className="mb-2" style={{ fontFamily: F.marquee, fontSize: 17, color: T.cream, letterSpacing: 0.5 }}>{g.label}</p>
          <div className="flex flex-col gap-2">
            {g.items.map(({ f, days }) => (
              <ListResultCard key={f.id} film={f} onOpen={onOpen}
                right={<div className="flex items-center pr-3"><span className="rounded-full px-2.5 py-1" style={{ background: T.accentSoft }}>
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: T.accent, fontWeight: 700 }}>J-{days}</span>
                </span></div>} />
            ))}
          </div>
        </div>
      ))}
      {groups.length === 0 && <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Rien à venir pour l'instant.</p>}
    </>
  );
}

function AlertesCalendrier({ films, onOpen }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);

  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), 1);
  const year = base.getFullYear();
  const month = base.getMonth() + monthOffset;
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  // Le calendrier ne prend en compte que dateManuelle, jamais dateAuto
  const alertsByDay = useMemo(() => {
    const map = {};
    films.forEach((f) => {
      const date = parseDateFR(f.dateManuelle);
      if (!date) return;
      if (date.getFullYear() !== year || date.getMonth() !== month) return;
      const days = daysUntil(date);
      if (days == null || days < 0) return;
      const d = date.getDate();
      (map[d] = map[d] || []).push(f);
    });
    return map;
  }, [films, year, month]);

  const sortedDays = Object.keys(alertsByDay).map(Number).sort((a, b) => a - b);

  useEffect(() => {
    if (sortedDays.length === 0) { setSelectedDay(null); return; }
    if (monthOffset === 0) {
      const todayD = now.getDate();
      setSelectedDay(sortedDays.find((d) => d >= todayD) ?? sortedDays[0]);
    } else {
      setSelectedDay(sortedDays[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthOffset, year, month, films]);

  const dayItems = selectedDay != null ? (alertsByDay[selectedDay] || []) : [];
  const today = monthOffset === 0 ? now.getDate() : null;

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setMonthOffset((m) => m - 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: T.surface }}>
          <ChevronLeft size={13} color={T.muted} />
        </button>
        <span style={{ fontFamily: F.marquee, fontSize: 18, color: T.accent, letterSpacing: 1 }}>{MOIS_LABELS[month]} {year}</span>
        <button onClick={() => setMonthOffset((m) => m + 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: T.surface }}>
          <ChevronRight size={13} color={T.muted} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1.5">
        {JOURS_LABELS.map((j, i) => (
          <span key={i} className="text-center" style={{ fontFamily: F.mono, fontSize: 9, color: T.mutedDim }}>{j}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1.5 mb-5">
        {cells.map((d, i) => {
          if (d == null) return <div key={i} />;
          const hasAlert = !!alertsByDay[d];
          const isSelected = d === selectedDay;
          const isToday = d === today;
          return (
            <button key={i} onClick={() => hasAlert && setSelectedDay(d)} className="flex flex-col items-center justify-center mx-auto" style={{ width: 36, height: 36 }}>
              <div className="flex items-center justify-center rounded-full" style={{
                width: 30, height: 30,
                background: isSelected ? T.accent : "transparent",
                border: isToday && !isSelected ? `1px solid ${T.accent}` : "none",
              }}>
                <span style={{ fontFamily: F.serif, fontSize: 13, fontWeight: hasAlert ? 700 : 400, color: isSelected ? T.bg : hasAlert ? T.cream : T.mutedDim }}>{d}</span>
              </div>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: hasAlert ? T.accent : "transparent", marginTop: 2 }} />
            </button>
          );
        })}
      </div>

      {selectedDay != null && (
        <div className="flex items-center gap-2 mb-2.5">
          <span style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.5 }}>{selectedDay} {MOIS_LABELS[month]}</span>
          <div style={{ flex: 1, height: 1, background: T.line }} />
        </div>
      )}
      <div className="flex flex-col gap-2">
        {dayItems.map((f) => (
          <button key={f.id} onClick={() => onOpen(f)} className="flex items-center gap-3 text-left pr-3 py-2 overflow-hidden" style={{ background: T.surface, border: `${T.borderWidth}px solid ${T.line}`, borderRadius: T.radiusSm, boxShadow: T.shadow }}>
            <Poster film={f} className="flex-shrink-0" style={{ width: 34, height: 48, objectFit: "cover" }} />
            <span className="flex-1 min-w-0">
              <span className="block truncate" style={{ fontFamily: F.serif, fontSize: 13.5, color: T.cream }}>{f.titre}</span>
              <span className="block" style={{ fontFamily: F.mono, fontSize: 8.5, color: T.mutedDim, letterSpacing: 0.3 }}>{(f.plateforme || "").toUpperCase()}</span>
            </span>
          </button>
        ))}
        {selectedDay == null && (
          <p className="text-center mt-6" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Rien à venir ce mois-ci.</p>
        )}
      </div>
    </>
  );
}

function AlertesScreen({ films, mode: initialMode, onOpen, onBack, onMenu }) {
  const [tab, setTab] = useState(initialMode || "manuel"); // "manuel" | "auto" | "calendrier"

  const TABS = [
    { id: "manuel", label: "BIENTÔT", icon: Clock },
    { id: "auto", label: "THÉORIQUE", icon: Rocket },
    { id: "calendrier", label: "CALENDRIER", icon: CalendarDays },
  ];

  return (
    <div className="flex-1 overflow-y-auto pull-scroll pb-6 px-5">
      <ScreenHeader title="ALERTES" onBack={onBack} onMenu={onMenu} />
      <div className="flex gap-1.5 mb-5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex-1 flex flex-col items-center gap-1 rounded-lg py-2"
              style={{ background: active ? T.accentSoft : T.surface, border: `1px solid ${active ? T.accent + "55" : T.line}` }}>
              <Icon size={13} color={active ? T.accent : T.muted} />
              <span style={{ fontFamily: F.mono, fontSize: 8, color: active ? T.accent : T.mutedDim, letterSpacing: 0.3 }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "manuel" && <AlertesListe films={films} field="dateManuelle" onOpen={onOpen} />}
      {tab === "auto" && <AlertesListe films={films} field="dateAuto" onOpen={onOpen} />}
      {tab === "calendrier" && <AlertesCalendrier films={films} onOpen={onOpen} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ECRAN EXPLORER                                                       */
/* ------------------------------------------------------------------ */
const TYPES_LIST = ["Film", "Série", "Documentaire", "Spectacle", "VOD", "Indispo"];
const PLATFORMS_LIST = ["Canal+", "Netflix", "Prime Video", "Disney+"];
const DUREE_BUCKETS = [
  { id: "court", label: "Court", hint: "-60min", min: 0, max: 59 },
  { id: "standard", label: "Standard", hint: "60-110", min: 60, max: 110 },
  { id: "long", label: "Long", hint: "110-149", min: 111, max: 149 },
  { id: "tres_long", label: "Très long", hint: "+150", min: 150, max: 9999 },
];
function parseDureeMinutes(d) {
  if (!d) return null;
  const m = String(d).match(/(\d+)h\s*(\d+)?/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2] || 0);
}

function PillGroup({ label, options, value, onChange, renderLabel }) {
  return (
    <div className="mb-5">
      <p className="mb-2" style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.2, color: T.accentSecondary }}>{label.toUpperCase()}</p>
      <div className="flex gap-2 flex-wrap">
        {["Tous", ...options].map((opt) => {
          const active = value === opt || (opt === "Tous" && !value);
          const key = typeof opt === "object" ? opt.id : opt;
          return (
            <button key={key} onClick={() => onChange(opt === "Tous" ? null : opt)} className="rounded-full px-3.5 py-2"
              style={{ fontFamily: F.serif, fontSize: 12.5, background: active ? T.accentSoft : T.surface, color: active ? T.accent : T.muted, border: `1px solid ${active ? T.accent + "55" : T.line}` }}>
              {renderLabel ? renderLabel(opt) : opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const GENRE_EMOJI = {
  Action: "💥", Animation: "🎨", Aventure: "🧭", Comédie: "😂", Crime: "🔪", Drame: "🎭",
  Fantastique: "🧙", Guerre: "🎖️", Horreur: "👻", Musique: "🎵", Mystère: "🕵️",
  Romance: "❤️", "Science-Fiction": "🛸", Thriller: "🔪", Western: "🤠",
  Documentaire: "🎥", Histoire: "📜", Familial: "👨‍👩‍👧", Téléfilm: "📺",
};
function genreEmoji(g) { return GENRE_EMOJI[g] || "🎞️"; }

function GenreField({ genreCounts, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = genreCounts.filter(([g]) => g.toLowerCase().includes(search.toLowerCase()));
  const toggle = (g) => onChange(selected.includes(g) ? selected.filter((x) => x !== g) : [...selected, g]);

  return (
    <div className="mb-5">
      <p className="mb-2" style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.2, color: T.accentSecondary }}>GENRE</p>
      <button onClick={() => setOpen(true)} className="w-full rounded-xl px-4 py-3 flex items-center justify-between text-left" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <span style={{ fontFamily: F.serif, fontSize: 13.5, color: selected.length ? T.cream : T.mutedDim }}>
          {selected.length === 0 ? "Tous les genres" : `${selected.length} genre${selected.length > 1 ? "s" : ""} sélectionné${selected.length > 1 ? "s" : ""}`}
        </span>
      </button>
      {selected.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-2">
          {selected.map((g) => (
            <button key={g} onClick={() => toggle(g)} className="inline-flex items-center gap-1 rounded-full pl-2.5 pr-2 py-1" style={{ background: T.accentSoft }}>
              <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accent }}>{g}</span>
              <X size={11} color={T.accent} />
            </button>
          ))}
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(10,8,6,0.75)" }} onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex flex-col rounded-t-2xl" style={{ background: T.bg, border: `1px solid ${T.line}`, borderBottom: "none", maxHeight: "82%" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span style={{ fontFamily: F.marquee, fontSize: 20, color: T.cream, letterSpacing: 0.5 }}>GENRE</span>
              <button onClick={() => setOpen(false)}><X size={18} color={T.muted} /></button>
            </div>
            <div className="px-5 pb-3">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un genre…"
                className="w-full rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.serif, fontSize: 16, color: T.cream }} />
            </div>
            <div className="overflow-y-auto pull-scroll px-5" style={{ flex: 1 }}>
              {filtered.map(([g, count]) => {
                const active = selected.includes(g);
                return (
                  <button key={g} onClick={() => toggle(g)} className="w-full flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${T.line}` }}>
                    <span className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center flex-shrink-0 rounded-full" style={{ width: 26, height: 26, border: `1.5px dashed ${T.accent}88`, transform: "rotate(-8deg)" }}>
                        <span style={{ fontSize: 12, transform: "rotate(8deg)" }}>{genreEmoji(g)}</span>
                      </div>
                      <span style={{ fontFamily: F.serif, fontSize: 14, color: T.cream }}>{g}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim }}>({count})</span>
                    </span>
                    <div className="rounded flex items-center justify-center flex-shrink-0" style={{ width: 20, height: 20, border: `1.5px solid ${active ? T.accent : T.line}`, background: active ? T.accent : "transparent" }}>
                      {active && <Check size={13} color={T.bg} />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-end px-5 py-4" style={{ borderTop: `1px solid ${T.line}`, paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
              <button onClick={() => setOpen(false)} className="rounded-full px-5 py-2" style={{ background: T.accent, fontFamily: F.mono, fontSize: 11, color: T.bg, fontWeight: 700, letterSpacing: 0.5 }}>TERMINÉ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// État des filtres Explorer — persiste en mémoire tant que l'appli reste
// ouverte (pas localStorage, se réinitialise à la fermeture). ExplorerScreen
// est démonté puis remonté à chaque navigation (ouvrir une fiche, revenir
// en arrière), ce qui effacerait ses useState internes sans ce filet.
let explorerFiltersState_ = { type: null, plateforme: null, duree: null, genresSel: [], noteMin: 0 };

function ExplorerScreen({ films, initialGenre, onOpen, onBack, onMenu }) {
  const [type, setType] = useState(explorerFiltersState_.type);
  const [plateforme, setPlateforme] = useState(explorerFiltersState_.plateforme);
  const [duree, setDuree] = useState(explorerFiltersState_.duree);
  const [genresSel, setGenresSel] = useState(
    explorerFiltersState_.genresSel.length > 0 ? explorerFiltersState_.genresSel : (initialGenre ? [initialGenre] : [])
  );
  const [noteMin, setNoteMin] = useState(explorerFiltersState_.noteMin);

  // Recopie à chaque changement, pour que le prochain montage reparte d'ici.
  useEffect(() => {
    explorerFiltersState_ = { type, plateforme, duree, genresSel, noteMin };
  }, [type, plateforme, duree, genresSel, noteMin]);

  const genreCounts = useMemo(() => {
    const m = {};
    films.forEach((f) => (f.genre || "").split(",").map((g) => g.trim()).filter(Boolean).forEach((g) => { m[g] = (m[g] || 0) + 1; }));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [films]);

  const dureeBucket = DUREE_BUCKETS.find((d) => d.id === duree);

  const results = useMemo(() => {
    return films.filter((f) => {
      if (isArchived(f)) return false;
      if (type && f.type !== type) return false;
      if (plateforme && (f.plateforme || "").toUpperCase() !== plateforme.toUpperCase()) return false;
      const fGenres = (f.genre || "").split(",").map((g) => g.trim());
      if (genresSel.length && !fGenres.some((g) => genresSel.includes(g))) return false;
      if (dureeBucket) {
        const mins = parseDureeMinutes(f.duree);
        if (mins == null || mins < dureeBucket.min || mins > dureeBucket.max) return false;
      }
      if (noteMin > 0 && (parseRating(f.noteLetterboxd) ?? -1) < noteMin) return false;
      return true;
    });
  }, [films, type, plateforme, genresSel, dureeBucket, noteMin]);

  return (
    <div className="flex-1 overflow-y-auto pull-scroll pb-6 px-5">
      <ScreenHeader title="EXPLORER" onBack={onBack} onMenu={onMenu} />
      <PillGroup label="Type de fiche" options={TYPES_LIST} value={type} onChange={setType} />
      <PillGroup label="Plateforme" options={PLATFORMS_LIST} value={plateforme} onChange={setPlateforme} />
      <GenreField genreCounts={genreCounts} selected={genresSel} onChange={setGenresSel} />
      <PillGroup label="Durée" options={DUREE_BUCKETS} value={duree} onChange={(v) => setDuree(v === null ? null : v.id)}
        renderLabel={(opt) => (opt === "Tous" ? "Toutes" : `${opt.label} (${opt.hint})`)} />
      <div className="mb-5">
        <p className="mb-2" style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.2, color: T.accentSecondary }}>NOTE MINIMUM</p>
        <div className="flex items-center justify-between rounded-xl px-4 py-2.5" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <button onClick={() => setNoteMin((v) => Math.max(0, +(v - 0.5).toFixed(1)))} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: T.surfaceRaised }}><Minus size={14} color={T.muted} /></button>
          <span style={{ fontFamily: F.marquee, fontSize: 20, color: T.cream, letterSpacing: 0.5 }}>{noteMin === 0 ? "TOUTES" : `★ ${noteMin.toFixed(1)}`}</span>
          <button onClick={() => setNoteMin((v) => Math.min(5, +(v + 0.5).toFixed(1)))} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: T.surfaceRaised }}><Plus size={14} color={T.muted} /></button>
        </div>
      </div>
      <p className="mb-3" style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.5 }}>{results.length} RÉSULTAT{results.length > 1 ? "S" : ""}</p>
      <div className="flex flex-col gap-2">
        {results.map((f) => <ListResultCard key={f.id} film={f} onOpen={onOpen} />)}
        {results.length === 0 && <p className="text-center mt-6" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Aucune fiche ne correspond à ces critères.</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ECRAN GENRES — grille, raccourci vers Explorer                      */
/* ------------------------------------------------------------------ */
function GenresScreen({ films, onNavigate, onBack, onMenu }) {
  const genreCounts = useMemo(() => {
    const m = {};
    films.forEach((f) => (f.genre || "").split(",").map((g) => g.trim()).filter(Boolean).forEach((g) => { m[g] = (m[g] || 0) + 1; }));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [films]);

  return (
    <div className="flex-1 overflow-y-auto pull-scroll pb-6 px-5">
      <ScreenHeader title="GENRES" onBack={onBack} onMenu={onMenu} />
      <div className="grid grid-cols-2 gap-2.5">
        {genreCounts.map(([g, count]) => (
          <button key={g} onClick={() => onNavigate({ name: "explorer", params: { initialGenre: g } })}
            className="flex items-center gap-2.5 rounded-xl p-3" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
            <div className="flex items-center justify-center flex-shrink-0 rounded-full" style={{ width: 34, height: 34, border: `1.5px dashed ${T.accent}88`, transform: "rotate(-8deg)" }}>
              <span style={{ fontSize: 15, transform: "rotate(8deg)" }}>{genreEmoji(g)}</span>
            </div>
            <span>
              <p style={{ fontFamily: F.serif, fontSize: 13, fontWeight: 600, color: T.cream, lineHeight: 1.2 }}>{g}</p>
              <p style={{ fontFamily: F.mono, fontSize: 9, color: T.accentSecondary }}>{count} FICHES</p>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ECRAN AJOUTER — visuel complet, PAS ENCORE branché à /api/add-film   */
/* ------------------------------------------------------------------ */
const AJOUT_TYPES = [
  { id: "Film", label: "Film" }, { id: "Série", label: "Série" }, { id: "Documentaire", label: "Documentaire" },
  { id: "Spectacle", label: "Spectacle" }, { id: "VOD", label: "VOD" }, { id: "Indispo", label: "Indispo" },
];

function AjouterScreen({ onBack, onAdded, onMenu }) {
  const [type, setType] = useState(null);
  const [titre, setTitre] = useState("");
  const [annee, setAnnee] = useState("");
  const [plateforme, setPlateforme] = useState("");
  const [dateManuelle, setDateManuelle] = useState("");
  const [urlLetterboxd, setUrlLetterboxd] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const canSubmit = titre.trim() && annee.trim() && plateforme;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    const result = await apiWrite("/api/add-film", { titre: titre.trim(), annee: annee.trim(), plateforme, type, dateManuelle: dateManuelle.trim() || undefined, urlLetterboxd: urlLetterboxd.trim() || undefined });
    setSaving(false);
    if (!result.ok) {
      setError(result.error || "Impossible d'ajouter ce film");
      return;
    }
    setSubmitted(true);
    if (onAdded) onAdded();
  };

  if (!type) {
    return (
      <div className="flex-1 overflow-y-auto pull-scroll pb-6 px-5">
        <ScreenHeader title="QUEL TICKET ?" onBack={onBack} onMenu={onMenu} />
        <div className="flex flex-col gap-2.5">
          {AJOUT_TYPES.map((t) => (
            <button key={t.id} onClick={() => setType(t.id)} className="rounded-xl px-4 py-4 text-left" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
              <span style={{ fontFamily: F.marquee, fontSize: 18, color: T.cream, letterSpacing: 0.5 }}>{t.label.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pull-scroll pb-6 px-5">
      <ScreenHeader title="NOUVELLE ENTRÉE" onBack={() => setType(null)} onMenu={onMenu} />
      <SectionLabel>IDENTIFICATION</SectionLabel>
      <label className="block mb-4">
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accentSecondary, letterSpacing: 1 }}>TITRE *</span>
        <input value={titre} onChange={(e) => setTitre(e.target.value)} className="w-full mt-1.5 rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.serif, fontSize: 16, color: T.cream }} />
      </label>
      <label className="block mb-4">
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accentSecondary, letterSpacing: 1 }}>ANNÉE *</span>
        <input value={annee} onChange={(e) => setAnnee(e.target.value)} className="w-full mt-1.5 rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.mono, fontSize: 16, color: T.cream }} />
      </label>
      <SectionLabel>OÙ LE REGARDER</SectionLabel>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {PLATFORMS_LIST.map((p) => (
          <button key={p} onClick={() => setPlateforme(p)} className="rounded-lg py-2.5 text-center"
            style={{ fontFamily: F.serif, fontSize: 13, background: plateforme === p ? T.accentSoft : T.surface, color: plateforme === p ? T.accent : T.muted, border: `1px solid ${plateforme === p ? T.accent + "55" : T.line}` }}>
            {p}
          </button>
        ))}
      </div>
      <SectionLabel>FACULTATIF</SectionLabel>
      <label className="block mb-4">
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.mutedDim, letterSpacing: 1 }}>DATE DE DISPONIBILITÉ (JJ/MM/AAAA)</span>
        <input value={dateManuelle} onChange={(e) => setDateManuelle(e.target.value)} placeholder="14/08/2026"
          className="w-full mt-1.5 rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.mono, fontSize: 16, color: T.cream }} />
      </label>
      <label className="block mb-5">
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.mutedDim, letterSpacing: 1 }}>URL LETTERBOXD</span>
        <input value={urlLetterboxd} onChange={(e) => setUrlLetterboxd(e.target.value)} placeholder="https://letterboxd.com/film/…"
          className="w-full mt-1.5 rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.mono, fontSize: 16, color: T.cream }} />
      </label>
      {error && (
        <div className="rounded-lg p-3 mb-3" style={{ background: T.alertSoft, border: `1px solid ${T.alert}44` }}>
          <p style={{ fontFamily: F.mono, fontSize: 10.5, color: T.alert }}>{error}</p>
        </div>
      )}
      {submitted ? (
        <div className="rounded-lg py-3.5 text-center mt-2" style={{ background: T.accentSoft, fontFamily: F.mono, fontSize: 11, color: T.accent, letterSpacing: 0.5 }}>✓ TICKET ÉMIS — « {titre} » AJOUTÉ AU SHEET</div>
      ) : (
        <button onClick={handleSubmit} disabled={!canSubmit || saving} className="w-full rounded-lg py-3.5" style={{ background: canSubmit ? T.accent : T.surfaceRaised, fontFamily: F.mono, fontSize: 12, letterSpacing: 1.2, color: canSubmit ? T.bg : T.mutedDim, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
          {saving ? "ENVOI…" : "ÉMETTRE LE TICKET"}
        </button>
      )}
      <p className="mt-3 text-center" style={{ fontFamily: F.mono, fontSize: 8.5, color: T.mutedDim }}>
        L'enrichissement (affiche, synopsis, note...) ne se fera automatiquement qu'une fois le script Apps Script rattaché à ce Sheet.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ECRAN ARCHIVES                                                       */
/* ------------------------------------------------------------------ */
function ArchivesScreen({ films, onOpen, onBack, onMenu }) {
  const [sortRecent, setSortRecent] = useState(true);
  const list = useMemo(() => {
    const arr = films.filter((f) => isArchived(f)).map((f) => ({ f, days: Math.abs(daysUntil(parseDateFR(f.dateManuelle))) }));
    arr.sort((a, b) => sortRecent ? a.days - b.days : b.days - a.days);
    return arr;
  }, [films, sortRecent]);

  return (
    <div className="flex-1 overflow-y-auto pull-scroll pb-6 px-5">
      <ScreenHeader title="ARCHIVES" onBack={onBack} onMenu={onMenu}
        right={<button onClick={() => setSortRecent((v) => !v)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <span style={{ fontFamily: F.mono, fontSize: 9, color: T.muted, letterSpacing: 0.4 }}>{sortRecent ? "PLUS RÉCENT" : "PLUS ANCIEN"}</span>
        </button>} />
      <p className="mb-3" style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.5 }}>{list.length} FICHE{list.length > 1 ? "S" : ""} ARCHIVÉE{list.length > 1 ? "S" : ""}</p>
      <div className="flex flex-col gap-2">
        {list.map(({ f, days }) => (
          <ListResultCard key={f.id} film={f} onOpen={onOpen}
            right={<div className="flex items-center pr-3"><span className="rounded-full px-2.5 py-1" style={{ background: "rgba(155,146,132,0.12)" }}>
              <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: 0.5, color: T.mutedDim, fontWeight: 600 }}>EXPIRÉ IL Y A {days}J</span>
            </span></div>} />
        ))}
        {list.length === 0 && <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Aucune fiche archivée.</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ECRAN TAGS                                                           */
/* ------------------------------------------------------------------ */
function tagMatches(film, tag) {
  if (tag === "Romy") return !!film.romy;
  if (tag === "Benoit") return !!film.benoit;
  if (tag === "À deux") return !!film.aDeux;
  if (tag === "En famille") return !!film.enFamille;
  return false;
}

function TagsScreen({ films, tag: initialTag, onOpen, onBack, onMenu }) {
  const [tag, setTag] = useState(initialTag || "Romy");
  const list = films.filter((f) => tagMatches(f, tag) && !isArchived(f));

  return (
    <div className="flex-1 overflow-y-auto pull-scroll pb-6 px-5">
      <ScreenHeader title="TAGS" onBack={onBack} onMenu={onMenu} />
      <div className="flex gap-2 flex-wrap mb-4">
        {TAG_LIST().map((t) => (
          <button key={t.id} onClick={() => setTag(t.id)} className="rounded-full px-3 py-1.5"
            style={{ background: tag === t.id ? T.accentSoft : T.surface, border: `1px solid ${tag === t.id ? T.accent + "66" : T.line}` }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: tag === t.id ? T.accent : T.muted }}>{t.label}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {list.map((f) => <ListResultCard key={f.id} film={f} onOpen={onOpen} />)}
        {list.length === 0 && <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Aucune fiche taguée « {tag} » pour l'instant.</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ECRAN RÉGLAGES                                                       */
/* ------------------------------------------------------------------ */
// Ordre d'affichage des groupes — du plus "standard" au plus exploratoire.
const GROUPES_THEMES_ORDRE = ["Originaux", "Signature", "Mises en page réinventées", "Ambiances CinéRadar"];

function ThemesScreen({ theme, onChangeTheme, onBack, onMenu }) {
  const parGroupe = useMemo(() => {
    const m = {};
    Object.entries(THEMES).forEach(([key, t]) => {
      const g = t.groupe || "Autres";
      (m[g] = m[g] || []).push([key, t]);
    });
    return m;
  }, []);

  return (
    <div className="flex-1 overflow-y-auto pull-scroll pb-8 px-5">
      <ScreenHeader title="THÈMES" onBack={onBack} onMenu={onMenu} />
      {GROUPES_THEMES_ORDRE.filter((g) => parGroupe[g]).map((groupe) => (
        <div key={groupe} className="mb-5">
          <SectionLabel>{groupe.toUpperCase()}</SectionLabel>
          <div className="flex flex-col gap-2">
            {parGroupe[groupe].map(([key, t]) => {
              const active = theme === key;
              return (
                <button key={key} onClick={() => onChangeTheme(key)} className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: active ? T.accentSoft : T.surface, border: `1px solid ${active ? T.accent + "66" : T.line}` }}>
                  <span style={{ fontFamily: F.serif, fontSize: 13.5, color: active ? T.accent : T.cream }}>{t.label}</span>
                  {active && <Check size={16} color={T.accent} />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="mt-1" style={{ fontFamily: F.mono, fontSize: 9, color: T.mutedDim, lineHeight: 1.5 }}>
        Change les couleurs, la police et parfois la mise en page dans toute l'appli. Ton choix est mémorisé sur cet appareil.
      </p>
    </div>
  );
}

function ReglagesScreen({ nbAccueil, onChangeNbAccueil, onRefresh, filmCount, onBack, onMenu, theme, onOpenThemes }) {
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = () => { setRefreshing(true); onRefresh(); setTimeout(() => setRefreshing(false), 900); };

  return (
    <div className="flex-1 overflow-y-auto pull-scroll pb-8 px-5">
      <ScreenHeader title="RÉGLAGES" onBack={onBack} onMenu={onMenu} />

      <SectionLabel>STYLE VISUEL</SectionLabel>
      <button onClick={onOpenThemes} className="w-full flex items-center justify-between rounded-xl px-4 py-3" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <div className="text-left">
          <p style={{ fontFamily: F.serif, fontSize: 13.5, color: T.cream }}>Thèmes</p>
          <p style={{ fontFamily: F.mono, fontSize: 9.5, color: T.mutedDim, marginTop: 2 }}>{THEMES[theme]?.label || theme}</p>
        </div>
        <ChevronRight size={16} color={T.mutedDim} />
      </button>
      <p className="mt-2" style={{ fontFamily: F.mono, fontSize: 9, color: T.mutedDim, lineHeight: 1.5 }}>
        {Object.keys(THEMES).length} thèmes, groupés par famille. Ton choix est mémorisé sur cet appareil.
      </p>

      <SectionLabel>NOMBRE DE FILMS SUR L'ACCUEIL</SectionLabel>
      <div className="flex items-center justify-between rounded-xl px-4 py-2.5" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <span style={{ fontFamily: F.serif, fontSize: 13.5, color: T.cream }}>"Ça part bientôt" affiche</span>
        <div className="flex items-center gap-3">
          <button onClick={() => onChangeNbAccueil(Math.max(3, nbAccueil - 1))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: T.surfaceRaised }}><Minus size={12} color={T.muted} /></button>
          <span style={{ fontFamily: F.marquee, fontSize: 18, color: T.accent, minWidth: 30, textAlign: "center" }}>{nbAccueil}</span>
          <button onClick={() => onChangeNbAccueil(Math.min(15, nbAccueil + 1))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: T.surfaceRaised }}><Plus size={12} color={T.muted} /></button>
        </div>
      </div>
      <p className="mt-2" style={{ fontFamily: F.mono, fontSize: 9, color: T.mutedDim, lineHeight: 1.5 }}>
        Les {nbAccueil} prochains films qui disparaissent, classés par date la plus proche. "Derniers ajouts" garde le même réglage.
      </p>

      <SectionLabel>DONNÉES</SectionLabel>
      <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <div>
          <p style={{ fontFamily: F.serif, fontSize: 13.5, color: T.cream }}>Bibliothèque</p>
          <p style={{ fontFamily: F.mono, fontSize: 9.5, color: T.mutedDim }}>{filmCount} fiches</p>
        </div>
        <button onClick={handleRefresh} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.accentSoft }}>
          <RefreshCw size={14} color={T.accent} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
        </button>
      </div>

      <SectionLabel>À PROPOS</SectionLabel>
      <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${T.line}` }}>
          <span style={{ fontFamily: F.serif, fontSize: 13.5, color: T.cream }}>Version</span>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: T.mutedDim }}>V2.0</span>
        </div>
        <a href="https://cineradar-nu.vercel.app" target="_blank" rel="noreferrer" className="w-full flex items-center justify-between px-4 py-3">
          <span style={{ fontFamily: F.serif, fontSize: 13.5, color: T.cream }}>CinéRadar</span>
          <ExternalLink size={13} color={T.accentSecondary} />
        </a>
      </div>
      <div className="flex items-start gap-2 mt-3 px-1">
        <Info size={12} color={T.mutedDim} style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ fontFamily: F.mono, fontSize: 8.5, color: T.mutedDim, lineHeight: 1.6 }}>
          MÉTADONNÉES ET AFFICHES : THE MOVIE DATABASE (TMDB). NOTES ET VOTES : LETTERBOXD. CINÉMAISON N'EST APPROUVÉ NI PAR L'UN NI PAR L'AUTRE.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MENU LATÉRAL — GUICHET                                               */
/* ------------------------------------------------------------------ */
function MenuDrawer({ open, onClose, films, onNavigate }) {
  const counts = useMemo(() => {
    const m = {};
    // Ne compte que les fiches à date valable (non archivées), pour que
    // ce chiffre corresponde exactement à ce que montre la bibliothèque.
    films.filter((f) => !isArchived(f)).forEach((f) => { m[f.type] = (m[f.type] || 0) + 1; });
    return m;
  }, [films]);

  const groups = [
    { label: "ALERTES", items: [
      { id: "alertes", title: "Alertes", nav: { name: "alertes", params: {} } },
    ]},
    { label: "BIBLIOTHÈQUES", items: TYPES_LIST.map((t) => ({ id: `type_${t}`, title: t, count: counts[t] || 0, nav: { name: "biblio", params: { type: t } } })) },
    { label: "DÉCOUVRIR", items: [
      { id: "recherche", title: "Recherche", nav: { name: "recherche", params: {} } },
      { id: "explorer", title: "Explorer", nav: { name: "explorer", params: {} } },
      { id: "genres", title: "Genres", nav: { name: "genres", params: {} } },
    ]},
    { label: "TAGS", items: [
      { id: "tag_romy", title: "Romy", nav: { name: "tags", params: { tag: "Romy" } } },
      { id: "tag_benoit", title: "Benoit", nav: { name: "tags", params: { tag: "Benoit" } } },
      { id: "tag_a_deux", title: "❤️ À deux", nav: { name: "tags", params: { tag: "À deux" } } },
      { id: "tag_famille", title: "En famille", nav: { name: "tags", params: { tag: "En famille" } } },
    ]},
  ];

  return (
    <div className="fixed inset-0 z-40" style={{ pointerEvents: open ? "auto" : "none" }}>
      <div onClick={onClose} className="absolute inset-0" style={{ background: "rgba(10,8,6,0.7)", opacity: open ? 1 : 0, transition: "opacity 0.25s" }} />
      <div className="absolute left-0 top-0 bottom-0 overflow-y-auto pull-scroll" style={{ width: 278, background: T.bg, borderRight: `1px solid ${T.line}`, transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.28s ease" }}>
        <div className="flex items-center justify-between px-4" style={{ paddingTop: "max(18px, env(safe-area-inset-top))", paddingBottom: 14 }}>
          <span style={{ fontFamily: F.marquee, fontSize: 21, color: T.accent, letterSpacing: 1.5 }}>GUICHET</span>
          <button onClick={onClose}><X size={18} color={T.muted} /></button>
        </div>
        {groups.map((g, gi) => (
          <div key={gi} className="px-4 mb-4">
            <p className="mb-1.5" style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.4, color: T.mutedDim }}>{g.label}</p>
            <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
              {g.items.map((it, i) => (
                <button key={it.id} onClick={() => onNavigate(it.nav)} className="w-full text-left px-3.5 py-2.5 flex items-center justify-between"
                  style={{ borderBottom: i < g.items.length - 1 ? `1px solid ${T.line}` : "none" }}>
                  <span style={{ fontFamily: F.serif, fontSize: 14, color: T.cream }}>{it.title}</span>
                  {it.count != null && <span style={{ fontFamily: F.mono, fontSize: 10, color: T.accentSecondary }}>{it.count}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="px-4 mb-6 mt-1 pt-3" style={{ borderTop: `1px solid ${T.line}` }}>
          <button onClick={() => onNavigate({ name: "archives", params: {} })} className="block w-full text-left py-2" style={{ fontFamily: F.serif, fontSize: 13.5, color: T.cream }}>Archives</button>
          <button onClick={() => onNavigate({ name: "reglages", params: {} })} className="block w-full text-left py-2" style={{ fontFamily: F.serif, fontSize: 13.5, color: T.cream }}>Réglages</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PULL-TO-REFRESH — tirer vers le bas en haut d'un écran recharge les */
/* données depuis le Sheet. Utile après une modification/suppression   */
/* pour resynchroniser sans attendre. Détecte le conteneur défilant    */
/* réellement sous le doigt via la classe "pull-scroll" (posée sur     */
/* chaque écran), pas de dépendance à une seule zone de scroll globale.*/
/* ------------------------------------------------------------------ */
const PULL_THRESHOLD = 64; // px à tirer avant que le relâchement déclenche le refresh
const PULL_MAX = 92;

function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const stateRef = useRef({ active: false, startY: 0, scrollEl: null }).current;

  const handleTouchStart = (e) => {
    if (refreshing) return;
    const scrollEl = e.target.closest(".pull-scroll");
    if (!scrollEl || scrollEl.scrollTop > 0) return;
    stateRef.active = true;
    stateRef.startY = e.touches[0].clientY;
    stateRef.scrollEl = scrollEl;
  };

  const handleTouchMove = (e) => {
    if (!stateRef.active) return;
    if (!stateRef.scrollEl || stateRef.scrollEl.scrollTop > 0) {
      stateRef.active = false;
      setPullDistance(0);
      return;
    }
    const delta = e.touches[0].clientY - stateRef.startY;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }
    setPullDistance(Math.min(delta * 0.5, PULL_MAX));
  };

  const handleTouchEnd = async () => {
    if (!stateRef.active) return;
    stateRef.active = false;
    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      className="relative flex-1 min-h-0 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {pullDistance > 0 && (
        <div
          className="absolute left-0 right-0 flex items-center justify-center z-30"
          style={{ top: 0, height: pullDistance, transition: refreshing ? "none" : "height 0.2s ease" }}
        >
          <RefreshCw
            size={17}
            color={T.accent}
            style={{
              transform: `rotate(${pullDistance * 3}deg)`,
              animation: refreshing ? "spin 0.8s linear infinite" : "none",
              opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* BARRE DE NAVIGATION PERMANENTE                                       */
/* ------------------------------------------------------------------ */
function BottomNav({ active, onNavigate }) {
  const items = [
    { id: "accueil", label: "Accueil", icon: LogoMark, nav: { name: "accueil", params: {} } },
    { id: "biblio", label: "Film", icon: Film, nav: { name: "biblio", params: { type: "Film" } } },
    { id: "alertes", label: "Alertes", icon: Clock, nav: { name: "alertes", params: { mode: "manuel" } } },
    { id: "ajouter", label: "Ajouter", icon: PlusCircle, nav: { name: "ajouter", params: {} } },
  ];

  if (CURRENT_THEME === "terminal") {
    // Barre d'onglets de fichiers ouverts, façon éditeur de code
    const fichiers = { accueil: "accueil.js", biblio: "films.js", alertes: "alertes.js", ajouter: "+ajouter.js" };
    return (
      <div className="flex-shrink-0 flex items-center px-3 py-3 overflow-x-auto" style={{ background: T.surface, borderTop: `1px solid ${T.line}`, paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        {items.map((it) => {
          const isActive = active === it.id;
          return (
            <button key={it.id} onClick={() => onNavigate(it.nav)} className="mr-4 flex items-center gap-1.5 flex-shrink-0">
              <FileText size={10} color={isActive ? "#569CD6" : T.mutedDim} />
              <span style={{ fontFamily: F.mono, fontSize: 9.5, color: isActive ? T.cream : T.mutedDim }}>{fichiers[it.id]}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const dotIndicator = CURRENT_THEME === "salle" || CURRENT_THEME === "letterboxd" || CURRENT_THEME === "bento";
  return (
    <div className="flex-shrink-0 flex items-stretch" style={{ background: T.surface, borderTop: `1px solid ${T.line}`, paddingBottom: "env(safe-area-inset-bottom)" }}>
      {items.map((it) => {
        const isActive = active === it.id;
        const Icon = it.icon;
        return (
          <button key={it.id} onClick={() => onNavigate(it.nav)} className="flex-1 flex flex-col items-center gap-1 py-1.5">
            {dotIndicator ? (
              it.id === "accueil" ? (
                <span style={{ fontFamily: F.marquee, fontSize: 11, fontWeight: 800, color: isActive ? T.cream : T.mutedDim }}>C</span>
              ) : (
                <Icon size={17} color={isActive ? T.cream : T.mutedDim} strokeWidth={isActive ? 2.2 : 1.8} />
              )
            ) : it.id === "accueil" ? (
              <span className="flex items-center justify-center" style={{ width: 17, height: 17, borderRadius: 4, background: isActive ? T.accent : T.accentSoft }}>
                <span style={{ fontFamily: F.marquee, fontSize: 9.5, color: isActive ? T.bg : T.accent }}>C</span>
              </span>
            ) : (
              <Icon size={15} color={isActive ? T.accent : T.mutedDim} />
            )}
            <span style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: 0.3, color: isActive ? (dotIndicator ? T.cream : T.accent) : T.mutedDim, fontWeight: dotIndicator && isActive ? 600 : 400 }}>{it.label.toUpperCase()}</span>
            {dotIndicator && <span style={{ width: 4, height: 4, borderRadius: "50%", background: isActive ? T.accent : "transparent", marginTop: -2 }} />}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* APP                                                                 */
/* ------------------------------------------------------------------ */
export default function App() {
  const [films, setFilms] = useState(null);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nbAccueil, setNbAccueilState] = useState(8);
  // Thème visuel : appliqué à T/F au montage (voir applyTheme_ tout en
  // haut du fichier), puis à chaque changement depuis Réglages.
  // themeTick force un nouveau rendu de toute l'appli après la mutation
  // de T/F, puisque T et F sont des objets mutés en place et non
  // remplacés (voir la note sur les THEMES en tête de fichier).
  const [theme, setTheme] = useState("ticket");
  const [, setThemeTick] = useState(0);
  // screen = { name, params }. "fiche" a un champ params.film et params.from
  // (l'écran précédent) pour que le bouton retour ramène au bon endroit.
  const [screen, setScreen] = useState({ name: "accueil", params: {} });

  const loadFilms = () => {
    // Renvoie la promesse pour que pull-to-refresh puisse attendre la fin
    // du chargement avant de masquer son indicateur.
    return fetch("/api/get-films")
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json();
      })
      .then((data) => setFilms(data))
      .catch((e) => setError(e.message));
  };

  useEffect(() => { loadFilms(); }, []);

  // Applique le thème mémorisé sur cet appareil dès le premier rendu.
  useEffect(() => {
    const stored = getStoredTheme_();
    setTheme(stored);
    applyTheme_(stored);
    setThemeTick((n) => n + 1);
  }, []);

  // Recharge le nombre de films "Ça part bientôt" mémorisé sur cet
  // appareil — sans ça, il revenait à 8 (valeur par défaut) à chaque
  // réouverture de l'appli.
  useEffect(() => {
    setNbAccueilState(getStoredNbAccueil_());
  }, []);

  const setNbAccueil = (n) => {
    setNbAccueilState(n);
    try { localStorage.setItem("cinemaison_nbAccueil", String(n)); } catch {}
  };

  const changeTheme = (name) => {
    setTheme(name);
    applyTheme_(name);
    setThemeTick((n) => n + 1); // force le nouveau rendu, T/F ont changé en place
  };

  const navigate = (nav) => { setScreen(nav); setMenuOpen(false); };
  const openFiche = (film) => setScreen({ name: "fiche", params: { film, from: screen } });
  const backFromFiche = () => setScreen(screen.params.from || { name: "accueil", params: {} });
  const openPerson = (nom) => setScreen({ name: "personne", params: { nom, from: screen } });
  const backFromPerson = () => setScreen(screen.params.from || { name: "accueil", params: {} });
  const goAccueil = () => setScreen({ name: "accueil", params: {} });

  // Met à jour une fiche dans le state local après un ajout de tag ou une
  // modification complète (écran Modifier), sans tout re-fetcher.
  const handleFilmUpdated = (id, fields) => {
    const normalized = { ...fields };
    ["benoit", "romy", "aDeux", "enFamille"].forEach((tagField) => {
      if (typeof normalized[tagField] === "boolean") {
        normalized[tagField] = normalized[tagField] ? "OUI" : "";
      }
    });
    setFilms((prev) => prev.map((f) => f.id === id ? { ...f, ...normalized } : f));
  };

  // Après suppression : retire la fiche du state local et revient en arrière
  const handleFilmDeleted = (id) => {
    setFilms((prev) => prev.filter((f) => f.id !== id));
    backFromFiche();
  };

  let body = null;
  if (films) {
    const { name, params } = screen;
    if (name === "accueil") {
      body = <AccueilScreen films={films} onOpen={openFiche} onSearch={() => navigate({ name: "recherche", params: {} })}
        onMenu={() => setMenuOpen(true)} onAdd={() => navigate({ name: "ajouter", params: {} })} onNavigate={navigate} nbAccueil={nbAccueil} />;
    } else if (name === "recherche") {
      body = <RechercheScreen films={films} onOpen={openFiche} onBack={goAccueil} onMenu={() => setMenuOpen(true)} />;
    } else if (name === "fiche") {
      body = <FicheDetailScreen film={params.film} onBack={backFromFiche} onFilmUpdated={handleFilmUpdated} onDelete={handleFilmDeleted} onOpenPerson={openPerson} />;
    } else if (name === "personne") {
      body = <PersonScreen films={films} nom={params.nom} onOpen={openFiche} onBack={backFromPerson} onMenu={() => setMenuOpen(true)} />;
    } else if (name === "biblio") {
      body = <BibliothequeScreen films={films} type={params.type} onOpen={openFiche} onBack={goAccueil} onMenu={() => setMenuOpen(true)} />;
    } else if (name === "alertes") {
      body = <AlertesScreen films={films} mode={params.mode} onOpen={openFiche} onBack={goAccueil} onMenu={() => setMenuOpen(true)} />;
    } else if (name === "explorer") {
      body = <ExplorerScreen films={films} initialGenre={params.initialGenre} onOpen={openFiche} onBack={goAccueil} onMenu={() => setMenuOpen(true)} />;
    } else if (name === "genres") {
      body = <GenresScreen films={films} onNavigate={navigate} onBack={goAccueil} onMenu={() => setMenuOpen(true)} />;
    } else if (name === "ajouter") {
      body = <AjouterScreen onBack={goAccueil} onAdded={loadFilms} onMenu={() => setMenuOpen(true)} />;
    } else if (name === "archives") {
      body = <ArchivesScreen films={films} onOpen={openFiche} onBack={goAccueil} onMenu={() => setMenuOpen(true)} />;
    } else if (name === "tags") {
      body = <TagsScreen films={films} tag={params.tag} onOpen={openFiche} onBack={goAccueil} onMenu={() => setMenuOpen(true)} />;
    } else if (name === "reglages") {
      body = <ReglagesScreen nbAccueil={nbAccueil} onChangeNbAccueil={setNbAccueil} onRefresh={loadFilms} filmCount={films.length} onBack={goAccueil} onMenu={() => setMenuOpen(true)} theme={theme} onOpenThemes={() => navigate({ name: "themes", params: {} })} />;
    } else if (name === "themes") {
      body = <ThemesScreen theme={theme} onChangeTheme={changeTheme} onBack={() => navigate({ name: "reglages", params: {} })} onMenu={() => setMenuOpen(true)} />;
    }
  }

  const activeTab =
    screen.name === "accueil" ? "accueil" :
    screen.name === "biblio" && screen.params.type === "Film" ? "biblio" :
    screen.name === "alertes" ? "alertes" :
    screen.name === "ajouter" ? "ajouter" : null;

  return (
    <div className="w-full flex items-center justify-center" style={{ background: T.bg, height: "100dvh" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes minitelBlink { 50% { opacity: 0; } }`}</style>
      <div
        className="flex flex-col w-full relative"
        style={{
          maxWidth: 460, height: "100%", background: T.bg,
          // Trame de points façon impression BD — uniquement en thème "bd"
          ...(CURRENT_THEME === "bd" ? {
            backgroundImage: `radial-gradient(${T.cream}22 1px, transparent 1px)`,
            backgroundSize: "7px 7px",
          } : {}),
          // Dégradé pastel diagonal — uniquement en thème "bento"
          ...(CURRENT_THEME === "bento" ? {
            background: `linear-gradient(160deg, ${T.bg} 0%, ${T.accentSecondarySoft} 50%, ${T.surfaceRaised} 100%)`,
          } : {}),
        }}
      >
        {error && (
          <div className="m-4 rounded-lg p-3" style={{ background: T.alertSoft, border: `1px solid ${T.alert}44` }}>
            <p style={{ fontFamily: F.mono, fontSize: 11, color: T.alert }}>Erreur : {error}</p>
          </div>
        )}

        {!films && !error && (
          <p className="p-4" style={{ fontFamily: F.serif, color: T.muted }}>Chargement des films…</p>
        )}

        <PullToRefresh onRefresh={loadFilms}>{body}</PullToRefresh>

        {films && <BottomNav active={activeTab} onNavigate={navigate} />}
        {films && <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} films={films} onNavigate={navigate} />}
      </div>
    </div>
  );
}
