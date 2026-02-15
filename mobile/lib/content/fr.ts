import type { Content } from "../../types/content";

export const fr: Content = {
   // Header
   header: {
      appName: "Poplist",
      tagline: "Créez et partagez des listes de vos films et séries préférés",
      home: "Accueil",
      explore: "Explorer",
      login: "Connexion",
      signup: "Inscription",
      logout: "Déconnexion",
   },

   // Auth Drawer
   auth: {
      loginTitle: "Connexion",
      loginDescription: "Connectez-vous pour accéder à vos listes.",
      signupTitle: "Inscription",
      signupDescription: "Créez un compte pour sauvegarder vos listes.",
      continueWithGoogle: "Continuer avec Google",
      or: "Ou",
      email: "Email",
      emailPlaceholder: "votre@email.com",
      password: "Mot de passe",
      passwordPlaceholder: "Votre mot de passe",
      processing: "Traitement...",
      dontHaveAccount: "Vous n'avez pas de compte ?",
      alreadyHaveAccount: "Vous avez déjà un compte ?",
   },

   // Watchlists Page
   watchlists: {
      title: "Bibliothèque",
      noWatchlists: "Vous n'avez pas encore créé de liste.",
      noWatchlistsInCategory: "Aucune liste dans cette catégorie",
      noItemsYet: "Aucun élément pour le moment",
      noItemsDescription: "Commencez à ajouter des films et séries à votre liste.",
      addToWatchlist: "Ajouter à une liste",
      myWatchlists: "Mes listes",
      followed: "Suivies",
      items: "éléments",
      item: "élément",
      searchPlaceholder: "Rechercher un film ou une série...",
      noResults: "Aucun résultat trouvé",
      startSearching: "Rechercher des films et séries",
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
         seeMore: "Voir tout",
         showMore: "Voir plus",
         showLess: "Voir moins",
         add: "Ajouter",
      },
   },

   // Home Page
   home: {
      categories: {
         title: "Listes par catégorie",
         subtitle: "Catégorie Poplist",
         seeMore: "Voir tout",
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
         title: "Listes populaires",
         subtitle: "Partagées par la communauté",
         seeMore: "Voir tout",
         noWatchlists: "Aucune liste publique pour le moment",
      },
      creators: {
         title: "Nos créateurs",
         subtitle: "Les membres les plus actifs de la communauté",
         seeMore: "Voir tout",
      },
   },

   explore: {
      title: "Explorer",
      subtitle: "Découvrez de nouvelles listes partagées par la communauté",
      searchPlaceholder: "Rechercher une liste...",
      filters: {
         all: "Tout",
         movies: "Films",
         series: "Séries",
         trending: "Tendances",
         topRated: "Mieux notés",
         popular: "Populaires",
         bestRated: "Mieux notés",
         yearMin: "Année minimum",
         yearMax: "Année maximum",
         search: "Rechercher...",
         noYearFound: "Aucune année trouvée.",
         clearYears: "Effacer les années",
      },
      genres: {
         action: "Action",
         adventure: "Aventure",
         animation: "Animation",
         comedy: "Comédie",
         crime: "Crime",
         documentary: "Documentaire",
         drama: "Drame",
         family: "Familial",
         fantasy: "Fantastique",
         horror: "Horreur",
         romance: "Romance",
         scienceFiction: "Science-Fiction",
         thriller: "Thriller",
         actionAdventure: "Action & Aventure",
         kids: "Enfants",
         mystery: "Mystère",
         sciFiFantasy: "Science-Fiction & Fantastique",
         soap: "Feuilleton",
         western: "Western",
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
      noResults: "Aucune liste trouvée",
      noResultsDescription: "Essayez de modifier vos filtres ou votre recherche",
   },

   categories: {
      title: "Catégories",
      subtitle: "Explorez les listes par thème",
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
         "apple-tv": {
            name: "Apple TV+",
            description: "Les productions originales Apple TV+",
         },
         crunchyroll: {
            name: "Crunchyroll",
            description: "Les meilleurs animes en streaming",
         },
         "hbo-max": {
            name: "HBO Max",
            description: "Les séries et films HBO",
         },
         youtube: {
            name: "YouTube",
            description: "Films et séries disponibles sur YouTube",
         },
         "canal-plus": {
            name: "Canal+",
            description: "Les programmes Canal+",
         },
         ocs: {
            name: "OCS",
            description: "Le meilleur du cinéma et des séries",
         },
         "paramount-plus": {
            name: "Paramount+",
            description: "Les productions Paramount+",
         },
         "rakuten-tv": {
            name: "Rakuten TV",
            description: "Films et séries sur Rakuten TV",
         },
         anime: {
            name: "Animation",
            description: "Les meilleurs séries et films d'animation et manga adaptés",
         },
         action: {
            name: "Action",
            description: "Classiques et nouveautés films d'actions",
         },
         documentaries: {
            name: "Docu",
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
      appName: "Poplist",
      language: "Langue",
   },

   // Profile Page
   profile: {
      usernameSection: {
         title: "Nom d'utilisateur",
         description: "Modifiez votre nom d'utilisateur. C'est ainsi que les autres vous verront.",
         label: "Nom d'utilisateur",
         placeholder: "Entrez votre nom d'utilisateur",
         hint: "3-20 caractères. Lettres, chiffres et underscores uniquement.",
         updateButton: "Mettre à jour",
         validation: {
            lengthError: "Le nom d'utilisateur doit contenir entre 3 et 20 caractères",
            formatError:
               "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores",
            alreadyTaken: "Le nom d'utilisateur est déjà pris",
         },
      },
      deleteSection: {
         title: "Supprimer le compte",
         description: "Action irréversible. Toutes vos données seront supprimées.",
         dialogTitle: "Supprimer votre compte",
         dialogDescription: "Action irréversible. Toutes vos données seront supprimées.",
         confirmationLabel: "Tapez 'confirmer' pour continuer",
         confirmationPlaceholder: "confirmer",
         deleteButton: "Supprimer le compte",
         deleting: "Suppression...",
         cancel: "Annuler",
      },
   },
   userProfile: {
      profile: "Profil",
      publicWatchlists: "Listes publiques",
      publicWatchlist: "Liste publique",
      watchlists: "listes",
      watchlist: "liste",
      noPublicWatchlists: "Aucune liste n'a été publiée.",
      noPublicWatchlistsDescription: "Cet utilisateur n'a pas encore publié de liste publique.",
      loading: "Chargement du profil...",
      notFound: "Utilisateur introuvable",
      notFoundDescription: "L'utilisateur que vous recherchez n'existe pas ou a été supprimé.",
      backToHome: "Retour à l'accueil",
   },
   settings: {
      tabs: {
         display: "Affichage",
         preferences: "Préférences",
         account: "Compte",
      },
      display: {
         backgroundColor: "Couleur de fond",
         backgroundColorHint: "Thème de l'application",
         ocean: "Océan",
         midnight: "Minuit",
         listColumns: "Colonnes des listes",
         listColumnsHint: "Nombre de colonnes sur la page d'accueil et mes listes",
         exploreColumns: "Colonnes Explorer",
         exploreColumnsHint: "Nombre de colonnes sur la page Explorer",
      },
      preferences: {
         language: "Langue",
         handedness: "Main dominante",
         handednessHint: "Position des boutons d'action",
         leftHanded: "Gaucher",
         rightHanded: "Droitier",
      },
   },
};
