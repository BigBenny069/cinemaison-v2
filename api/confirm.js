// Page de confirmation UNIQUE pour les 3 boutons envoyés par mail --
// fusionnée (06/09/2026, correctif limite Vercel Hobby : 12 fonctions
// serverless max par déploiement, on l'avait dépassée avec une page
// par action). Dispatch par ?page=add|ignore|apply.
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

  return res.status(400).send(pageHtml(
    "Lien incomplet",
    "<p>Ce lien est incomplet ou abîmé (paramètre ?page= manquant ou inconnu).</p>"
  ));
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
function pageIgnorer(req, res) {
  const { titre, type, pw } = req.query || {};

  if (!titre || (type !== "SUGGESTION" && type !== "AMBIGUITE") || !pw) {
    return res.status(400).send(pageHtml(
      "Lien incomplet",
      "<p>Ce lien est incomplet ou abîmé.</p>"
    ));
  }

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
          const reponse = await fetch("/api/prime-ignores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              password: ${JSON.stringify(pw)},
              titre: ${JSON.stringify(titre)},
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

// ---- ?page=apply : "VALIDER ET APPLIQUER" (CONTROLE_PRIME) ----
function pageAppliquer(req, res) {
  const { pw } = req.query || {};

  if (!pw) {
    return res.status(400).send(pageHtml(
      "Lien incomplet",
      "<p>Ce lien est incomplet ou abîmé.</p>"
    ));
  }

  const contenu = `
    <p style="font-size:14px;color:#3A2E22">
      Ça va écrire dans l'onglet <strong>Films</strong> les changements de dates,
      plateformes et statuts détectés par le dernier passage de <code>prime.js</code>.
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
          const reponse = await fetch("/api/controle-prime", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: ${JSON.stringify(pw)}, action: "apply" }),
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

  return res.status(200).send(pageHtml("Valider CONTROLE_PRIME", contenu));
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
