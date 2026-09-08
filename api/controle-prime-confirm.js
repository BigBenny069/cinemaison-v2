// Page de confirmation pour le bouton "VALIDER ET APPLIQUER" du mail
// CONTROLE_PRIME. Même principe de sécurité que les autres pages de
// confirmation : le lien du mail est un simple GET (sans danger même
// pré-visité par un scanner de client mail), l'écriture réelle dans
// Films ne se déclenche que sur un vrai clic humain sur cette page.
export default function handler(req, res) {
  const { pw } = req.query || {};

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (!pw) {
    return res.status(400).send(page(
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
          const reponse = await fetch("/api/appliquer-controle-prime", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: ${JSON.stringify(pw)} }),
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

  return res.status(200).send(page("Valider CONTROLE_PRIME", contenu));
}

function page(titre, contenu) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title></head>
<body style="margin:0;padding:0;background:#F5EFE0;font-family:Georgia,serif">
<div style="background:#F5EFE0;padding:24px 12px;min-height:100vh;box-sizing:border-box">
<div style="background:#FFFBF2;border-radius:8px;padding:28px 22px;max-width:420px;margin:40px auto">
<div style="font-size:20px;font-weight:bold;color:#3A2E22;margin-bottom:16px">
CINÉ<span style="color:#B5622B">MAISON</span></div>
${contenu}
</div></div></body></html>`;
}
