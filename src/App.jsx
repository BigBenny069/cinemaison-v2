import { useState, useEffect, useMemo } from "react";
import { Menu, Shuffle, ChevronLeft, ChevronRight, Pencil, Trash2, Star, Film, Clock, X, Search, Rocket, Minus, Plus, Check, RefreshCw, ExternalLink, Info, PlusCircle, CalendarDays } from "lucide-react";

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
  accentSecondarySoft: "#16262A",
  cream: "#F3EEE3",
  muted: "#9C9284",
  mutedDim: "#6B6355",
  line: "#332B22",
  alert: "#B85C4A",
  alertSoft: "#2E1A15",
};

const F = { marquee: "'Bebas Neue', sans-serif", serif: "'Source Serif 4', serif", mono: "'IBM Plex Mono', monospace" };

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
function AccueilScreen({ films, onOpen, onSearch, onMenu, onAdd, nbAccueil }) {
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
    const eligibles = films.filter((f) => f.type === "Film");
    const pool = eligibles.length > 0 ? eligibles : films;
    return pool[Math.floor(Math.random() * pool.length)];
  });

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      <div className="flex items-center justify-between px-4 pb-4" style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}>
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
          style={{ background: T.surface, border: `1px solid ${T.line}` }}
        >
          <Search size={15} color={T.mutedDim} />
          <span style={{ fontFamily: F.serif, fontSize: 13.5, color: T.mutedDim }}>Titre, réalisateur, acteur…</span>
        </button>
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
    <div className="flex-1 overflow-y-auto pb-6 px-5">
      <ScreenHeader title="MODIFIER" onBack={onCancel} />

      <SectionLabel>IDENTIFICATION</SectionLabel>
      <label className="block mb-4">
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accentSecondary, letterSpacing: 1 }}>TITRE *</span>
        <input value={titre} onChange={(e) => setTitre(e.target.value)} className="w-full mt-1.5 rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.serif, fontSize: 14, color: T.cream }} />
      </label>
      <label className="block mb-4">
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accentSecondary, letterSpacing: 1 }}>ANNÉE *</span>
        <input value={annee} onChange={(e) => setAnnee(e.target.value)} className="w-full mt-1.5 rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.mono, fontSize: 13, color: T.cream }} />
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
          className="w-full mt-1.5 rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.mono, fontSize: 12.5, color: T.cream }} />
      </label>
      <label className="block mb-5">
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.mutedDim, letterSpacing: 1 }}>URL LETTERBOXD</span>
        <input value={urlLetterboxd} onChange={(e) => setUrlLetterboxd(e.target.value)} placeholder="https://letterboxd.com/film/…"
          className="w-full mt-1.5 rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.mono, fontSize: 12.5, color: T.cream }} />
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

function FicheDetailScreen({ film: filmProp, onBack, onFilmUpdated, onDelete }) {
  const [film, setFilm] = useState(filmProp);
  const [editing, setEditing] = useState(false);
  const expiryDays = computeExpiryDays(film);
  const archived = isArchived(film);
  const cast = (film.casting || "").split(",").map((s) => s.trim()).filter(Boolean);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  return (
    <div className="flex-1 overflow-y-auto relative pb-6">
      <div onClick={() => setPosterOpen(true)} className="relative" style={{ height: 340, cursor: "pointer" }}>
        <Poster film={film} className="w-full h-full" style={archived ? { filter: "grayscale(45%)" } : undefined} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgba(20,16,12,0.1) 40%, ${T.bg} 100%)` }} />
        <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="absolute left-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ top: "max(16px, env(safe-area-inset-top))", background: "rgba(20,16,12,0.55)" }}>
          <ChevronLeft size={18} color={T.cream} />
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
        <div className="mt-2"><PlatformIcon label={film.plateforme} /></div>

        {archived ? (
          <div className="rounded-xl p-3 mt-4" style={{ background: T.surfaceRaised, border: `1px solid ${T.line}` }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.5 }}>
              ARCHIVÉ — DATE DÉPASSÉE DEPUIS {Math.abs(daysUntil(parseDateFR(film.dateManuelle)))} JOURS
            </span>
          </div>
        ) : expiryDays != null && expiryDays >= 0 && (
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

        {activeTag(film) && (
          <div className="mt-4">
            <span className="rounded-full px-3 py-1.5" style={{ background: T.accentSoft, border: `1px solid ${T.accent}66`, fontFamily: F.serif, fontSize: 12.5, color: T.accent }}>
              À voir : {activeTag(film)}
            </span>
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
    <button onClick={() => onOpen(film)} className="flex text-left rounded-2xl overflow-hidden w-full" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      <Poster film={film} className="w-20 h-28 flex-shrink-0" />
      <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
        <p className="truncate" style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 15, color: T.cream }}>{film.titre}</p>
        <p style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.4 }}>
          {film.annee} · {(film.plateforme || "").toUpperCase()}
        </p>
        <MatchTag match={match} />
      </div>
    </button>
  );
}

function RechercheScreen({ films, onOpen, onBack }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return films.map((f) => ({ film: f, match: matchFilm(f, query) })).filter((r) => r.match);
  }, [films, query]);

  return (
    <div className="flex-1 overflow-y-auto pb-6 px-5">
      <div className="flex items-center gap-2" style={{ paddingTop: "max(16px, env(safe-area-inset-top))", paddingBottom: 16 }}>
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <ChevronLeft size={16} color={T.muted} />
        </button>
        <h1 style={{ fontFamily: F.marquee, fontSize: 24, color: T.cream, letterSpacing: 0.5, lineHeight: 1 }}>RECHERCHE</h1>
      </div>

      <div className="relative mb-4">
        <Search size={16} color={T.mutedDim} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Titre, réalisateur, acteur…"
          className="w-full rounded-xl pl-10 pr-9 py-3 outline-none"
          style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.serif, fontSize: 14.5, color: T.cream }}
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

function ScreenHeader({ title, onBack, right }) {
  return (
    <div className="flex items-center justify-between" style={{ paddingTop: "max(16px, env(safe-area-inset-top))", paddingBottom: 16 }}>
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <ChevronLeft size={16} color={T.muted} />
        </button>
        <h1 style={{ fontFamily: F.marquee, fontSize: 24, color: T.cream, letterSpacing: 0.5, lineHeight: 1 }}>{title}</h1>
      </div>
      {right}
    </div>
  );
}

function ListResultCard({ film, onOpen, right }) {
  return (
    <button onClick={() => onOpen(film)} className="flex text-left rounded-2xl overflow-hidden w-full" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      <Poster film={film} className="w-20 h-28 flex-shrink-0" style={isArchived(film) ? { filter: "grayscale(55%)", opacity: 0.75 } : undefined} />
      <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
        <p className="truncate" style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 15, color: isArchived(film) ? T.muted : T.cream }}>{film.titre}</p>
        <p style={{ fontFamily: F.mono, fontSize: 10, color: T.mutedDim, letterSpacing: 0.4 }}>{film.annee} · {(film.plateforme || "").toUpperCase()}</p>
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

function BibliothequeScreen({ films, type, onOpen, onBack }) {
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
    <div className="flex-1 overflow-y-auto pb-6 px-5">
      <ScreenHeader title={(type || "").toUpperCase()} onBack={onBack} />
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
          <button key={f.id} onClick={() => onOpen(f)} className="flex items-center gap-3 text-left rounded-lg pr-3 py-2 overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
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

function AlertesScreen({ films, mode: initialMode, onOpen, onBack }) {
  const [tab, setTab] = useState(initialMode || "manuel"); // "manuel" | "auto" | "calendrier"

  const TABS = [
    { id: "manuel", label: "BIENTÔT", icon: Clock },
    { id: "auto", label: "THÉORIQUE", icon: Rocket },
    { id: "calendrier", label: "CALENDRIER", icon: CalendarDays },
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-6 px-5">
      <ScreenHeader title="ALERTES" onBack={onBack} />
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
                className="w-full rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.serif, fontSize: 13, color: T.cream }} />
            </div>
            <div className="overflow-y-auto px-5" style={{ flex: 1 }}>
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

function ExplorerScreen({ films, initialGenre, onOpen, onBack }) {
  const [type, setType] = useState(null);
  const [plateforme, setPlateforme] = useState(null);
  const [duree, setDuree] = useState(null);
  const [genresSel, setGenresSel] = useState(initialGenre ? [initialGenre] : []);
  const [noteMin, setNoteMin] = useState(0);

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
    <div className="flex-1 overflow-y-auto pb-6 px-5">
      <ScreenHeader title="EXPLORER" onBack={onBack} />
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
function GenresScreen({ films, onNavigate, onBack }) {
  const genreCounts = useMemo(() => {
    const m = {};
    films.forEach((f) => (f.genre || "").split(",").map((g) => g.trim()).filter(Boolean).forEach((g) => { m[g] = (m[g] || 0) + 1; }));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [films]);

  return (
    <div className="flex-1 overflow-y-auto pb-6 px-5">
      <ScreenHeader title="GENRES" onBack={onBack} />
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

function AjouterScreen({ onBack, onAdded }) {
  const [type, setType] = useState(null);
  const [titre, setTitre] = useState("");
  const [annee, setAnnee] = useState("");
  const [plateforme, setPlateforme] = useState("");
  const [urlLetterboxd, setUrlLetterboxd] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const canSubmit = titre.trim() && annee.trim() && plateforme;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    const result = await apiWrite("/api/add-film", { titre: titre.trim(), annee: annee.trim(), plateforme, type, urlLetterboxd: urlLetterboxd.trim() || undefined });
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
      <div className="flex-1 overflow-y-auto pb-6 px-5">
        <ScreenHeader title="QUEL TICKET ?" onBack={onBack} />
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
    <div className="flex-1 overflow-y-auto pb-6 px-5">
      <ScreenHeader title="NOUVELLE ENTRÉE" onBack={() => setType(null)} />
      <SectionLabel>IDENTIFICATION</SectionLabel>
      <label className="block mb-4">
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accentSecondary, letterSpacing: 1 }}>TITRE *</span>
        <input value={titre} onChange={(e) => setTitre(e.target.value)} className="w-full mt-1.5 rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.serif, fontSize: 14, color: T.cream }} />
      </label>
      <label className="block mb-4">
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.accentSecondary, letterSpacing: 1 }}>ANNÉE *</span>
        <input value={annee} onChange={(e) => setAnnee(e.target.value)} className="w-full mt-1.5 rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.mono, fontSize: 13, color: T.cream }} />
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
      <label className="block mb-5">
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.mutedDim, letterSpacing: 1 }}>URL LETTERBOXD</span>
        <input value={urlLetterboxd} onChange={(e) => setUrlLetterboxd(e.target.value)} placeholder="https://letterboxd.com/film/…"
          className="w-full mt-1.5 rounded-lg px-3 py-2.5 outline-none" style={{ background: T.surface, border: `1px solid ${T.line}`, fontFamily: F.mono, fontSize: 12.5, color: T.cream }} />
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
function ArchivesScreen({ films, onOpen, onBack }) {
  const [sortRecent, setSortRecent] = useState(true);
  const list = useMemo(() => {
    const arr = films.filter((f) => isArchived(f)).map((f) => ({ f, days: Math.abs(daysUntil(parseDateFR(f.dateManuelle))) }));
    arr.sort((a, b) => sortRecent ? a.days - b.days : b.days - a.days);
    return arr;
  }, [films, sortRecent]);

  return (
    <div className="flex-1 overflow-y-auto pb-6 px-5">
      <ScreenHeader title="ARCHIVES" onBack={onBack}
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

function TagsScreen({ films, tag: initialTag, onOpen, onBack }) {
  const [tag, setTag] = useState(initialTag || "Romy");
  const list = films.filter((f) => tagMatches(f, tag) && !isArchived(f));

  return (
    <div className="flex-1 overflow-y-auto pb-6 px-5">
      <ScreenHeader title="TAGS" onBack={onBack} />
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
function ReglagesScreen({ nbAccueil, onChangeNbAccueil, onRefresh, filmCount, onBack }) {
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = () => { setRefreshing(true); onRefresh(); setTimeout(() => setRefreshing(false), 900); };

  return (
    <div className="flex-1 overflow-y-auto pb-8 px-5">
      <ScreenHeader title="RÉGLAGES" onBack={onBack} />

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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MENU LATÉRAL — GUICHET                                               */
/* ------------------------------------------------------------------ */
function MenuDrawer({ open, onClose, films, onNavigate }) {
  const counts = useMemo(() => {
    const m = {};
    films.forEach((f) => { m[f.type] = (m[f.type] || 0) + 1; });
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
      <div className="absolute left-0 top-0 bottom-0 overflow-y-auto" style={{ width: 278, background: T.bg, borderRight: `1px solid ${T.line}`, transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.28s ease" }}>
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
/* BARRE DE NAVIGATION PERMANENTE                                       */
/* ------------------------------------------------------------------ */
function BottomNav({ active, onNavigate }) {
  const items = [
    { id: "accueil", label: "Accueil", icon: LogoMark, nav: { name: "accueil", params: {} } },
    { id: "biblio", label: "Film", icon: Film, nav: { name: "biblio", params: { type: "Film" } } },
    { id: "alertes", label: "Alertes", icon: Clock, nav: { name: "alertes", params: { mode: "manuel" } } },
    { id: "ajouter", label: "Ajouter", icon: PlusCircle, nav: { name: "ajouter", params: {} } },
  ];
  return (
    <div className="flex-shrink-0 flex items-stretch" style={{ background: T.surface, borderTop: `1px solid ${T.line}`, paddingBottom: "env(safe-area-inset-bottom)" }}>
      {items.map((it) => {
        const isActive = active === it.id;
        const Icon = it.icon;
        return (
          <button key={it.id} onClick={() => onNavigate(it.nav)} className="flex-1 flex flex-col items-center gap-0.5 py-1.5">
            {it.id === "accueil" ? (
              <span className="flex items-center justify-center" style={{ width: 17, height: 17, borderRadius: 4, background: isActive ? T.accent : T.accentSoft }}>
                <span style={{ fontFamily: F.marquee, fontSize: 9.5, color: isActive ? T.bg : T.accent }}>C</span>
              </span>
            ) : (
              <Icon size={15} color={isActive ? T.accent : T.mutedDim} />
            )}
            <span style={{ fontFamily: F.mono, fontSize: 8, letterSpacing: 0.3, color: isActive ? T.accent : T.mutedDim }}>{it.label.toUpperCase()}</span>
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
  const [nbAccueil, setNbAccueil] = useState(8);
  // screen = { name, params }. "fiche" a un champ params.film et params.from
  // (l'écran précédent) pour que le bouton retour ramène au bon endroit.
  const [screen, setScreen] = useState({ name: "accueil", params: {} });

  const loadFilms = () => {
    fetch("/api/get-films")
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json();
      })
      .then((data) => setFilms(data))
      .catch((e) => setError(e.message));
  };

  useEffect(() => { loadFilms(); }, []);

  const navigate = (nav) => { setScreen(nav); setMenuOpen(false); };
  const openFiche = (film) => setScreen({ name: "fiche", params: { film, from: screen } });
  const backFromFiche = () => setScreen(screen.params.from || { name: "accueil", params: {} });
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
        onMenu={() => setMenuOpen(true)} onAdd={() => navigate({ name: "ajouter", params: {} })} nbAccueil={nbAccueil} />;
    } else if (name === "recherche") {
      body = <RechercheScreen films={films} onOpen={openFiche} onBack={goAccueil} />;
    } else if (name === "fiche") {
      body = <FicheDetailScreen film={params.film} onBack={backFromFiche} onFilmUpdated={handleFilmUpdated} onDelete={handleFilmDeleted} />;
    } else if (name === "biblio") {
      body = <BibliothequeScreen films={films} type={params.type} onOpen={openFiche} onBack={goAccueil} />;
    } else if (name === "alertes") {
      body = <AlertesScreen films={films} mode={params.mode} onOpen={openFiche} onBack={goAccueil} />;
    } else if (name === "explorer") {
      body = <ExplorerScreen films={films} initialGenre={params.initialGenre} onOpen={openFiche} onBack={goAccueil} />;
    } else if (name === "genres") {
      body = <GenresScreen films={films} onNavigate={navigate} onBack={goAccueil} />;
    } else if (name === "ajouter") {
      body = <AjouterScreen onBack={goAccueil} onAdded={loadFilms} />;
    } else if (name === "archives") {
      body = <ArchivesScreen films={films} onOpen={openFiche} onBack={goAccueil} />;
    } else if (name === "tags") {
      body = <TagsScreen films={films} tag={params.tag} onOpen={openFiche} onBack={goAccueil} />;
    } else if (name === "reglages") {
      body = <ReglagesScreen nbAccueil={nbAccueil} onChangeNbAccueil={setNbAccueil} onRefresh={loadFilms} filmCount={films.length} onBack={goAccueil} />;
    }
  }

  const activeTab =
    screen.name === "accueil" ? "accueil" :
    screen.name === "biblio" && screen.params.type === "Film" ? "biblio" :
    screen.name === "alertes" ? "alertes" :
    screen.name === "ajouter" ? "ajouter" : null;

  return (
    <div className="w-full flex items-center justify-center" style={{ background: T.bg, height: "100dvh" }}>
      <div className="flex flex-col w-full relative" style={{ maxWidth: 460, height: "100%", background: T.bg }}>
        {error && (
          <div className="m-4 rounded-lg p-3" style={{ background: T.alertSoft, border: `1px solid ${T.alert}44` }}>
            <p style={{ fontFamily: F.mono, fontSize: 11, color: T.alert }}>Erreur : {error}</p>
          </div>
        )}

        {!films && !error && (
          <p className="p-4" style={{ fontFamily: F.serif, color: T.muted }}>Chargement des films…</p>
        )}

        <div className="flex-1 min-h-0 flex flex-col">{body}</div>

        {films && <BottomNav active={activeTab} onNavigate={navigate} />}
        {films && <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} films={films} onNavigate={navigate} />}
      </div>
    </div>
  );
}
