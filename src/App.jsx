import { useState, useEffect } from "react";

/* ------------------------------------------------------------------ */
/* SQUELETTE DE DÉPART — CinéMaison V2                                */
/* Ce fichier prouve que le plumbing fonctionne : le front appelle    */
/* /api/get-films, qui lit ton Google Sheet côté serveur.             */
/* Les écrans complets (Accueil, Bibliothèques, Explorer, Fiche...)   */
/* de CineMaisonApp.jsx seront branchés ici lors de la prochaine      */
/* session — pour l'instant on valide juste que les vraies données    */
/* arrivent bien du Sheet jusqu'au navigateur.                        */
/* ------------------------------------------------------------------ */

export default function App() {
  const [films, setFilms] = useState(null);
  const [error, setError] = useState(null);

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
    <div className="min-h-screen bg-bg text-cream px-4 py-6">
      <h1
        className="text-3xl mb-1"
        style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#C58D29", letterSpacing: 1 }}
      >
        CINÉMAISON
      </h1>
      <p
        className="mb-6"
        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 1, color: "#6B6355" }}
      >
        SQUELETTE V2 — CONNEXION AU GOOGLE SHEET
      </p>

      {error && (
        <div className="rounded-lg p-3 mb-4" style={{ background: "#2E1A15", border: "1px solid #B85C4A44" }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#B85C4A" }}>
            Erreur : {error}
          </p>
        </div>
      )}

      {!films && !error && (
        <p style={{ fontFamily: "'Source Serif 4', serif", color: "#9C9284" }}>Chargement des films…</p>
      )}

      {films && (
        <>
          <p className="mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6B6355" }}>
            {films.length} FICHE{films.length > 1 ? "S" : ""} RÉCUPÉRÉE{films.length > 1 ? "S" : ""} DU SHEET
          </p>
          <div className="flex flex-col gap-2">
            {films.slice(0, 20).map((f) => (
              <div key={f.id} className="rounded-xl p-3 bg-surface" style={{ border: "1px solid #332B22" }}>
                <p style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 15 }}>{f.titre}</p>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#6B6355" }}>
                  {f.annee} · {f.type} · {f.plateforme}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
