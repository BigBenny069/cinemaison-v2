// Page de confirmation pour les liens "Ignorer" (suggestions) et
// "Validé, c'est normal" (ambiguïtés) du mail Prime. Même principe de
// sécurité que suggestion-confirm.js : le lien du mail est un simple
// GET qui affiche une page avec un bouton -- l'écriture réelle ne se
// déclenche que sur un vrai clic (protège contre les scanners de liens
// automatiques des clients mail).
export default function handler(req, res) {
  const { titre, type, pw } = req.query || {};

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (!titre || (type !== "SUGGESTION" && type !== "AMBIGUITE") || !pw) {
    return res.status(400).send(page(
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
          const reponse = await fetch("/api/write-prime-ignore", {
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

  return res.status(200).send(page(texteBouton, contenu));
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
