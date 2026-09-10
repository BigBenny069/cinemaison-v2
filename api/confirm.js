// Page de confirmation UNIQUE pour les boutons envoyés par mail --
// fusionnée (06/09/2026, correctif limite Vercel Hobby : 12 fonctions
// serverless max par déploiement, on l'avait dépassée avec une page
// par action). Dispatch par ?page=add|ignore|apply|merge|remove.
//
// Toujours le même principe de sécurité : le lien du mail est un
// simple GET (sans danger même pré-visité par un scanner de client
// mail), l'écriture réelle ne se déclenche que sur un vrai clic humain
// sur le bouton de cette page.
export default function handler(req, res) {
  const { page: type } = req.query || {};

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (type === "add") return pageAjouter(req, res);
  if (type === "ignore") return pageIgnorer(req, res);
  if (type === "apply") return pageAppliquer(req, res);
  if (type === "merge") return pageFusionner(req, res);
  if (type === "remove") return pageSupprimer(req, res);

  return res.status(400).send(pageHtml(
    "Lien incomplet",
    "<p>Ce lien est incomplet ou abîmé (paramètre ?page= manquant ou inconnu).</p>"
  ));
}

// ---- ?page=remove : "Retirer de CinéMaison" (rapport d'écarts, 18_RAPPORT_ECARTS_PLATEFORMES.gs) ----
function pageSupprimer(req, res) {
  const { id, titre, pw } = req.query || {};

  if (!id || !pw) {
    return res.status(400).send(pageHtml(
      "Lien incomplet",
      "<p>Ce lien est incomplet ou abîmé.</p>"
    ));
  }

  const titreEchappe = echapperHtml(titre || id);

  const contenu = `
    <p style="font-size:15px;color:#3A2E22"><strong>${titreEchappe}</strong></p>
    <p style="font-size:13px;color:#9A9182">
      Cette fiche est absente du dernier scan complet de sa plateforme -- confirme
      pour la retirer définitivement de CinéMaison. Cette action ne peut pas être
      annulée automatiquement.
    </p>
    <button id="btn" style="background:#B5622B;color:#FFFBF2;border:none;border-radius:6px;
      padding:12px 20px;font-size:15px;font-family:Arial,sans-serif;cursor:pointer;width:100%">
      Retirer de CinéMaison
    </button>
    <p id="statut" style="font-size:13px;color:#9A9182;margin-top:12px"></p>
    <script>
      const bouton = document.getElementById("btn");
      const statut = document.getElementById("statut");
      bouton.addEventListener("click", async () => {
        bouton.disabled = true;
        bouton.textContent = "Suppression en cours...";
        try {
          const reponse = await fetch("/api/delete-film", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: ${JSON.stringify(pw)}, id: ${JSON.stringify(id)} }),
          });
          const corps = await reponse.json().catch(() => ({}));
          if (reponse.ok) {
            bouton.textContent = "Retiré";
            statut.textContent = "C'est fait, tu peux fermer cette page.";
          } else {
            bouton.disabled = false;
            bouton.textContent = "Retirer de CinéMaison";
            statut.textContent = "Erreur : " + (corps.error || "inconnue");
          }
        } catch (e) {
          bouton.disabled = false;
          bouton.textContent = "Retirer de CinéMaison";
          statut.textContent = "Erreur réseau : " + e.message;
        }
      });
    </script>
  `;

  return res.status(200).send(pageHtml("Retirer de CinéMaison", contenu));
}


// ---- ?page=add : "+ Ajouter à CinéMaison" (suggestions) ----
function pageAjouter(req, res) {
  const { titre, annee, type, plateforme, pw } = req.query || {};

  if (!titre || !annee || !type || !plateforme || !pw) {
    return res.status(400).send(pageHtml(
      "Lien incomplet",
      "<p>Ce lien de suggestion est incomplet ou abîmé -- retourne dans l'app pour ajouter ce titre à la main.</p>"
    ));
  }

  const titreEchappe = echapperHtml(titre);
  const anneeEchappee = echapperHtml(String(annee));
  const typeEchappe = echapperHtml(type);
  const plateformeEchappee = echapperHtml(plateforme);

  const contenu = `
    <p style="font-size:15px;color:#3A2E22">
      <strong>${titreEchappe}</strong> (${anneeEchappee}) -- ${plateformeEchappee}, type suggéré : ${typeEchappe}
    </p>
    <button id="btn" style="background:#B5622B;color:#FFFBF2;border:none;border-radius:6px;
      padding:12px 20px;font-size:15px;font-family:Arial,sans-serif;cursor:pointer;width:100%">
      Ajouter à CinéMaison
    </button>
    <p id="statut" style="font-size:13px;color:#9A9182;margin-top:12px"></p>
    <script>
      const bouton = document.getElementById("btn");
      const statut = document.getElementById("statut");
      bouton.addEventListener("click", async () => {
        bouton.disabled = true;
        bouton.textContent = "Ajout en cours...";
        try {
          const reponse = await fetch("/api/add-film", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              password: ${JSON.stringify(pw)},
              titre: ${JSON.stringify(titre)},
              annee: ${JSON.stringify(annee)},
              plateforme: ${JSON.stringify(plateforme)},
              type: ${JSON.stringify(type)},
            }),
          });
          const corps = await reponse.json().catch(() => ({}));
          if (reponse.ok) {
            bouton.textContent = "Ajouté (" + corps.id + ")";
            statut.textContent = "C'est bon, la fiche a été créée. Tu peux fermer cette page.";
          } else {
            bouton.disabled = false;
            bouton.textContent = "Ajouter à CinéMaison";
            statut.textContent = "Erreur : " + (corps.error || "inconnue");
          }
        } catch (e) {
          bouton.disabled = false;
          bouton.textContent = "Ajouter à CinéMaison";
          statut.textContent = "Erreur réseau : " + e.message;
        }
      });
    </script>
  `;

  return res.status(200).send(pageHtml("Ajouter à CinéMaison", contenu));
}

// ---- ?page=ignore : "Ignorer" (suggestions) / "Validé, c'est normal" (ambiguïtés) ----
// plateforme absente ou "PRIME" -> comportement historique inchangé
// (api/prime-ignores.js) ; toute autre plateforme (NETFLIX, DISNEY...)
// -> nouveau système générique (api/streaming-ignores.js). Garde les
// liens Prime déjà envoyés dans des mails existants valides.
function pageIgnorer(req, res) {
  const { titre, type, pw, plateforme } = req.query || {};

  if (!titre || (type !== "SUGGESTION" && type !== "AMBIGUITE") || !pw) {
    return res.status(400).send(pageHtml(
      "Lien incomplet",
      "<p>Ce lien est incomplet ou abîmé.</p>"
    ));
  }

  const estPrimeHistorique = !plateforme || plateforme === "PRIME";
  const endpoint = estPrimeHistorique ? "/api/prime-ignores" : "/api/streaming-ignores";

  const titreEchappe = echapperHtml(titre);
  const estAmbiguite = type === "AMBIGUITE";

  const texteBouton = estAmbiguite ? "Validé, c'est normal" : "Ignorer cette suggestion";
  const texteExplication = estAmbiguite
    ? "Confirme que ces deux fiches CinéMaison sont bien deux films différents (pas un doublon à corriger). Ce titre ne sera plus signalé comme ambiguïté."
    : "Ce titre ne te sera plus proposé à l'avenir, même s'il reste absent de CinéMaison.";

  const contenu = `
    <p style="font-size:15px;color:#3A2E22"><strong>${titreEchappe}</strong></p>
    <p style="font-size:13px;color:#9A9182">${texteExplication}</p>
    <button id="btn" style="background:#9A9182;color:#FFFBF2;border:none;border-radius:6px;
      padding:12px 20px;font-size:15px;font-family:Arial,sans-serif;cursor:pointer;width:100%">
      ${texteBouton}
    </button>
    <p id="statut" style="font-size:13px;color:#9A9182;margin-top:12px"></p>
    <script>
      const bouton = document.getElementById("btn");
      const statut = document.getElementById("statut");
      bouton.addEventListener("click", async () => {
        bouton.disabled = true;
        bouton.textContent = "...";
        try {
          const reponse = await fetch(${JSON.stringify(endpoint)}, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              password: ${JSON.stringify(pw)},
              titre: ${JSON.stringify(titre)},
              plateforme: ${JSON.stringify(plateforme || "PRIME")},
              type: ${JSON.stringify(type)},
            }),
          });
          const corps = await reponse.json().catch(() => ({}));
          if (reponse.ok) {
            bouton.textContent = "C'est noté";
            statut.textContent = "Tu peux fermer cette page.";
          } else {
            bouton.disabled = false;
            bouton.textContent = ${JSON.stringify(texteBouton)};
            statut.textContent = "Erreur : " + (corps.error || "inconnue");
          }
        } catch (e) {
          bouton.disabled = false;
          bouton.textContent = ${JSON.stringify(texteBouton)};
          statut.textContent = "Erreur réseau : " + e.message;
        }
      });
    </script>
  `;

  return res.status(200).send(pageHtml(texteBouton, contenu));
}

// ---- ?page=apply : "VALIDER ET APPLIQUER" (CONTROLE_<PLATEFORME>) ----
// plateforme absente ou "PRIME" -> comportement historique inchangé
// (api/controle-prime.js) ; toute autre plateforme -> nouveau système
// générique (api/controle-streaming.js).
function pageAppliquer(req, res) {
  const { pw, plateforme } = req.query || {};

  if (!pw) {
    return res.status(400).send(pageHtml(
      "Lien incomplet",
      "<p>Ce lien est incomplet ou abîmé.</p>"
    ));
  }

  const estPrimeHistorique = !plateforme || plateforme === "PRIME";
  const endpoint = estPrimeHistorique ? "/api/controle-prime" : "/api/controle-streaming";
  const nomPlateforme = plateforme || "Prime";

  const contenu = `
    <p style="font-size:14px;color:#3A2E22">
      Ça va écrire dans l'onglet <strong>Films</strong> les changements de dates,
      plateformes et statuts détectés par le dernier passage du collecteur ${echapperHtml(nomPlateforme)}.
    </p>
    <p style="font-size:13px;color:#9A9182">Cette action ne peut pas être annulée automatiquement.</p>
    <button id="btn" style="background:#B5622B;color:#FFFBF2;border:none;border-radius:6px;
      padding:12px 20px;font-size:15px;font-family:Arial,sans-serif;cursor:pointer;width:100%">
      Valider et appliquer
    </button>
    <p id="statut" style="font-size:13px;color:#9A9182;margin-top:12px"></p>
    <div id="resume" style="margin-top:12px"></div>
    <script>
      const bouton = document.getElementById("btn");
      const statut = document.getElementById("statut");
      const resumeDiv = document.getElementById("resume");
      bouton.addEventListener("click", async () => {
        bouton.disabled = true;
        bouton.textContent = "Application en cours...";
        try {
          const reponse = await fetch(${JSON.stringify(endpoint)}, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              password: ${JSON.stringify(pw)},
              action: "apply",
              plateforme: ${JSON.stringify(plateforme || "PRIME")},
            }),
          });
          const corps = await reponse.json().catch(() => ({}));
          if (reponse.ok) {
            bouton.textContent = "Appliqué";
            statut.textContent = "C'est fait, tu peux fermer cette page.";
            if (corps.resume) {
              const r = corps.resume;
              resumeDiv.innerHTML =
                '<div style="font-size:12px;color:#9A9182;font-family:Arial,sans-serif">' +
                'Changements de date : ' + r.changements +
                ' &middot; Ajouts plateforme : ' + r.ajoutsPlateforme +
                ' &middot; Erreurs : ' + r.erreurs + '</div>';
            }
          } else {
            bouton.disabled = false;
            bouton.textContent = "Valider et appliquer";
            statut.textContent = "Erreur : " + (corps.error || "inconnue");
          }
        } catch (e) {
          bouton.disabled = false;
          bouton.textContent = "Valider et appliquer";
          statut.textContent = "Erreur réseau : " + e.message;
        }
      });
    </script>
  `;

  return res.status(200).send(pageHtml("Valider CONTROLE_" + nomPlateforme.toUpperCase(), contenu));
}

// ---- ?page=merge : "Fusionner avec une fiche existante" (suggestions) ----
function pageFusionner(req, res) {
  const { titre, pw, plateforme } = req.query || {};

  if (!titre || !pw) {
    return res.status(400).send(pageHtml(
      "Lien incomplet",
      "<p>Ce lien est incomplet ou abîmé.</p>"
    ));
  }

  const estPrimeHistorique = !plateforme || plateforme === "PRIME";
  const endpoint = estPrimeHistorique ? "/api/prime-ignores" : "/api/streaming-ignores";

  const titreEchappe = echapperHtml(titre);

  const contenu = `
    <p style="font-size:15px;color:#3A2E22">
      <strong>${titreEchappe}</strong>
    </p>
    <p style="font-size:13px;color:#9A9182">
      Ce titre est en fait déjà dans CinéMaison, juste écrit différemment ?
      Cherche-le et sélectionne-le ci-dessous -- il sera lié définitivement
      à cette fiche, pour que Prime puisse suivre sa date de départ correctement.
    </p>
    <input id="recherche" type="text" placeholder="Tape le début du titre..."
      style="width:100%;box-sizing:border-box;padding:10px;font-size:15px;
      font-family:Arial,sans-serif;border:1px solid #E3D9C4;border-radius:6px;margin-bottom:10px">
    <div id="resultats" style="max-height:280px;overflow-y:auto"></div>
    <p id="statut" style="font-size:13px;color:#9A9182;margin-top:12px"></p>
    <script>
      const champRecherche = document.getElementById("recherche");
      const zoneResultats = document.getElementById("resultats");
      const statut = document.getElementById("statut");
      let films = [];

      statut.textContent = "Chargement de la liste CinéMaison...";
      fetch("/api/get-films?leger=1")
        .then((r) => r.json())
        .then((data) => {
          films = data;
          statut.textContent = films.length + " fiche(s) chargée(s). Tape pour chercher.";
        })
        .catch((e) => { statut.textContent = "Erreur de chargement : " + e.message; });

      function normaliser(s) {
        return (s || "").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase();
      }

      function afficherResultats() {
        const requete = normaliser(champRecherche.value.trim());
        zoneResultats.innerHTML = "";
        if (requete.length < 2) return;

        const trouves = films.filter((f) => normaliser(f.titre).includes(requete)).slice(0, 25);
        trouves.forEach((f) => {
          const ligne = document.createElement("div");
          ligne.style.cssText = "padding:10px;border-bottom:1px solid #EFE7D6;cursor:pointer;font-family:Arial,sans-serif;font-size:14px;color:#3A2E22";
          ligne.textContent = f.titre + (f.annee ? " (" + f.annee + ")" : "") + " -- " + (f.plateforme || "?") + " -- " + f.id;
          ligne.addEventListener("click", () => fusionner(f));
          zoneResultats.appendChild(ligne);
        });
        if (trouves.length === 0) {
          zoneResultats.innerHTML = '<div style="font-family:Arial,sans-serif;font-size:13px;color:#9A9182;padding:10px">Aucun résultat.</div>';
        }
      }

      champRecherche.addEventListener("input", afficherResultats);

      async function fusionner(film) {
        statut.textContent = "Fusion en cours...";
        try {
          const reponse = await fetch(${JSON.stringify(endpoint)}, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              password: ${JSON.stringify(pw)},
              titre: ${JSON.stringify(titre)},
              plateforme: ${JSON.stringify(plateforme || "PRIME")},
              type: "ALIAS",
              idCible: film.id,
            }),
          });
          const corps = await reponse.json().catch(() => ({}));
          if (reponse.ok) {
            zoneResultats.innerHTML = "";
            champRecherche.style.display = "none";
            statut.textContent = "C'est fait : \\"${titreEchappe}\\" est maintenant lié à " + film.titre + " (" + film.id + "). Tu peux fermer cette page.";
          } else {
            statut.textContent = "Erreur : " + (corps.error || "inconnue");
          }
        } catch (e) {
          statut.textContent = "Erreur réseau : " + e.message;
        }
      }
    </script>
  `;

  return res.status(200).send(pageHtml("Fusionner avec une fiche existante", contenu));
}

function echapperHtml(texte) {
  return String(texte || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pageHtml(titre, contenu) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${echapperHtml(titre)}</title></head>
<body style="margin:0;padding:0;background:#F5EFE0;font-family:Georgia,serif">
<div style="background:#F5EFE0;padding:24px 12px;min-height:100vh;box-sizing:border-box">
<div style="background:#FFFBF2;border-radius:8px;padding:28px 22px;max-width:420px;margin:40px auto">
<div style="font-size:20px;font-weight:bold;color:#3A2E22;margin-bottom:16px">
CINÉ<span style="color:#B5622B">MAISON</span></div>
${contenu}
</div></div></body></html>`;
}
