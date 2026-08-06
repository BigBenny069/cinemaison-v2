# CinéMaison V2

Squelette de départ — interface web (Vite + React + Tailwind) qui lit et écrit
dans le Google Sheet "CinéMaison V2 - Base Films (copie de travail)" via des
fonctions serverless Vercel. Le Mode Vacances (Apps Script) continue de tourner
côté Sheet exactement comme avant ; cette app est une nouvelle "vitrine" par-dessus.

## Ce qui est déjà branché

- `GET /api/get-films` — lit l'onglet `Films` du Sheet et renvoie un sous-ensemble
  de colonnes en JSON
- `POST /api/add-film` — ajoute une ligne (titre/année/plateforme/type/date/Letterboxd),
  protégé par un mot de passe simple. Les colonnes d'enrichissement restent vides,
  le Mode Vacances les complètera à son prochain passage.
- `src/App.jsx` — écran minimal qui affiche les films récupérés, pour valider que
  toute la chaîne fonctionne (Sheet → API → navigateur)

## Ce qu'il reste à faire

- Porter les écrans complets de `CineMaisonApp.jsx` (Accueil, Bibliothèques par type,
  Explorer, Fiche détail, Édition...) dans `src/`, en les branchant sur `/api/get-films`
  au lieu du tableau `FILMS` statique
- Ajouter `api/update-film.js` et `api/delete-film.js` sur le même modèle que `add-film.js`
- Réintégrer les vrais logos de plateformes (PNG fournis)

## Mise en route

### 1. Créer le compte de service Google

1. Va sur [console.cloud.google.com](https://console.cloud.google.com), crée un projet
   (ou réutilise celui de ton Apps Script actuel s'il existe)
2. Active l'**API Google Sheets**
3. Crée un **compte de service** (IAM & Admin > Comptes de service), génère une clé JSON
4. Ouvre le Google Sheet "CinéMaison V2 - Base Films (copie de travail)" et **partage-le**
   (bouton Partager) avec l'adresse email du compte de service (finit par
   `...gserviceaccount.com`), en lui donnant l'accès **Éditeur**

### 2. Déployer sur Vercel

1. Push ce projet sur ton repo GitHub `cinemaison-v2`
2. Sur [vercel.com](https://vercel.com), importe le repo
3. Dans les réglages du projet Vercel, ajoute les 3 variables d'environnement
   listées dans `.env.example` (colle le JSON complet de la clé du compte de service
   dans `GOOGLE_SERVICE_ACCOUNT_KEY`, choisis un mot de passe pour `ADD_FILM_PASSWORD`)
4. Déploie

### 3. Vérifier

Une fois déployé, l'URL Vercel doit afficher la liste de tes films — si tu vois une
erreur, elle vient presque toujours d'un partage manquant sur le Sheet (étape 1.4)
ou d'une variable d'environnement mal collée.
