import { useState, useEffect, useMemo, useRef } from "react";
import { Menu, Shuffle, ChevronLeft, ChevronRight, Pencil, Trash2, Star, Film, Clock, X, Search, Rocket, Minus, Plus, Check, RefreshCw, ExternalLink, Info, PlusCircle, CalendarDays, Play, FileText, Maximize2, Volume2, VolumeX } from "lucide-react";

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
  popart: {
    label: "Pop Art",
    groupe: "Mises en page réinventées",
    colors: {
      bg: "#FFF8ED",
      surface: "#FFFFFF",
      surfaceRaised: "#F3EAD6",
      accent: "#FF2D78",
      accentSoft: "rgba(255,45,120,0.14)",
      accentSecondary: "#00C2D1",
      accentSecondarySoft: "rgba(0,194,209,0.14)",
      accentTertiary: "#8B2FE0",
      gold: "#F4E409",
      cream: "#161414",
      muted: "#6B6458",
      mutedDim: "#A89F8E",
      line: "rgba(22,20,20,0.14)",
      alert: "#FF2D78",
      alertSoft: "rgba(255,45,120,0.14)",
      radius: 4,
      radiusSm: 3,
      shadow: "none",
      borderWidth: 3,
    },
    fonts: { marquee: "'Inter', sans-serif", serif: "'Inter', sans-serif", mono: "'IBM Plex Mono', monospace" },
  },
  canalplus: {
    label: "Chaîne Cryptée",
    groupe: "Mises en page réinventées",
    colors: {
      bg: "#0A0A0A",
      surface: "#161616",
      surfaceRaised: "#1E1E1E",
      accent: "#EC1953",
      accentSoft: "rgba(236,25,83,0.14)",
      accentSecondary: "#EC1953",
      accentSecondarySoft: "rgba(236,25,83,0.14)",
      gold: "#EC1953",
      cream: "#F2F2F2",
      muted: "#999999",
      mutedDim: "#666666",
      line: "#232323",
      alert: "#EC1953",
      alertSoft: "rgba(236,25,83,0.14)",
      radius: 10,
      radiusSm: 8,
      shadow: "none",
      borderWidth: 1,
    },
    fonts: { marquee: "'Archivo Black', sans-serif", serif: "'Inter', sans-serif", mono: "'IBM Plex Mono', monospace" },
  },
  springfield: {
    label: "Springfield",
    groupe: "Mises en page réinventées",
    colors: {
      bg: "#FFD23F",
      surface: "#FFFFFF",
      surfaceRaised: "#FFF3B0",
      accent: "#D62828",
      accentSoft: "rgba(214,40,40,0.12)",
      accentSecondary: "#2E5EAA",
      accentSecondarySoft: "rgba(46,94,170,0.12)",
      gold: "#FFD23F",
      cream: "#1A1400",
      muted: "#7a6a2f",
      mutedDim: "#a8975c",
      line: "#1A1400",
      alert: "#D62828",
      alertSoft: "rgba(214,40,40,0.12)",
      radius: 10,
      radiusSm: 8,
      shadow: "none",
      borderWidth: 2,
    },
    fonts: { marquee: "'Simpsonfont', 'Archivo Black', sans-serif", serif: "'Inter', sans-serif", mono: "'IBM Plex Mono', monospace" },
  },
  cacartoon: {
    label: "Ça Cartoon",
    groupe: "Mises en page réinventées",
    colors: {
      bg: "#0D0D0D",
      surface: "#161616",
      surfaceRaised: "#1E1E1E",
      accent: "#E13A2E",
      accentSoft: "rgba(225,58,46,0.14)",
      accentSecondary: "#1B4F9C",
      accentSecondarySoft: "rgba(27,79,156,0.14)",
      accentTertiary: "#4F9A55",
      accentQuaternary: "#8E4B9E",
      gold: "#F4B92A",
      cream: "#F2F2F2",
      muted: "#999999",
      mutedDim: "#666666",
      line: "#262626",
      alert: "#E13A2E",
      alertSoft: "rgba(225,58,46,0.14)",
      radius: 10,
      radiusSm: 8,
      shadow: "none",
      borderWidth: 3,
    },
    fonts: { marquee: "'Archivo Black', sans-serif", serif: "'Inter', sans-serif", mono: "'IBM Plex Mono', monospace" },
  },
  // ---- 4 nouvelles directions : couleurs/police/forme intégrées, les     ----
  // ---- inventions structurelles (grille bento, JSON, BD, blobs) restent  ----
  // ---- propres aux aperçus — non reproduites sur tous les écrans ici.    ----
  bento: {
    label: "Bento Moderne",
    groupe: "Mises en page réinventées",
    colors: {
      bg: "#F1E9D8",
      surface: "#FFFFFF",
      surfaceRaised: "#FBF6EC",
      accent: "#A8603F",
      accentSoft: "#F3DED2",
      accentSecondary: "#5B7A5E",
      accentSecondarySoft: "#E2E8DE",
      gold: "#C9A24B",
      cream: "#33281C",
      muted: "#8A7A63",
      mutedDim: "#B0A38C",
      line: "#A8603F22",
      alert: "#A8603F",
      alertSoft: "#F3DED2",
      radius: 24,
      radiusSm: 18,
      shadow: "0 8px 24px rgba(168,96,63,0.12)",
      borderWidth: 1,
    },
    fonts: { marquee: "'Inter', sans-serif", serif: "'Inter', sans-serif", mono: "'IBM Plex Mono', monospace" },
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
  // ---- "Six Directions" — palette/typo ChatGPT, importées telles quelles
  // (comme les Ambiances CinéRadar : pas de branche CURRENT_THEME dédiée) ----
  palais: {
    label: "Palais 1932",
    groupe: "Six Directions",
    colors: {
      bg: "#160D24",
      surface: "#1D1329",
      surfaceRaised: "#241735",
      accent: "#B66A3C",
      accentSoft: "#3A2413",
      accentSecondary: "#39736D",
      accentSecondarySoft: "#16302C",
      gold: "#FFD24A",
      cream: "#F4DEB3",
      muted: "#C7B491",
      mutedDim: "#8A7A5C",
      line: "#F4DEB326",
      alert: "#E85D4A",
      alertSoft: "#3A1F18",
      radius: 4,
      radiusSm: 4,
      shadow: "0 18px 50px rgba(4,0,10,0.42)",
      borderWidth: 1,
    },
    fonts: { marquee: "'Cormorant Garamond', serif", serif: "'Cormorant Garamond', serif", mono: "'Manrope', sans-serif" },
  },
  nvague: {
    label: "Nouvelle Vague 74",
    groupe: "Six Directions",
    colors: {
      bg: "#F2E7CF",
      surface: "#FFFDF6",
      surfaceRaised: "#EAE0C4",
      accent: "#E64124",
      accentSoft: "#F6D9CE",
      accentSecondary: "#2155CD",
      accentSecondarySoft: "#DCE4F7",
      gold: "#E6B83D",
      cream: "#171717",
      muted: "#5C584C",
      mutedDim: "#8F8A76",
      line: "#17171733",
      alert: "#E64124",
      alertSoft: "#F6D9CE",
      radius: 0,
      radiusSm: 0,
      shadow: "8px 8px 0 #171717",
      borderWidth: 1,
    },
    fonts: { marquee: "'Bebas Neue', sans-serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Sans Condensed', sans-serif" },
  },
  kansoHeritage: {
    label: "Kanso Héritage",
    groupe: "Six Directions",
    colors: {
      bg: "#F4EEDF",
      surface: "#FFFFFF",
      surfaceRaised: "#EDE4CE",
      accent: "#C85A32",
      accentSoft: "#F3DFD2",
      accentSecondary: "#26354A",
      accentSecondarySoft: "#DCE1E8",
      gold: "#B79A58",
      cream: "#181713",
      muted: "#68705A",
      mutedDim: "#9C9584",
      line: "#18171322",
      alert: "#C85A32",
      alertSoft: "#F3DFD2",
      radius: 6,
      radiusSm: 4,
      shadow: "0 6px 18px rgba(24,23,19,0.08)",
      borderWidth: 1,
    },
    fonts: { marquee: "'Noto Serif Display', serif", serif: "'Noto Sans', sans-serif", mono: "'IBM Plex Mono', monospace" },
  },
  popbrutal: {
    label: "Studio Pop Brutal",
    groupe: "Six Directions",
    colors: {
      bg: "#FFF7E8",
      surface: "#FFFFFF",
      surfaceRaised: "#FFF0D2",
      accent: "#FF4B36",
      accentSoft: "#FFD9D2",
      accentSecondary: "#2348FF",
      accentSecondarySoft: "#D6DEFF",
      gold: "#C7FF2E",
      cream: "#090909",
      muted: "#333333",
      mutedDim: "#666666",
      line: "#090909",
      alert: "#FF4B36",
      alertSoft: "#FFD9D2",
      radius: 0,
      radiusSm: 0,
      shadow: "6px 6px 0 #090909",
      borderWidth: 2,
    },
    fonts: { marquee: "'Anton', sans-serif", serif: "'Anton', sans-serif", mono: "'Archivo', sans-serif" },
  },
  projectionniste: {
    label: "Le Projectionniste",
    groupe: "Rituel",
    colors: {
      bg: "#0A0908",
      surface: "#161310",
      surfaceRaised: "#201B16",
      accent: "#B8763A",
      accentSoft: "#3A2A16",
      accentSecondary: "#5C6B6F",
      accentSecondarySoft: "#1A2224",
      gold: "#B8763A",
      cream: "#E8E0D0",
      muted: "#7A6F5C",
      mutedDim: "#4A4030",
      line: "#2A241D",
      alert: "#8B3A2A",
      alertSoft: "#2A1510",
      radius: 3,
      radiusSm: 2,
      shadow: "none",
      borderWidth: 1,
    },
    fonts: { marquee: "'Oswald', sans-serif", serif: "'Special Elite', monospace", mono: "'IBM Plex Mono', monospace" },
  },
};

let T = { ...THEMES.ticket.colors };
let F = { ...THEMES.ticket.fonts };
let CURRENT_THEME = "ticket"; // nom du thème actif — lu directement par les composants qui ont besoin d'un rendu spécifique (ex: SectionTitle, Poster) au-delà d'un simple changement de couleur/police.
// Compteur de rubrique pour Nouvelle Vague 74 (numérotation 01/02/03 façon grille suisse) — remis à 0 à chaque montage d'écran via AccueilScreen.
const NVAGUE_SECTION_COUNTER = { n: 0 };

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
/* NOTIFICATIONS LOCALES — réglage par appareil (localStorage, comme le */
/* thème ou le compte à rebours). Pas de push serveur : la notification */
/* se déclenche seulement quand l'appli est ouverte/revient au premier  */
/* plan, en vérifiant la bibliothèque à ce moment-là. Une vraie push en */
/* arrière-plan (téléphone fermé) demanderait un backend dédié (clés    */
/* VAPID + service worker + déclencheur côté serveur) — hors scope ici. */
/* ------------------------------------------------------------------ */
function getStoredNotifEnabled_() {
  try { return localStorage.getItem("cinemaison_notif_enabled") === "1"; } catch { return false; }
}
function getStoredNotifSeuil_() {
  try {
    const v = parseInt(localStorage.getItem("cinemaison_notif_seuil"), 10);
    return v === 2 || v === 5 ? v : 5;
  } catch { return 5; }
}
function getLastNotifDate_() {
  try { return localStorage.getItem("cinemaison_notif_last"); } catch { return null; }
}
function setLastNotifDate_(d) {
  try { localStorage.setItem("cinemaison_notif_last", d); } catch {}
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

// Urgence visuelle : rouge vif si ≤2 jours, orange si ≤5 jours, sinon on
// garde la couleur habituelle du thème (retourne null -> l'appelant garde
// son T.accent/T.alert d'origine). Couleurs volontairement fixes plutôt
// que dérivées du thème, pour rester universellement reconnaissables
// ("rouge = urgent") quel que soit le thème actif.
function urgencyColor_(days) {
  if (days == null) return null;
  if (days <= 2) return "#E8394A";
  if (days <= 5) return "#F5A623";
  return null;
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

// Extrait l'ID d'une vidéo YouTube à partir des formats d'URL courants
// (watch?v=, youtu.be/, embed/). Renvoie null si le format n'est pas
// reconnu — le trailer inline (Chaîne Cryptée) se rabat alors sur le
// bouton "TRAILER" classique qui ouvre le lien externe.
function extractYoutubeId_(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// Chaîne Cryptée : lecture automatique de la bande-annonce à la place de
// l'affiche, comme sur myCanal — vidéo intégrée en iframe (jamais un lien
// vers l'appli/le site YouTube), démarrée en muet après quelques secondes
// sur la fiche. Boutons son + plein écran superposés, et taper n'importe où
// sur la vidéo l'ouvre en plein écran (comme sur l'appli Canal+). YouTube
// reste l'hébergeur de la vidéo (impossible de retirer une éventuelle pub
// sans contourner leur système, ce qu'on ne fait pas), mais rien ne sort
// jamais de l'appli : pas de logo cliquable vers YouTube, pas de suggestions.
function InlineTrailer({ youtubeId, muted, onToggleMute, onExpand }) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: muted ? "1" : "0",
    controls: "0",
    modestbranding: "1",
    rel: "0",
    showinfo: "0",
    iv_load_policy: "3",
    playsinline: "1",
    loop: "1",
    playlist: youtubeId,
  });
  return (
    <div className="absolute inset-0" style={{ overflow: "hidden" }} onClick={onExpand}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`}
        title="Bande-annonce"
        allow="autoplay; encrypted-media"
        style={{
          position: "absolute", top: "50%", left: "50%", width: "100%", height: "100%",
          // Légèrement surdimensionnée puis recentrée pour masquer la barre
          // de titre YouTube qui dépasse en haut/bas malgré modestbranding.
          minWidth: "177.77vh", minHeight: "56.25vw",
          transform: "translate(-50%, -50%) scale(1.15)",
          border: "none", pointerEvents: "none",
        }}
      />
      <button
        onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
        className="absolute flex items-center justify-center"
        style={{ bottom: 50, left: 14, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "1.5px solid rgba(255,255,255,0.5)", boxShadow: "0 0 8px rgba(255,255,255,0.25)" }}
      >
        {muted ? <VolumeX size={15} color="#fff" /> : <Volume2 size={15} color="#fff" />}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onExpand(); }}
        className="absolute flex items-center justify-center"
        style={{ bottom: 50, left: 56, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "1.5px solid rgba(255,255,255,0.5)", boxShadow: "0 0 8px rgba(255,255,255,0.25)" }}
      >
        <Maximize2 size={14} color="#fff" />
      </button>
    </div>
  );
}

// Bouton "Bande-annonce" — n'apparaît que si film.urlBandeAnnonce est
// renseigné (rempli par le script d'enrichissement via TMDb). Ouvre la
// vidéo dans un lecteur plein écran intégré à l'appli (jamais un onglet
// YouTube externe) — même logique que la loupe sur l'affiche plus bas.
function TrailerButton({ url }) {
  const [open, setOpen] = useState(false);
  const youtubeId = extractYoutubeId_(url);
  if (!url || !youtubeId) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative inline-flex flex-col rounded-lg overflow-hidden flex-shrink-0"
        style={{ border: `1.5px solid ${T.accent}` }}
      >
        <div className="px-1 pt-1" style={{ background: `${T.accent}22` }}><FilmSprockets /></div>
        <div className="flex items-center gap-2 px-3 py-1.5">
          <Play size={13} color={T.accent} fill={T.accent} strokeWidth={0} />
          <span style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: 0.5, color: T.accent, fontWeight: 600 }}>TRAILER</span>
        </div>
        <div className="px-1 pb-1" style={{ background: `${T.accent}22` }}><FilmSprockets /></div>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#000" }}>
          <button onClick={() => setOpen(false)} className="absolute right-4 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ top: "max(16px, env(safe-area-inset-top))", background: "rgba(255,255,255,0.12)", zIndex: 2 }}>
            <X size={18} color="#fff" />
          </button>
          <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&playsinline=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`}
              title="Bande-annonce"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            />
          </div>
        </div>
      )}
    </>
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

function Poster({ film, className, style, hideSprockets }) {
  const [failed, setFailed] = useState(false);
  const isTable = CURRENT_THEME === "table";
  const isJardin = CURRENT_THEME === "jardin";
  // Coins asymétriques façon galet — remplace l'arrondi standard uniquement
  // pour ce thème, quelle que soit la taille de l'affiche (mini-carte,
  // grande affiche de fiche détail...).
  const jardinRadius = "38% 62% 63% 37% / 41% 44% 56% 59%";
  let content;

  if (!film.affiche || failed) {
    const flatBlockThemes = CURRENT_THEME === "affiche" || CURRENT_THEME === "bd";
    const isBD = CURRENT_THEME === "bd";
    const flatColor = flatBlockThemes ? afficheBlockColor_(film.titre) : null;
    const background = isBD
      // Trame de points par-dessus l'aplat de couleur, façon impression BD
      ? `radial-gradient(${T.cream}33 1px, transparent 1px), ${flatColor}`
      : flatBlockThemes
      ? flatColor
      : `linear-gradient(160deg, ${T.accentSoft}, ${T.surfaceRaised})`;
    const textColor = CURRENT_THEME === "affiche" || isBD ? T.cream : T.accent;
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
        <span style={{ fontFamily: isJardin ? F.serif : F.marquee, fontStyle: isJardin ? "italic" : "normal", fontSize: 12, color: textColor, letterSpacing: 0.5, textAlign: "center", lineHeight: 1.15, fontWeight: isBD ? 700 : 400 }}>
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
        {!hideSprockets && <NegativeSprockets side="top" />}
        {content}
        {!hideSprockets && <NegativeSprockets side="bottom" />}
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
  const urgent = urgencyColor_(days);
  const color = urgent || T.accent;
  return (
    <div className="absolute flex flex-col items-center justify-center"
      style={{
        top: 6, right: 6, width: 40, height: 40, borderRadius: "50%",
        border: `2px solid ${color}`, background: "rgba(20,16,12,0.72)",
        boxShadow: `0 0 0 2px ${T.bg}`, transform: "rotate(-10deg)",
      }}>
      <span style={{ fontFamily: F.marquee, fontSize: 15, color, lineHeight: 1 }}>J-{days}</span>
    </div>
  );
}

// Springfield : lettrage jaune à contour bleu épais net, technique double
// calque (span arrière avec -webkit-text-stroke plein pour le contour +
// span avant sans stroke pour l'aplat jaune) — variante A validée par Ben.
// IMPORTANT : ne jamais mettre de padding (px-*, mx-*) directement sur ce
// composant — le calque de contour est positionné en absolu par rapport au
// bord du padding et se désaligne du texte visible. Le padding doit toujours
// être posé sur un <div> englobant, pas sur SpringfieldTitle lui-même.
function SpringfieldTitle({ children, className }) {
  return (
    <p className={className} style={{ fontFamily: F.marquee, fontSize: 17, letterSpacing: 1.5, position: "relative", margin: 0 }}>
      <span aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, color: "transparent", WebkitTextStroke: `6px ${T.accentSecondary}` }}>{children}</span>
      <span style={{ position: "relative", color: T.gold }}>{children}</span>
    </p>
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
  if (CURRENT_THEME === "cacartoon") {
    // Ça Cartoon : pastille de couleur (rouge/bleu/jaune/vert en rotation
    // selon le titre) + lettrage bulle "Chewy" — pas de texte multicolore
    // lettre par lettre ici (réservé au hero/logo), pour rester lisible.
    const dotColors = [T.accent, T.accentSecondary, T.gold, T.accentTertiary];
    const hash = String(children || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const dotColor = dotColors[hash % dotColors.length];
    return (
      <div className="flex items-center gap-2.5 px-4 mb-2.5">
        <span style={{ width: 13, height: 13, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
        <span style={{ fontFamily: F.marquee, fontSize: 17, color: T.cream }}>{children}</span>
        {onMore && <button onClick={onMore} style={{ marginLeft: "auto", fontFamily: F.mono, fontSize: 9.5, color: T.gold, fontWeight: 700 }}>TOUT VOIR</button>}
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
  if (CURRENT_THEME === "palais") {
    // Palais 1932 : petites capitales encadrées d'un double filet doré,
    // esprit programme de salle art déco.
    return (
      <div className="px-5 mb-3.5 text-center">
        <div className="flex items-center gap-2 justify-center">
          <span style={{ flex: 1, height: 1, background: `${T.accent}88`, maxWidth: 36 }} />
          <span style={{ fontFamily: F.marquee, fontSize: 12.5, letterSpacing: 3, color: T.accent, fontWeight: 600 }}>{children}</span>
          <span style={{ flex: 1, height: 1, background: `${T.accent}88`, maxWidth: 36 }} />
        </div>
      </div>
    );
  }
  if (CURRENT_THEME === "popbrutal") {
    // Studio Pop Brutal : étiquette sticker tournée, contour dur.
    return (
      <div className="px-4 mb-3">
        <span className="inline-block px-2.5 py-1" style={{ background: T.accentSecondary, color: "#fff", fontFamily: F.marquee, fontSize: 12, fontWeight: 900, border: `${T.borderWidth}px solid ${T.line}`, boxShadow: T.shadow, transform: "rotate(-1deg)" }}>
          {children}
        </span>
      </div>
    );
  }
  if (CURRENT_THEME === "projectionniste") {
    // Le Projectionniste : petite capitale technique avec un losange
    // ambre en repère — esprit feuille de route de cabine.
    return (
      <div className="flex items-center gap-2 px-5 mb-2.5">
        <span style={{ color: T.accent, fontSize: 11 }}>◆</span>
        <span style={{ fontFamily: F.marquee, fontSize: 12, letterSpacing: 1.5, color: T.accent, fontWeight: 600 }}>{children}</span>
        <span style={{ height: 1, flex: 1, background: T.line }} />
      </div>
    );
  }
  if (CURRENT_THEME === "kansoHeritage") {
    // Kanso Héritage : capitale serif fine + filet doré, esprit rouleau
    // éditorial, en écho au lien "Tout voir" de la maquette.
    return (
      <div className="flex items-center justify-between px-4 mb-2.5">
        <span style={{ fontFamily: F.marquee, fontSize: 11, letterSpacing: 1.4, color: T.cream }}>{children}</span>
        {onMore && <button onClick={onMore} style={{ fontFamily: F.mono, fontSize: 9, color: T.gold }}>Tout voir</button>}
      </div>
    );
  }
      if (CURRENT_THEME === "nvague") {
    // Nouvelle Vague 74 : titre de rubrique façon grille suisse (numéro
    // retiré à la demande de Ben — répétitif et sans valeur ajoutée).
    return (
      <div className="flex items-center justify-between px-4 mb-2.5">
        <span style={{ fontFamily: F.marquee, fontSize: 15, letterSpacing: 0.5, color: T.cream, fontWeight: 400 }}>{children}</span>
        {onMore && (
          <button onClick={onMore} style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accentSecondary, fontWeight: 700 }}>TOUT VOIR →</button>
        )}
      </div>
    );
  }
  if (CURRENT_THEME === "ticket") {
    // Petite touche signature : la ligne qui suit le titre devient
    // pointillée, comme la ligne de déchirure d'un vrai ticket.
    return (
      <div className="flex items-center gap-2 px-4 mb-2">
        <Icon size={13} color={T.accent} style={{ flexShrink: 0 }} />
        <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 1.4, color: T.cream, fontWeight: 600, whiteSpace: "nowrap" }}>{children}</span>
        <span style={{ height: 0, flex: 1, borderTop: `1px dashed ${T.accent}88` }} />
      </div>
    );
  }
  if (CURRENT_THEME === "bleu") {
    // Petite touche signature : la ligne devient un dégradé bleu, esprit
    // interface sleek plutôt qu'un simple filet plat.
    return (
      <div className="flex items-center gap-2 px-4 mb-2">
        <Icon size={13} color={T.accent} style={{ flexShrink: 0 }} />
        <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 1.4, color: T.cream, fontWeight: 600, whiteSpace: "nowrap" }}>{children}</span>
        <span style={{ height: 2, flex: 1, background: `linear-gradient(90deg, ${T.accent}, transparent)`, borderRadius: 2 }} />
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
            {film.annee} · {(film.plateforme || "").toUpperCase()}{film.duree ? ` · ${film.duree}` : ""}
          </p>
          {rating != null && <p style={{ fontFamily: F.mono, fontSize: 10, color: T.accent, fontWeight: 600, marginTop: 3 }}>★ {rating.toFixed(1)}</p>}
          {film.synopsis && (
            <p className="mt-1.5" style={{ fontFamily: F.serif, fontSize: 10.5, color: T.muted, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{film.synopsis}</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
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
/* LE PROJECTIONNISTE — compte à rebours d'amorce 35mm affiché avant   */
/* chaque ouverture de fiche (si l'option est activée dans Réglages).  */
/* ------------------------------------------------------------------ */
function LeaderCountdown({ onDone }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    if (n <= 0) {
      const t = setTimeout(onDone, 120);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((v) => v - 1), 480);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: T.bg, zIndex: 200 }}>
      <div className="absolute inset-0" style={{
        opacity: 0.06, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, #fff 0.5px, transparent 0.6px)",
        backgroundSize: "3px 3px",
      }} />
      <div className="relative flex items-center justify-center" style={{ width: 170, height: 170, borderRadius: "50%", border: `2px solid ${T.accent}` }}>
        <div className="absolute" style={{ width: "100%", height: 1, background: T.accent, opacity: 0.5 }} />
        <div className="absolute" style={{ width: 1, height: "100%", background: T.accent, opacity: 0.5 }} />
        <span style={{ fontFamily: F.marquee, fontWeight: 700, fontSize: 60, color: T.cream, textShadow: `0 0 20px ${T.accent}88` }}>{n > 0 ? n : ""}</span>
      </div>
      <p className="mt-6" style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: 4, color: T.muted }}>
        {n > 1 ? "AMORCE — CHARGEMENT DE LA BOBINE" : "PROJECTION IMMINENTE"}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ECRAN ACCUEIL                                                       */
/* ------------------------------------------------------------------ */
// Accueil est démonté/remonté à chaque navigation (ouvrir une fiche, revenir
// en arrière), ce qui effacerait le filtre de durée et la suggestion tirée
// à chaque fois sans ce filet — même mécanisme que explorerFiltersState_
// pour l'écran Explorer.
let accueilDureeFiltre_ = null;
let accueilSuggestionId_ = null;

function AccueilScreen({ films, onOpen, onSearch, onMenu, onAdd, onNavigate, nbAccueil }) {
  if (CURRENT_THEME === "nvague") NVAGUE_SECTION_COUNTER.n = 0; // repart à 01 à chaque passage sur l'Accueil
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

  // "Ce soir on a X minutes" — filtre optionnel de durée pour la
  // suggestion, qui priorise en plus les films qui expirent bientôt parmi
  // ceux qui rentrent dans le créneau choisi (combine les deux forces de
  // l'appli : bibliothèque + urgence d'expiration). Initialisé depuis la
  // variable module-level pour survivre à l'aller-retour vers une fiche.
  const [dureeFiltre, setDureeFiltreState] = useState(accueilDureeFiltre_);
  const setDureeFiltre = (v) => { accueilDureeFiltre_ = v; setDureeFiltreState(v); };

  const buildSuggestionPool_ = (bucketId) => {
    const nonArchives = films.filter((f) => !isArchived(f));
    let eligibles = nonArchives.filter((f) => f.type === "Film");
    if (eligibles.length === 0) eligibles = nonArchives.length > 0 ? nonArchives : films;
    const bucket = DUREE_BUCKETS.find((b) => b.id === bucketId);
    if (bucket) {
      // Filtre strict : si rien ne correspond au créneau choisi, le pool
      // reste vide (pas de repli sur un autre film) — l'Accueil affiche
      // alors un message plutôt que de proposer une durée non demandée.
      eligibles = eligibles.filter((f) => {
        const mins = parseDureeMinutes(f.duree);
        return mins != null && mins >= bucket.min && mins <= bucket.max;
      });
    }
    return eligibles;
  };
  // Tire un film dans le pool en favorisant (sans jamais exclure) ceux qui
  // expirent bientôt — tirage pondéré plutôt que restreint à un sous-groupe
  // "urgent" : l'ancienne version limitait le tirage aux seuls films ayant
  // une date d'expiration connue, ce qui donnait l'impression de toujours
  // revoir les 3 mêmes titres dès que le pool filtré était petit (ex. les
  // films de moins de 60min, dont peu ont une date renseignée).
  const pickFromPool_ = (pool, exclude) => {
    if (pool.length === 0) return null;
    const candidates = exclude && pool.length > 1 ? pool.filter((f) => f.id !== exclude.id) : pool;
    if (candidates.length === 0) return pool[0];
    const weighted = [];
    candidates.forEach((f) => {
      const days = computeExpiryDays(f);
      const weight = days != null && days >= 0 ? 3 : 1; // urgent = 3x plus de chances, jamais 0
      for (let i = 0; i < weight; i++) weighted.push(f);
    });
    return weighted[Math.floor(Math.random() * weighted.length)];
  };

  // Suggestion elle-même mémorisée par id — évite qu'ouvrir une fiche puis
  // revenir en arrière retire un nouveau film au hasard (perturbant si on
  // voulait justement revenir à cette suggestion après avoir juste consulté
  // le détail d'un autre film depuis "Ça part bientôt" par exemple).
  const [suggestion, setSuggestionState] = useState(() => {
    const remembered = accueilSuggestionId_ ? films.find((f) => f.id === accueilSuggestionId_) : null;
    return remembered || pickFromPool_(buildSuggestionPool_(accueilDureeFiltre_), null);
  });
  const setSuggestion = (updater) => {
    setSuggestionState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      accueilSuggestionId_ = next ? next.id : null;
      return next;
    });
  };
  // Bouton "changer la suggestion" — retire un nouveau film dans le pool
  // courant (respecte le filtre de durée actif), en évitant si possible de
  // retomber sur le même.
  const reshuffleSuggestion = () => {
    setSuggestion((current) => pickFromPool_(buildSuggestionPool_(dureeFiltre), current));
  };
  const changeDureeFiltre = (bucketId) => {
    setDureeFiltre(bucketId);
    setSuggestion((current) => pickFromPool_(buildSuggestionPool_(bucketId), current));
  };

  const DUREE_FILTRE_OPTIONS = [{ id: null, label: "Tous", hint: null }, ...DUREE_BUCKETS.map((b) => ({ id: b.id, label: b.label, hint: b.hint }))];
  const [dureeMenuOpen, setDureeMenuOpen] = useState(false);
  const dureeActiveLabel = DUREE_FILTRE_OPTIONS.find((o) => o.id === dureeFiltre)?.label || "Tous";

  return (
    <div className="flex-1 overflow-y-auto pull-scroll pb-4 relative" style={CURRENT_THEME === "springfield" ? { background: "linear-gradient(180deg, #3F9BDB 0%, #6EC0EA 45%, #A9DCF2 100%)" } : undefined}>
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 pb-4" style={{ background: CURRENT_THEME === "springfield" ? "transparent" : T.bg, paddingTop: "max(16px, env(safe-area-inset-top))" }}>
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

      <div className="px-4 mb-3 flex items-center gap-2 relative" style={{ zIndex: 2 }}>
        <button
          onClick={onSearch}
          className="flex-1 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
          style={{ background: T.surface, border: `${T.borderWidth}px solid ${T.line}`, borderRadius: T.radius }}
        >
          <Search size={15} color={T.mutedDim} />
          <span style={{ fontFamily: F.serif, fontSize: 13.5, color: T.mutedDim }}>Titre, réalisateur, acteur…</span>
                  </button>
        {/* "Ce soir on a X minutes" — un seul bouton compact à côté de la   */}
        {/* recherche (au lieu d'une rangée de chips qui surchargeait        */}
        {/* l'Accueil) ; il ouvre un petit menu listant les créneaux avec    */}
        {/* leur durée indiquée. */}
        <button onClick={() => setDureeMenuOpen(true)} className="flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2.5"
          style={{ background: dureeFiltre ? T.accentSoft : T.surface, border: `${T.borderWidth}px solid ${dureeFiltre ? T.accent + "66" : T.line}`, borderRadius: T.radius }}>
          <Clock size={14} color={dureeFiltre ? T.accent : T.mutedDim} />
          <span style={{ fontFamily: F.mono, fontSize: 10, color: dureeFiltre ? T.accent : T.mutedDim, fontWeight: dureeFiltre ? 700 : 400, whiteSpace: "nowrap" }}>{dureeActiveLabel}</span>
        </button>
      </div>

      {dureeMenuOpen && (
        <div onClick={() => setDureeMenuOpen(false)} className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(10,8,6,0.75)" }}>
          <div onClick={(e) => e.stopPropagation()} className="rounded-t-2xl overflow-hidden" style={{ background: T.bg, border: `1px solid ${T.line}`, borderBottom: "none" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span style={{ fontFamily: F.marquee, fontSize: 20, color: T.cream, letterSpacing: 0.5 }}>CE SOIR, ON A</span>
              <button onClick={() => setDureeMenuOpen(false)}><X size={18} color={T.muted} /></button>
            </div>
            <div className="px-5 pb-6">
              {DUREE_FILTRE_OPTIONS.map((opt, i) => {
                const active = dureeFiltre === opt.id;
                return (
                  <button key={opt.label} onClick={() => { changeDureeFiltre(opt.id); setDureeMenuOpen(false); }}
                    className="w-full flex items-center justify-between py-3"
                    style={{ borderBottom: i < DUREE_FILTRE_OPTIONS.length - 1 ? `1px solid ${T.line}` : "none" }}>
                    <span style={{ fontFamily: F.serif, fontSize: 14, color: active ? T.accent : T.cream }}>
                      {opt.label}{opt.hint ? ` (${opt.hint})` : ""}
                    </span>
                    {active && <Check size={16} color={T.accent} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filtre durée strict : aucun film ne correspond au créneau choisi —  */}
      {/* affiché une seule fois ici (indépendant du thème actif) plutôt que  */}
      {/* de laisser chaque rendu par thème deviner un état vide différent.   */}
      {!suggestion && dureeFiltre && (
        <div className="px-4 mb-6">
          <div className="rounded-xl p-4 text-center" style={{ background: T.surfaceRaised, border: `1px solid ${T.line}` }}>
            <Clock size={18} color={T.mutedDim} style={{ margin: "0 auto 8px" }} />
            <p style={{ fontFamily: F.serif, fontSize: 13.5, color: T.cream }}>
              Pas de film disponible sur le temps choisi
            </p>
            <button onClick={() => changeDureeFiltre(null)} className="mt-2" style={{ fontFamily: F.mono, fontSize: 10, color: T.accent, fontWeight: 700 }}>
              VOIR TOUS LES FILMS
            </button>
          </div>
        </div>
      )}

      {/* Salle Privée : bandeau vedette pleine largeur en haut, façon */}
      {/* Netflix/Apple TV+, à la place du ticket classique en bas de page. */}
      {suggestion && CURRENT_THEME === "salle" && (
        <div className="px-4 mb-8 relative">
          <span className="block mb-2" style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accent, letterSpacing: 1.5, fontWeight: 600 }}>SUGGESTION DU SOIR</span>
          <button onClick={() => onOpen(suggestion)} className="relative w-full text-left rounded-2xl overflow-hidden block" style={{ height: 220 }}>
            <Poster film={suggestion} className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
            {/* Dégradé renforcé : la zone de texte doit rester lisible même sur */}
            {/* une affiche très claire (ex. fond blanc/brumeux). */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,17,24,0.97) 35%, rgba(20,17,24,0.55) 65%, transparent 100%)" }} />
            <div className="absolute left-5 right-5 bottom-5">
              <h2 style={{ fontFamily: F.marquee, fontSize: 26, color: T.cream, lineHeight: 1.05, textShadow: "0 2px 10px rgba(0,0,0,0.85)" }}>{suggestion.titre}</h2>
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
              {suggestion.synopsis && (
                <p className="mt-2" style={{ fontFamily: F.serif, fontSize: 11.5, color: T.cream, lineHeight: 1.5, textShadow: "0 1px 6px rgba(0,0,0,0.9)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{suggestion.synopsis}</p>
              )}
            </div>
          </button>
          <button onClick={reshuffleSuggestion} className="absolute flex items-center justify-center" style={{ top: 34, right: 28, width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.5)" }}>
            <RefreshCw size={12} color="#fff" />
          </button>
        </div>
      )}

      {/* Jardin d'Hiver : bandeau vedette en forme de galet, teinte pleine    */}
      {/* (pas de photo pleine largeur) — esprit carte postale posée.         */}
      {suggestion && CURRENT_THEME === "jardin" && (
        <div className="px-6 mb-8">
          <button onClick={() => onOpen(suggestion)} className="relative w-full text-left p-5 block overflow-hidden"
            style={{ borderRadius: "38% 62% 63% 37% / 41% 44% 56% 59%", minHeight: 210 }}>
            <Poster film={suggestion} className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
            {/* Dégradé concentré en bas — l'affiche reste visible en haut  */}
            {/* (comme "Derniers ajouts"), le texte garde un fond assez     */}
            {/* sombre pour rester lisible quelle que soit l'affiche.       */}
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${T.accent}33 0%, rgba(20,17,16,0.35) 45%, rgba(20,17,16,0.92) 100%)` }} />
            <div className="relative" style={{ marginTop: 60 }}>
              <span style={{ fontFamily: F.mono, fontSize: 9.5, color: "#fff", letterSpacing: 1, fontWeight: 700, textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>CE SOIR, ON REGARDE</span>
              <p className="mt-2" style={{ fontFamily: F.serif, fontSize: 26, color: "#fff", fontStyle: "italic", lineHeight: 1.1, textShadow: "0 2px 10px rgba(0,0,0,0.85)" }}>{suggestion.titre}</p>
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
                {suggestion.duree && (
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: "#fff", opacity: 0.85 }}>{suggestion.duree}</span>
                )}
              </div>
              {suggestion.synopsis && (
                <p className="mt-2.5" style={{ fontFamily: F.serif, fontSize: 11, color: "#fff", fontStyle: "italic", lineHeight: 1.5, opacity: 0.95, textShadow: "0 1px 6px rgba(0,0,0,0.9)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{suggestion.synopsis}</p>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Bulle BD : la suggestion devient une grande bulle de dialogue qui  */}
      {/* "sort" du cadre avec sa pointe — au lieu du ticket classique.      */}
      {suggestion && CURRENT_THEME === "bd" && (
        <>
          <div className="relative">
            <SectionTitle icon={Shuffle}>SUGGESTION DU SOIR</SectionTitle>
            <button onClick={reshuffleSuggestion} className="absolute flex items-center justify-center" style={{ right: 16, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: T.surfaceRaised }}>
              <RefreshCw size={11} color={T.muted} />
            </button>
          </div>
          <div className="mx-4 mb-8" style={{ position: "relative" }}>
            <button onClick={() => onOpen(suggestion)} className="w-full flex gap-3 text-left p-3.5" style={{ background: T.surface, border: `${T.borderWidth}px solid ${T.cream}`, borderRadius: 20, boxShadow: T.shadow }}>
              <Poster film={suggestion} className="flex-shrink-0" style={{ width: 66, height: 92, border: `${T.borderWidth}px solid ${T.cream}`, borderRadius: 4 }} />
              <div className="min-w-0">
                <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 15, color: T.cream }}>{suggestion.titre}</p>
                <p style={{ fontFamily: F.mono, fontSize: 8.5, color: T.mutedDim, marginTop: 3 }}>
                  {suggestion.duree ? suggestion.duree : ""}{suggestion.plateforme ? ` · ${suggestion.plateforme}` : ""}
                  {parseRating(suggestion.noteLetterboxd) != null ? ` · ★ ${parseRating(suggestion.noteLetterboxd).toFixed(1)}` : ""}
                </p>
                {suggestion.synopsis && (
                  <p className="mt-1.5" style={{ fontFamily: F.serif, fontSize: 10, color: T.muted, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{suggestion.synopsis}</p>
                )}
              </div>
            </button>
            <div className="absolute" style={{ left: 36, bottom: -14, width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: `16px solid ${T.cream}` }} />
            <div className="absolute" style={{ left: 29, bottom: -7.5, width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: `13px solid ${T.surface}` }} />
          </div>
        </>
      )}

      {bientot.length > 0 && CURRENT_THEME === "bd" && (
        <>
          <SectionTitle icon={Clock} onMore={() => onNavigate({ name: "alertes", params: { mode: "manuel" } })}>ÇA PART BIENTÔT !</SectionTitle>
          <div className="mx-4 mb-6 overflow-x-auto" style={{ background: T.surface, border: `${T.borderWidth}px solid ${T.cream}`, borderRadius: T.radiusSm, boxShadow: T.shadow, padding: 12 }}>
            <div className="flex gap-3.5">
              {bientot.map((f) => {
                const days = computeExpiryDays(f);
                return (
                  <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left" style={{ width: 108 }}>
                    <div className="relative overflow-hidden" style={{ height: 152, border: `${T.borderWidth}px solid ${T.cream}`, borderRadius: 3 }}>
                      <Poster film={f} className="w-full h-full" style={{ objectFit: "cover" }} />
                      {days != null && (
                        <span className="absolute flex items-center justify-center" style={{
                          top: -14, right: -14, width: 44, height: 44, background: T.accent, color: "#fff",
                          fontFamily: F.marquee, fontSize: 12, transform: "rotate(-12deg)", zIndex: 3,
                          clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                        }}>{`J-${days}`}</span>
                      )}
                    </div>
                    <p className="truncate mt-1.5" style={{ fontFamily: F.marquee, fontSize: 10, color: T.cream }}>{f.titre}</p>
                    <p style={{ fontFamily: F.mono, fontSize: 8, color: T.mutedDim, marginTop: 1 }}>
                      {f.plateforme}{f.duree ? ` · ${f.duree}` : ""}
                      {parseRating(f.noteLetterboxd) != null && (
                        <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</span></>
                      )}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Table lumineuse : suggestion sur écran lumineux, filet rouge —     */}
      {/* positionnée avant "Ça part bientôt" (ordre Suggestion → Bientôt →  */}
      {/* Ajouts).                                                           */}
      {suggestion && CURRENT_THEME === "table" && (
        <>
          <div className="relative">
            <SectionTitle icon={Shuffle}>SUGGESTION DU SOIR</SectionTitle>
            <button onClick={reshuffleSuggestion} className="absolute flex items-center justify-center" style={{ right: 16, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: T.surfaceRaised }}>
              <RefreshCw size={11} color={T.muted} />
            </button>
          </div>
          <div className="mx-4 mb-6 flex gap-3 p-3" style={{ background: T.surface, border: `2px solid ${T.accent}` }}>
            <Poster film={suggestion} className="flex-shrink-0" style={{ width: 60, height: 84, objectFit: "cover" }} />
            <div className="min-w-0">
              <p className="truncate" style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 15, color: T.cream }}>{suggestion.titre}</p>
              <p style={{ fontFamily: F.mono, fontSize: 9, color: T.mutedDim, marginTop: 3 }}>
                {suggestion.annee}{suggestion.duree ? ` · ${suggestion.duree}` : ""}{suggestion.plateforme ? ` · ${suggestion.plateforme}` : ""}
                {parseRating(suggestion.noteLetterboxd) != null && (
                  <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(suggestion.noteLetterboxd).toFixed(1)}</span></>
                )}
              </p>
              {suggestion.synopsis && (
                <p className="mt-1.5" style={{ fontFamily: F.serif, fontSize: 10, color: T.muted, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{suggestion.synopsis}</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Table lumineuse : bande de pellicule négative, esprit visionneuse  */}
      {/* de table lumineuse — filet rouge, perforations fines.              */}
      {/* Table lumineuse : même style de carte que "Derniers ajouts" (via  */}
      {/* MiniCard) — plus de bandeau noir ni de overflow-hidden qui        */}
      {/* rognait les perforations en pointillé de la pellicule.            */}
      {bientot.length > 0 && CURRENT_THEME === "table" && (
        <>
          <SectionTitle icon={Clock} onMore={() => onNavigate({ name: "alertes", params: { mode: "manuel" } })}>ÇA PART BIENTÔT</SectionTitle>
          <div className="flex gap-3 px-4 overflow-x-auto mb-5" style={{ paddingTop: 6, paddingBottom: 6 }}>
            {bientot.map((f) => (
              <MiniCard key={f.id} film={f} onOpen={onOpen}
                sub={parseRating(f.noteLetterboxd) != null ? `★ ${parseRating(f.noteLetterboxd).toFixed(1)}` : "pas de note"} showStamp />
            ))}
          </div>
        </>
      )}

      {/* Letterboxd : cartes sombres, note en étoiles vertes, esprit        */}
      {/* application communautaire de cinéphiles. Ordre Suggestion →        */}
      {/* Bientôt → Ajouts, regroupé ici pour le contrôler.                  */}
      {suggestion && CURRENT_THEME === "letterboxd" && (
        <>
          <div className="relative">
            <SectionTitle icon={Shuffle}>SUGGESTION DU SOIR</SectionTitle>
            <button onClick={reshuffleSuggestion} className="absolute flex items-center justify-center" style={{ right: 16, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: T.surfaceRaised }}>
              <RefreshCw size={11} color={T.muted} />
            </button>
          </div>
          <div className="mx-4 mb-6 flex gap-3 p-3" style={{ background: T.surface, borderRadius: T.radiusSm }}>
            <Poster film={suggestion} className="flex-shrink-0" style={{ width: 64, height: 90, borderRadius: 4 }} />
            <div className="min-w-0">
              <p className="truncate" style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 14, color: T.cream }}>{suggestion.titre}</p>
              <p style={{ fontFamily: F.mono, fontSize: 9, color: T.mutedDim, marginTop: 3 }}>
                {suggestion.annee}{suggestion.duree ? ` · ${suggestion.duree}` : ""}{suggestion.plateforme ? ` · ${suggestion.plateforme}` : ""}
                {parseRating(suggestion.noteLetterboxd) != null && (
                  <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(suggestion.noteLetterboxd).toFixed(1)}</span></>
                )}
              </p>
              {suggestion.synopsis && (
                <p className="mt-1.5" style={{ fontFamily: F.serif, fontSize: 10, color: T.muted, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{suggestion.synopsis}</p>
              )}
            </div>
          </div>
        </>
      )}

      {bientot.length > 0 && CURRENT_THEME === "letterboxd" && (
        <>
          <SectionTitle icon={Clock} onMore={() => onNavigate({ name: "alertes", params: { mode: "manuel" } })}>ÇA PART BIENTÔT</SectionTitle>
          <div className="flex gap-3 px-4 overflow-x-auto mb-6">
            {bientot.map((f) => {
              const days = computeExpiryDays(f);
              const rating = parseRating(f.noteLetterboxd);
              return (
                <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left" style={{ width: 100 }}>
                  <div className="relative overflow-hidden" style={{ height: 140, borderRadius: T.radiusSm }}>
                    <Poster film={f} className="w-full h-full" style={{ objectFit: "cover" }} />
                    {days != null && <span className="absolute" style={{ top: 4, right: 4, background: T.alert, color: "#fff", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>J-{days}</span>}
                  </div>
                  <p className="truncate mt-1.5" style={{ fontFamily: F.serif, fontSize: 10, fontWeight: 600, color: T.cream }}>{f.titre}</p>
                  {rating != null && (
                    <p style={{ color: T.accent, fontSize: 9, marginTop: 1, fontFamily: F.mono, fontWeight: 700 }}>★ {rating.toFixed(1)}</p>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {derniers.length > 0 && CURRENT_THEME === "letterboxd" && (
        <>
          <SectionTitle icon={Film} onMore={() => onNavigate({ name: "biblio", params: { type: "Film" } })}>DERNIERS AJOUTS</SectionTitle>
          <div className="flex gap-3 px-4 overflow-x-auto mb-6">
            {derniers.map((f) => {
              const rating = parseRating(f.noteLetterboxd);
              return (
                <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left" style={{ width: 100 }}>
                  <div className="relative overflow-hidden" style={{ height: 140, borderRadius: T.radiusSm }}>
                    <Poster film={f} className="w-full h-full" style={{ objectFit: "cover" }} />
                  </div>
                  <p className="truncate mt-1.5" style={{ fontFamily: F.serif, fontSize: 10, fontWeight: 600, color: T.cream }}>{f.titre}</p>
                  {rating != null && (
                    <p style={{ color: T.accent, fontSize: 9, marginTop: 1, fontFamily: F.mono, fontWeight: 700 }}>★ {rating.toFixed(1)}</p>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}



      {/* Pop Art : cadres colorés flashy (rose/cyan/jaune/violet en rotation) */}
      {/* autour des vraies affiches — texte du titre volontairement sobre.    */}
      {/* Pop Art : ordre spécifique — Suggestion, puis Ça part bientôt,    */}
      {/* puis Derniers ajouts — regroupés ici en un seul bloc pour          */}
      {/* contrôler l'ordre (les 3 zones sont normalement à 3 endroits       */}
      {/* distincts du fichier, partagés avec les autres thèmes).            */}
      {/* Springfield : ciel + nuages en grappes (cercles superposés,       */}
      {/* comme le générique) uniquement sur l'Accueil — la Fiche reste sur */}
      {/* le jaune uni (T.bg). Suggestion → Bientôt → Ajouts.               */}
      {CURRENT_THEME === "springfield" && (
        <>
          {[
            [-30, 55, 0.9], [190, 40, 0.7], [-40, 145, 0.6], [210, 160, 0.85],
            [60, 230, 0.5], [-20, 520, 0.65], [200, 560, 0.55], [40, 780, 0.6], [-30, 980, 0.5],
          ].map(([x, y, s], i) => (
            <div key={i} className="absolute" style={{ left: x, top: y, zIndex: 0 }}>
              <div className="absolute" style={{ background: "#fff", borderRadius: 50, width: 130 * s, height: 38 * s, left: 0, top: 26 * s }} />
              <div className="absolute rounded-full" style={{ background: "#fff", width: 55 * s, height: 55 * s, left: 5 * s, top: 0 }} />
              <div className="absolute rounded-full" style={{ background: "#fff", width: 75 * s, height: 75 * s, left: 35 * s, top: -14 * s }} />
              <div className="absolute rounded-full" style={{ background: "#fff", width: 58 * s, height: 58 * s, left: 82 * s, top: 2 * s }} />
              <div className="absolute rounded-full" style={{ background: "#fff", width: 40 * s, height: 40 * s, left: 105 * s, top: 14 * s }} />
            </div>
          ))}

          {/* Tout le vrai contenu est regroupé dans UN SEUL conteneur       */}
          {/* positionné + z-index élevé, pour être garanti au-dessus des    */}
          {/* nuages quel que soit l'élément (un simple <div> non positionné */}
          {/* passe toujours SOUS un élément positionné, même placé avant    */}
          {/* dans le code — c'était le bug des nuages qui mangeaient les    */}
          {/* affiches et le texte).                                        */}
          <div className="relative" style={{ zIndex: 2 }}>

          {suggestion && (
            <>
              <div className="relative px-4 mb-2">
                <SpringfieldTitle>SUGGESTION DU SOIR</SpringfieldTitle>
                <button onClick={reshuffleSuggestion} className="absolute flex items-center justify-center" style={{ right: 16, top: "50%", transform: "translateY(-50%)", width: 26, height: 26, borderRadius: "50%", background: "#fff", border: `2px solid ${T.accentSecondary}` }}>
                  <RefreshCw size={12} color={T.accentSecondary} />
                </button>
              </div>
              <div className="px-4 mb-6">
                <button onClick={() => onOpen(suggestion)} className="w-full flex gap-3 text-left p-2.5" style={{ background: "#fff", border: `2px solid ${T.accentSecondary}`, borderRadius: T.radius }}>
                  <Poster film={suggestion} className="flex-shrink-0" style={{ width: 70, height: 96, borderRadius: 6, objectFit: "cover" }} />
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="truncate" style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 14, color: "#1c3350" }}>{suggestion.titre}</p>
                    <p style={{ fontFamily: F.mono, fontSize: 9.5, color: "#1c3350", fontWeight: 700, marginTop: 3 }}>
                      {suggestion.plateforme}{suggestion.duree ? ` · ${suggestion.duree}` : ""}
                      {parseRating(suggestion.noteLetterboxd) != null && (
                        <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(suggestion.noteLetterboxd).toFixed(1)}</span></>
                      )}
                    </p>
                    {suggestion.synopsis && (
                      <p className="mt-1" style={{ fontFamily: F.serif, fontSize: 9.5, color: "#3f6485", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{suggestion.synopsis}</p>
                    )}
                  </div>
                </button>
              </div>
            </>
          )}

          {bientot.length > 0 && (
            <>
              <div className="relative px-4 mb-2.5">
                <SpringfieldTitle>ÇA PART BIENTÔT</SpringfieldTitle>
              </div>
              <div className="relative flex gap-3 px-4 overflow-x-auto mb-6">
                {bientot.map((f) => {
                  const days = computeExpiryDays(f);
                  return (
                    <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left" style={{ width: 100 }}>
                      <div className="relative overflow-hidden" style={{ height: 132, borderRadius: 8, background: "#fff", border: `2px solid ${T.accentSecondary}` }}>
                        <Poster film={f} className="w-full h-full" style={{ objectFit: "cover" }} />
                        {days != null && <span className="absolute top-1.5 left-1.5" style={{ background: T.accent, color: "#fff", fontFamily: F.serif, fontWeight: 800, fontSize: 8, padding: "2px 6px", borderRadius: 4, border: "1.5px solid #1A1400" }}>J-{days}</span>}
                      </div>
                      <p className="truncate mt-1.5" style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 11, color: "#1c3350" }}>{f.titre}</p>
                      <p style={{ fontFamily: F.mono, fontSize: 8.5, color: "#1c3350", fontWeight: 700, marginTop: 2 }}>
                        {f.plateforme}{f.duree ? ` · ${f.duree}` : ""}
                        {parseRating(f.noteLetterboxd) != null && (
                          <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</span></>
                        )}
                      </p>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {derniers.length > 0 && (
            <>
              <div className="relative px-4 mb-2.5">
                <SpringfieldTitle>DERNIERS AJOUTS</SpringfieldTitle>
              </div>
              <div className="relative flex gap-3 px-4 overflow-x-auto mb-6">
                {derniers.map((f) => (
                  <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left" style={{ width: 100 }}>
                    <div className="overflow-hidden" style={{ height: 132, borderRadius: 8, background: "#fff", border: `2px solid ${T.accentSecondary}` }}>
                      <Poster film={f} className="w-full h-full" style={{ objectFit: "cover" }} />
                    </div>
                    <p className="truncate mt-1.5" style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 11, color: "#1c3350" }}>{f.titre}</p>
                    <p style={{ fontFamily: F.mono, fontSize: 8.5, color: "#1c3350", fontWeight: 700, marginTop: 2 }}>
                      {f.plateforme}{f.duree ? ` · ${f.duree}` : ""}
                      {parseRating(f.noteLetterboxd) != null && (
                        <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</span></>
                      )}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}

          </div>
        </>
      )}

      {/* Ça Cartoon : bandeau Memphis (blocs de couleur superposés) au-     */}
      {/* dessus de la suggestion, cartes à bordure cyclique rouge/bleu/    */}
      {/* jaune/vert pour "Ça part bientôt" et "Derniers ajouts" — pastille */}
      {/* de couleur dans SectionTitle au lieu du texte multicolore.        */}
      {CURRENT_THEME === "cacartoon" && (
        <>
          {suggestion && (
            <div className="px-4 mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <span className="inline-flex items-center gap-2">
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: T.accent, flexShrink: 0 }} />
                  <span style={{ fontFamily: F.marquee, fontSize: 15, color: T.gold }}>SUGGESTION DU SOIR</span>
                </span>
                <button onClick={reshuffleSuggestion} className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: T.surfaceRaised }}>
                  <RefreshCw size={11} color={T.gold} />
                  <span style={{ fontFamily: F.mono, fontSize: 9, color: T.gold, fontWeight: 700 }}>REJOUER</span>
                </button>
              </div>
              <div className="relative overflow-hidden mb-2.5" style={{ height: 60, borderRadius: T.radiusSm }}>
                <div className="absolute" style={{ background: T.accent, width: "55%", height: "70%", top: "-15%", left: "-6%", transform: "rotate(-3deg)", opacity: 0.9 }} />
                <div className="absolute" style={{ background: T.accentSecondary, width: "45%", height: "65%", top: "-8%", right: "-6%", transform: "rotate(4deg)", opacity: 0.9 }} />
                <div className="absolute" style={{ background: T.gold, width: "35%", height: "50%", bottom: "-12%", left: "12%", transform: "rotate(-6deg)", opacity: 0.9 }} />
                <div className="absolute" style={{ background: T.accentTertiary, width: "30%", height: "45%", bottom: "-10%", right: "8%", transform: "rotate(5deg)", opacity: 0.9 }} />
              </div>
              <button onClick={() => onOpen(suggestion)} className="relative w-full text-left overflow-hidden" style={{ background: T.surface, border: `${T.borderWidth}px solid ${T.accent}`, borderRadius: T.radius }}>
                <div style={{ height: 6, background: `linear-gradient(90deg, ${T.accent}, ${T.gold}, ${T.accentSecondary}, ${T.accentTertiary})` }} />
                <div className="flex gap-3 p-3" style={{ minHeight: 92 }}>
                  <Poster film={suggestion} className="flex-shrink-0" style={{ width: 66, height: 92, borderRadius: 6, objectFit: "cover" }} />
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 17, color: T.cream }}>{suggestion.titre}</p>
                    <p style={{ fontFamily: F.mono, fontSize: 9, color: T.muted, marginTop: 4 }}>
                      {suggestion.plateforme}{suggestion.duree ? ` · ${suggestion.duree}` : ""}
                      {parseRating(suggestion.noteLetterboxd) != null && (
                        <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(suggestion.noteLetterboxd).toFixed(1)}</span></>
                      )}
                    </p>
                    {/* Hauteur fixe (2 lignes réservées, même vides) — sans   */}
                    {/* ça, un synopsis d'une seule ligne (ou absent) réduit   */}
                    {/* la hauteur de la carte et fait varier l'écart avec le  */}
                    {/* menu suivant d'une suggestion à l'autre.               */}
                    <p className="mt-1.5" style={{ fontFamily: F.serif, fontSize: 10, color: T.muted, lineHeight: 1.4, height: 28, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{suggestion.synopsis || ""}</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {bientot.length > 0 && (
            <>
              <SectionTitle icon={Clock} onMore={() => onNavigate({ name: "alertes", params: { mode: "manuel" } })}>ÇA PART BIENTÔT</SectionTitle>
              <div className="flex gap-3.5 px-4 overflow-x-auto mb-6">
                {bientot.map((f, i) => {
                  const days = computeExpiryDays(f);
                  const frameColors = [T.accent, T.accentSecondary, T.gold, T.accentTertiary];
                  const frameColor = frameColors[i % frameColors.length];
                  return (
                    <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left overflow-hidden" style={{ width: 108, background: T.surface, border: `${T.borderWidth}px solid ${frameColor}`, borderRadius: T.radius }}>
                      <div className="relative">
                        <Poster film={f} className="w-full" style={{ height: 152, objectFit: "cover" }} />
                        {days != null && <span className="absolute" style={{ top: 4, right: 4, background: frameColor, color: "#fff", fontFamily: F.marquee, fontSize: 11, padding: "1px 6px", borderRadius: 999 }}>J-{days}</span>}
                      </div>
                      <div className="p-2">
                        <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 12, color: T.cream }}>{f.titre}</p>
                        <p style={{ fontFamily: F.mono, fontSize: 8, color: T.muted, marginTop: 1 }}>
                          {f.plateforme}{f.duree ? ` · ${f.duree}` : ""}
                          {parseRating(f.noteLetterboxd) != null && (
                            <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</span></>
                          )}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {derniers.length > 0 && (
            <>
              <SectionTitle icon={Film} onMore={() => onNavigate({ name: "biblio", params: { type: "Film" } })}>DERNIERS AJOUTS</SectionTitle>
              <div className="flex gap-3.5 px-4 overflow-x-auto mb-6">
                {derniers.map((f, i) => {
                  const frameColors = [T.accentSecondary, T.gold, T.accentTertiary, T.accent];
                  const frameColor = frameColors[i % frameColors.length];
                  return (
                    <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left overflow-hidden" style={{ width: 108, background: T.surface, border: `${T.borderWidth}px solid ${frameColor}`, borderRadius: T.radius }}>
                      <Poster film={f} className="w-full" style={{ height: 152, objectFit: "cover" }} />
                      <div className="p-2">
                        <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 12, color: T.cream }}>{f.titre}</p>
                        <p style={{ fontFamily: F.mono, fontSize: 8, color: T.muted, marginTop: 1 }}>
                          {f.plateforme}{f.duree ? ` · ${f.duree}` : ""}
                          {parseRating(f.noteLetterboxd) != null && (
                            <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</span></>
                          )}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {CURRENT_THEME === "canalplus" && (
        <>
          {suggestion && (
            <>
              <p className="mx-4 mb-2" style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, letterSpacing: 2, color: T.muted, textTransform: "uppercase" }}>Suggestion du soir</p>
              <div className="relative mx-4 mb-1 overflow-hidden" style={{ height: 220, borderRadius: T.radiusSm }}>
                <Poster film={suggestion} className="w-full h-full" style={{ objectFit: "cover" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.85) 8%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.1) 100%)" }} />
                <button onClick={() => onOpen(suggestion)} className="absolute left-0 right-0 bottom-0 text-left p-4">
                  <p style={{ fontFamily: F.marquee, fontSize: 24, color: "#fff", lineHeight: 1.02, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>{suggestion.titre}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span style={{ fontFamily: F.serif, fontWeight: 600, fontStyle: "italic", fontSize: 10.5, color: "#eee", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                      {suggestion.plateforme || ""}{suggestion.duree ? ` · ${suggestion.duree}` : ""}
                    </span>
                    {parseRating(suggestion.noteLetterboxd) != null && (
                      <span className="flex items-center gap-1" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                        <Star size={10} color="#fff" fill="#fff" />
                        <span style={{ fontFamily: F.mono, fontSize: 10, color: "#fff", fontWeight: 700 }}>{parseRating(suggestion.noteLetterboxd).toFixed(1)}</span>
                      </span>
                    )}
                  </div>
                  {suggestion.synopsis && (
                    <p style={{ fontFamily: F.serif, fontSize: 10.5, color: "#eee", lineHeight: 1.4, marginTop: 6, textShadow: "0 1px 4px rgba(0,0,0,0.8)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{suggestion.synopsis}</p>
                  )}
                </button>
                <button onClick={reshuffleSuggestion} className="absolute flex items-center justify-center" style={{ top: 12, right: 12, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.5)" }}>
                  <RefreshCw size={13} color="#fff" />
                </button>
              </div>
              <div className="mb-6" />
            </>
          )}

          {bientot.length > 0 && (
            <>
              <SectionTitle icon={Clock} onMore={() => onNavigate({ name: "alertes", params: { mode: "manuel" } })}>ÇA PART BIENTÔT</SectionTitle>
              <div className="flex gap-3 px-4 overflow-x-auto mb-6">
                {bientot.map((f) => {
                  const days = computeExpiryDays(f);
                  // Rouge de plus en plus saturé/opaque quand l'échéance approche.
                  const urgent = days != null && days <= 2;
                  return (
                    <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left" style={{ width: 108 }}>
                      <div className="relative overflow-hidden" style={{ height: 152, borderRadius: 8 }}>
                        <Poster film={f} className="w-full h-full" style={{ objectFit: "cover" }} />
                        {days != null && (
                          <span className="absolute top-1.5 left-1.5" style={{ background: urgent ? T.accent : "rgba(0,0,0,0.6)", border: urgent ? "none" : `1px solid ${T.accent}`, color: "#fff", fontFamily: F.serif, fontWeight: 800, fontSize: 8, padding: "2px 6px", borderRadius: 4 }}>J-{days}</span>
                        )}
                      </div>
                      <p className="truncate mt-1.5" style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 11, color: T.cream }}>{f.titre}</p>
                      <p style={{ fontFamily: F.mono, fontSize: 8.5, color: T.muted, marginTop: 2 }}>
                        {f.plateforme}{f.duree ? ` · ${f.duree}` : ""}
                        {parseRating(f.noteLetterboxd) != null && (
                          <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</span></>
                        )}
                      </p>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {derniers.length > 0 && (
            <>
              <SectionTitle icon={Film} onMore={() => onNavigate({ name: "biblio", params: { type: "Film" } })}>DERNIERS AJOUTS</SectionTitle>
              <div className="flex gap-3 px-4 overflow-x-auto mb-6">
                {derniers.map((f) => (
                  <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left" style={{ width: 108 }}>
                    <Poster film={f} className="w-full" style={{ height: 152, borderRadius: 8, objectFit: "cover" }} />
                    <p className="truncate mt-1.5" style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 11, color: T.cream }}>{f.titre}</p>
                    <p style={{ fontFamily: F.mono, fontSize: 8.5, color: T.muted, marginTop: 2 }}>
                      {f.plateforme}{f.duree ? ` · ${f.duree}` : ""}
                      {parseRating(f.noteLetterboxd) != null && (
                        <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</span></>
                      )}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {CURRENT_THEME === "popart" && (
        <>
          {suggestion && (
            <>
              <div className="relative">
            <SectionTitle icon={Shuffle}>SUGGESTION DU SOIR</SectionTitle>
            <button onClick={reshuffleSuggestion} className="absolute flex items-center justify-center" style={{ right: 16, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: T.surfaceRaised }}>
              <RefreshCw size={11} color={T.muted} />
            </button>
          </div>
              <div className="mx-4 mb-6">
                <button onClick={() => onOpen(suggestion)} className="w-full flex gap-3 text-left p-3" style={{ background: T.surface, border: `${T.borderWidth}px solid ${T.accentTertiary}`, borderRadius: T.radius }}>
                  <Poster film={suggestion} className="flex-shrink-0" style={{ width: 64, height: 88, objectFit: "cover" }} />
                  <div className="min-w-0">
                    <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 15, color: T.cream }}>{suggestion.titre}</p>
                    <p style={{ fontFamily: F.mono, fontSize: 9, color: T.muted, marginTop: 4 }}>
                      {suggestion.annee}{suggestion.duree ? ` · ${suggestion.duree}` : ""}{suggestion.plateforme ? ` · ${suggestion.plateforme}` : ""}
                      {parseRating(suggestion.noteLetterboxd) != null ? ` · ★ ${parseRating(suggestion.noteLetterboxd).toFixed(1)}` : ""}
                    </p>
                    {suggestion.synopsis && (
                      <p className="mt-1.5" style={{ fontFamily: F.serif, fontSize: 10, color: T.muted, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{suggestion.synopsis}</p>
                    )}
                  </div>
                </button>
              </div>
            </>
          )}

          {bientot.length > 0 && (
            <>
              <SectionTitle icon={Clock} onMore={() => onNavigate({ name: "alertes", params: { mode: "manuel" } })}>ÇA PART BIENTÔT</SectionTitle>
              <div className="flex gap-3.5 px-4 overflow-x-auto mb-6">
                {bientot.map((f, i) => {
                  const days = computeExpiryDays(f);
                  const frameColors = [T.accent, T.accentSecondary, T.gold, T.accentTertiary];
                  const frameColor = frameColors[i % frameColors.length];
                  return (
                    <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left overflow-hidden" style={{ width: 108, background: T.surface, border: `${T.borderWidth}px solid ${frameColor}`, borderRadius: T.radius }}>
                      <div className="relative">
                        <Poster film={f} className="w-full" style={{ height: 152, objectFit: "cover" }} />
                        {days != null && <span className="absolute" style={{ top: 4, right: 4, background: frameColor, color: "#000", fontFamily: F.mono, fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 2 }}>J-{days}</span>}
                      </div>
                      <div className="p-2">
                        <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 10, color: T.cream }}>{f.titre}</p>
                        <p style={{ fontFamily: F.mono, fontSize: 7.5, color: T.muted, marginTop: 1 }}>
                          {f.plateforme}{f.duree ? ` · ${f.duree}` : ""}
                          {parseRating(f.noteLetterboxd) != null && (
                            <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</span></>
                          )}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {derniers.length > 0 && (
            <>
              <SectionTitle icon={Film} onMore={() => onNavigate({ name: "biblio", params: { type: "Film" } })}>DERNIERS AJOUTS</SectionTitle>
              <div className="flex gap-3.5 px-4 overflow-x-auto mb-6">
                {derniers.map((f, i) => {
                  const frameColors = [T.accentSecondary, T.gold, T.accentTertiary, T.accent];
                  const frameColor = frameColors[i % frameColors.length];
                  return (
                    <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left overflow-hidden" style={{ width: 108, background: T.surface, border: `${T.borderWidth}px solid ${frameColor}`, borderRadius: T.radius }}>
                      <Poster film={f} className="w-full" style={{ height: 152, objectFit: "cover" }} />
                      <div className="p-2">
                        <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 10, color: T.cream }}>{f.titre}</p>
                        <p style={{ fontFamily: F.mono, fontSize: 7.5, color: T.muted, marginTop: 1 }}>
                          {f.plateforme}{f.duree ? ` · ${f.duree}` : ""}
                          {parseRating(f.noteLetterboxd) != null && (
                            <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</span></>
                          )}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Ticket de cinéma & Bleu moderne : ordre dédié Suggestion → Bientôt */}
      {/* → Ajouts (même rendu MiniCard que la version générique).           */}
      {(CURRENT_THEME === "ticket" || CURRENT_THEME === "bleu") && (
        <>
          {suggestion && (
            <div className="relative">
              <SectionTitle icon={Shuffle}>SUGGESTION DU SOIR</SectionTitle>
              <button onClick={reshuffleSuggestion} className="absolute flex items-center justify-center" style={{ right: 16, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: T.surfaceRaised }}>
                <RefreshCw size={11} color={T.muted} />
              </button>
            </div>
          )}
          {suggestion && (
            <div className="px-4 mb-6">
              <TicketCard film={suggestion} onOpen={onOpen} />
            </div>
          )}
          {bientot.length > 0 && (
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
          {derniers.length > 0 && (
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
        </>
      )}

      {bientot.length > 0 && CURRENT_THEME !== "bento" && CURRENT_THEME !== "palais" && CURRENT_THEME !== "nvague" && CURRENT_THEME !== "kansoHeritage" && CURRENT_THEME !== "popbrutal" && CURRENT_THEME !== "projectionniste" && CURRENT_THEME !== "bd" && CURRENT_THEME !== "table" && CURRENT_THEME !== "affiche" && CURRENT_THEME !== "letterboxd" && CURRENT_THEME !== "popart" && CURRENT_THEME !== "ticket" && CURRENT_THEME !== "bleu" && CURRENT_THEME !== "canalplus" && CURRENT_THEME !== "springfield" && CURRENT_THEME !== "cacartoon" && (
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

      {/* étiquette encadrée en pointillés (option A validée).              */}
      {/* voir plus haut) — remplace les anciens boîtiers plats.             */}
      {/* console lumineuse ambre — même esprit que le rail plus bas.       */}
      {/* Placée avant "Ça part bientôt" (ordre Suggestion → Bientôt →      */}
      {/* Ajouts).                                                          */}

      {/* Nouvelle Vague 74 : bandeau rouge alerte + rail encadré filet noir, */}
      {/* esprit une de revue avec chapeau éditorial.                       */}
      {/* Nouvelle Vague 74 : encart éditorial, filet rouge en marge, typo   */}
      {/* Source Serif — esprit critique de revue. Placé avant "Ça part     */}
      {/* bientôt" (ordre Suggestion → Bientôt → Ajouts).                   */}
      {suggestion && CURRENT_THEME === "nvague" && (
        <>
          <div className="relative">
            <SectionTitle icon={Shuffle}>SUGGESTION DU SOIR</SectionTitle>
            <button onClick={reshuffleSuggestion} className="absolute flex items-center justify-center" style={{ right: 16, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: T.surfaceRaised }}>
              <RefreshCw size={11} color={T.muted} />
            </button>
          </div>
          <div className="px-4 mb-6">
            <button onClick={() => onOpen(suggestion)} className="w-full flex gap-3 text-left p-1" style={{ borderLeft: `3px solid ${T.accent}` }}>
              <Poster film={suggestion} className="flex-shrink-0" style={{ width: 64, height: 90 }} />
              <div className="pl-2 pt-1">
                <span style={{ fontFamily: F.mono, fontSize: 8.5, color: T.accent, fontWeight: 700, letterSpacing: 0.5 }}>SUGGESTION DU SOIR</span>
                <p className="mt-1" style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 700, color: T.cream, lineHeight: 1.15 }}>{suggestion.titre}</p>
                <p className="mt-1" style={{ fontFamily: F.mono, fontSize: 9.5, color: T.mutedDim }}>
                  {suggestion.duree ? suggestion.duree : ""}{suggestion.plateforme ? ` · ${suggestion.plateforme}` : ""}
                  {parseRating(suggestion.noteLetterboxd) != null && (
                    <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(suggestion.noteLetterboxd).toFixed(1)}</span></>
                  )}
                </p>
                {suggestion.synopsis && (
                  <p className="mt-1.5" style={{ fontFamily: F.serif, fontSize: 10, color: T.muted, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{suggestion.synopsis}</p>
                )}
              </div>
            </button>
          </div>
        </>
      )}

      {bientot.length > 0 && CURRENT_THEME === "nvague" && (
        <>
          <SectionTitle icon={Clock} onMore={() => onNavigate({ name: "alertes", params: { mode: "manuel" } })}>ÇA PART BIENTÔT</SectionTitle>
          <div className="flex gap-0 px-4 overflow-x-auto mb-5" style={{ borderTop: `1px solid ${T.cream}`, borderLeft: `1px solid ${T.cream}` }}>
            {bientot.map((f) => {
              const days = computeExpiryDays(f);
              return (
                <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left p-2" style={{ width: 100, borderRight: `1px solid ${T.cream}`, borderBottom: `1px solid ${T.cream}` }}>
                  <Poster film={f} className="w-full" style={{ height: 114 }} />
                  <p className="truncate mt-1.5" style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, color: T.cream }}>{f.titre}</p>
                  <p style={{ fontFamily: F.mono, fontSize: 8, color: T.accent, fontWeight: 700 }}>{days != null ? `J-${days}` : ""} · {f.plateforme}</p>
                  <p style={{ fontFamily: F.mono, fontSize: 7.5, color: T.mutedDim }}>
                    {f.duree || ""}
                    {parseRating(f.noteLetterboxd) != null && (
                      <>{f.duree ? " · " : ""}<span style={{ whiteSpace: "nowrap" }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</span></>
                    )}
                  </p>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Studio Pop Brutal : bloc plein pivoté, ombre dure marquée —       */}
      {/* le CTA le plus voyant de l'écran — positionné avant "Ça part      */}
      {/* bientôt" (ordre Suggestion → Bientôt → Ajouts).                   */}
      {suggestion && CURRENT_THEME === "popbrutal" && (
        <>
          <div className="relative">
            <SectionTitle icon={Shuffle}>Suggestion du soir</SectionTitle>
            <button onClick={reshuffleSuggestion} className="absolute flex items-center justify-center" style={{ right: 16, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: T.surfaceRaised }}>
              <RefreshCw size={11} color={T.muted} />
            </button>
          </div>
          <div className="px-4 mb-6">
            <button onClick={() => onOpen(suggestion)} className="w-full text-left p-3.5 flex gap-3"
              style={{ background: T.accent, color: "#fff", border: `${T.borderWidth}px solid ${T.line}`, boxShadow: T.shadow, transform: "rotate(-0.6deg)" }}>
              <Poster film={suggestion} className="flex-shrink-0" style={{ width: 60, height: 84, border: `${T.borderWidth}px solid ${T.line}` }} />
              <div>
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 0.5 }}>☆ SUGGESTION DU SOIR</span>
                <p className="mt-1" style={{ fontFamily: F.marquee, fontSize: 19, lineHeight: 1.05 }}>{suggestion.titre}</p>
                <p className="mt-1" style={{ fontFamily: "'Archivo', sans-serif", fontSize: 9.5, opacity: 0.9, fontWeight: 700 }}>
                  {suggestion.duree ? suggestion.duree : ""}{suggestion.plateforme ? ` · ${suggestion.plateforme}` : ""}
                  {parseRating(suggestion.noteLetterboxd) != null && (
                    <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(suggestion.noteLetterboxd).toFixed(1)}</span></>
                  )}
                </p>
                {suggestion.synopsis && (
                  <p className="mt-1.5" style={{ fontFamily: "'Archivo', sans-serif", fontSize: 9, opacity: 0.85, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{suggestion.synopsis}</p>
                )}
              </div>
            </button>
          </div>
        </>
      )}

      {/* Studio Pop Brutal : cartes sticker légèrement pivotées, ombre     */}
      {/* dure, badge d'échéance en coin — esprit étiquettes collées.       */}
      {bientot.length > 0 && CURRENT_THEME === "popbrutal" && (
        <>
          <SectionTitle icon={Clock} onMore={() => onNavigate({ name: "alertes", params: { mode: "manuel" } })}>Ça part bientôt</SectionTitle>
          <div className="flex gap-3 px-4 overflow-x-auto mb-6 pb-1">
            {bientot.map((f, i) => {
              const days = computeExpiryDays(f);
              const rot = i % 2 === 0 ? -2 : 2;
              return (
                <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left p-1.5" style={{ width: 100, background: T.surface, border: `${T.borderWidth}px solid ${T.line}`, boxShadow: T.shadow, transform: `rotate(${rot}deg)` }}>
                  <div className="relative">
                    <Poster film={f} className="w-full" style={{ height: 114, border: `${T.borderWidth}px solid ${T.line}` }} />
                    <span className="absolute" style={{ top: 3, right: 3, background: T.accent, color: "#fff", fontFamily: F.marquee, fontSize: 10, fontWeight: 900, padding: "1px 5px", border: `1px solid ${T.line}` }}>{days != null ? `J-${days}` : ""}</span>
                  </div>
                  <p className="truncate mt-1.5" style={{ fontFamily: "'Archivo', sans-serif", fontSize: 10, fontWeight: 700, color: T.cream }}>{f.titre}</p>
                  <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: 8.5, color: T.muted, marginTop: 1, fontWeight: 700 }}>
                    {f.plateforme}{f.duree ? ` · ${f.duree}` : ""}
                  </p>
                  {parseRating(f.noteLetterboxd) != null && (
                    <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: 8.5, color: T.accentSecondary, fontWeight: 900, marginTop: 1 }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</p>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Palais 1932 : carte "arche" — coins hauts arrondis en plein cintre, */}
      {/* cadre cuivre, esprit fronton de salle de cinéma 1930. Positionnée  */}
      {/* avant "Ça part bientôt" (ordre Suggestion → Bientôt → Ajouts).     */}
      {suggestion && CURRENT_THEME === "palais" && (
        <>
          <div className="relative">
            <SectionTitle icon={Shuffle}>SUGGESTION DU SOIR</SectionTitle>
            <button onClick={reshuffleSuggestion} className="absolute flex items-center justify-center" style={{ right: 16, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: T.surfaceRaised }}>
              <RefreshCw size={11} color={T.muted} />
            </button>
          </div>
          <div className="px-5 mb-6">
            <button onClick={() => onOpen(suggestion)} className="w-full text-left p-4"
              style={{ background: T.surface, border: `1px solid ${T.accent}`, borderRadius: "50% 50% 8px 8px / 24px 24px 8px 8px" }}>
              <div className="flex flex-col items-center text-center">
                <div className="overflow-hidden mb-3" style={{ width: 64, height: 64, borderRadius: "50%", border: `2px solid ${T.accent}` }}>
                  <Poster film={suggestion} className="w-full h-full" style={{ objectFit: "cover" }} />
                </div>
                <p style={{ fontFamily: F.marquee, fontSize: 19, color: T.cream, lineHeight: 1.15 }}>{suggestion.titre}</p>
                <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10.5, color: T.mutedDim, marginTop: 4 }}>
                  {suggestion.annee}{suggestion.duree ? ` · ${suggestion.duree}` : ""}
                  {parseRating(suggestion.noteLetterboxd) != null && (
                    <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(suggestion.noteLetterboxd).toFixed(1)}</span></>
                  )}
                </p>
                <span className="mt-2" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9.5, letterSpacing: 1.5, color: T.accent, fontWeight: 700 }}>{(suggestion.plateforme || "").toUpperCase()}</span>
                {suggestion.synopsis && (
                  <p className="mt-2.5" style={{ fontFamily: F.serif, fontSize: 11, fontStyle: "italic", color: T.muted, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{suggestion.synopsis}</p>
                )}
              </div>
            </button>
          </div>
        </>
      )}

      {/* Palais 1932 : rail vertical, affiches en médaillon rond cerclé de */}
      {/* cuivre, échéance en petite capitale — esprit programme de salle.  */}
      {bientot.length > 0 && CURRENT_THEME === "palais" && (
        <>
          <SectionTitle icon={Clock} onMore={() => onNavigate({ name: "alertes", params: { mode: "manuel" } })}>ÇA PART BIENTÔT</SectionTitle>
          <div className="px-5 mb-6">
            {bientot.map((f, i) => {
              const days = computeExpiryDays(f);
              return (
                <button key={f.id} onClick={() => onOpen(f)} className="w-full flex items-center gap-3 py-2.5 text-left"
                  style={{ borderBottom: i < bientot.length - 1 ? `1px solid ${T.accent}22` : "none" }}>
                  <div className="flex-shrink-0 overflow-hidden" style={{ width: 42, height: 42, borderRadius: "50%", border: `2px solid ${T.accent}` }}>
                    <Poster film={f} className="w-full h-full" style={{ objectFit: "cover" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontFamily: F.serif, fontSize: 14, fontWeight: 600, color: T.cream }}>{f.titre}</p>
                    <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9.5, color: T.mutedDim, marginTop: 1 }}>
                      {f.plateforme}{f.duree ? ` · ${f.duree}` : ""}{parseRating(f.noteLetterboxd) != null ? ` · ★ ${parseRating(f.noteLetterboxd).toFixed(1)}` : ""}
                    </p>
                  </div>
                  <span style={{ fontFamily: F.serif, fontSize: 15, color: T.alert, flexShrink: 0 }}>{days != null ? `J-${days}` : ""}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Le Projectionniste : bande de pellicule perforée horizontale,     */}
      {/* photogrammes numérotés — remplace le rail de cartes classique.    */}
      {suggestion && CURRENT_THEME === "projectionniste" && (
        <>
          <div className="relative">
            <SectionTitle icon={Shuffle}>SUGGESTION DU SOIR</SectionTitle>
            <button onClick={reshuffleSuggestion} className="absolute flex items-center justify-center" style={{ right: 16, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: T.surfaceRaised }}>
              <RefreshCw size={11} color={T.muted} />
            </button>
          </div>
          <div className="px-4 mb-6">
            <button onClick={() => onOpen(suggestion)} className="w-full flex gap-3 text-left p-3" style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radiusSm }}>
              <div className="flex-shrink-0 overflow-hidden" style={{ width: 64, height: 64, borderRadius: "50%", border: `2px solid ${T.accent}`, boxShadow: `0 0 16px ${T.accent}33` }}>
                <Poster film={suggestion} className="w-full h-full" style={{ objectFit: "cover" }} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span style={{ fontFamily: F.mono, fontSize: 8.5, color: T.accent, letterSpacing: 1 }}>BOBINE CHARGÉE</span>
                <p className="truncate mt-1" style={{ fontFamily: F.marquee, fontSize: 16, color: T.cream }}>{suggestion.titre}</p>
                <p style={{ fontFamily: F.mono, fontSize: 9, color: T.mutedDim, marginTop: 2 }}>
                  {suggestion.annee}{suggestion.duree ? ` · ${suggestion.duree}` : ""}{suggestion.plateforme ? ` · ${suggestion.plateforme}` : ""}
                  {parseRating(suggestion.noteLetterboxd) != null ? ` · ★ ${parseRating(suggestion.noteLetterboxd).toFixed(1)}` : ""}
                </p>
                {suggestion.synopsis && (
                  <p className="mt-1" style={{ fontFamily: F.serif, fontSize: 9.5, color: T.muted, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{suggestion.synopsis}</p>
                )}
              </div>
            </button>
          </div>
        </>
      )}

      {bientot.length > 0 && CURRENT_THEME === "projectionniste" && (
        <>
          <SectionTitle icon={Clock} onMore={() => onNavigate({ name: "alertes", params: { mode: "manuel" } })}>ÇA PART BIENTÔT</SectionTitle>
          <div className="mx-4 mb-6 overflow-x-auto" style={{ background: "#000", borderRadius: 3, padding: "10px 4px" }}>
            <div className="flex gap-0.5">
              {bientot.map((f) => {
                const days = computeExpiryDays(f);
                const holes = Array.from({ length: 6 });
                return (
                  <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left" style={{ width: 84, background: T.surface, borderLeft: "1px solid #000", borderRight: "1px solid #000" }}>
                    <div className="flex justify-around px-1 py-0.5">{holes.map((_, i) => <span key={i} style={{ width: 5, height: 5, background: "#000", borderRadius: 1 }} />)}</div>
                    <div className="px-1.5 pb-2 pt-0.5">
                      <div className="relative mb-1 overflow-hidden flex items-center justify-center" style={{ height: 64, borderRadius: 2 }}>
                        <Poster film={f} className="w-full h-full" style={{ objectFit: "cover" }} />
                        {days != null && <span className="absolute" style={{ top: 2, right: 2, background: T.alert, color: "#fff", fontSize: 7, fontWeight: 700, padding: "1px 3px", borderRadius: 2 }}>J-{days}</span>}
                      </div>
                      <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 8.5, color: T.cream, lineHeight: 1.2 }}>{f.titre}</p>
                      <p style={{ fontFamily: F.mono, fontSize: 6.5, color: T.mutedDim, marginTop: 1 }}>{f.plateforme}{f.duree ? ` · ${f.duree}` : ""}</p>
                      {parseRating(f.noteLetterboxd) != null && (
                        <p style={{ fontFamily: F.mono, fontSize: 6.5, color: T.accent, marginTop: 1, fontWeight: 700 }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</p>
                      )}
                    </div>
                    <div className="flex justify-around px-1 py-0.5">{holes.map((_, i) => <span key={i} style={{ width: 5, height: 5, background: "#000", borderRadius: 1 }} />)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Bulle BD : vraie planche en cases (grille 2 colonnes, bordures    */}
      {/* épaisses, ombre dure décalée) — esprit gouttières de bande        */}
      {/* dessinée plutôt qu'un simple rail défilant.                       */}
      {derniers.length > 0 && CURRENT_THEME === "bd" && (
        <>
          <SectionTitle icon={Film} onMore={() => onNavigate({ name: "biblio", params: { type: "Film" } })}>DERNIERS AJOUTS</SectionTitle>
          <div className="flex gap-3.5 px-4 overflow-x-auto mb-6">
            {derniers.map((f) => (
              <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left overflow-hidden" style={{ width: 108, background: T.surface, border: `${T.borderWidth}px solid ${T.cream}`, borderRadius: 3, boxShadow: `4px 4px 0 ${T.cream}88` }}>
                <Poster film={f} className="w-full" style={{ height: 152, objectFit: "cover" }} />
                <div className="p-2">
                  <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 10, color: T.cream }}>{f.titre}</p>
                  <p style={{ fontFamily: F.mono, fontSize: 8, color: T.mutedDim, marginTop: 2 }}>{f.plateforme}{f.duree ? ` · ${f.duree}` : ""}</p>
                  {parseRating(f.noteLetterboxd) != null && (
                    <p style={{ fontFamily: F.mono, fontSize: 8, color: T.accent, fontWeight: 700, marginTop: 2 }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {CURRENT_THEME !== "bento" && CURRENT_THEME !== "kansoHeritage" && CURRENT_THEME !== "projectionniste" && CURRENT_THEME !== "bd" && CURRENT_THEME !== "popart" && CURRENT_THEME !== "ticket" && CURRENT_THEME !== "bleu" && CURRENT_THEME !== "canalplus" && CURRENT_THEME !== "springfield" && CURRENT_THEME !== "cacartoon" && CURRENT_THEME !== "affiche" && CURRENT_THEME !== "letterboxd" && (
        <>
          <SectionTitle icon={Film} onMore={() => onNavigate({ name: "biblio", params: { type: "Film" } })}>DERNIERS AJOUTS</SectionTitle>
          <div className="flex gap-3 px-4 overflow-x-auto mb-5" style={CURRENT_THEME === "table" ? { paddingTop: 6, paddingBottom: 6 } : undefined}>
            {derniers.map((f) => (
              <MiniCard key={f.id} film={f} onOpen={onOpen}
                sub={parseRating(f.noteLetterboxd) != null ? `★ ${parseRating(f.noteLetterboxd).toFixed(1)}` : "pas de note"} />
            ))}
          </div>
        </>
      )}

      {/* Le Projectionniste : le "chariot" — la feuille de route de       */}
      {/* cabine, en liste de bobines qui tournent au survol/tap.          */}
      {CURRENT_THEME === "projectionniste" && (
        <>
          <SectionTitle icon={Film} onMore={() => onNavigate({ name: "biblio", params: { type: "Film" } })}>DERNIERS AJOUTS</SectionTitle>
          <div className="px-4 mb-6">
            {derniers.map((f, i) => (
              <button key={f.id} onClick={() => onOpen(f)} className="w-full flex items-center gap-3 py-2.5 text-left"
                style={{ borderBottom: i < derniers.length - 1 ? `1px solid ${T.line}` : "none" }}>
                <div className="flex-shrink-0 relative overflow-hidden" style={{ width: 38, height: 38, borderRadius: "50%", border: `2px solid ${T.mutedDim}` }}>
                  <Poster film={f} className="w-full h-full" style={{ objectFit: "cover" }} />
                  {/* Perforations de bobine en surimpression, sur le pourtour du cercle */}
                  <div className="absolute inset-0" style={{ borderRadius: "50%", boxShadow: `inset 0 0 0 8px ${T.bg}bb` }} />
                  <span className="absolute" style={{ top: "50%", left: "50%", width: 4, height: 4, borderRadius: "50%", background: T.bg, transform: "translate(-50%,-50%)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 13, color: T.cream }}>{f.titre}</p>
                  <p style={{ fontFamily: F.mono, fontSize: 8.5, color: T.mutedDim, marginTop: 1 }}>
                    {f.plateforme}{f.duree ? ` · ${f.duree}` : ""}{parseRating(f.noteLetterboxd) != null ? ` · ★ ${parseRating(f.noteLetterboxd).toFixed(1)}` : ""}
                  </p>
                </div>
                <span style={{ fontFamily: F.mono, fontSize: 9, color: T.accent, flexShrink: 0 }}>N°{String(i + 1).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Kanso Héritage : rouleau éditorial — grande sélection d'ouverture */}
      {/* en composition split (texte indigo + affiche), rangée compacte    */}
      {/* pour les ajouts, recommandation façon cinémathèque.               */}
      {CURRENT_THEME === "kansoHeritage" && (
        <>
          {suggestion && (
            <>
              <div className="relative">
            <SectionTitle icon={Shuffle}>SUGGESTION DU SOIR</SectionTitle>
            <button onClick={reshuffleSuggestion} className="absolute flex items-center justify-center" style={{ right: 16, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: T.surfaceRaised }}>
              <RefreshCw size={11} color={T.muted} />
            </button>
          </div>
              <div className="mx-4 mb-6">
                <button onClick={() => onOpen(suggestion)} className="w-full flex gap-3 text-left p-3" style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow }}>
                  <Poster film={suggestion} className="flex-shrink-0" style={{ width: 64, height: 84, borderRadius: T.radiusSm }} />
                  <div className="min-w-0">
                    <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 15, color: T.cream }}>{suggestion.titre}</p>
                    <p style={{ fontFamily: F.mono, fontSize: 8.5, color: T.mutedDim, marginTop: 3 }}>
                      {suggestion.plateforme}{suggestion.duree ? ` · ${suggestion.duree}` : ""}
                      {parseRating(suggestion.noteLetterboxd) != null && (
                        <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(suggestion.noteLetterboxd).toFixed(1)}</span></>
                      )}
                    </p>
                    {suggestion.synopsis && <p className="mt-1" style={{ fontSize: 9, color: T.muted, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{suggestion.synopsis}</p>}
                  </div>
                </button>
              </div>
            </>
          )}

          {/* Rail de vraies affiches (une par film à venir), même taille   */}
          {/* que les autres thèmes récents — l'ancienne version n'affichait */}
          {/* qu'un seul film en grande carte, ce qui était le bug signalé.  */}
          {bientot.length > 0 && (
            <>
              <SectionTitle icon={Clock} onMore={() => onNavigate({ name: "alertes", params: { mode: "manuel" } })}>ÇA PART BIENTÔT</SectionTitle>
              <div className="flex gap-3.5 px-4 overflow-x-auto mb-6">
                {bientot.map((f) => {
                  const days = computeExpiryDays(f);
                  return (
                    <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left overflow-hidden" style={{ width: 100, background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow }}>
                      <div className="relative">
                        <Poster film={f} className="w-full" style={{ height: 114, objectFit: "cover" }} />
                        {days != null && <span className="absolute" style={{ top: 4, right: 4, background: T.accent, color: "#fff", fontFamily: F.mono, fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 2 }}>J-{days}</span>}
                      </div>
                      <div className="p-2">
                        <p className="truncate" style={{ fontFamily: F.serif, fontSize: 9.5, fontWeight: 600, color: T.cream }}>{f.titre}</p>
                        <p style={{ fontFamily: F.mono, fontSize: 7.5, color: T.mutedDim, marginTop: 1 }}>
                          {f.plateforme}{f.duree ? ` · ${f.duree}` : ""}
                          {parseRating(f.noteLetterboxd) != null && (
                            <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</span></>
                          )}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {derniers.length > 0 && (
            <>
              <SectionTitle icon={Film} onMore={() => onNavigate({ name: "biblio", params: { type: "Film" } })}>DERNIERS AJOUTS</SectionTitle>
              <div className="flex gap-3.5 px-4 overflow-x-auto mb-6">
                {derniers.map((f) => (
                  <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left overflow-hidden" style={{ width: 108, background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, boxShadow: T.shadow }}>
                    <Poster film={f} className="w-full" style={{ height: 152, objectFit: "cover" }} />
                    <div className="p-2">
                      <p className="truncate" style={{ fontFamily: F.serif, fontSize: 9.5, fontWeight: 600, color: T.cream }}>{f.titre}</p>
                      <p style={{ fontFamily: F.mono, fontSize: 7.5, color: T.mutedDim, marginTop: 1 }}>
                        {f.annee}{f.duree ? ` · ${f.duree}` : ""}
                        {parseRating(f.noteLetterboxd) != null && (
                          <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</span></>
                        )}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* avec échéance/confiance en surimpression, rail asymétrique pour   */}
      {/* les ajouts, carte vitrée jade pour la suggestion.                 */}
      
      {/* Bento Moderne : cartes vitrées avec vraies affiches partout —     */}
      {/* suggestion en grande carte plein cadre, puis deux rangées de      */}
      {/* cartes 2 colonnes avec titre/plateforme/durée/note en dessous.    */}
      {suggestion && CURRENT_THEME === "bento" && (
        <div className="px-4 mb-5 relative">
          <span className="block mb-2" style={{ fontFamily: F.mono, fontSize: 9.5, color: T.gold, fontWeight: 700, letterSpacing: 0.5 }}>SUGGESTION DU SOIR</span>
          <button onClick={() => onOpen(suggestion)} className="relative w-full overflow-hidden text-left"
            style={{ height: 190, borderRadius: T.radius, border: `1px solid ${T.line}`, boxShadow: T.shadow }}>
            <Poster film={suggestion} className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,15,40,0) 35%, rgba(20,15,40,0.88) 100%)" }} />
            <div className="absolute left-0 right-0 bottom-0 p-4">
              <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 21, fontWeight: 800, color: "#fff" }}>{suggestion.titre}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <PlatformIcon label={suggestion.plateforme} />
                {suggestion.duree && (
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: "#fff", opacity: 0.85 }}>{suggestion.duree}</span>
                )}
                {parseRating(suggestion.noteLetterboxd) != null && (
                  <span className="flex items-center gap-1">
                    <Star size={10} color={T.gold} fill={T.gold} />
                    <span style={{ fontFamily: F.mono, fontSize: 10, color: "#fff", fontWeight: 700 }}>{parseRating(suggestion.noteLetterboxd).toFixed(1)}</span>
                  </span>
                )}
              </div>
              {suggestion.synopsis && (
                <p className="mt-1.5" style={{ fontFamily: F.serif, fontSize: 10.5, color: "#eee", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{suggestion.synopsis}</p>
              )}
            </div>
          </button>
          <button onClick={reshuffleSuggestion} className="absolute flex items-center justify-center" style={{ top: 38, right: 16, width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.4)" }}>
            <RefreshCw size={12} color="#fff" />
          </button>
        </div>
      )}

      {/* Bento Moderne : affiches redimensionnées en 108×152 (même taille  */}
      {/* que Pop Art) sur un rail horizontal — plus la grille 2 colonnes    */}
      {/* qui coupait les affiches trop court. */}
      {bientot.length > 0 && CURRENT_THEME === "bento" && (
        <>
          <SectionTitle icon={Clock} onMore={() => onNavigate({ name: "alertes", params: { mode: "manuel" } })}>ÇA PART BIENTÔT</SectionTitle>
          <div className="flex gap-3 px-4 overflow-x-auto mb-6">
            {bientot.map((f) => {
              const days = computeExpiryDays(f);
              return (
                <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 relative overflow-hidden text-left" style={{ width: 108 }}>
                  <div className="relative overflow-hidden" style={{ borderRadius: T.radiusSm, border: `1px solid ${T.line}`, boxShadow: T.shadow }}>
                    <Poster film={f} className="w-full" style={{ height: 152, objectFit: "cover" }} />
                    {days != null && (
                      <span className="absolute" style={{ top: 6, right: 6, background: T.accentSecondary, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999 }}>J-{days}</span>
                    )}
                  </div>
                  <p className="truncate mt-1.5" style={{ fontFamily: F.marquee, fontSize: 12, fontWeight: 700, color: T.cream }}>{f.titre}</p>
                  <p style={{ fontFamily: F.mono, fontSize: 9, color: T.muted, marginTop: 2 }}>{f.plateforme}{f.duree ? ` · ${f.duree}` : ""}</p>
                  {parseRating(f.noteLetterboxd) != null && (
                    <p className="flex items-center gap-1" style={{ marginTop: 2 }}>
                      <Star size={9} color={T.gold} fill={T.gold} />
                      <span style={{ fontFamily: F.mono, fontSize: 9, color: T.gold, fontWeight: 700 }}>{parseRating(f.noteLetterboxd).toFixed(1)}</span>
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {derniers.length > 0 && CURRENT_THEME === "bento" && (
        <>
          <SectionTitle icon={Film} onMore={() => onNavigate({ name: "biblio", params: { type: "Film" } })}>DERNIERS AJOUTS</SectionTitle>
          <div className="flex gap-3 px-4 overflow-x-auto mb-6">
            {derniers.map((f) => (
              <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left" style={{ width: 108 }}>
                <Poster film={f} className="w-full" style={{ height: 152, objectFit: "cover", borderRadius: T.radiusSm, border: `1px solid ${T.line}`, boxShadow: T.shadow }} />
                <p className="truncate mt-1.5" style={{ fontFamily: F.marquee, fontSize: 12, fontWeight: 700, color: T.cream }}>{f.titre}</p>
                <p style={{ fontFamily: F.mono, fontSize: 9, color: T.muted, marginTop: 2 }}>{f.plateforme}{f.duree ? ` · ${f.duree}` : ""}</p>
                {parseRating(f.noteLetterboxd) != null && (
                  <p className="flex items-center gap-1" style={{ marginTop: 2 }}>
                    <Star size={9} color={T.gold} fill={T.gold} />
                    <span style={{ fontFamily: F.mono, fontSize: 9, color: T.gold, fontWeight: 700 }}>{parseRating(f.noteLetterboxd).toFixed(1)}</span>
                  </p>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Affiche de festival : carte plein cadre, ombre dure XL —           */}
      {/* positionnée avant "Ça part bientôt" (ordre Suggestion → Bientôt →  */}
      {/* Ajouts).                                                           */}
      {suggestion && CURRENT_THEME === "affiche" && (
        <>
          <div className="relative">
            <SectionTitle icon={Shuffle}>SUGGESTION DU SOIR</SectionTitle>
            <button onClick={reshuffleSuggestion} className="absolute flex items-center justify-center" style={{ right: 16, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: T.surfaceRaised }}>
              <RefreshCw size={11} color={T.muted} />
            </button>
          </div>
          <div className="mx-4 mb-8">
            <button onClick={() => onOpen(suggestion)} className="w-full flex gap-3 text-left p-3" style={{ background: T.surface, border: `2px solid ${T.cream}`, boxShadow: T.shadow }}>
              <Poster film={suggestion} className="flex-shrink-0" style={{ width: 66, height: 92, objectFit: "cover" }} />
              <div className="min-w-0">
                <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 15, color: T.cream }}>{suggestion.titre}</p>
                <p style={{ fontFamily: F.mono, fontSize: 8.5, color: T.mutedDim, marginTop: 4 }}>
                  {suggestion.annee}{suggestion.duree ? ` · ${suggestion.duree}` : ""}{suggestion.plateforme ? ` · ${suggestion.plateforme}` : ""}
                  {parseRating(suggestion.noteLetterboxd) != null && (
                    <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(suggestion.noteLetterboxd).toFixed(1)}</span></>
                  )}
                </p>
                {suggestion.synopsis && (
                  <p className="mt-1.5" style={{ fontFamily: F.mono, fontSize: 9.5, color: T.muted, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{suggestion.synopsis}</p>
                )}
              </div>
            </button>
          </div>
        </>
      )}

      {/* Affiche de festival : cartes néobrutalistes, ombre dure décalée,  */}
      {/* bordure noire épaisse — esprit programme de festival imprimé.      */}
      {bientot.length > 0 && CURRENT_THEME === "affiche" && (
        <>
          <SectionTitle icon={Clock} onMore={() => onNavigate({ name: "alertes", params: { mode: "manuel" } })}>ÇA PART BIENTÔT</SectionTitle>
          <div className="flex gap-4 px-4 overflow-x-auto mb-6 pb-1">
            {bientot.map((f) => {
              const days = computeExpiryDays(f);
              return (
                <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left" style={{ width: 100, background: T.surface, border: `2px solid ${T.cream}`, boxShadow: T.shadow }}>
                  <div className="relative">
                    <Poster film={f} className="w-full" style={{ height: 114, objectFit: "cover", borderBottom: `2px solid ${T.cream}` }} />
                    {days != null && <span className="absolute" style={{ top: -8, right: -8, background: T.accentSoft, color: T.cream, fontFamily: F.marquee, fontSize: 11, padding: "3px 7px", border: `2px solid ${T.cream}`, borderRadius: 999 }}>J-{days}</span>}
                  </div>
                  <div className="p-2">
                    <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 10, color: T.cream }}>{f.titre}</p>
                    <p style={{ fontFamily: F.mono, fontSize: 8, color: T.mutedDim, marginTop: 2 }}>
                      {f.plateforme}{f.duree ? ` · ${f.duree}` : ""}
                      {parseRating(f.noteLetterboxd) != null && (
                        <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</span></>
                      )}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Affiche de festival : même carte néobrutaliste, pour garder       */}
      {/* l'ordre Suggestion → Bientôt → Ajouts (le fallback générique de   */}
      {/* Derniers Ajouts est plus haut dans le fichier et cassait l'ordre  */}
      {/* d'affichage réel). */}
      {derniers.length > 0 && CURRENT_THEME === "affiche" && (
        <>
          <SectionTitle icon={Film} onMore={() => onNavigate({ name: "biblio", params: { type: "Film" } })}>DERNIERS AJOUTS</SectionTitle>
          <div className="flex gap-4 px-4 overflow-x-auto mb-6 pb-1">
            {derniers.map((f) => (
              <button key={f.id} onClick={() => onOpen(f)} className="flex-shrink-0 text-left" style={{ width: 100, background: T.surface, border: `2px solid ${T.cream}`, boxShadow: T.shadow }}>
                <Poster film={f} className="w-full" style={{ height: 114, objectFit: "cover", borderBottom: `2px solid ${T.cream}` }} />
                <div className="p-2">
                  <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 10, color: T.cream }}>{f.titre}</p>
                  <p style={{ fontFamily: F.mono, fontSize: 8, color: T.mutedDim, marginTop: 2 }}>
                    {f.plateforme}{f.duree ? ` · ${f.duree}` : ""}
                    {parseRating(f.noteLetterboxd) != null && (
                      <> · <span style={{ whiteSpace: "nowrap" }}>★ {parseRating(f.noteLetterboxd).toFixed(1)}</span></>
                    )}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {suggestion && CURRENT_THEME !== "salle" && CURRENT_THEME !== "bento" && CURRENT_THEME !== "jardin" && CURRENT_THEME !== "palais" && CURRENT_THEME !== "nvague" && CURRENT_THEME !== "kansoHeritage" && CURRENT_THEME !== "popbrutal" && CURRENT_THEME !== "projectionniste" && CURRENT_THEME !== "bd" && CURRENT_THEME !== "table" && CURRENT_THEME !== "affiche" && CURRENT_THEME !== "letterboxd" && CURRENT_THEME !== "popart" && CURRENT_THEME !== "ticket" && CURRENT_THEME !== "bleu" && CURRENT_THEME !== "canalplus" && CURRENT_THEME !== "springfield" && CURRENT_THEME !== "cacartoon" && (
        <>
          <div className="relative">
            <SectionTitle icon={Shuffle}>SUGGESTION DU SOIR</SectionTitle>
            <button onClick={reshuffleSuggestion} className="absolute flex items-center justify-center" style={{ right: 16, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: T.surfaceRaised }}>
              <RefreshCw size={11} color={T.muted} />
            </button>
          </div>
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
    return <h4 className={className} style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: 1.4, color: T.mutedDim }}>{children}</h4>;
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

  // Chaîne Cryptée : lance la bande-annonce en muet ~3.5s après l'arrivée
  // sur la fiche, façon myCanal — seulement si un lien YouTube exploitable
  // est disponible. Réinitialisé à chaque changement de fiche (film.id).
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerMuted, setTrailerMuted] = useState(true);
  const [trailerFullscreen, setTrailerFullscreen] = useState(false);
  const youtubeId = extractYoutubeId_(film.urlBandeAnnonce);
  useEffect(() => {
    setShowTrailer(false);
    setTrailerMuted(true);
    setTrailerFullscreen(false);
    if (CURRENT_THEME !== "canalplus" || !youtubeId) return;
    const t = setTimeout(() => setShowTrailer(true), 3500);
    return () => clearTimeout(t);
  }, [film.id, youtubeId]);

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

  return (
    <>
      {/* Barre retour/édition/suppression FIXE — en position:fixed réelle,   */}
      {/* donc ancrée à l'écran indépendamment de la hauteur du conteneur     */}
      {/* parent (contrairement à un "h-full" dans un parent flex, qui s'est  */}
      {/* révélé fragile). Toujours accessible même tout en bas d'une fiche.  */}
      <div className="fixed left-0 right-0 z-30 flex items-center justify-between px-4" style={{ top: "max(16px, env(safe-area-inset-top))" }}>
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}>
          <ChevronLeft size={18} color="#fff" />
        </button>
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}><Pencil size={15} color="#fff" /></button>
          <button onClick={() => setConfirmDelete(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}><Trash2 size={16} color="#FF6B6B" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pull-scroll relative pb-6">
      {CURRENT_THEME === "bd" ? (
        /* Bulle BD : la couverture devient une vraie case encadrée, avec   */
        /* une bordure épaisse en retrait (esprit planche imprimée) et un   */
        /* petit macaron rond pour le type, comme un numéro de page.        */
        <div className="relative" style={{ height: 340, padding: 14, background: T.bg }}>
          <div onClick={() => setPosterOpen(true)} className="relative w-full h-full overflow-hidden" style={{ border: `${T.borderWidth}px solid ${T.cream}`, borderRadius: 6, boxShadow: T.shadow, cursor: "pointer" }}>
            <Poster film={film} className="w-full h-full" style={archived ? { filter: "grayscale(45%)" } : undefined} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(22,20,20,0) 55%, rgba(22,20,20,0.65) 100%)" }} />
          </div>
        </div>
      ) : CURRENT_THEME === "cacartoon" ? (
        /* Ça Cartoon : liseré arc-en-ciel (rouge/jaune/bleu/vert) en haut  */
        /* de la couverture — clin d'œil discret au générique multicolore, */
        /* sans surcharger le reste de la fiche.                           */
        <div className="relative" style={{ height: 340 }}>
          <div style={{ height: 7, background: `linear-gradient(90deg, ${T.accent}, ${T.gold}, ${T.accentSecondary}, ${T.accentTertiary})` }} />
          <div onClick={() => setPosterOpen(true)} className="relative" style={{ height: 333, cursor: "pointer" }}>
            <Poster film={film} className="w-full h-full" style={archived ? { filter: "grayscale(45%)" } : undefined} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(13,13,13,0.1) 40%, ${T.bg} 100%)` }} />
          </div>
        </div>
      ) : CURRENT_THEME === "canalplus" ? (
        /* Chaîne Cryptée : bande-annonce en lecture automatique après       */
        /* quelques secondes, à la place de l'affiche — comme sur myCanal.   */
        /* Taper sur la vidéo l'ouvre en plein écran (voir onExpand).        */
        <div className="relative" style={{ height: 340 }}>
          <div onClick={() => !showTrailer && setPosterOpen(true)} className="relative w-full h-full" style={{ cursor: showTrailer ? "default" : "pointer" }}>
            <Poster film={film} className="w-full h-full" style={archived ? { filter: "grayscale(45%)" } : undefined} />
            {showTrailer && youtubeId && !trailerFullscreen && (
              <InlineTrailer youtubeId={youtubeId} muted={trailerMuted} onToggleMute={() => setTrailerMuted((v) => !v)} onExpand={() => setTrailerFullscreen(true)} />
            )}
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(20,16,12,0.1) 40%, ${T.bg} 100%)`, pointerEvents: "none" }} />
          </div>
        </div>
      ) : (
        <div onClick={() => setPosterOpen(true)} className="relative" style={{ height: 340, cursor: "pointer" }}>
          {/* Table lumineuse : sprockets masqués ici — le titre remonte    */}
          {/* par-dessus le bas du poster (-mt-10 plus bas) et les faisait  */}
          {/* tomber dans le texte. */}
          <Poster film={film} className="w-full h-full" style={archived ? { filter: "grayscale(45%)" } : undefined} hideSprockets={CURRENT_THEME === "table"} />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(20,16,12,0.1) 40%, ${T.bg} 100%)` }} />
        </div>
      )}

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
          {CURRENT_THEME !== "canalplus" && <TrailerButton url={film.urlBandeAnnonce} />}
        </div>

        {/* Chaîne Cryptée : en plus du bouton "TRAILER" ci-dessus (présent   */}
        {/* sur tous les thèmes), la lecture s'enchaîne aussi automatiquement */}
        {/* à l'arrivée sur la fiche — spécificité propre à ce thème.         */}
        {CURRENT_THEME === "canalplus" && youtubeId && (
          <button onClick={() => setShowTrailer(true)} className="flex items-center justify-center gap-2 mt-4 py-3.5 rounded-lg w-full" style={{ background: T.accent }}>
            <Play size={15} color="#fff" fill="#fff" strokeWidth={0} />
            <span style={{ fontFamily: F.marquee, fontSize: 15, color: "#fff", letterSpacing: 1 }}>{showTrailer ? "REVOIR LA BANDE-ANNONCE" : "VOIR LA BANDE-ANNONCE"}</span>
          </button>
        )}

        {archived ? (
          <div className="rounded-xl p-3 mt-4" style={{ background: T.surfaceRaised, border: `1px solid ${T.line}` }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.5 }}>
              ARCHIVÉ — DATE DÉPASSÉE DEPUIS {Math.abs(daysUntil(parseDateFR(film.dateManuelle)))} JOURS
            </span>
          </div>
        ) : expiryDays != null && expiryDays >= 0 && (() => {
          // Urgence visuelle : au-delà des couleurs habituelles du thème, la
          // couleur du badge J-x vire au rouge (≤2j) ou orange (≤5j) — même
          // logique que sur les affiches de l'Accueil.
          const urg = urgencyColor_(expiryDays);
          return CURRENT_THEME === "affiche" ? (
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-2" style={{ background: urg || T.gold, border: `${T.borderWidth}px solid ${T.cream}`, boxShadow: T.shadow, transform: "rotate(-1deg)" }}>
              <span style={{ fontFamily: F.marquee, fontSize: 15, color: T.cream }}>J−{expiryDays} · DERNIÈRE SÉANCE</span>
            </div>
          )  : CURRENT_THEME === "table" ? (
            <div className="relative inline-block mt-4">
              <span style={{ fontFamily: F.serif, fontSize: 18, fontWeight: 700, color: T.cream }}>Expire dans {expiryDays} jours</span>
              <div className="absolute" style={{ left: -6, right: -6, bottom: -2, height: 2, background: urg || T.accent, transform: "rotate(-1deg)" }} />
            </div>
          ) : CURRENT_THEME === "salle" ? (
            <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3 mt-5" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: urg || T.alert, flexShrink: 0 }} />
              <span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.cream }}>Disponible encore <span style={{ color: urg || T.alert, fontWeight: 600 }}>{expiryDays} jours</span></span>
            </div>
          ) : CURRENT_THEME === "letterboxd" ? (
            <span className="inline-flex items-center rounded px-2.5 py-1 mt-4" style={{ background: `${urg || T.alert}1F` }}>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: urg || T.alert, fontWeight: 700 }}>J-{expiryDays} · dernière séance</span>
            </span>
          )      : CURRENT_THEME === "popart" ? (
            <div className="inline-flex items-center gap-2 mt-5 px-3.5 py-2" style={{ background: urg || T.gold, borderRadius: T.radiusSm }}>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: urg ? "#fff" : "#000", fontWeight: 700 }}>J-{expiryDays} avant expiration</span>
            </div>
          ) : CURRENT_THEME === "canalplus" ? (
            <div className="inline-flex items-center gap-2 mt-5 px-3.5 py-2" style={{ background: urg || T.accent, borderRadius: 6 }}>
              <span style={{ fontFamily: F.serif, fontWeight: 800, fontSize: 12, color: "#fff" }}>J-{expiryDays} avant retrait</span>
            </div>
          ) : CURRENT_THEME === "cacartoon" ? (
            <div className="inline-flex items-center gap-2 mt-5 px-3.5 py-2" style={{ background: urg || T.accent, borderRadius: 20, border: `2px solid ${T.cream}` }}>
              <span style={{ fontFamily: F.marquee, fontSize: 15, color: "#fff" }}>J-{expiryDays} avant la dernière séance</span>
            </div>
          ) : CURRENT_THEME === "bd" ? (
            <div className="relative inline-block mt-5 px-3.5 py-2" style={{ background: urg || T.alert, border: `${T.borderWidth}px solid ${T.cream}`, borderRadius: 16 }}>
              <span style={{ fontFamily: F.marquee, fontSize: 13, color: "#fff" }}>DISPO ENCORE {expiryDays} JOURS !</span>
              <div className="absolute" style={{ left: 18, bottom: -11, width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: `11px solid ${T.cream}` }} />
              <div className="absolute" style={{ left: 21.5, bottom: -6.5, width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `7px solid ${urg || T.alert}` }} />
            </div>
          ) : CURRENT_THEME === "jardin" ? (
            <div className="mt-5 p-4" style={{ background: urg ? `${urg}22` : T.alertSoft, borderRadius: "32px 48px 32px 48px" }}>
              <span style={{ fontFamily: F.mono, fontSize: 9.5, color: urg || T.accentSecondary, fontWeight: 700 }}>ENCORE DISPONIBLE</span>
              <p style={{ fontFamily: F.serif, fontSize: 20, color: T.cream, fontStyle: "italic" }}>{expiryDays} jours</p>
            </div>
          ) : CURRENT_THEME === "projectionniste" ? (
            <div className="inline-block mt-5 px-3.5 py-2" style={{ border: `1px solid ${urg || T.alert}`, borderRadius: 2 }}>
              <span style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.5, color: urg || T.alert }}>DISPO ENCORE — J-{expiryDays}</span>
            </div>
          ) : CURRENT_THEME === "kansoHeritage" ? (
            <div className="inline-flex items-center gap-2 mt-5 px-3.5 py-2" style={{ background: urg ? `${urg}22` : T.accentSoft, borderRadius: 4 }}>
              <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: urg || T.accent, fontWeight: 700 }}>DISPO ENCORE</span>
              <span style={{ fontFamily: F.marquee, fontSize: 13, color: T.cream }}>{expiryDays} jours</span>
            </div>
          )   : CURRENT_THEME === "bento" ? (
            <div className="inline-flex items-center gap-2 mt-5 px-4 py-2.5" style={{ background: urg ? `${urg}22` : T.accentSoft, borderRadius: 999, boxShadow: T.shadow }}>
              <span style={{ fontFamily: F.marquee, fontSize: 15, color: urg || T.accent, fontWeight: 800 }}>J-{expiryDays}</span>
              <span style={{ fontFamily: F.mono, fontSize: 9, color: T.cream }}>avant expiration</span>
            </div>
          ) : CURRENT_THEME === "palais" ? (
            <div className="inline-flex items-center gap-2 mt-5 px-3.5 py-2" style={{ border: `1px solid ${urg || T.accent}`, borderRadius: 999 }}>
              <span style={{ fontFamily: F.serif, fontSize: 15, color: urg || T.accent }}>J-{expiryDays}</span>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, letterSpacing: 1, color: T.mutedDim }}>DERNIÈRES SÉANCES</span>
            </div>
          ) : CURRENT_THEME === "nvague" ? (
            <div className="inline-block mt-5 px-3 py-1.5" style={{ background: urg || T.accent, color: T.surface }}>
              <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700 }}>J-{expiryDays} · QUITTE BIENTÔT LE CATALOGUE</span>
            </div>
          ) : CURRENT_THEME === "popbrutal" ? (
            <div className="inline-block mt-5 px-4 py-2" style={{ background: urg || T.accent, color: "#fff", border: `${T.borderWidth}px solid ${T.line}`, boxShadow: T.shadow, transform: "rotate(-1.5deg)" }}>
              <span style={{ fontFamily: F.marquee, fontSize: 14 }}>J-{expiryDays} AVANT DISPARITION</span>
            </div>
          ) : CURRENT_THEME === "ticket" ? (
            <div className="relative inline-flex items-center gap-3 mt-4 rounded-xl p-3" style={{ background: urg ? `${urg}22` : T.alertSoft, border: `1px dashed ${urg || T.alert}66` }}>
              <span style={{ fontFamily: F.marquee, fontSize: 22, color: urg || T.alert }}>J-{expiryDays}</span>
              <span style={{ fontFamily: F.mono, fontSize: 9.5, color: urg || T.alert }}>DERNIÈRE SÉANCE PRÉVUE</span>
              <span className="absolute" style={{ left: -6, top: "50%", width: 12, height: 12, borderRadius: "50%", background: T.bg, transform: "translateY(-50%)" }} />
              <span className="absolute" style={{ right: -6, top: "50%", width: 12, height: 12, borderRadius: "50%", background: T.bg, transform: "translateY(-50%)" }} />
            </div>
          ) : CURRENT_THEME === "bleu" ? (
            <div className="inline-flex items-center gap-3 mt-4 rounded-full px-4 py-2.5" style={{ background: urg ? `${urg}22` : T.alertSoft, boxShadow: `0 0 16px ${urg || T.alert}33` }}>
              <span style={{ fontFamily: F.marquee, fontSize: 18, color: urg || T.alert }}>J-{expiryDays}</span>
              <span style={{ fontFamily: F.mono, fontSize: 9.5, color: urg || T.alert, letterSpacing: 0.5 }}>DERNIÈRE SÉANCE PRÉVUE</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl p-3 mt-4" style={{ background: urg ? `${urg}22` : T.alertSoft, border: `1px solid ${urg || T.alert}44` }}>
              <span style={{ fontFamily: F.marquee, fontSize: 22, color: urg || T.alert }}>J-{expiryDays}</span>
              <span style={{ fontFamily: F.mono, fontSize: 9.5, color: urg || T.alert }}>DERNIÈRE SÉANCE PRÉVUE</span>
            </div>
          );
        })()}

        {/* Dates de fin de disponibilité — manuelle et auto — toujours       */}
        {/* affichées ensemble, juste avant le synopsis, quel que soit le     */}
        {/* thème (pas de variante par thème ici, contrairement au badge      */}
        {/* d'expiration ci-dessus qui reste stylé par thème).                */}
        {(film.dateManuelle || film.dateAuto) && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {film.dateManuelle && (
              <div className="flex-1" style={{ minWidth: 130, background: T.surface, border: `1px solid ${T.line}`, borderRadius: 10, padding: "8px 12px" }}>
                <p style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: 1, color: T.mutedDim, fontWeight: 700 }}>FIN · MANUEL</p>
                <p style={{ fontFamily: F.serif, fontSize: 13.5, color: T.cream, marginTop: 2 }}>{film.dateManuelle}</p>
              </div>
            )}
            {film.dateAuto && (
              <div className="flex-1" style={{ minWidth: 130, background: T.surface, border: `1px solid ${T.line}`, borderRadius: 10, padding: "8px 12px" }}>
                <p style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: 1, color: T.mutedDim, fontWeight: 700 }}>FIN · AUTO</p>
                <p style={{ fontFamily: F.serif, fontSize: 13.5, color: T.cream, marginTop: 2 }}>{film.dateAuto}</p>
              </div>
            )}
          </div>
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
            {CURRENT_THEME === "letterboxd" ? (
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

      {/* Chaîne Cryptée : plein écran de la bande-annonce (taper sur la     */}
      {/* vidéo intégrée en haut de fiche l'ouvre ici) — son réactivé par    */}
      {/* défaut, comme le fait myCanal en plein écran. */}
      {trailerFullscreen && youtubeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#000" }}>
          <button onClick={() => setTrailerFullscreen(false)} className="absolute right-4 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ top: "max(16px, env(safe-area-inset-top))", background: "rgba(255,255,255,0.12)", zIndex: 2 }}>
            <X size={18} color="#fff" />
          </button>
          <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=0&playsinline=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`}
              title="Bande-annonce"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            />
          </div>
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
    </>
  );
}

/* ------------------------------------------------------------------ */
/* ECRAN RECHERCHE — titre, réalisateur, casting                       */
/* ------------------------------------------------------------------ */
function normalizeSearch(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Devine l'URL Letterboxd la plus probable à partir du titre — Letterboxd
// n'a pas d'API de recherche publique (contrairement à TMDb), donc pas de
// vraie autocomplete possible ici. Le format d'URL Letterboxd suit presque
// toujours ce schéma (titre en minuscules, sans accents, espaces -> tirets),
// donc cette estimation tombe juste la plupart du temps, mais reste une
// estimation — d'où le bouton "Vérifier sur Letterboxd" à côté pour corriger
// en un clic si besoin.
function slugifyLetterboxd_(titre) {
  return normalizeSearch(titre)
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
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
        <p style={{ fontFamily: F.mono, fontSize: 10, color: T.accent, marginTop: 2 }}>
          {parseRating(film.noteLetterboxd) != null ? `★ ${parseRating(film.noteLetterboxd).toFixed(1)}` : "pas de note"}
        </p>
        <MatchTag match={match} />
      </div>
    </button>
  );
}

function RechercheScreen({ films, onOpen, onBack, onMenu, initialQuery, onQueryChange }) {
  const [query, setQuery] = useState(initialQuery || "");

  // Répercute chaque frappe dans les params de l'écran courant, pour que
  // la recherche survive au passage par une fiche puis au retour.
  useEffect(() => {
    if (onQueryChange) onQueryChange(query);
  }, [query]);

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

// Section repliable — utilisée dans Réglages pour alléger l'écran (tout
// n'est plus affiché en permanence). Fermée par défaut sauf indication
// contraire ; l'état de chaque section n'est volontairement pas mémorisé
// d'une ouverture d'écran à l'autre (on repart replié à chaque fois).
function CollapsibleSection({ title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-1">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between py-3 mt-2"
        style={{ borderBottom: `1px solid ${T.line}` }}>
        <span className="text-left">
          <span className="block" style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: 1.4, color: T.mutedDim }}>{title}</span>
          {subtitle && !open && <span className="block mt-0.5" style={{ fontFamily: F.serif, fontSize: 12, color: T.cream }}>{subtitle}</span>}
        </span>
        <ChevronRight size={15} color={T.mutedDim} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
      </button>
      {open && <div className="pt-3 pb-1">{children}</div>}
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
  // Pop Art / Ça Cartoon : cadre coloré flashy, stable par film (basé sur
  // son id) pour qu'il ne change pas de couleur selon l'écran ou le tri.
  let borderColor = T.line;
  if (CURRENT_THEME === "popart" || CURRENT_THEME === "cacartoon") {
    const frameColors = [T.accent, T.accentSecondary, T.gold, T.accentTertiary];
    const hash = String(film.id || film.titre || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    borderColor = frameColors[hash % frameColors.length];
  }
  return (
    <button onClick={() => onOpen(film)} className="flex text-left overflow-hidden w-full" style={{ background: T.surface, border: `${T.borderWidth}px solid ${borderColor}`, borderRadius: T.radius, boxShadow: T.shadow }}>
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

  // Minitel : rangées façon page vidéotex — blocs de couleur pleins,
  // curseur clignotant sur la ligne la plus urgente.

  // Salle Privée : programme de soirée élégant, filet doré, typographie
  // raffinée — esprit affichage de salle de projection.
  if (CURRENT_THEME === "salle") {
    const flat = groups.flatMap((g) => g.items).sort((a, b) => a.days - b.days);
    if (flat.length === 0) {
      return <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Rien à venir pour l'instant.</p>;
    }
    return (
      <div className="flex flex-col">
        {flat.map(({ f, days }, i) => (
          <button key={f.id} onClick={() => onOpen(f)} className="w-full flex items-center gap-3 text-left py-3"
            style={{ borderBottom: i < flat.length - 1 ? `1px solid ${T.line}` : "none" }}>
            <span className="flex items-center justify-center flex-shrink-0" style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${urgencyColor_(days) || T.accent}` }}>
              <span style={{ fontFamily: F.mono, fontSize: 10, color: urgencyColor_(days) || T.accent, fontWeight: 600 }}>J-{days}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate" style={{ fontFamily: F.serif, fontSize: 14, color: T.cream, fontStyle: "italic" }}>{f.titre}</p>
              <p style={{ fontFamily: F.mono, fontSize: 9, color: T.mutedDim, marginTop: 1 }}>{f.plateforme}{f.duree ? ` · ${f.duree}` : ""}</p>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Jardin d'Hiver : cartes organiques, arrondis très généreux, esprit
  // galet — pas de ligne dure, tout en douceur.
  if (CURRENT_THEME === "jardin") {
    const flat = groups.flatMap((g) => g.items).sort((a, b) => a.days - b.days);
    if (flat.length === 0) {
      return <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Rien à venir pour l'instant.</p>;
    }
    return (
      <div className="flex flex-col gap-2.5">
        {flat.map(({ f, days }) => (
          <button key={f.id} onClick={() => onOpen(f)} className="w-full flex items-center gap-3 text-left p-3"
            style={{ background: T.surface, borderRadius: "28px 40px 28px 40px" }}>
            <span className="flex-shrink-0 px-2.5 py-1" style={{ background: urgencyColor_(days) ? `${urgencyColor_(days)}22` : T.accentSecondarySoft, borderRadius: 999 }}>
              <span style={{ fontFamily: F.mono, fontSize: 9.5, color: urgencyColor_(days) || T.accentSecondary, fontWeight: 700 }}>J-{days}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate" style={{ fontFamily: F.serif, fontSize: 13.5, color: T.cream, fontStyle: "italic" }}>{f.titre}</p>
              <p style={{ fontFamily: F.mono, fontSize: 8.5, color: T.mutedDim, marginTop: 1 }}>{f.plateforme}{f.duree ? ` · ${f.duree}` : ""}</p>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Le Projectionniste : bande de pellicule verticale perforée, même
  // langage visuel que le rail "Ça part bientôt" de l'Accueil.
  if (CURRENT_THEME === "projectionniste") {
    const flat = groups.flatMap((g) => g.items).sort((a, b) => a.days - b.days);
    if (flat.length === 0) {
      return <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Rien à venir pour l'instant.</p>;
    }
    return (
      <div className="relative pl-3" style={{ borderLeft: `2px dashed ${T.line}` }}>
        {flat.map(({ f, days }) => (
          <button key={f.id} onClick={() => onOpen(f)} className="w-full flex items-center gap-3 text-left relative mb-4">
            <span className="absolute flex items-center justify-center" style={{ left: -19, top: "50%", transform: "translateY(-50%)", width: 8, height: 8, borderRadius: "50%", background: urgencyColor_(days) || T.accent }} />
            <Poster film={f} className="flex-shrink-0" style={{ width: 38, height: 54, borderRadius: 2, marginLeft: 10 }} />
            <div className="min-w-0 flex-1">
              <p style={{ fontFamily: F.mono, fontSize: 9, color: urgencyColor_(days) || T.accent, fontWeight: 700 }}>J-{days}</p>
              <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 12.5, color: T.cream }}>{f.titre}</p>
              <p style={{ fontFamily: F.mono, fontSize: 8, color: T.mutedDim, marginTop: 1 }}>{f.plateforme}{f.duree ? ` · ${f.duree}` : ""}</p>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Bento Moderne : cartes vitrées, mêmes codes visuels que l'Accueil.
  if (CURRENT_THEME === "bento") {
    const flat = groups.flatMap((g) => g.items).sort((a, b) => a.days - b.days);
    if (flat.length === 0) {
      return <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Rien à venir pour l'instant.</p>;
    }
    return (
      <div className="flex flex-col gap-2.5">
        {flat.map(({ f, days }) => (
          <button key={f.id} onClick={() => onOpen(f)} className="w-full flex items-center gap-3 text-left p-2.5"
            style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radiusSm, boxShadow: T.shadow }}>
            <Poster film={f} className="flex-shrink-0" style={{ width: 44, height: 62, borderRadius: 10, objectFit: "cover" }} />
            <div className="min-w-0 flex-1">
              <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 12.5, color: T.cream }}>{f.titre}</p>
              <p style={{ fontFamily: F.mono, fontSize: 8.5, color: T.mutedDim, marginTop: 1 }}>{f.plateforme}{f.duree ? ` · ${f.duree}` : ""}</p>
            </div>
            <span className="flex-shrink-0 px-2.5 py-1" style={{ background: urgencyColor_(days) ? `${urgencyColor_(days)}22` : T.accentSoft, borderRadius: 999 }}>
              <span style={{ fontFamily: F.marquee, fontSize: 11, color: urgencyColor_(days) || T.accent, fontWeight: 800 }}>J-{days}</span>
            </span>
          </button>
        ))}
      </div>
    );
  }

  // Palais 1932 : rail vertical à médaillons, même langage que l'Accueil.
  if (CURRENT_THEME === "palais") {
    const flat = groups.flatMap((g) => g.items).sort((a, b) => a.days - b.days);
    if (flat.length === 0) {
      return <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Rien à venir pour l'instant.</p>;
    }
    return (
      <div>
        {flat.map(({ f, days }, i) => (
          <button key={f.id} onClick={() => onOpen(f)} className="w-full flex items-center gap-3 py-2.5 text-left"
            style={{ borderBottom: i < flat.length - 1 ? `1px solid ${T.accent}22` : "none" }}>
            <div className="flex-shrink-0 overflow-hidden" style={{ width: 42, height: 42, borderRadius: "50%", border: `2px solid ${T.accent}` }}>
              <Poster film={f} className="w-full h-full" style={{ objectFit: "cover" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ fontFamily: F.serif, fontSize: 14, fontWeight: 600, color: T.cream }}>{f.titre}</p>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9.5, color: T.mutedDim, marginTop: 1 }}>{f.plateforme}{f.duree ? ` · ${f.duree}` : ""}</p>
            </div>
            <span style={{ fontFamily: F.serif, fontSize: 15, color: urgencyColor_(days) || T.alert, flexShrink: 0 }}>J-{days}</span>
          </button>
        ))}
      </div>
    );
  }

  // Nouvelle Vague 74 : bandeau rouge + liste encadrée filet noir.
  if (CURRENT_THEME === "nvague") {
    const flat = groups.flatMap((g) => g.items).sort((a, b) => a.days - b.days);
    return (
      <div>
        <div className="mb-3 px-3 py-2" style={{ background: T.accent, color: T.surface }}>
          <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700 }}>{flat.length} titre{flat.length > 1 ? "s" : ""} à surveiller</span>
        </div>
        {flat.map(({ f, days }, i) => (
          <button key={f.id} onClick={() => onOpen(f)} className="w-full flex items-center justify-between py-2.5 text-left" style={{ borderBottom: `1px solid ${T.cream}` }}>
            <div className="min-w-0">
              <p className="truncate" style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 13, color: T.cream }}>{f.titre}</p>
              <p style={{ fontFamily: F.mono, fontSize: 9, color: T.mutedDim, marginTop: 1 }}>{f.plateforme}{f.duree ? ` · ${f.duree}` : ""}</p>
            </div>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: urgencyColor_(days) || T.accent, fontWeight: 700, flexShrink: 0 }}>J-{days}</span>
          </button>
        ))}
        {flat.length === 0 && <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Rien à venir pour l'instant.</p>}
      </div>
    );
  }

  // Studio Pop Brutal : cartes sticker pivotées, ombre dure.
  if (CURRENT_THEME === "popbrutal") {
    const flat = groups.flatMap((g) => g.items).sort((a, b) => a.days - b.days);
    if (flat.length === 0) {
      return <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Rien à venir pour l'instant.</p>;
    }
    return (
      <div className="flex flex-col gap-3">
        {flat.map(({ f, days }, i) => {
          const rot = i % 2 === 0 ? -1 : 1;
          return (
            <button key={f.id} onClick={() => onOpen(f)} className="w-full flex items-center gap-3 text-left p-2.5"
              style={{ background: T.surface, border: `${T.borderWidth}px solid ${T.line}`, boxShadow: T.shadow, transform: `rotate(${rot}deg)` }}>
              <Poster film={f} className="flex-shrink-0" style={{ width: 40, height: 56, border: `2px solid ${T.line}` }} />
              <div className="min-w-0 flex-1">
                <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 11, color: T.cream }}>{f.titre}</p>
                <p style={{ fontFamily: "'Archivo', sans-serif", fontSize: 8, color: T.muted, marginTop: 1, fontWeight: 700 }}>{f.plateforme}{f.duree ? ` · ${f.duree}` : ""}</p>
              </div>
              <span className="flex-shrink-0 px-2 py-1" style={{ background: urgencyColor_(days) || T.accent, color: "#fff", fontFamily: F.marquee, fontSize: 11 }}>J-{days}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Table lumineuse : liste sur fond noir façon visionneuse, filet rouge.
  if (CURRENT_THEME === "table") {
    const flat = groups.flatMap((g) => g.items).sort((a, b) => a.days - b.days);
    if (flat.length === 0) {
      return <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Rien à venir pour l'instant.</p>;
    }
    return (
      <div className="flex flex-col gap-2 -mx-5 px-5 py-3" style={{ background: "#0D0D0D" }}>
        {flat.map(({ f, days }) => (
          <button key={f.id} onClick={() => onOpen(f)} className="w-full flex items-center justify-between py-2 text-left" style={{ borderBottom: `1px solid #F2F0E822` }}>
            <div className="min-w-0">
              <p className="truncate" style={{ fontFamily: F.mono, fontSize: 12, color: "#F2F0E8" }}>{f.titre}</p>
              <p style={{ fontFamily: F.mono, fontSize: 8.5, color: "#F2F0E880", marginTop: 1 }}>{f.plateforme}{f.duree ? ` · ${f.duree}` : ""}</p>
            </div>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: urgencyColor_(days) || T.accent, fontWeight: 700, flexShrink: 0 }}>J-{days}</span>
          </button>
        ))}
      </div>
    );
  }

  // Affiche de festival : cartes ticket, ombre dure, bordure noire.
  if (CURRENT_THEME === "affiche") {
    const flat = groups.flatMap((g) => g.items).sort((a, b) => a.days - b.days);
    if (flat.length === 0) {
      return <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Rien à venir pour l'instant.</p>;
    }
    return (
      <div className="flex flex-col gap-3">
        {flat.map(({ f, days }) => (
          <button key={f.id} onClick={() => onOpen(f)} className="w-full flex items-center gap-3 text-left p-2.5"
            style={{ background: T.surface, border: `2px solid ${T.cream}`, boxShadow: T.shadow }}>
            <Poster film={f} className="flex-shrink-0" style={{ width: 42, height: 58, objectFit: "cover" }} />
            <div className="min-w-0 flex-1">
              <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 11, color: T.cream }}>{f.titre}</p>
              <p style={{ fontFamily: F.mono, fontSize: 8, color: T.mutedDim, marginTop: 2 }}>{f.plateforme}{f.duree ? ` · ${f.duree}` : ""}</p>
            </div>
            <span className="flex-shrink-0 px-2 py-1" style={{ background: urgencyColor_(days) ? `${urgencyColor_(days)}22` : T.accentSoft, fontFamily: F.marquee, fontSize: 10, color: urgencyColor_(days) || T.cream, borderRadius: 999, border: `1px solid ${T.cream}` }}>J-{days}</span>
          </button>
        ))}
      </div>
    );
  }

  // Letterboxd : liste sombre, note en étoiles vertes.
  if (CURRENT_THEME === "letterboxd") {
    const flat = groups.flatMap((g) => g.items).sort((a, b) => a.days - b.days);
    if (flat.length === 0) {
      return <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Rien à venir pour l'instant.</p>;
    }
    return (
      <div className="flex flex-col gap-2.5">
        {flat.map(({ f, days }) => {
          const rating = parseRating(f.noteLetterboxd);
          return (
            <button key={f.id} onClick={() => onOpen(f)} className="w-full flex items-center gap-3 text-left p-2" style={{ background: T.surface, borderRadius: T.radiusSm }}>
              <Poster film={f} className="flex-shrink-0" style={{ width: 40, height: 56, borderRadius: 4 }} />
              <div className="min-w-0 flex-1">
                <p className="truncate" style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 12.5, color: T.cream }}>{f.titre}</p>
                {rating != null && <p style={{ color: T.accent, fontSize: 9, marginTop: 2, fontFamily: F.mono, fontWeight: 700 }}>★ {rating.toFixed(1)}</p>}
              </div>
              <span style={{ fontFamily: F.mono, fontSize: 10, color: urgencyColor_(days) || T.alert, fontWeight: 700, flexShrink: 0 }}>J-{days}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Guichet Nocturne : liste feutrée, halo chaud sur l'échéance.

  // Vidéoclub 88 : cartes néon, esprit rayonnage de location.

  // Film Noir : liste en filets, badge rouge sang.

  // Pellicule Vintage : liste sépia, filets dorés.

  // Salle IMAX : cartes techniques, halo bleu.

  // Pop Art / Ça Cartoon : cadres colorés flashy en rotation, texte sobre.
  if (CURRENT_THEME === "popart" || CURRENT_THEME === "cacartoon") {
    const flat = groups.flatMap((g) => g.items).sort((a, b) => a.days - b.days);
    if (flat.length === 0) {
      return <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Rien à venir pour l'instant.</p>;
    }
    const frameColors = [T.accent, T.accentSecondary, T.gold, T.accentTertiary];
    return (
      <div className="flex flex-col gap-3">
        {flat.map(({ f, days }, i) => {
          const urg = urgencyColor_(days);
          const frameColor = urg || frameColors[i % frameColors.length];
          return (
            <button key={f.id} onClick={() => onOpen(f)} className="w-full flex items-center gap-3 text-left p-2" style={{ background: T.surface, border: `${T.borderWidth}px solid ${frameColor}`, borderRadius: T.radius }}>
              <Poster film={f} className="flex-shrink-0" style={{ width: 42, height: 58, objectFit: "cover" }} />
              <div className="min-w-0 flex-1">
                <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 12.5, color: T.cream }}>{f.titre}</p>
                <p style={{ fontFamily: F.mono, fontSize: 8.5, color: T.muted, marginTop: 1 }}>{f.plateforme}{f.duree ? ` · ${f.duree}` : ""}</p>
              </div>
              <span className="flex-shrink-0 px-2 py-1" style={{ background: frameColor, color: (urg || CURRENT_THEME === "cacartoon") ? "#fff" : "#000", fontFamily: F.mono, fontSize: 10, fontWeight: 700, borderRadius: CURRENT_THEME === "cacartoon" ? 999 : 2 }}>J-{days}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Bulle BD : liste en cases avec ombre dure décalée, éclat onomatopée
  // pour l'échéance — même esprit que l'Accueil, pas de rail générique.
  if (CURRENT_THEME === "bd") {
    const flat = groups.flatMap((g) => g.items).sort((a, b) => a.days - b.days);
    if (flat.length === 0) {
      return <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Rien à venir pour l'instant.</p>;
    }
    return (
      <div className="flex flex-col gap-4">
        {flat.map(({ f, days }) => (
          <button key={f.id} onClick={() => onOpen(f)} className="w-full flex items-center gap-3 text-left relative p-2.5"
            style={{ background: T.surface, border: `${T.borderWidth}px solid ${T.cream}`, borderRadius: T.radiusSm, boxShadow: T.shadow }}>
            <div className="relative flex-shrink-0" style={{ width: 46, height: 64 }}>
              <Poster film={f} className="w-full h-full" style={{ border: `2px solid ${T.cream}`, borderRadius: 3, objectFit: "cover" }} />
              <span className="absolute flex items-center justify-center" style={{
                top: -12, right: -12, width: 32, height: 32, background: urgencyColor_(days) || T.accent, color: "#fff",
                fontFamily: F.marquee, fontSize: 9, transform: "rotate(-10deg)", zIndex: 3,
                clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
              }}>{`J-${days}`}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate" style={{ fontFamily: F.marquee, fontSize: 12.5, color: T.cream }}>{f.titre}</p>
              <p style={{ fontFamily: F.mono, fontSize: 8.5, color: T.mutedDim, marginTop: 2 }}>{f.plateforme}{f.duree ? ` · ${f.duree}` : ""}</p>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Kanso Héritage / Kanso Neo : ligne temporelle verticale (pastilles J-X
  // reliées), au lieu de la liste groupée par date classique — bien plus
  // proche de la maquette validée pour ces deux thèmes.
  if (CURRENT_THEME === "kansoHeritage") {
    const flat = groups.flatMap((g) => g.items).sort((a, b) => a.days - b.days);
    const heritageColors = ["#C85A32", "#C85A32", "#B08050", "#98895A", "#78805A", "#68705A"];
    const colors = heritageColors;
    if (flat.length === 0) {
      return <p className="text-center mt-8" style={{ fontFamily: F.serif, fontSize: 13, color: T.mutedDim, fontStyle: "italic" }}>Rien à venir pour l'instant.</p>;
    }
    return (
      <div className="relative pl-9">
        <div className="absolute" style={{
          left: 16, top: 8, bottom: 8, width: 1,
          background: `repeating-linear-gradient(0deg, ${T.cream}40 0 4px, transparent 4px 8px)`,
        }} />
        {flat.map(({ f, days }, i) => {
          const c = urgencyColor_(days) || colors[Math.min(i, colors.length - 1)];
          return (
            <button key={f.id} onClick={() => onOpen(f)} className="w-full text-left relative flex items-start gap-2.5" style={{ marginBottom: 18 }}>
              <span className="absolute flex items-center justify-center" style={{ left: -34, top: 0, width: 30, height: 30, borderRadius: "50%", background: c, color: "#fff", fontFamily: F.mono, fontSize: 9, fontWeight: 700 }}>J-{days}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate" style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 12.5, color: T.cream }}>{f.titre}</p>
                <p style={{ fontFamily: F.mono, fontSize: 8.5, color: T.mutedDim, marginTop: 1 }}>{f.plateforme}{f.duree ? ` · ${f.duree}` : ""}</p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {groups.map((g) => (
        <div key={g.label} className="mb-4">
          <p className="mb-2" style={{ fontFamily: F.marquee, fontSize: 17, color: T.cream, letterSpacing: 0.5 }}>{g.label}</p>
          <div className="flex flex-col gap-2">
            {g.items.map(({ f, days }) => (
              <ListResultCard key={f.id} film={f} onOpen={onOpen}
                right={<div className="flex items-center pr-3"><span className="rounded-full px-2.5 py-1" style={{ background: urgencyColor_(days) ? `${urgencyColor_(days)}22` : T.accentSoft }}>
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: urgencyColor_(days) || T.accent, fontWeight: 700 }}>J-{days}</span>
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
  const s = String(d).trim();
  // Format "1h48" / "2h" — heures (+ minutes optionnelles)
  const hm = s.match(/(\d+)\s*h\s*(\d+)?/i);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2] || 0);
  // Format "23min" / "18 min" — courts-métrages sans heure, ignorés avant
  // ce correctif (donc invisibles dans tous les filtres de durée).
  const m = s.match(/(\d+)\s*min/i);
  if (m) return Number(m[1]);
  return null;
}

function PillGroup({ label, options, value, onChange, renderLabel }) {
  return (
    <div className="mb-5">
      <p className="mb-2" style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.2, color: T.accentSecondary }}>{label.toUpperCase()}</p>
      <div className="flex gap-2 flex-wrap">
        {["Tous", ...options].map((opt) => {
          const key = typeof opt === "object" ? opt.id : opt;
          // Les options peuvent être des chaînes (Type, Plateforme) ou des
          // objets {id, label, ...} (Durée) — la comparaison doit gérer les
          // deux cas, sinon la sélection ne s'affiche jamais en couleur
          // pour les groupes à options-objets.
          const active = opt === "Tous" ? !value : (typeof opt === "object" ? opt.id === value : opt === value);
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
let explorerFiltersState_ = { type: null, plateforme: null, duree: null, genresSel: [], noteMin: 0, noteMax: 5 };
// Position de défilement mémorisée en dehors de React, pour la restaurer
// au retour d'une fiche ouverte depuis Explorer (au lieu de remonter en
// haut de la liste à chaque fois).
let explorerScrollTop_ = 0;

function ExplorerScreen({ films, initialGenre, onOpen, onBack, onMenu }) {
  const [type, setType] = useState(explorerFiltersState_.type);
  const [plateforme, setPlateforme] = useState(explorerFiltersState_.plateforme);
  const [duree, setDuree] = useState(explorerFiltersState_.duree);
  const [genresSel, setGenresSel] = useState(
    explorerFiltersState_.genresSel.length > 0 ? explorerFiltersState_.genresSel : (initialGenre ? [initialGenre] : [])
  );
  const [noteMin, setNoteMin] = useState(explorerFiltersState_.noteMin);
  const [noteMax, setNoteMax] = useState(explorerFiltersState_.noteMax ?? 5);
  const scrollRef = useRef(null);

  // Recopie à chaque changement, pour que le prochain montage reparte d'ici.
  useEffect(() => {
    explorerFiltersState_ = { type, plateforme, duree, genresSel, noteMin, noteMax };
  }, [type, plateforme, duree, genresSel, noteMin, noteMax]);

  // Restaure la position de défilement au montage (retour depuis une      //
  // fiche), et la mémorise en continu pendant le défilement.               //
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = explorerScrollTop_;
  }, []);
  const handleScroll = () => {
    if (scrollRef.current) explorerScrollTop_ = scrollRef.current.scrollTop;
  };

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
      if (noteMax < 5 && (parseRating(f.noteLetterboxd) ?? 99) > noteMax) return false;
      return true;
    });
  }, [films, type, plateforme, genresSel, dureeBucket, noteMin, noteMax]);

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto pull-scroll pb-6 px-5">
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
      <div className="mb-5">
        <p className="mb-2" style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.2, color: T.accentSecondary }}>NOTE MAXIMUM</p>
        <div className="flex items-center justify-between rounded-xl px-4 py-2.5" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <button onClick={() => setNoteMax((v) => Math.max(0, +(v - 0.5).toFixed(1)))} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: T.surfaceRaised }}><Minus size={14} color={T.muted} /></button>
          <span style={{ fontFamily: F.marquee, fontSize: 20, color: T.cream, letterSpacing: 0.5 }}>{noteMax >= 5 ? "TOUTES" : `★ ${noteMax.toFixed(1)}`}</span>
          <button onClick={() => setNoteMax((v) => Math.min(5, +(v + 0.5).toFixed(1)))} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: T.surfaceRaised }}><Plus size={14} color={T.muted} /></button>
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [justAdded, setJustAdded] = useState(null); // titre du film ajouté, pour le toast — null = pas de toast affiché
  const canSubmit = titre.trim() && annee.trim() && plateforme;

  // Recherche TMDb en direct (autocomplete) — évite de taper le titre/année
  // à l'aveugle et de devoir attendre le prochain passage du script
  // d'enrichissement pour vérifier qu'on a bien tapé le bon film. Appelle
  // /api/search-tmdb (nouvelle route à ajouter côté Vercel, voir le fichier
  // séparé fourni) ; si la route n'existe pas encore, la recherche échoue
  // silencieusement et l'ajout manuel classique reste disponible.
  const [tmdbResults, setTmdbResults] = useState([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbOpen, setTmdbOpen] = useState(false);
  const [tmdbError, setTmdbError] = useState(null);
  const [titreTouchedByUser, setTitreTouchedByUser] = useState(false);
  useEffect(() => {
    if (!titreTouchedByUser || titre.trim().length < 2) { setTmdbResults([]); setTmdbError(null); return; }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setTmdbLoading(true);
      setTmdbError(null);
      try {
        const res = await fetch(`/api/search-tmdb?q=${encodeURIComponent(titre.trim())}`, { signal: controller.signal });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          // On affiche le message renvoyé par la route (ex: clé TMDB_API_KEY
          // manquante côté Vercel) au lieu d'échouer silencieusement — sinon
          // impossible de savoir pourquoi la recherche ne renvoie rien.
          setTmdbError(data.error || `Erreur ${res.status}`);
          setTmdbResults([]);
          return;
        }
        setTmdbResults(Array.isArray(data.results) ? data.results.slice(0, 6) : []);
        setTmdbOpen(true);
      } catch (e) {
        if (e.name !== "AbortError") setTmdbError("Recherche indisponible (connexion ou route /api/search-tmdb manquante)");
      } finally {
        setTmdbLoading(false);
      }
    }, 400);
    return () => { clearTimeout(t); controller.abort(); };
  }, [titre, titreTouchedByUser]);

  const pickTmdbResult = (r) => {
    setTitre(r.titre);
    if (r.annee) setAnnee(String(r.annee));
    // Pré-remplit une estimation du lien Letterboxd — seulement si le champ
    // est encore vide, pour ne jamais écraser une saisie manuelle existante.
    if (!urlLetterboxd.trim() && r.titre) {
      setUrlLetterboxd(`https://letterboxd.com/film/${slugifyLetterboxd_(r.titre)}/`);
    }
    setTmdbOpen(false);
    setTitreTouchedByUser(false);
  };

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
    if (onAdded) onAdded();
    // Toast de confirmation ~2,5s puis retour automatique à l'Accueil —
    // remplace l'ancien écran "TICKET ÉMIS" + bouton manuel, qui obligeait
    // à taper pour revenir. Fonctionne sur tous les thèmes (couleurs T/F
    // génériques, pas de variante par thème nécessaire).
    setJustAdded(titre.trim());
    setTimeout(() => { onBack(); }, 2500);
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
      <label className="block mb-4 relative">
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accentSecondary, letterSpacing: 1 }}>TITRE *</span>
        <input
          value={titre}
          onChange={(e) => { setTitre(e.target.value); setTitreTouchedByUser(true); }}
          onFocus={() => { if (tmdbResults.length > 0) setTmdbOpen(true); }}
          className="w-full mt-1.5 rounded-lg px-3 py-2.5 outline-none"
          style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.serif, fontSize: 16, color: T.cream }}
        />
        {tmdbLoading && (
          <span className="absolute" style={{ right: 12, top: 38 }}>
            <RefreshCw size={14} color={T.mutedDim} style={{ animation: "spin 0.8s linear infinite" }} />
          </span>
        )}
        {tmdbOpen && tmdbResults.length > 0 && (
          <div className="absolute left-0 right-0 z-30 mt-1 rounded-lg overflow-hidden" style={{ background: T.surfaceRaised, border: `1px solid ${T.line}`, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            {tmdbResults.map((r, i) => (
              <button key={i} onClick={() => pickTmdbResult(r)} className="w-full flex items-center gap-2.5 px-3 py-2 text-left"
                style={{ borderBottom: i < tmdbResults.length - 1 ? `1px solid ${T.line}` : "none" }}>
                {r.affiche ? (
                  <img src={r.affiche} alt={r.titre} className="flex-shrink-0 rounded" style={{ width: 30, height: 42, objectFit: "cover" }} />
                ) : (
                  <span className="flex-shrink-0 rounded flex items-center justify-center" style={{ width: 30, height: 42, background: T.surface }}>
                    <Film size={12} color={T.mutedDim} />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate" style={{ fontFamily: F.serif, fontSize: 13, color: T.cream }}>{r.titre}</span>
                  <span className="block" style={{ fontFamily: F.mono, fontSize: 9.5, color: T.mutedDim }}>{r.annee || "—"}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        {tmdbError && (
          <p className="mt-1.5" style={{ fontFamily: F.mono, fontSize: 9, color: T.alert }}>{tmdbError}</p>
        )}
        {tmdbOpen && !tmdbLoading && !tmdbError && tmdbResults.length === 0 && titre.trim().length >= 2 && (
          <p className="mt-1.5" style={{ fontFamily: F.mono, fontSize: 9, color: T.mutedDim, fontStyle: "italic" }}>Aucun résultat TMDb pour « {titre.trim()} ».</p>
        )}
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
        {/* Letterboxd n'a pas d'API de recherche publique — le lien ci-dessus */}
        {/* n'est qu'une estimation basée sur le titre quand rempli via TMDb.  */}
        {/* Ce lien ouvre la recherche officielle Letterboxd pour vérifier/    */}
        {/* corriger en un clic plutôt que de deviner à l'aveugle. */}
        {titre.trim() && (
          <a href={`https://letterboxd.com/search/films/${encodeURIComponent(titre.trim())}/`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 mt-2">
            <ExternalLink size={11} color={T.accentSecondary} />
            <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accentSecondary }}>Vérifier sur Letterboxd</span>
          </a>
        )}
      </label>
      {error && (
        <div className="rounded-lg p-3 mb-3" style={{ background: T.alertSoft, border: `1px solid ${T.alert}44` }}>
          <p style={{ fontFamily: F.mono, fontSize: 10.5, color: T.alert }}>{error}</p>
        </div>
      )}
      <button onClick={handleSubmit} disabled={!canSubmit || saving || !!justAdded} className="w-full rounded-lg py-3.5" style={{ background: canSubmit ? T.accent : T.surfaceRaised, fontFamily: F.mono, fontSize: 12, letterSpacing: 1.2, color: canSubmit ? T.bg : T.mutedDim, fontWeight: 700, opacity: (saving || justAdded) ? 0.7 : 1 }}>
        {saving ? "ENVOI…" : "ÉMETTRE LE TICKET"}
      </button>
      <p className="mt-3 text-center" style={{ fontFamily: F.mono, fontSize: 8.5, color: T.mutedDim }}>
        L'enrichissement (affiche, synopsis, note...) ne se fera automatiquement qu'une fois le script Apps Script rattaché à ce Sheet.
      </p>

      {/* Toast de confirmation — glisse depuis le haut, reste ~2,5s puis     */}
      {/* laisse place au retour automatique (déclenché dans handleSubmit).  */}
      {/* Générique T/F : s'adapte tout seul à n'importe quel thème actif.   */}
      {justAdded && (
        <div className="fixed left-0 right-0 z-50 flex justify-center px-4" style={{ top: "max(16px, env(safe-area-inset-top))" }}>
          <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 w-full" style={{ maxWidth: 460, background: T.surfaceRaised, border: `1px solid ${T.accent}55`, boxShadow: "0 8px 24px rgba(0,0,0,0.45)", animation: "toastSlideIn 0.3s ease" }}>
            <span className="flex items-center justify-center flex-shrink-0 rounded-full" style={{ width: 26, height: 26, background: T.accentSoft }}>
              <Check size={14} color={T.accent} />
            </span>
            <span className="min-w-0">
              <span className="block truncate" style={{ fontFamily: F.serif, fontSize: 13.5, color: T.cream, fontWeight: 600 }}>« {justAdded} » ajouté</span>
              <span className="block" style={{ fontFamily: F.mono, fontSize: 9, color: T.mutedDim, marginTop: 1 }}>Retour à l'accueil…</span>
            </span>
          </div>
        </div>
      )}
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
const GROUPES_THEMES_ORDRE = ["Rituel", "Originaux", "Signature", "Mises en page réinventées", "Six Directions", "Ambiances CinéRadar"];

function ThemesScreen({ theme, onChangeTheme, onBack, onMenu, leaderEnabled, onToggleLeader }) {
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
                <div key={key}>
                  <button onClick={() => onChangeTheme(key)} className="w-full flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: active ? T.accentSoft : T.surface, border: `1px solid ${active ? T.accent + "66" : T.line}` }}>
                    {/* Aperçu : 3 pastilles des couleurs clés du thème +     */}
                    {/* échantillon "Aa" dans la police titre du thème —      */}
                    {/* permet de reconnaître un thème sans y entrer.         */}
                    <span className="flex items-center flex-shrink-0" style={{ gap: 3 }}>
                      {[t.colors.accent, t.colors.accentSecondary, t.colors.gold || t.colors.accentSoft].map((c, i) => (
                        <span key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c, border: `1px solid ${t.colors.bg}55`, flexShrink: 0 }} />
                      ))}
                    </span>
                    <span className="flex items-center justify-center flex-shrink-0 rounded-md" style={{ width: 30, height: 30, background: t.colors.bg }}>
                      <span style={{ fontFamily: t.fonts.marquee, fontSize: 14, color: t.colors.accent }}>Aa</span>
                    </span>
                    <span className="flex-1 text-left" style={{ fontFamily: F.serif, fontSize: 13.5, color: active ? T.accent : T.cream }}>{t.label}</span>
                    {active && <Check size={16} color={T.accent} />}
                  </button>
                  {/* Le Projectionniste : bouton dédié pour activer/désactiver le    */}
                  {/* compte à rebours d'amorce à chaque ouverture de fiche — on      */}
                  {/* garde le rituel par défaut, mais on peut le couper vite fait    */}
                  {/* si on enchaîne beaucoup de recherches un soir donné.            */}
                  {key === "projectionniste" && active && (
                    <button onClick={() => onToggleLeader(!leaderEnabled)} className="w-full flex items-center justify-between rounded-xl px-4 py-2.5 mt-1.5"
                      style={{ background: T.surfaceRaised, border: `1px solid ${T.line}` }}>
                      <span style={{ fontFamily: F.mono, fontSize: 10.5, color: T.muted }}>Compte à rebours à l'ouverture des fiches</span>
                      <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: leaderEnabled ? T.accent : T.mutedDim, letterSpacing: 0.5 }}>
                        {leaderEnabled ? "AVEC ●" : "SANS ○"}
                      </span>
                    </button>
                  )}
                </div>
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

  // Notifications locales — réglage propre à cet appareil (localStorage),
  // comme le thème ou le compte à rebours du Projectionniste. La demande de
  // permission navigateur doit venir d'un vrai clic utilisateur, donc on ne
  // l'appelle qu'ici, jamais automatiquement au chargement.
  const [notifEnabled, setNotifEnabled] = useState(getStoredNotifEnabled_());
  const [notifSeuil, setNotifSeuil] = useState(getStoredNotifSeuil_());
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const toggleNotif = async () => {
    if (typeof Notification === "undefined") { window.alert("Les notifications ne sont pas prises en charge sur ce navigateur."); return; }
    if (!notifEnabled) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm !== "granted") { window.alert("Autorisation refusée — active les notifications dans les réglages de ton iPhone pour ce site si tu changes d'avis."); return; }
    }
    const next = !notifEnabled;
    setNotifEnabled(next);
    try { localStorage.setItem("cinemaison_notif_enabled", next ? "1" : "0"); } catch {}
  };
  const changeNotifSeuil = (v) => {
    setNotifSeuil(v);
    try { localStorage.setItem("cinemaison_notif_seuil", String(v)); } catch {}
  };

  // Relance en masse l'enrichissement des fiches sans bande-annonce — vide
  // EtatEnrichissement + StatutEnrichissement pour toutes les fiches
  // concernées en un seul appel (api/bulk-retry-trailers.js), au lieu de
  // le faire fiche par fiche via "Redemander une vérification".
  const [retryingTrailers, setRetryingTrailers] = useState(false);
  const [retryTrailersResult, setRetryTrailersResult] = useState(null);
  const handleRetryTrailers = async () => {
    if (!window.confirm("Relancer l'enrichissement de toutes les fiches sans bande-annonce ? Le script d'enrichissement les reprendra à son prochain cycle.")) return;
    setRetryingTrailers(true);
    setRetryTrailersResult(null);
    const result = await apiWrite("/api/bulk-retry-trailers", {});
    setRetryingTrailers(false);
    if (!result.ok) {
      window.alert(result.error || "Impossible de relancer les fiches");
      return;
    }
    setRetryTrailersResult(result.data.concerned);
  };

  return (
    <div className="flex-1 overflow-y-auto pull-scroll pb-8 px-5">
      <ScreenHeader title="RÉGLAGES" onBack={onBack} onMenu={onMenu} />

      <CollapsibleSection title="STYLE VISUEL" subtitle={THEMES[theme]?.label || theme}>
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
      </CollapsibleSection>

      <CollapsibleSection title="NOTIFICATIONS" subtitle={notifEnabled ? `Activées · J-${notifSeuil}` : "Désactivées"}>
        <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <div className="pr-3">
            <p style={{ fontFamily: F.serif, fontSize: 13.5, color: T.cream }}>Alertes d'expiration</p>
            <p style={{ fontFamily: F.mono, fontSize: 9, color: T.mutedDim, marginTop: 2 }}>Sur cet appareil uniquement</p>
          </div>
          <button onClick={toggleNotif} className="flex-shrink-0 rounded-full px-3 py-1.5" style={{ background: notifEnabled ? T.accentSoft : T.surfaceRaised, border: `1px solid ${notifEnabled ? T.accent + "66" : T.line}` }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: notifEnabled ? T.accent : T.mutedDim }}>{notifEnabled ? "ACTIVÉES" : "DÉSACTIVÉES"}</span>
          </button>
        </div>
        {notifEnabled && (
          <div className="flex items-center justify-between rounded-xl px-4 py-2.5 mt-2" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
            <span style={{ fontFamily: F.serif, fontSize: 13, color: T.cream }}>Me prévenir dès</span>
            <div className="flex gap-1.5">
              {[2, 5].map((v) => (
                <button key={v} onClick={() => changeNotifSeuil(v)} className="rounded-full px-3 py-1.5"
                  style={{ background: notifSeuil === v ? T.accentSoft : T.surfaceRaised, border: `1px solid ${notifSeuil === v ? T.accent + "66" : T.line}` }}>
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: notifSeuil === v ? T.accent : T.mutedDim, fontWeight: 700 }}>J-{v}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="mt-2" style={{ fontFamily: F.mono, fontSize: 9, color: T.mutedDim, lineHeight: 1.5 }}>
          Notification locale à l'ouverture de l'appli (pas d'alerte si l'appli est fermée en arrière-plan). Réglage propre à cet iPhone — à refaire si tu changes d'appareil.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="NOMBRE DE FILMS SUR L'ACCUEIL" subtitle={`${nbAccueil} films`}>
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
      </CollapsibleSection>

      <CollapsibleSection title="DONNÉES" subtitle={`${filmCount} fiches`}>
        <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <div>
            <p style={{ fontFamily: F.serif, fontSize: 13.5, color: T.cream }}>Bibliothèque</p>
            <p style={{ fontFamily: F.mono, fontSize: 9.5, color: T.mutedDim }}>{filmCount} fiches</p>
          </div>
          <button onClick={handleRefresh} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.accentSoft }}>
            <RefreshCw size={14} color={T.accent} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl px-4 py-3 mt-2" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <div className="pr-3">
            <p style={{ fontFamily: F.serif, fontSize: 13.5, color: T.cream }}>Bandes-annonces manquantes</p>
            <p style={{ fontFamily: F.mono, fontSize: 9, color: T.mutedDim, marginTop: 2 }}>
              {retryTrailersResult != null ? `${retryTrailersResult} fiche${retryTrailersResult > 1 ? "s" : ""} relancée${retryTrailersResult > 1 ? "s" : ""}` : "Redemander en masse"}
            </p>
          </div>
          <button onClick={handleRetryTrailers} disabled={retryingTrailers} className="flex-shrink-0 rounded-full px-3 py-1.5" style={{ background: T.surfaceRaised, border: `1px solid ${T.line}`, opacity: retryingTrailers ? 0.6 : 1 }}>
            <RefreshCw size={13} color={T.accentSecondary} style={{ animation: retryingTrailers ? "spin 0.8s linear infinite" : "none" }} />
          </button>
        </div>
        <p className="mt-2" style={{ fontFamily: F.mono, fontSize: 9, color: T.mutedDim, lineHeight: 1.5 }}>
          Vide l'état d'enrichissement des fiches sans bande-annonce pour que le script les reprenne au prochain cycle — n'affecte ni l'affiche, ni le synopsis, ni les autres infos déjà récupérées.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="À PROPOS" subtitle="V2.0">
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
      </CollapsibleSection>
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
          {CURRENT_THEME === "kansoHeritage" ? (
            <span style={{ fontFamily: F.marquee, fontSize: 16, color: T.cream, letterSpacing: 1 }}>印 LE GUICHET</span>
          )  : CURRENT_THEME === "bd" ? (
            <span className="relative inline-block px-3 py-1.5" style={{ background: T.accentSoft, border: `${T.borderWidth}px solid ${T.cream}`, borderRadius: 14 }}>
              <span style={{ fontFamily: F.marquee, fontSize: 13, color: T.cream }}>LE GUICHET</span>
            </span>
          )  : CURRENT_THEME === "salle" ? (
            <span style={{ fontFamily: F.serif, fontSize: 18, color: T.cream, letterSpacing: 2, fontStyle: "italic" }}>Le Guichet</span>
          ) : CURRENT_THEME === "jardin" ? (
            <span style={{ fontFamily: F.serif, fontSize: 17, color: T.cream, fontStyle: "italic" }}>Le Guichet</span>
          ) : CURRENT_THEME === "projectionniste" ? (
            <span style={{ fontFamily: F.marquee, fontSize: 15, color: T.accent, letterSpacing: 1.5 }}>CARNET DE CABINE</span>
          ) : CURRENT_THEME === "bento" ? (
            <span className="px-3 py-1.5" style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 999, fontFamily: F.marquee, fontSize: 13, color: T.cream, fontWeight: 700, boxShadow: T.shadow }}>Guichet</span>
          ) : CURRENT_THEME === "palais" ? (
            <span style={{ fontFamily: F.serif, fontSize: 20, color: T.cream, letterSpacing: 3 }}>LE GUICHET</span>
          ) : CURRENT_THEME === "nvague" ? (
            <span style={{ fontFamily: F.marquee, fontSize: 22, color: T.cream }}>LE GUICHET</span>
          ) : CURRENT_THEME === "popbrutal" ? (
            <span className="px-3 py-1" style={{ background: T.cream, color: T.bg, fontFamily: F.marquee, fontSize: 16, border: `${T.borderWidth}px solid ${T.cream}`, transform: "rotate(-1deg)", display: "inline-block" }}>GUICHET</span>
          ) : CURRENT_THEME === "table" ? (
            <span style={{ fontFamily: F.mono, fontSize: 16, color: T.accent, letterSpacing: 1, fontWeight: 700 }}>LE GUICHET</span>
          ) : CURRENT_THEME === "affiche" ? (
            <span className="px-3 py-1" style={{ background: T.cream, color: T.bg, fontFamily: F.marquee, fontSize: 15, boxShadow: T.shadow }}>GUICHET</span>
          ) : CURRENT_THEME === "letterboxd" ? (
            <span style={{ fontFamily: F.serif, fontSize: 18, color: T.cream, fontWeight: 700 }}>Le Guichet</span>
          )      : CURRENT_THEME === "popart" ? (
            <span style={{ fontFamily: F.marquee, fontSize: 20, color: T.cream }}>LE GUICHET</span>
          ) : CURRENT_THEME === "cacartoon" ? (
            <span className="inline-flex items-center gap-1.5">
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: T.accent }} />
              <span style={{ fontFamily: F.marquee, fontSize: 20, color: T.gold }}>Le Guichet</span>
            </span>
          ) : (
            <span style={{ fontFamily: F.marquee, fontSize: 21, color: T.accent, letterSpacing: 1.5 }}>GUICHET</span>
          )}
          <button onClick={onClose}><X size={18} color={T.muted} /></button>
        </div>
        {groups.map((g, gi) => (
          <div key={gi} className="px-4 mb-4">
            <p className="mb-1.5" style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.4, color: T.mutedDim }}>{g.label}</p>
            <div className="overflow-hidden" style={{
              background: T.surface,
              border: CURRENT_THEME === "bd" ? `${T.borderWidth}px solid ${T.cream}` : `1px solid ${T.line}`,
              borderRadius: CURRENT_THEME === "bd" ? T.radiusSm : 12,
              boxShadow: CURRENT_THEME === "bd" ? T.shadow : "none",
            }}>
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
/* ------------------------------------------------------------------ */
/* INTRO DE CHARGEMENT — rideau/marquee joué UNE FOIS au vrai lancement */
/* de l'appli (pas à chaque navigation), pendant le chargement réseau,  */
/* quel que soit le thème actif. Son de projecteur synthétisé (Web      */
/* Audio, pas de fichier externe) + tentative de vibration.             */
/* ------------------------------------------------------------------ */
function playProjectorSound_() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    // Bourdonnement grave de moteur de projecteur (bruit filtré)
    const bufferSize = ctx.sampleRate * 1.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 180;
    filter.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.15);
    gain.gain.linearRampToValueAtTime(0.0001, now + 1.3);
    noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    noise.start(now); noise.stop(now + 1.4);
    // Petit "clic" sec de déclenchement, comme un obturateur
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = "square"; click.frequency.value = 800;
    clickGain.gain.setValueAtTime(0.15, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    click.connect(clickGain); clickGain.connect(ctx.destination);
    click.start(now); click.stop(now + 0.07);
  } catch {
    // Contexte audio indisponible ou bloqué par le navigateur — silencieux, pas grave.
  }
}

function AppBootIntro({ ready, onDone }) {
  const [lit, setLit] = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLit(true), 30);
    playProjectorSound_();
    // Vibration : ne fonctionne PAS sur iPhone (Safari/PWA n'implémentent pas
    // la Vibration API) — tentative silencieuse, sans effet visible sur iOS,
    // mais active sur Android si jamais l'appli y tourne un jour.
    try { if (navigator.vibrate) navigator.vibrate([25, 40, 25]); } catch {}
    return () => clearTimeout(t);
  }, []);
  // Chronologie, une fois les films chargés :
  //   1. le rideau s'ouvre (1,3 s) ;
  //   2. le logo CINÉMAISON reste ensuite affiché, fixe, sur fond noir
  //      pendant une courte pause (1,1 s) — c'est la "photo" demandée ;
  //   3. tout s'efface en fondu (0,6 s) pour révéler l'appli en dessous.
  // Durée totale de l'intro une fois les données prêtes : ≈ 3,2 s (900 ms
  // avant le début de l'ouverture + 1,3 s d'ouverture + 1,1 s de pause +
  // 0,6 s de fondu final). Si le réseau est lent, le marquee/bobine
  // continue de tourner en boucle avant même que ce minutage démarre.
  const CURTAIN_OPEN_DELAY = 900;
  const CURTAIN_OPEN_DURATION = 1300;
  const HOLD_DURATION = 1100;
  const FADE_OUT_DURATION = 600;
  useEffect(() => {
    if (!ready) return;
    const t1 = setTimeout(() => setCurtainOpen(true), CURTAIN_OPEN_DELAY);
    const t2 = setTimeout(() => setFadingOut(true), CURTAIN_OPEN_DELAY + CURTAIN_OPEN_DURATION + HOLD_DURATION);
    const t3 = setTimeout(() => { setHidden(true); onDone && onDone(); }, CURTAIN_OPEN_DELAY + CURTAIN_OPEN_DURATION + HOLD_DURATION + FADE_OUT_DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [ready]);
  if (hidden) return null;

  const word = "CINÉMAISON";
  // Couleurs et polices fixes, volontairement PAS liées au thème actif (T/F)
  // — Ben veut la même animation d'ouverture, à l'identique, quel que soit
  // le thème choisi (contrairement au reste de l'appli qui suit T/F).
  const GOLD = "#C58D29";
  const CREAM = "#F3EEE3";
  const MUTED = "#9C9284";
  const MONO = "'IBM Plex Mono', monospace";
  const MARQUEE_FONT = "'Bebas Neue', sans-serif";

  const fringeStyle = { position: "absolute", bottom: 0, left: 0, right: 0, height: 14, background: `repeating-linear-gradient(90deg, ${GOLD} 0 6px, transparent 6px 12px)`, opacity: 0.5 };
  const curtainBase = {
    // z-index 45 : SOUS le marquee (z-index 50 ci-dessous), pour que
    // "CINÉMAISON" et la bobine soient visibles EN SURIMPRESSION du
    // velours pendant la fermeture — pas cachés derrière.
    position: "absolute", top: 0, bottom: 0, width: "52%", zIndex: 45,
    background: "repeating-linear-gradient(90deg, #6E1F1A 0px, #6E1F1A 14px, #5A1815 14px, #5A1815 28px), linear-gradient(180deg,#7A2620,#4A1310)",
    boxShadow: "inset -30px 0 60px rgba(0,0,0,0.55)",
    transition: `transform ${CURTAIN_OPEN_DURATION}ms cubic-bezier(.65,0,.35,1)`,
    pointerEvents: curtainOpen ? "none" : "auto",
  };
  return (
    <div className="absolute inset-0" style={{ zIndex: 100, overflow: "hidden", background: "#050403", opacity: fadingOut ? 0 : 1, transition: `opacity ${FADE_OUT_DURATION}ms ease` }}>
      <div style={{ ...curtainBase, left: 0, transformOrigin: "left", transform: curtainOpen ? "translateX(-102%) scaleX(0.4)" : "translateX(0) scaleX(1)" }}>
        <div style={fringeStyle} />
      </div>
      <div style={{ ...curtainBase, right: 0, transformOrigin: "right", transform: curtainOpen ? "translateX(102%) scaleX(0.4)" : "translateX(0) scaleX(1)" }}>
        <div style={fringeStyle} />
      </div>

      {/* Le logo reste affiché, fixe, sur fond noir après l'ouverture du   */}
      {/* rideau — il ne s'efface plus en même temps que le rideau s'ouvre, */}
      {/* seulement au moment du fondu final (fadingOut).                  */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 50, pointerEvents: "none" }}>
        <div className="flex gap-1 mb-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: GOLD, boxShadow: `0 0 6px ${GOLD}88`, animation: "seanceChase 1.6s infinite", animationDelay: `${i * 0.07}s` }} />
          ))}
        </div>
        <div className="flex overflow-hidden">
          {[...word].map((ch, i) => (
            <span key={i} style={{
              fontFamily: MARQUEE_FONT, fontSize: 30, lineHeight: 1, letterSpacing: 1.5,
              color: lit ? CREAM : "transparent",
              textShadow: lit ? `0 0 14px ${GOLD}88` : "none",
              opacity: lit ? 1 : 0, transform: lit ? "translateY(0)" : "translateY(18px)",
              transition: `all .5s ease ${i * 0.09}s`,
            }}>{ch === " " ? "\u00A0" : ch}</span>
          ))}
        </div>
        <p style={{ marginTop: 14, fontFamily: MONO, fontSize: 10, letterSpacing: 5, color: MUTED, opacity: lit ? 1 : 0, transition: "opacity 1s ease 1.3s" }}>
          VOTRE CINÉMA. VOS RÈGLES.
        </p>
        {!ready && (
          <div className="flex items-center gap-2 mt-5" style={{ opacity: lit ? 1 : 0, transition: "opacity 1s ease 1.1s" }}>
            <Film size={13} color={GOLD} style={{ animation: "spin 1.6s linear infinite" }} />
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 3, color: MUTED }}>CHARGEMENT DES FILMS…</span>
          </div>
        )}
      </div>
    </div>
  );
}

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
  // Écran d'ouverture (marquee + rideau) — reste monté jusqu'à ce que le
  // rideau ait fini de s'ouvrir, PAS juste tant que films est vide, pour
  // avoir une vraie transition au lieu d'un cut brutal dès l'arrivée des
  // données.
  const [showBoot, setShowBoot] = useState(true);

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

  // Recharge automatiquement les films à chaque fois que l'appli redevient
  // visible — pas seulement au tout premier chargement. Sur iOS, fermer
  // l'appli (sans la tuer) puis la rouvrir déclenche un simple retour au
  // premier plan (pas un vrai rechargement de page), donc sans ce listener
  // les données restaient figées depuis la dernière ouverture, parfois
  // depuis plusieurs heures.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") loadFilms();
    };
    document.addEventListener("visibilitychange", onVisible);
    // Filet de sécurité supplémentaire : certains navigateurs/PWA déclenchent
    // "pageshow" (retour de cache arrière) sans passer par visibilitychange.
    window.addEventListener("pageshow", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, []);

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

  // Notifications locales : à chaque chargement de la bibliothèque (donc à
  // l'ouverture de l'appli, ou quand elle revient au premier plan grâce au
  // listener plus haut), vérifie s'il y a des films sous le seuil choisi et
  // envoie UNE notification récap par jour (pas une par film, pour ne pas
  // spammer). "Une fois par jour" = pas de re-déclenchement si l'appli est
  // rouverte plusieurs fois le même jour.
  useEffect(() => {
    if (!films || !getStoredNotifEnabled_()) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const todayKey = new Date().toISOString().slice(0, 10);
    if (getLastNotifDate_() === todayKey) return;
    const seuil = getStoredNotifSeuil_();
    const urgents = films
      .map((f) => ({ f, days: computeExpiryDays(f) }))
      .filter((x) => x.days != null && x.days >= 0 && x.days <= seuil);
    if (urgents.length === 0) { setLastNotifDate_(todayKey); return; }
    urgents.sort((a, b) => a.days - b.days);
    const titres = urgents.slice(0, 3).map((x) => x.f.titre).join(", ");
    const suffix = urgents.length > 3 ? ` (+${urgents.length - 3} autres)` : "";
    try {
      new Notification("CinéMaison — ça part bientôt", {
        body: `${titres}${suffix}`,
        icon: "/logos/canal.png",
      });
    } catch {}
    setLastNotifDate_(todayKey);
  }, [films]);

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
  // Le Projectionniste : compte à rebours d'amorce avant chaque ouverture
  // de fiche, activable/désactivable depuis Réglages (localStorage), pour
  // ne pas ralentir une session où on enchaîne beaucoup de fiches.
  const [leaderEnabled, setLeaderEnabled] = useState(() => {
    try { return localStorage.getItem("cinemaison_leader_countdown") !== "0"; } catch { return true; }
  });
  const [leaderPendingFilm, setLeaderPendingFilm] = useState(null);
  const toggleLeaderEnabled = (value) => {
    setLeaderEnabled(value);
    try { localStorage.setItem("cinemaison_leader_countdown", value ? "1" : "0"); } catch {}
  };
  const openFiche = (film) => {
    if (CURRENT_THEME === "projectionniste" && leaderEnabled) {
      setLeaderPendingFilm(film);
      return;
    }
    setScreen({ name: "fiche", params: { film, from: screen } });
  };
  // Permet à un écran (Recherche notamment) de garder une trace de son
  // état (texte tapé, filtres…) directement dans les params de l'écran
  // courant — pour que ce texte survive au passage par une fiche puis au
  // retour, au lieu d'être perdu à chaque remontage du composant.
  const updateScreenParams = (patch) => setScreen((s) => ({ ...s, params: { ...s.params, ...patch } }));
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
      body = <RechercheScreen films={films} onOpen={openFiche} onBack={goAccueil} onMenu={() => setMenuOpen(true)}
        initialQuery={screen.params.query} onQueryChange={(q) => updateScreenParams({ query: q })} />;
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
      body = <ThemesScreen theme={theme} onChangeTheme={changeTheme} onBack={() => navigate({ name: "reglages", params: {} })} onMenu={() => setMenuOpen(true)} leaderEnabled={leaderEnabled} onToggleLeader={toggleLeaderEnabled} />;
    }
  }

  const activeTab =
    screen.name === "accueil" ? "accueil" :
    screen.name === "biblio" && screen.params.type === "Film" ? "biblio" :
    screen.name === "alertes" ? "alertes" :
    screen.name === "ajouter" ? "ajouter" : null;

  return (
    <div className="w-full flex items-center justify-center" style={{ background: T.bg, height: "100dvh" }}>
      <style>{`@font-face { font-family: 'Simpsonfont'; src: url('/fonts/Simpsonfont.ttf') format('truetype'); font-weight: normal; font-style: normal; font-display: swap; } @keyframes spin { to { transform: rotate(360deg); } } @keyframes minitelBlink { 50% { opacity: 0; } } @keyframes seanceChase { 0%,100% { opacity: 0.25; } 50% { opacity: 1; } } @keyframes toastSlideIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
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
          // Papier ancien nettement marqué (taches d'encre contrastées aux  //
          // quatre coins + grain fibreux visible) — uniquement en thème     //
          // "kansoHeritage".                                                //
          ...(CURRENT_THEME === "kansoHeritage" ? {
            backgroundImage: `
              radial-gradient(ellipse 340px 260px at 8% 0%, rgba(90,65,30,0.22), transparent 65%),
              radial-gradient(ellipse 300px 300px at 100% 20%, rgba(38,53,74,0.14), transparent 62%),
              radial-gradient(ellipse 260px 300px at 0% 75%, rgba(200,90,50,0.13), transparent 62%),
              radial-gradient(ellipse 380px 260px at 95% 95%, rgba(90,65,30,0.20), transparent 65%),
              radial-gradient(circle 6px at 30% 35%, rgba(90,65,30,0.22), transparent 75%),
              radial-gradient(circle 9px at 70% 55%, rgba(90,65,30,0.18), transparent 75%),
              radial-gradient(circle 5px at 55% 82%, rgba(90,65,30,0.20), transparent 75%),
              radial-gradient(${T.cream}35 0.6px, transparent 0.7px)
            `,
            backgroundSize: "100% 100%,100% 100%,100% 100%,100% 100%,100% 100%,100% 100%,100% 100%, 3px 3px",
            backgroundColor: "#EBDFC0",
          } : {}),
        }}
      >
        {/* Kanso Héritage : reliure cousue sur le bord gauche + paquet      */}
        {/* ficelé (ficelle + sceau) sous l'en-tête — décor en surimpression, */}
        {/* visible sur tous les écrans du thème sans repousser le contenu   */}
        {/* existant (pointer-events désactivés, ne gêne jamais le tap).     */}
        {CURRENT_THEME === "kansoHeritage" && (
          <>
            <div className="absolute" style={{
              left: 8, top: 60, bottom: 16, width: 2, zIndex: 5, pointerEvents: "none", opacity: 0.5,
              background: "repeating-linear-gradient(180deg, #B79A58 0 10px, #8A7038 10px 12px)",
            }}>
              <span className="absolute rounded-full" style={{ left: -3, top: -4, width: 8, height: 8, background: "#8A7038" }} />
              <span className="absolute rounded-full" style={{ left: -3, bottom: -4, width: 8, height: 8, background: "#8A7038" }} />
            </div>
            <div className="absolute" style={{ top: 96, left: "8%", width: "84%", height: 4, zIndex: 5, pointerEvents: "none", opacity: 0.5, background: "#B79A58", borderRadius: 2, transform: "rotate(1.5deg)" }}>
              <span className="absolute rounded-full" style={{
                top: -13, left: "50%", width: 30, height: 30, marginLeft: -15,
                background: "radial-gradient(circle at 35% 30%, #D46A3F, #A6472A)", boxShadow: "0 2px 5px rgba(0,0,0,.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ color: "#F5E9D8", fontSize: 11, fontFamily: "'Noto Serif Display', serif" }}>感</span>
              </span>
            </div>
          </>
        )}

        {error && (
          <div className="m-4 rounded-lg p-3" style={{ background: T.alertSoft, border: `1px solid ${T.alert}44` }}>
            <p style={{ fontFamily: F.mono, fontSize: 11, color: T.alert }}>Erreur : {error}</p>
          </div>
        )}

        {showBoot && <AppBootIntro ready={!!films || !!error} onDone={() => setShowBoot(false)} />}
        {leaderPendingFilm && (
          <LeaderCountdown onDone={() => {
            const film = leaderPendingFilm;
            setLeaderPendingFilm(null);
            setScreen({ name: "fiche", params: { film, from: screen } });
          }} />
        )}

        <PullToRefresh onRefresh={loadFilms}>{body}</PullToRefresh>

        {films && <BottomNav active={activeTab} onNavigate={navigate} />}
        {films && <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} films={films} onNavigate={navigate} />}
      </div>
    </div>
  );
}
