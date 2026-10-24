// Petit adaptateur : garde la même écriture `google.auth.GoogleAuth` / `google.sheets(...)`
// que partout dans le projet, mais avec la bibliothèque légère @googleapis/sheets
// (au lieu de "googleapis" qui embarque tous les services Google).
import { sheets, auth } from "@googleapis/sheets";

export const google = { sheets, auth };
