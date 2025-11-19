import type { Content } from "@/types/content";

export const fr: Content = {
  // Header
  header: {
    appName: "WatchlistHub",
    home: "Accueil",
    explore: "Explorer",
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
    title: "Bibliothèque",
    createWatchlist: "Nouvelle watchlist",
    createWatchlistDescription:
      "Créez une nouvelle watchlist pour organiser vos films et séries.",
    notLoggedInWarning: "Données locales",
    noWatchlists: "Vous n'avez pas encore créé de watchlist.",
    myWatchlists: "Mes watchlists",
    followed: "Suivies",
    noWatchlistsInCategory: "Aucune watchlist dans cette catégorie",
    adjustFilters: "Ajustez les filtres pour voir plus de watchlists",
    items: "éléments",
    item: "élément",
    headerPublic: "Liste publique",
    headerPrivate: "Liste privée",
    public: "Publique",
    private: "Privé",
    loading: "Chargement...",
    accountDataBadge: "Données du compte utilisateur",
    preview: "Aperçu",
    categories: "Catégories / Tags",
    categoriesDescription:
      "Sélectionnez une ou plusieurs catégories pour faciliter la découverte de votre watchlist",
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
    deleteWatchlistConfirm: 'Êtes-vous sûr de vouloir supprimer "{name}" ?',
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
    tooltips: {
      share: "Partager",
      save: "Ajouter à la bibliothèque",
      unsave: "Retirer de la bibliothèque",
      duplicate: "Dupliquer dans mon espace",
      inviteCollaborator: "Inviter un collaborateur",
    },
    contextMenu: {
      addToWatchlist: "Ajouter à une watchlist",
      removeFromWatchlist: "Retirer de la watchlist",
      moveToFirst: "Déplacer en première position",
      moveToLast: "Déplacer en dernière position",
    },
    collaborators: {
      addTitle: "Ajouter un collaborateur",
      addDescription:
        "Entrez le nom d'utilisateur pour inviter un collaborateur",
      usernamePlaceholder: "Nom d'utilisateur",
      add: "Ajouter",
      adding: "Ajout...",
      addSuccess: "Collaborateur ajouté avec succès",
      addError: "Impossible d'ajouter le collaborateur",
      currentTitle: "Collaborateurs actuels",
      remove: "Retirer",
      removeSuccess: "Collaborateur retiré",
      removeError: "Impossible de retirer le collaborateur",
      leaveTitle: "Quitter la watchlist ?",
      leaveDescription:
        "Êtes-vous sûr de vouloir quitter cette watchlist ? Vous perdrez vos droits de collaborateur.",
      leave: "Quitter",
      leaving: "Sortie...",
      leaveSuccess: "Vous avez quitté la watchlist",
      leaveError: "Échec de la sortie de la watchlist",
    },
    addToWatchlist: "Ajouter à une watchlist",
    noWatchlist: "Aucune watchlist",
  },

  landing: {
    hero: {
      tagline: "Planifiez, suivez et profitez de vos films ensemble",
      title: "Vos Watchlists parfaitement organisées",
      subtitle:
        "Organisez vos soirées TV et partagez vos découvertes avec vos amis",
      cta: "Créer une watchlist",
    },
    features: {
      organize: {
        tagline: "Organisation",
        title: "Création de listes collaboratives",
        description:
          "Créez des listes personnelles ou collaboratives de films et séries.",
      },
      discover: {
        tagline: "Découverte",
        title: "Découvrez des films et séries",
        description:
          "Utilisez la fonction explorer pour trouver du contenu à ajouter à vos watchlists.",
      },
      share: {
        tagline: "Partage",
        title: "Suivez les watchlists de la communauté",
        description:
          "Ajouter les watchlists d'autres utilisateurs à votre espace personnel.",
      },
    },
    startInSeconds: {
      title: "Démarrez dans la secondes",
      subtitle: "Pas de set-up compliqué, c'est vous et vos contenus préférés",
      step1: {
        title: "Créez votre watchlist",
        description:
          'Commencez avec "Mes films favoris" ou soyez nostalgique avec "Films d\'enfance".',
      },
      step2: {
        title: "Ajoutez des films",
        description:
          "Recherchez un film ou une série à l'aide d'un mot clé et ajoutez le à votre watchlist du moment.",
      },
      step3: {
        title: "Partagez-la avec vos amis",
        description:
          'Mettez vos watchlist en mode "public" et partagez les facilement avec un lien.',
      },
    },
    testimonials: {
      title: "Apprécié par les passionnés",
      subtitle: "Rejoignez une communauté d'utilisateurs satisfaits",
      testimonial1: {
        text: "Application parfaite pour organiser mes watchlists. Interface claire et intuitive.",
        author: "— Marie L.",
      },
      testimonial2: {
        text: "Très pratique ! Permet de garder une trace de ce qu'on a vu et de ce qu'on souhaite recommander.",
        author: "— Thomas D.",
      },
      testimonial3: {
        text: "Simple, efficace, exactement ce que je cherchais pour gérer mes films à voir.",
        author: "— Julie M.",
      },
    },
    finalCta: {
      title: "Commence à créer tes watchlists facilement",
      subtitle:
        "Rejoignez WatchlistHub et organisez vos contenus favoris en quelques clics.",
      button: "Créer ma watchlist",
      disclaimer: "Application gratuite • Pas de carte requise",
    },
  },

  // Home Page
  home: {
    hero: {
      //   title: "Découvre, crée et partage tes watchlists",
      title: "Vos Watchlists parfaitement organisées",
      subtitle: "Ton univers cinéma, organisée et partagé avec tes amis.",
      cta: "Créer une watchlist",
      pills: {
        organize: "Organisez vos films",
        share: "Partagez avec vos amis",
        discover: "Découvrez des pépites",
      },
    },
    library: {
      title: "Bibliothèque",
      subtitle: "Vos watchlists personnelles",
      seeAll: "Voir tout",
    },
    categories: {
      title: "Watchlists par thème",
      subtitle: "Catégorie WatchlistHub",
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
    recommendations: {
      title: "Tendances du moment",
      subtitle: "Les titres qui cartonnent cette semaine.",
      seeMore: "Voir tout",
    },
  },

  explore: {
    title: "Explorer",
    subtitle: "Découvrez de nouvelles watchlists partagées par la communauté",
    searchPlaceholder: "Rechercher une watchlist...",
    filters: {
      all: "Tout",
      movies: "Films",
      series: "Séries",
      trending: "Tendances",
      topRated: "Mieux notés",
    },
    sortBy: {
      label: "Trier par",
      popular: "Les plus populaires",
      recentlyAdded: "Récemment ajoutées",
      mostItems: "Plus d'éléments",
    },
    pagination: {
      pageOf: "Page {page} sur {totalPages}",
    },
    noResults: "Aucune watchlist trouvée",
    noResultsDescription: "Essayez de modifier vos filtres ou votre recherche",
  },

  categories: {
    title: "Catégories",
    subtitle: "Explorez les watchlists par thème",
    list: {
      movies: {
        name: "Films",
        description: "Les meilleurs films du moment",
      },
      series: {
        name: "Séries",
        description: "Les séries à ne pas manquer",
      },
      netflix: {
        name: "Netflix",
        description: "Les pépites Netflix",
      },
      "prime-video": {
        name: "Prime Video",
        description: "Exclusivités Amazon Prime",
      },
      "disney-plus": {
        name: "Disney+",
        description: "L'univers Disney, Pixar, Marvel et Star Wars",
      },
      anime: {
        name: "Animation",
        description:
          "Les meilleurs séries et films d'animation et manga adaptés",
      },
      action: {
        name: "Action",
        description: "Classiques et nouveautés films d'actions",
      },
      documentaries: {
        name: "Documentaires",
        description: "Documentaires captivants et éducatifs",
      },
      enfant: {
        name: "Enfant",
        description: "Films et séries pour enfant",
      },
      jeunesse: {
        name: "Jeunesse",
        description: "Films et séries adolescent et adulte",
      },
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
    avatarSection: {
      title: "Photo de profil",
      description:
        "Téléchargez une photo de profil pour personnaliser votre compte",
      uploadButton: "Télécharger",
      changeButton: "Modifier",
      deleteButton: "Supprimer",
      uploading: "Téléchargement...",
      deleting: "Suppression...",
      hint: "Recommandé : Image carrée, 5 Mo maximum",
      validation: {
        invalidFileType: "Veuillez sélectionner un fichier image valide",
        fileTooLarge: "La taille de l'image doit être inférieure à 5 Mo",
        uploadFailed: "Échec du téléchargement de l'avatar",
        deleteFailed: "Échec de la suppression de l'avatar",
        readFailed: "Échec de la lecture du fichier image",
      },
      toasts: {
        updated: "Avatar mis à jour",
        updatedDesc: "Votre avatar a été mis à jour avec succès",
        deleted: "Avatar supprimé",
        deletedDesc: "Votre avatar a été supprimé avec succès",
      },
    },
    usernameSection: {
      title: "Nom d'utilisateur",
      description:
        "Modifiez votre nom d'utilisateur. C'est ainsi que les autres vous verront.",
      label: "Nom d'utilisateur",
      placeholder: "Entrez votre nom d'utilisateur",
      hint: "3-20 caractères. Lettres, chiffres et underscores uniquement.",
      updateButton: "Mettre à jour",
      validation: {
        lengthError:
          "Le nom d'utilisateur doit contenir entre 3 et 20 caractères",
        formatError:
          "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores",
        alreadyTaken: "Le nom d'utilisateur est déjà pris",
      },
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
    deleteSection: {
      title: "Supprimer le compte",
      description: "Action irréversible. Toutes vos données seront supprimées.",
      dialogTitle: "Supprimer votre compte",
      dialogDescription:
        "Action irréversible. Toutes vos données seront supprimées.",
      confirmationLabel: "Tapez 'confirmer' pour continuer",
      confirmationPlaceholder: "confirmer",
      deleteButton: "Supprimer le compte",
      deleting: "Suppression...",
      cancel: "Annuler",
    },
    toasts: {
      usernameUpdated: "Nom d'utilisateur mis à jour",
      usernameUpdatedDesc:
        "Votre nom d'utilisateur a été mis à jour avec succès.",
      passwordChanged: "Mot de passe changé",
      passwordChangedDesc: "Votre mot de passe a été changé avec succès.",
      accountDeleted: "Compte supprimé",
      accountDeletedDesc: "Votre compte a été supprimé avec succès.",
      error: "Erreur",
      passwordMismatch: "Les nouveaux mots de passe ne correspondent pas",
      updateFailed: "Échec de la mise à jour du nom d'utilisateur",
      passwordChangeFailed: "Échec du changement de mot de passe",
      accountDeleteFailed: "Échec de la suppression du compte",
    },
  },
};
