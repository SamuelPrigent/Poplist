export const fr = {
  // Header
  header: {
    appName: "WatchlistHub",
    login: "Connexion",
    signup: "S'inscrire",
    logout: "Déconnexion",
  },

  // Auth Drawer
  auth: {
    loginTitle: "Connexion",
    loginDescription:
      "Bienvenue ! Connectez-vous pour accéder à vos watchlists.",
    signupTitle: "Inscription",
    signupDescription: "Créez un compte pour sauvegarder vos watchlists.",
    continueWithGoogle: "Continuer avec Google",
    or: "Ou",
    email: "Email",
    emailPlaceholder: "votre@email.com",
    password: "Mot de passe",
    passwordPlaceholder: "••••••••",
    processing: "Traitement...",
    dontHaveAccount: "Vous n'avez pas de compte ?",
    alreadyHaveAccount: "Vous avez déjà un compte ?",
  },

  // Watchlists Page
  watchlists: {
    title: "Vos Watchlists",
    createWatchlist: "Créer une watchlist",
    notLoggedInWarning:
      "Vous n'êtes pas connecté. Les watchlists sont stockées localement et seront synchronisées lors de votre connexion.",
    noWatchlists: "Vous n'avez pas encore créé de watchlist.",
    createFirstWatchlist: "Créer votre première watchlist",
    items: "éléments",
    item: "élément",
    public: "Public",
    loading: "Chargement...",
  },

  // Home Page
  home: {
    hero: {
      title: "WatchlistHub",
      subtitle:
        "Créez et partagez des watchlists de vos films et séries favorites.",
    },
    trending: {
      title: "Tendances du jour",
      noImage: "Pas d'image",
    },
  },

  // Footer
  footer: {
    appName: "WatchlistHub",
    language: "Langue",
  },
} as const;

export type Content = typeof fr;
