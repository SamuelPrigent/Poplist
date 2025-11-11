import type { Content } from "@/types/content";

export const fr: Content = {
  // Header
  header: {
    appName: "WatchlistHub",
    login: "Connexion",
    signup: "Inscription",
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
    title: "Vos watchlists",
    createWatchlist: "Créer",
    createWatchlistDescription:
      "Créez une nouvelle watchlist pour organiser vos films et séries.",
    notLoggedInWarning: "Données locales",
    noWatchlists: "Vous n'avez pas encore créé de watchlist.",
    items: "éléments",
    item: "élément",
    public: "Public",
    private: "Privé",
    loading: "Chargement...",
    accountDataBadge: "Données du compte utilisateur",
    name: "Nom",
    namePlaceholder: "Ma watchlist",
    description: "Description",
    descriptionPlaceholder: "Description de votre watchlist",
    coverImage: "Image de couverture",
    uploadImage: "Télécharger une image",
    changeImage: "Changer l'image",
    imageUploadHint: "PNG, JPG ou WEBP (max. 5MB)",
    makePublic: "Rendre publique",
    cancel: "Annuler",
    create: "Créer",
    creating: "Création...",
    back: "Retour",
    noItemsYet: "Aucun élément pour le moment",
    noItemsDescription:
      "Commencez à ajouter des films et séries à votre watchlist pour organiser votre liste de visionnage.",
    editWatchlist: "Modifier la watchlist",
    editWatchlistDescription: "Modifiez les informations de votre watchlist.",
    deleteWatchlist: "Supprimer la watchlist",
    deleteWatchlistConfirm:
      'Êtes-vous sûr de vouloir supprimer "{name}" ? Cette action est irréversible.',
    deleteWatchlistWarning:
      "Cette watchlist contient {count} élément(s) qui seront également supprimés.",
    saving: "Enregistrement...",
    save: "Enregistrer",
    deleting: "Suppression...",
    delete: "Supprimer",
    addItem: "Ajouter",
    searchMoviesAndSeries:
      "Recherchez et ajoutez des films ou séries à votre watchlist",
    searchPlaceholder: "Rechercher un film ou une série...",
    searching: "Recherche...",
    noResults: "Aucun résultat trouvé",
    startSearching: "Commencez à taper pour rechercher des films et séries",
    add: "Ajouter",
    added: "Ajouté",
    inWatchlist: "Dans la watchlist",
    // Table headers
    tableHeaders: {
      number: "#",
      title: "Titre",
      type: "Type",
      platforms: "Plateformes",
      duration: "Durée",
    },
    // Content types
    contentTypes: {
      movie: "Film",
      series: "Série",
    },
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
};
