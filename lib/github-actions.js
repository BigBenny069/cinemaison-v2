// lib/github-actions.js — CinéMaison V2
//
// Déclenche le workflow GitHub Actions resoudre-letterboxd.yml via
// l'API GitHub (dispatch manuel), utilisé en secours par
// update-film.js/add-film.js quand la tentative rapide (Vercel) échoue
// sur un lien Letterboxd bloqué -- voir la note dans update-film.js
// pour le contexte complet (15/09/2026).
//
// Nécessite un token GitHub (secret Vercel GITHUB_DISPATCH_TOKEN) avec
// la permission "Actions: write" sur le dépôt cinemaison-v2 -- sans ce
// secret configuré, la fonction échoue silencieusement (le workflow
// programmé toutes les 30 min prend simplement le relais un peu plus
// tard, aucune casse).

const DEPOT_GITHUB = "BigBenny069/cinemaison-v2";
const WORKFLOW_FICHIER = "resoudre-letterboxd.yml";

export async function declencherWorkflowLetterboxdV1_() {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) return false;

  try {
    const reponse = await fetch(
      "https://api.github.com/repos/" + DEPOT_GITHUB + "/actions/workflows/" + WORKFLOW_FICHIER + "/dispatches",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ ref: "main" }),
      }
    );
    // GitHub répond 204 (No Content) sans corps si la demande est acceptée.
    return reponse.status === 204;
  } catch (e) {
    return false;
  }
}
