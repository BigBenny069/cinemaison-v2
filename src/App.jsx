import { useState, useEffect, useMemo } from "react";
import { Menu, Shuffle, ChevronLeft, Pencil, Trash2, Star, Film, Clock, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/* TOKENS — palette CinéMaison                                        */
/* ------------------------------------------------------------------ */
const T = {
  bg: "#14100C",
  surface: "#1F1912",
  surfaceRaised: "#2A2216",
  accent: "#C58D29",
  accentSoft: "#3A2C13",
  accentSecondary: "#56929F",
  cream: "#F3EEE3",
  muted: "#9C9284",
  mutedDim: "#6B6355",
  line: "#332B22",
  alert: "#B85C4A",
  alertSoft: "#2E1A15",
};

const F = { marquee: "'Bebas Neue', sans-serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Mono', monospace" };

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

function PlatformIcon({ label }) {
  const [failed, setFailed] = useState(false);
  const slug = PLATFORM_SLUGS[label];
  const showImg = slug && !failed;
  return (
    <span className="inline-flex items-center gap-1.5">
      {showImg ? (
        <img
          src={`/logos/${slug}.png`}
          alt={label}
          className="flex-shrink-0 rounded-md"
          style={{ width: 20, height: 20, objectFit: "contain", background: "#0A0A0A" }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="flex items-center justify-center flex-shrink-0 rounded-md" style={{ width: 20, height: 20, background: T.surfaceRaised, fontSize: 9, color: T.muted }}>
          {(label || "?")[0]}
        </span>
      )}
      <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 0.5, color: T.muted }}>{(label || "").toUpperCase()}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* ELEMENTS SIGNATURE                                                  */
/* ------------------------------------------------------------------ */
function Poster({ film, className, style }) {
  const [failed, setFailed] = useState(false);
  if (!film.affiche || failed) {
    return (
      <div className={className} style={{ ...style, background: `linear-gradient(160deg, ${T.accentSoft}, ${T.surfaceRaised})`, display: "flex", alignItems: "center", justifyContent: "center", padding: 6 }}>
        <span style={{ fontFamily: F.marquee, fontSize: 12, color: T.accent, letterSpacing: 0.5, textAlign: "center", lineHeight: 1.15 }}>
          {(film.titre || "").slice(0, 22).toUpperCase()}
        </span>
      </div>
    );
  }
  return <img src={film.affiche} alt={film.titre} className={className} style={{ ...style, objectFit: "cover", objectPosition: "top" }} onError={() => setFailed(true)} />;
}

function RatingStamp({ value, size = 58 }) {
  const rating = parseRating(value);
  if (rating == null) return null;
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

function SectionTitle({ children, icon: Icon = Film }) {
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
  return (
    <button onClick={() => onOpen(film)} className="flex text-left rounded-2xl overflow-hidden w-full"
      style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      <Poster film={film} className="w-20 h-28 flex-shrink-0" />
      <Perforation />
      <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
        <div>
          <p className="truncate" style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 15, color: T.cream }}>{film.titre}</p>
          <p style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.4 }}>
            {film.annee} · {(film.type || "").toUpperCase()}
          </p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 0.5, color: T.muted }}>{(film.plateforme || "").toUpperCase()}</span>
          {expiryDays != null ? (
            <span style={{ fontFamily: F.mono, fontSize: 10, color: T.alert, fontWeight: 600 }}>{`J-${expiryDays}`}</span>
          ) : parseRating(film.noteLetterboxd) != null ? (
            <span style={{ fontFamily: F.mono, fontSize: 10, color: T.accent, fontWeight: 600 }}>★ {parseRating(film.noteLetterboxd).toFixed(1)}</span>
          ) : null}
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
        <Poster film={film} className="w-full rounded-lg" style={{ height: 152 }} />
        {showStamp && expiryDays != null && <DateStamp days={expiryDays} />}
      </div>
      <p className="truncate mt-1.5" style={{ fontFamily: F.serif, fontSize: 12, fontWeight: 600, color: T.cream }}>{film.titre}</p>
      <p style={{ fontFamily: F.mono, fontSize: 9.5, color: T.mutedDim }}>{film.plateforme}</p>
      <p style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accent }}>{sub}</p>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* ECRAN ACCUEIL                                                       */
/* ------------------------------------------------------------------ */
function AccueilScreen({ films, onOpen }) {
  const bientot = useMemo(() => {
    return films
      .map((f) => ({ f, days: computeExpiryDays(f) }))
      .filter((x) => x.days != null && x.days >= 0)
      .sort((a, b) => a.days - b.days)
      .slice(0, 8)
      .map((x) => x.f);
  }, [films]);

  // L'API renvoie les films dans l'ordre des lignes du Sheet, qui est
  // fiable pour l'ordre d'ajout (les nouvelles fiches sont ajoutées en bas).
  // Les ID ne sont volontairement pas utilisés pour ce tri : certains sont
  // séquentiels (FILM0001...) mais d'autres, issus d'anciens imports, sont
  // des identifiants aléatoires — les mélanger fausse le classement.
  const derniers = useMemo(() => {
    return [...films].reverse().slice(0, 8);
  }, [films]);

  const [suggestion] = useState(() => {
    const eligibles = films.filter((f) => f.type === "Film");
    const pool = eligibles.length > 0 ? eligibles : films;
    return pool[Math.floor(Math.random() * pool.length)];
  });

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      <div className="flex items-center justify-between px-4 pb-4" style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}>
        <button className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: T.surface, border: `1px solid ${T.accentSecondary}55` }}>
          <Menu size={16} color={T.accentSecondary} />
        </button>
        <div className="flex items-center gap-2">
          <LogoMark />
          <h1 style={{ fontFamily: F.marquee, fontSize: 26, color: T.accent, letterSpacing: 1 }}>CINÉMAISON</h1>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {bientot.length > 0 && (
        <>
          <SectionTitle icon={Clock}>ÇA PART BIENTÔT</SectionTitle>
          <div className="flex gap-3 px-4 overflow-x-auto mb-5">
            {bientot.map((f) => (
              <MiniCard key={f.id} film={f} onOpen={onOpen}
                sub={parseRating(f.noteLetterboxd) != null ? `★ ${parseRating(f.noteLetterboxd).toFixed(1)}` : "pas de note"} showStamp />
            ))}
          </div>
        </>
      )}

      <SectionTitle icon={Film}>DERNIERS AJOUTS</SectionTitle>
      <div className="flex gap-3 px-4 overflow-x-auto mb-5">
        {derniers.map((f) => (
          <MiniCard key={f.id} film={f} onOpen={onOpen}
            sub={parseRating(f.noteLetterboxd) != null ? `★ ${parseRating(f.noteLetterboxd).toFixed(1)}` : "pas de note"} />
        ))}
      </div>

      {suggestion && (
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
function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.line}` }}>
      <span style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.5 }}>{label.toUpperCase()}</span>
      <span style={{ fontFamily: F.serif, fontSize: 12.5, color: T.cream, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function FicheDetailScreen({ film, onBack }) {
  const expiryDays = computeExpiryDays(film);
  const cast = (film.casting || "").split(",").map((s) => s.trim()).filter(Boolean);
  const [posterOpen, setPosterOpen] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto relative pb-6">
      <div onClick={() => setPosterOpen(true)} className="relative" style={{ height: 340, cursor: "pointer" }}>
        <Poster film={film} className="w-full h-full" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(20,16,12,0.1) 40%, ${T.bg} 100%)` }} />
        <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="absolute left-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ top: "max(16px, env(safe-area-inset-top))", background: "rgba(20,16,12,0.55)" }}>
          <ChevronLeft size={18} color={T.cream} />
        </button>
        <div className="absolute right-4 flex gap-2" style={{ top: "max(16px, env(safe-area-inset-top))" }}>
          <button onClick={(e) => e.stopPropagation()} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(20,16,12,0.55)" }}><Pencil size={15} color={T.accentSecondary} /></button>
          <button onClick={(e) => e.stopPropagation()} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(20,16,12,0.55)" }}><Trash2 size={16} color={T.alert} /></button>
        </div>
      </div>

      <div className="px-5 -mt-10 relative">
        <div className="flex items-end justify-between mb-1">
          <h2 style={{ fontFamily: F.marquee, fontSize: 27, color: T.cream, letterSpacing: 0.5, lineHeight: 1 }}>{film.titre}</h2>
          <RatingStamp value={film.noteLetterboxd} />
        </div>
        <p style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.5 }}>
          {(film.type || "").toUpperCase()} · {film.annee} · {film.duree || "—"}
        </p>
        <div className="mt-2"><PlatformIcon label={film.plateforme} /></div>

        {expiryDays != null && expiryDays >= 0 && (
          <div className="flex items-center gap-3 rounded-xl p-3 mt-4" style={{ background: T.alertSoft, border: `1px solid ${T.alert}44` }}>
            <span style={{ fontFamily: F.marquee, fontSize: 22, color: T.alert }}>J-{expiryDays}</span>
            <span style={{ fontFamily: F.mono, fontSize: 9.5, color: "#E3B3A6" }}>DERNIÈRE SÉANCE PRÉVUE</span>
          </div>
        )}

        {film.synopsis && (
          <>
            <h4 className="mt-5 mb-1" style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: 1.4, color: T.mutedDim }}>SYNOPSIS</h4>
            <p style={{ fontFamily: F.serif, fontSize: 13.5, lineHeight: 1.6, color: T.muted }}>{film.synopsis}</p>
          </>
        )}

        {cast.length > 0 && (
          <>
            <h4 className="mt-5 mb-2" style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: 1.4, color: T.mutedDim }}>DISTRIBUTION</h4>
            <div className="flex gap-2 flex-wrap mb-2">
              {cast.map((c) => (
                <span key={c} className="rounded-full px-3 py-1.5" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.serif, fontSize: 12, color: T.muted }}>{c}</span>
              ))}
            </div>
          </>
        )}

        <h4 className="mt-4 mb-1" style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: 1.4, color: T.mutedDim }}>FICHE TECHNIQUE</h4>
        <Row label="Réalisateur" value={film.realisateur} />
        <Row label="Genre" value={film.genre} />
        <Row label="Date de dispo. (saisie)" value={film.dateManuelle} />
        <Row label="Date de dispo. (auto)" value={film.dateAuto} />
        <Row label="Votes Letterboxd" value={film.votesLetterboxd} />

        {film.urlLetterboxd && (
          <div className="mt-4">
            <a href={film.urlLetterboxd} target="_blank" rel="noreferrer"><LetterboxdMark /></a>
          </div>
        )}
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* APP                                                                 */
/* ------------------------------------------------------------------ */
export default function App() {
  const [films, setFilms] = useState(null);
  const [error, setError] = useState(null);
  const [openFilm, setOpenFilm] = useState(null);

  useEffect(() => {
    fetch("/api/get-films")
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json();
      })
      .then((data) => setFilms(data))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="w-full min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
      <div className="flex flex-col w-full" style={{ maxWidth: 460, minHeight: "100vh", background: T.bg }}>
        {error && (
          <div className="m-4 rounded-lg p-3" style={{ background: T.alertSoft, border: `1px solid ${T.alert}44` }}>
            <p style={{ fontFamily: F.mono, fontSize: 11, color: T.alert }}>Erreur : {error}</p>
          </div>
        )}

        {!films && !error && (
          <p className="p-4" style={{ fontFamily: F.serif, color: T.muted }}>Chargement des films…</p>
        )}

        {films && !openFilm && <AccueilScreen films={films} onOpen={setOpenFilm} />}
        {films && openFilm && <FicheDetailScreen film={openFilm} onBack={() => setOpenFilm(null)} />}
      </div>
    </div>
  );
}
