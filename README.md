# Poplist

## Aperçu

Poplist est une application fullstack (React + Express) permettant de créer, organiser et partager des listes de films et séries, avec récupération automatique des métadonnées via l'API TMDB.

## Prérequis

- **Node.js** ≥ 20
- **npm** (fourni avec Node.js)
- Accès à une instance MongoDB locale ou distante
- Clés API TMDB et identifiants OAuth Google (optionnel si authentification Google activée)

## Installation

1. **Cloner le dépôt**

   ```bash
   git clone <URL_DU_DEPOT>
   cd WatchlistHub
   ```

2. **Installer les dépendances**
   - Backend
     ```bash
     cd backend
     npm install
     ```
   - Frontend
     ```bash
     cd frontend
     npm install
     ```

## Configuration des variables d'environnement

Renomme ou copie les fichiers `.env.example` en `.env` dans chaque dossier (backend et frontend), puis complète les valeurs.

### Backend (`backend/.env`)

| Variable               | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| `PORT`                 | Port HTTP du serveur Express (défaut: 3000)                  |
| `CLIENT_URL`           | URL du frontend autorisée pour CORS et redirections          |
| `MONGO_URL`            | URI de la base MongoDB principale                            |
| `MONGO_URL_TEST`       | URI de la base MongoDB de test (si tests automatisés)        |
| `TMDB_API`             | Clé API TMDB pour les requêtes serveur                       |
| `JWT_ACCESS_SECRET`    | Secret utilisé pour signer les tokens d'accès                |
| `JWT_REFRESH_SECRET`   | Secret utilisé pour signer les refresh tokens                |
| `GOOGLE_CLIENT_ID`     | Client ID OAuth Google (si login Google activé)              |
| `GOOGLE_CLIENT_SECRET` | Client Secret OAuth Google                                   |
| `NODE_ENV`             | Environnement d'exécution (`development`, `production`, ...) |
| `COOKIE_DOMAIN`        | Domaine pour les cookies d'authentification                  |

### Frontend (`frontend/.env`)

| Variable            | Description                                       |
| ------------------- | ------------------------------------------------- |
| `VITE_API_PORT`     | Port local du backend utilisé par le frontend     |
| `VITE_API_URL`      | URL du backend pour les appels API                |
| `VITE_TMDB_API_KEY` | Clé API TMDB exposée côté client (token v4 ou v3) |

> ⚠️ **Ne jamais commiter vos fichiers `.env`**. Ils sont déjà ignorés via `.gitignore`.

## Lancement en développement

Dans deux terminaux séparés :

- **Backend**

  ```bash
  cd backend
  npm run dev
  ```

- **Frontend**
  ```bash
  cd frontend
  npm run dev
  ```

Le frontend sera accessible par défaut sur `http://localhost:5173` et communiquera avec le backend sur `http://localhost:3000`.

## Scripts utiles

### Backend

| Commande        | Description                            |
| --------------- | -------------------------------------- |
| `npm run dev`   | Lance le serveur Express en mode watch |
| `npm run build` | Compile TypeScript vers `dist/`        |
| `npm run start` | Démarre la version compilée            |

### Frontend

| Commande          | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Démarre Vite en mode développement  |
| `npm run build`   | Build de production                 |
| `npm run preview` | Prévisualise le build de production |

## Déploiement

Avant un déploiement public, pense à :

1. Configurer des secrets sécurisés (JWT, OAuth) via un gestionnaire de secrets ou variables d'environnement.
2. Désactiver les logs sensibles côté backend.
3. Vérifier les URL de redirection (`CLIENT_URL`) et les paramètres CORS selon l'environnement cible.
