// Page de confirmation UNIQUE pour les boutons envoyés par mail --
// fusionnée (06/09/2026, correctif limite Vercel Hobby : 12 fonctions
// serverless max par déploiement, on l'avait dépassée avec une page
// par action). Dispatch par ?page=add|ignore|apply|merge|remove|canalApply...
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
  if (type === "letterboxdOk") return pageLetterboxdOk(req, res);
  if (type === "confirmType") return pageConfirmerType(req, res);
  if (type === "confirmerTypeActuel") return pageConfirmerTypeActuel(req, res);
  if (type === "horsListeCanal") return pageHorsListeCanal(req, res);
  if (type === "canalApply") return pageCanalApply(req, res);

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
    <!-- NOUVEAU (27/10/2026) -- avis sur le film avant de le retirer (affine les
         suggestions). "Pas vu" (par défaut) n'enregistre aucun avis : le film
         n'influence pas les suggestions. Mêmes 5 niveaux et mêmes tranches
         Letterboxd que l'app (App.jsx, AVIS_NIVEAUX). -->
    <style>
      .avis-b{background:#F5EFE0;border:1px solid #DDD0B6;border-radius:8px;padding:8px 2px;cursor:pointer;
        font-family:Arial,sans-serif;color:#9A9182;display:flex;flex-direction:column;align-items:center;gap:3px}
      .avis-b[aria-pressed="true"]{background:#F1E0B8;border-color:#B5622B;color:#B5622B;font-weight:bold}
      .avis-b .e{font-size:24px;line-height:1}.avis-b .l{font-size:10px;text-align:center}.avis-b .r{font-size:9px}
    </style>
    <p style="font-size:11px;letter-spacing:1px;color:#9A9182;margin:18px 0 8px;font-family:Arial,sans-serif">
      TON AVIS SUR CE FILM (AFFINE LES SUGGESTIONS)
    </p>
    <div id="avis" style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">
      <button type="button" class="avis-b" data-v="1" aria-pressed="false"><span class="e">👎</span><span class="l">J'aime pas</span><span class="r">0,5 – 1,5 ★</span></button>
      <button type="button" class="avis-b" data-v="2" aria-pressed="false"><span class="e">😐</span><span class="l">Neutre</span><span class="r">2 – 2,5 ★</span></button>
      <button type="button" class="avis-b" data-v="3" aria-pressed="false"><span class="e">🙂</span><span class="l">J'aime bien</span><span class="r">3 – 3,5 ★</span></button>
      <button type="button" class="avis-b" data-v="4" aria-pressed="false"><span class="e">😍</span><span class="l">J'adore</span><span class="r">4 – 4,5 ★</span></button>
      <button type="button" class="avis-b" data-v="5" aria-pressed="false"><span class="e">🤩</span><span class="l">J'adore++</span><span class="r">5 ★</span></button>
    </div>
    <button type="button" class="avis-b" id="pasvu" data-v="0" aria-pressed="true" style="width:100%;flex-direction:row;justify-content:center;gap:8px;margin:8px 0 18px;padding:10px">
      <span class="e" style="font-size:16px">🚫</span><span class="l" style="font-size:12px">Pas vu : ne pas influencer les suggestions</span>
    </button>
    <button id="btn" style="background:#B5622B;color:#FFFBF2;border:none;border-radius:6px;
      padding:12px 20px;font-size:15px;font-family:Arial,sans-serif;cursor:pointer;width:100%">
      Retirer de CinéMaison
    </button>
    <p id="statut" style="font-size:13px;color:#9A9182;margin-top:12px"></p>
    <script>
      const bouton = document.getElementById("btn");
      const statut = document.getElementById("statut");
      let avis = null; // null = pas vu : aucun avis enregistré
      const boutonsAvis = document.querySelectorAll(".avis-b");
      boutonsAvis.forEach((b) => b.addEventListener("click", () => {
        if (bouton.disabled) return;
        avis = Number(b.dataset.v) || null;
        boutonsAvis.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      }));
      bouton.addEventListener("click", async () => {
        bouton.disabled = true;
        bouton.textContent = "Suppression en cours...";
        try {
          const reponse = await fetch("/api/delete-film", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: ${JSON.stringify(pw)}, id: ${JSON.stringify(id)}, avis: avis }),
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


// ---- ?page=letterboxdOk : "C'est la bonne URL" (mail de vérification Letterboxd, 09_WEBHOOK.gs) ----
function pageLetterboxdOk(req, res) {
  const { id, url, titre, pw } = req.query || {};

  if (!id || !url || !pw) {
    return res.status(400).send(pageHtml(
      "Lien incomplet",
      "<p>Ce lien est incomplet ou abîmé.</p>"
    ));
  }

  const titreEchappe = echapperHtml(titre || id);
  const urlEchappee = echapperHtml(url);

  const contenu = `
    <p style="font-size:15px;color:#3A2E22"><strong>${titreEchappe}</strong></p>
    <p style="font-size:13px;color:#9A9182">
      <a href="${urlEchappee}" style="color:#B5622B">${urlEchappee}</a><br>
      Confirme que c'est bien la bonne page Letterboxd pour ce film -- elle ne
      sera plus resignalée par les prochains audits, tant que son URL ne
      change pas.
    </p>
    <button id="btn" style="background:#B5622B;color:#FFFBF2;border:none;border-radius:6px;
      padding:12px 20px;font-size:15px;font-family:Arial,sans-serif;cursor:pointer;width:100%">
      C'est la bonne URL
    </button>
    <p id="statut" style="font-size:13px;color:#9A9182;margin-top:12px"></p>
    <script>
      const bouton = document.getElementById("btn");
      const statut = document.getElementById("statut");
      bouton.addEventListener("click", async () => {
        bouton.disabled = true;
        bouton.textContent = "Enregistrement...";
        try {
          const reponse = await fetch("/api/update-film", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              password: ${JSON.stringify(pw)},
              letterboxdConfirmer: { id: ${JSON.stringify(id)}, url: ${JSON.stringify(url)} },
            }),
          });
          const corps = await reponse.json().catch(() => ({}));
          if (reponse.ok) {
            bouton.textContent = "Confirmé";
            statut.textContent = "C'est noté, tu peux fermer cette page.";
          } else {
            bouton.disabled = false;
            bouton.textContent = "C'est la bonne URL";
            statut.textContent = "Erreur : " + (corps.error || "inconnue");
          }
        } catch (e) {
          bouton.disabled = false;
          bouton.textContent = "C'est la bonne URL";
          statut.textContent = "Erreur réseau : " + e.message;
        }
      });
    </script>
  `;

  return res.status(200).send(pageHtml("Confirmer l'URL Letterboxd", contenu));
}

// ---- ?page=add : "+ Ajouter à CinéMaison" (suggestions) ----
function pageAjouter(req, res) {
  const { titre, annee, type, statutAcces, plateforme, pw } = req.query || {};

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
  // NOUVEAU (19/09/2026) -- Phase D (Étape 4) : optionnel, seulement
  // présent si différent d'"Inclus" (voir construireUrlConfirmation_,
  // prime.js).
  const statutAccesEchappe = statutAcces ? echapperHtml(statutAcces) : "";

  const contenu = `
    <p style="font-size:15px;color:#3A2E22">
      <strong>${titreEchappe}</strong> (${anneeEchappee}) -- ${plateformeEchappee}, type suggéré : ${typeEchappe}${statutAccesEchappe ? " (" + statutAccesEchappe + ")" : ""}
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
              statutAcces: ${JSON.stringify(statutAcces || "")},
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
// (lib/prime-ignores-handler.js, via api/streaming-ignores.js) ; toute autre plateforme (NETFLIX, DISNEY...)
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
  const endpoint = "/api/streaming-ignores";

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
// (lib/controle-prime-handler.js, via api/controle-streaming.js) ; toute autre plateforme -> nouveau système
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
  const endpoint = "/api/controle-streaming";
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
  const endpoint = "/api/streaming-ignores";

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
        return (s || "").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
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

// ---- ?page=confirmType : "Corriger" (mail "Type possiblement
// incohérent", 09_WEBHOOK.gs traiterAlerteTypeIncoherentStreamingV1_)
// NOUVEAU (26/09/2026) -- remplace l'ancien lien direct vers l'app
// (baseUrl + "/?film=...&edit=1"), qui n'a jamais fonctionné : l'app
// ne lit aucun paramètre d'URL de ce genre, donc le lien ouvrait juste
// l'accueil (signalé par Ben). Même principe que les autres boutons
// de cette page : le clic écrit directement le Type détecté sur la
// fiche, sans repasser par l'application.
function pageConfirmerType(req, res) {
  const { id, titre, typeDetecte, pw } = req.query || {};

  if (!id || !typeDetecte || !pw) {
    return res.status(400).send(pageHtml(
      "Lien incomplet",
      "<p>Ce lien est incomplet ou abîmé -- retourne dans l'app pour corriger le Type à la main.</p>"
    ));
  }

  const titreEchappe = echapperHtml(titre || id);
  const typeEchappe = echapperHtml(typeDetecte);

  const contenu = `
    <p style="font-size:15px;color:#3A2E22"><strong>${titreEchappe}</strong></p>
    <p style="font-size:13px;color:#9A9182">
      Confirme pour enregistrer le Type détecté sur la page de la plateforme :
      <strong>${typeEchappe}</strong>.
    </p>
    <button id="btn" style="background:#B5622B;color:#FFFBF2;border:none;border-radius:6px;
      padding:12px 20px;font-size:15px;font-family:Arial,sans-serif;cursor:pointer;width:100%">
      Corriger le Type en ${typeEchappe}
    </button>
    <p id="statut" style="font-size:13px;color:#9A9182;margin-top:12px"></p>
    <script>
      const bouton = document.getElementById("btn");
      const statut = document.getElementById("statut");
      bouton.addEventListener("click", async () => {
        bouton.disabled = true;
        bouton.textContent = "Enregistrement...";
        try {
          const reponse = await fetch("/api/update-film", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              password: ${JSON.stringify(pw)},
              id: ${JSON.stringify(id)},
              fields: { type: ${JSON.stringify(typeDetecte)} },
            }),
          });
          const corps = await reponse.json().catch(() => ({}));
          if (reponse.ok) {
            bouton.textContent = "Corrigé";
            statut.textContent = "C'est fait, tu peux fermer cette page.";
          } else {
            bouton.disabled = false;
            bouton.textContent = "Corriger le Type en ${typeDetecte}";
            statut.textContent = "Erreur : " + (corps.error || "inconnue");
          }
        } catch (e) {
          bouton.disabled = false;
          bouton.textContent = "Corriger le Type en ${typeDetecte}";
          statut.textContent = "Erreur réseau : " + e.message;
        }
      });
    </script>
  `;

  return res.status(200).send(pageHtml("Corriger le Type", contenu));
}

// ---- ?page=confirmerTypeActuel : "C'est déjà bon" (mail "Type
// possiblement incohérent" quand la détection se trompe, pas la
// fiche -- ex. "Surveillant!"/"Nine Perfect Strangers", confirmées
// séries à la main par Ben, 27/09/2026). Pose TypeConfirme=true SANS
// toucher au champ Type -- les collecteurs sautent alors cette fiche
// dans la comparaison future au lieu de re-signaler le même faux
// positif à chaque run.
function pageConfirmerTypeActuel(req, res) {
  const { id, titre, typeActuel, pw } = req.query || {};

  if (!id || !pw) {
    return res.status(400).send(pageHtml(
      "Lien incomplet",
      "<p>Ce lien est incomplet ou abîmé -- retourne dans l'app pour confirmer le Type à la main.</p>"
    ));
  }

  const titreEchappe = echapperHtml(titre || id);
  const typeEchappe = echapperHtml(typeActuel || "");

  const contenu = `
    <p style="font-size:15px;color:#3A2E22"><strong>${titreEchappe}</strong></p>
    <p style="font-size:13px;color:#9A9182">
      Confirme que le Type actuel${typeEchappe ? " (<strong>" + typeEchappe + "</strong>)" : ""}
      est le bon -- cette fiche ne sera plus signalée par les prochains contrôles.
    </p>
    <button id="btn" style="background:#B5622B;color:#FFFBF2;border:none;border-radius:6px;
      padding:12px 20px;font-size:15px;font-family:Arial,sans-serif;cursor:pointer;width:100%">
      C'est déjà le bon Type
    </button>
    <p id="statut" style="font-size:13px;color:#9A9182;margin-top:12px"></p>
    <script>
      const bouton = document.getElementById("btn");
      const statut = document.getElementById("statut");
      bouton.addEventListener("click", async () => {
        bouton.disabled = true;
        bouton.textContent = "Enregistrement...";
        try {
          const reponse = await fetch("/api/update-film", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              password: ${JSON.stringify(pw)},
              id: ${JSON.stringify(id)},
              fields: { typeConfirme: true },
            }),
          });
          const corps = await reponse.json().catch(() => ({}));
          if (reponse.ok) {
            bouton.textContent = "Confirmé";
            statut.textContent = "C'est fait, tu peux fermer cette page.";
          } else {
            bouton.disabled = false;
            bouton.textContent = "C'est déjà le bon Type";
            statut.textContent = "Erreur : " + (corps.error || "inconnue");
          }
        } catch (e) {
          bouton.disabled = false;
          bouton.textContent = "C'est déjà le bon Type";
          statut.textContent = "Erreur réseau : " + e.message;
        }
      });
    </script>
  `;

  return res.status(200).send(pageHtml("Confirmer le Type", contenu));
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


// ---- ?page=horsListeCanal : "Garder hors de Ma Liste Canal+" (mail "CANAL+
// écarts avec Ma Liste", 21_CANAL_ECARTS.js) -- NOUVEAU (10/10/2026) ----
// Écrit "oui" dans la colonne HorsListeCanal de la fiche : elle passe alors
// dans la section grisée du mail suivant. Écriture uniquement sur clic
// humain (le GET du lien est sans danger).
function pageHorsListeCanal(req, res) {
  const { id, titre, pw } = req.query || {};

  if (!id || !pw) {
    return res.status(400).send(pageHtml(
      "Lien incomplet",
      "<p>Ce lien est incomplet ou abîmé -- écris « oui » dans la colonne HorsListeCanal du Sheet à la main.</p>"
    ));
  }

  const titreEchappe = echapperHtml(titre || id);

  const contenu = `
    <p style="font-size:15px;color:#3A2E22"><strong>${titreEchappe}</strong></p>
    <p style="font-size:13px;color:#9A9182">
      Cette fiche reste dans CinéMaison et le contrôle des dates continue de la suivre.
      Elle ne sera simplement plus signalée comme « absente de Ma Liste » Canal+.
    </p>
    <button id="btn" style="background:#B5622B;color:#FFFBF2;border:none;border-radius:6px;
      padding:12px 20px;font-size:15px;font-family:Arial,sans-serif;cursor:pointer;width:100%">
      Garder hors de Ma Liste Canal+
    </button>
    <p id="statut" style="font-size:13px;color:#9A9182;margin-top:12px"></p>
    <script>
      const bouton = document.getElementById("btn");
      const statut = document.getElementById("statut");
      bouton.addEventListener("click", async () => {
        bouton.disabled = true;
        bouton.textContent = "Enregistrement...";
        try {
          const reponse = await fetch("/api/update-film", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              password: ${JSON.stringify(pw)},
              id: ${JSON.stringify(id)},
              fields: { horsListeCanal: "oui" },
            }),
          });
          const corps = await reponse.json().catch(() => ({}));
          if (reponse.ok) {
            bouton.textContent = "Noté";
            statut.textContent = "C'est fait, tu peux fermer cette page.";
          } else {
            bouton.disabled = false;
            bouton.textContent = "Garder hors de Ma Liste Canal+";
            statut.textContent = "Erreur : " + (corps.error || "inconnue");
          }
        } catch (e) {
          bouton.disabled = false;
          bouton.textContent = "Garder hors de Ma Liste Canal+";
          statut.textContent = "Erreur réseau : " + e.message;
        }
      });
    </script>
  `;

  return res.status(200).send(pageHtml("Hors de Ma Liste Canal+", contenu));
}

// ---- ?page=canalApply : "CHOISIR LES LIGNES ET APPLIQUER" (mail "CANAL+ changements
// de statut à valider", 31_CANAL_PROPOSITIONS_STATUTS.js) -- NOUVEAU (27/10/2026) ----
// La page charge les propositions en attente, toutes cochées ; le clic sur le bouton
// applique les lignes cochées et marque les autres comme refusées (pas reproposées
// avant 30 jours). Écriture uniquement sur clic humain.
function pageCanalApply(req, res) {
  const { pw } = req.query || {};

  if (!pw) {
    return res.status(400).send(pageHtml(
      "Lien incomplet",
      "<p>Ce lien est incomplet ou abîmé.</p>"
    ));
  }

  const contenu = `
    <p style="font-size:14px;color:#3A2E22">
      Décoche les changements que tu <strong>refuses</strong>, puis valide : les lignes cochées
      sont écrites dans la colonne Statut d'accès de l'onglet Films.
    </p>
    <div id="liste" style="margin:12px 0;font-family:Arial,sans-serif;font-size:13px;color:#9A9182">Chargement...</div>
    <button id="btn" disabled style="background:#B5622B;color:#FFFBF2;border:none;border-radius:6px;
      padding:12px 20px;font-size:15px;font-family:Arial,sans-serif;cursor:pointer;width:100%;opacity:0.5">
      Appliquer la sélection
    </button>
    <p id="statut" style="font-size:13px;color:#9A9182;margin-top:12px"></p>
    <script>
      const PW = ${JSON.stringify(pw)};
      const liste = document.getElementById("liste");
      const bouton = document.getElementById("btn");
      const statut = document.getElementById("statut");
      let propositions = [];

      function echapper(t) {
        return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      }

      function majBouton() {
        const n = document.querySelectorAll("input[data-cle]:checked").length;
        bouton.textContent = n > 0 ? "Appliquer la sélection (" + n + ")" : "Tout refuser";
      }

      async function appeler(canalPropositions) {
        const reponse = await fetch("/api/update-film", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: PW, canalPropositions }),
        });
        const corps = await reponse.json().catch(() => ({}));
        return { ok: reponse.ok, corps };
      }

      async function charger() {
        try {
          const r = await appeler({ mode: "lister" });
          if (!r.ok) { liste.textContent = "Erreur : " + (r.corps.error || "inconnue"); return; }
          propositions = r.corps.propositions || [];
          if (propositions.length === 0) {
            liste.textContent = "Plus aucune proposition en attente : tout est déjà traité. Tu peux fermer cette page.";
            return;
          }
          liste.innerHTML = propositions.map((p) =>
            '<label style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #EFE7D6;cursor:pointer">' +
            '<input type="checkbox" checked data-cle="' + echapper(p.cle) + '" style="margin-top:3px;width:18px;height:18px">' +
            '<span style="color:#3A2E22;line-height:1.5"><strong>' + echapper(p.filmId) + '</strong> &middot; ' + echapper(p.titre) +
            (p.annee ? ' (' + echapper(p.annee) + ')' : '') + '<br>' +
            '<span style="display:inline-block;margin:3px 0;padding:2px 8px;border-radius:10px;background:#F6E7D3;color:#7A4A1E;font-weight:bold">' +
            echapper(p.statutActuel || "vide") + ' &rarr; ' + echapper(p.statutPropose) + '</span><br>' +
            '<span style="color:#9A9182;font-size:12px">' + echapper(p.raison) + '</span></span></label>'
          ).join("");
          liste.querySelectorAll("input").forEach((c) => c.addEventListener("change", majBouton));
          bouton.disabled = false;
          bouton.style.opacity = "1";
          majBouton();
        } catch (e) {
          liste.textContent = "Erreur réseau : " + e.message;
        }
      }

      bouton.addEventListener("click", async () => {
        const cochees = [...document.querySelectorAll("input[data-cle]:checked")].map((c) => c.dataset.cle);
        const decochees = [...document.querySelectorAll("input[data-cle]:not(:checked)")].map((c) => c.dataset.cle);
        bouton.disabled = true;
        bouton.textContent = "Application en cours...";
        try {
          const r = await appeler({ mode: "appliquer", appliquer: cochees, refuser: decochees });
          if (r.ok) {
            const x = r.corps.resume || {};
            bouton.textContent = "Terminé";
            statut.textContent = "C'est fait, tu peux fermer cette page. Appliquées : " + (x.appliquees || 0) +
              " · Refusées : " + (x.refusees || 0) +
              (x.dejaModifiees ? " · Déjà modifiées entre-temps (ignorées) : " + x.dejaModifiees : "");
            liste.querySelectorAll("input").forEach((c) => { c.disabled = true; });
          } else {
            bouton.disabled = false;
            majBouton();
            statut.textContent = "Erreur : " + (r.corps.error || "inconnue");
          }
        } catch (e) {
          bouton.disabled = false;
          majBouton();
          statut.textContent = "Erreur réseau : " + e.message;
        }
      });

      charger();
    </script>
  `;

  return res.status(200).send(pageHtml("Changements de statut Canal+", contenu));
}
