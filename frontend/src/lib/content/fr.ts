import type { Content } from "@/types/content";

export const fr: Content = {
  // Header
  header: {
    appName: "WatchlistHub",
    home: "Accueil",
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
    edit: "Modifier",
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
    // Series info
    seriesInfo: {
      season: "saison",
      seasons: "saisons",
      episodes: "épisodes",
    },
    // Item Details Modal
    itemDetails: {
      loading: "Chargement...",
      error: "Échec du chargement des détails",
      mediaDetails: "Détails du média",
      fullDetailsFor: "Détails complets pour",
      loadingDetails: "Chargement des détails",
      notAvailable: "N/A",
      votes: "votes",
      synopsis: "Synopsis",
      director: "Réalisateur",
      creator: "Créateur",
      availableOn: "Disponible sur",
      mainCast: "Acteurs principaux",
      seeMore: "Voir plus",
    },
  },

  // Home Page
  home: {
    hero: {
      //   title: "Découvre, crée et partage tes watchlists",
      title: "Vos Watchlists parfaitement organisés",
      subtitle: "Ton univers cinéma, organisé et partagé avec tes amis.",
      cta: "Créer une watchlist",
    },
    categories: {
      title: "Watchlists par thème",
      subtitle: "Sélection WatchlistHub",
      seeMore: "Voir plus",
      items: {
        // Ligne 1 - Par type et plateforme
        movies: {
          title: "Films",
          description: "Sélection de films",
        },
        series: {
          title: "Séries",
          description: "Sélection de séries",
        },
        netflix: {
          title: "Netflix only",
          description: "Exclusivement sur Netflix",
        },
        primeVideo: {
          title: "Prime Video only",
          description: "Exclusivement sur Prime Video",
        },
        disneyPlus: {
          title: "Disney+ only",
          description: "Exclusivement sur Disney+",
        },
        crunchyroll: {
          title: "Crunchyroll only",
          description: "Exclusivement sur Crunchyroll",
        },
        // Ligne 2 - Par genre et thème
        netflixChill: {
          title: "Netflix & Chill",
          description: "Films populaires à voir à deux",
        },
        films2010s: {
          title: "Films 2010–2020",
          description: "Les incontournables modernes",
        },
        childhood: {
          title: "Classiques d'enfance",
          description: "Films jeunesse et nostalgie",
        },
        comedy: {
          title: "Comédie",
          description: "Pour rire et se détendre",
        },
        action: {
          title: "Action",
          description: "Films d'action et blockbusters",
        },
        anime: {
          title: "Anime",
          description: "Séries animées japonaises",
        },
      },
    },
    popularWatchlists: {
      title: "Watchlists populaires",
      subtitle: "Partagées par la communauté",
      seeMore: "Voir plus",
      noWatchlists: "Aucune watchlist publique pour le moment",
    },
    faq: {
      title: "Questions fréquentes",
      subtitle: "Tout ce que tu dois savoir pour commencer",
      questions: {
        privateWatchlists: {
          question: "Comment les watchlists privées fonctionnent ?",
          answer:
            "Les watchlists privées te permettent de garder tes sélections pour toi seul. Elles ne sont visibles que par toi et ne peuvent pas être partagées avec d'autres utilisateurs. Tu peux basculer entre privé et public à tout moment depuis les paramètres de ta watchlist.",
        },
        pricing: {
          question: "Est-ce que c'est gratuit à l'utilisation ?",
          answer:
            "Oui, l'application est entièrement gratuite ! Tu peux créer autant de watchlists que tu veux, les partager avec tes amis et explorer des milliers de films et séries sans aucun frais.",
        },
        exploreSection: {
          question: "À quoi sert la partie Explorer du site ?",
          answer:
            "La section Explorer te permet de découvrir de nouveaux contenus en parcourant les tendances actuelles, les films et séries les plus populaires ou les mieux notés. Tu peux filtrer par genre pour trouver exactement ce que tu recherches et ajouter directement des éléments à tes watchlists.",
        },
        whatMakesDifferent: {
          question: "Qu'est-ce qui fait que cette application est différente ?",
          answer:
            "Cette application a pour but de rester simple avec peu de fonctionnalités et de pages différentes pour être claire et facile d'utilisation. L'expérience se veut naturelle et intuitive, sans complexité inutile. On se concentre sur l'essentiel : organiser et partager tes films et séries préférés.",
        },
        streaming: {
          question: "Est-ce que je peux regarder des séries ou des films ?",
          answer:
            "Non, le but de cette application n'est pas le streaming mais le partage facile de contenu qui t'a plu sur tes plateformes favorites. On t'aide à organiser ce que tu veux regarder et à le partager avec ta communauté, mais pour visionner le contenu, tu devras te rendre sur les plateformes de streaming appropriées.",
        },
      },
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

  // Profile Page
  profile: {
    title: "Paramètres du profil",
    subtitle: "Gérez les paramètres et préférences de votre compte",
    userInformation: "Informations utilisateur",
    usernameSection: {
      title: "Nom d'utilisateur",
      description:
        "Modifiez votre nom d'utilisateur. C'est ainsi que les autres vous verront.",
      label: "Nom d'utilisateur",
      placeholder: "Entrez votre nom d'utilisateur",
      hint: "3-20 caractères. Lettres, chiffres et underscores uniquement.",
      updateButton: "Mettre à jour",
    },
    passwordSection: {
      title: "Mot de passe",
      description:
        "Changez votre mot de passe. Assurez-vous qu'il contient au moins 8 caractères.",
      currentPasswordLabel: "Mot de passe",
      currentPasswordPlaceholder: "Entrez votre mot de passe actuel",
      newPasswordLabel: "Nouveau mot de passe",
      newPasswordPlaceholder: "Nouveau mot de passe",
      confirmPasswordLabel: "Confirmation",
      confirmPasswordPlaceholder: "Nouveau mot de passe",
      changeButton: "Changer le mot de passe",
    },
    toasts: {
      usernameUpdated: "Nom d'utilisateur mis à jour",
      usernameUpdatedDesc:
        "Votre nom d'utilisateur a été mis à jour avec succès.",
      passwordChanged: "Mot de passe changé",
      passwordChangedDesc: "Votre mot de passe a été changé avec succès.",
      error: "Erreur",
      passwordMismatch: "Les nouveaux mots de passe ne correspondent pas",
      updateFailed: "Échec de la mise à jour du nom d'utilisateur",
      passwordChangeFailed: "Échec du changement de mot de passe",
    },
  },
};
