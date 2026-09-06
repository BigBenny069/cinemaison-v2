// Page de confirmation servie par le lien "+ Ajouter à CinéMaison" du
// mail de suggestions Prime (voir prime.js et 09_WEBHOOK.gs). Le lien
// du mail pointe ICI en GET -- geste sans danger, y compris si un
// client mail le "pré-clique" automatiquement pour le scanner, puisque
// cette page ne fait qu'AFFICHER un bouton, elle n'écrit jamais rien
// toute seule. L'ajout réel (POST vers api/add-film) ne se déclenche
// que sur un vrai clic humain sur ce bouton.
export default function handler(req, res) {
  const { titre, annee, type, plateforme, pw } = req.query || {};

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (!titre || !annee || !type || !plateforme || !pw) {
    return res.status(400).send(page(
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

  return res.status(200).send(page("Ajouter à CinéMaison", contenu));
}

function echapperHtml(texte) {
  return String(texte || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function page(titre, contenu) {
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
