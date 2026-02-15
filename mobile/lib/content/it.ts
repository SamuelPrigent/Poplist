import type { Content } from '../../types/content';

export const it: Content = {
  // Header
  header: {
    appName: 'Poplist',
    tagline: 'Crea e condividi liste dei tuoi film e serie preferiti',
    home: 'Home',
    explore: 'Esplora',
    login: 'Accedi',
    signup: 'Registrati',
    logout: 'Esci',
  },

  // Auth Drawer
  auth: {
    loginTitle: 'Accedi',
    loginDescription: 'Bentornato! Accedi per accedere alle tue liste.',
    signupTitle: 'Registrati',
    signupDescription: 'Crea un account per salvare le tue liste.',
    continueWithGoogle: 'Continua con Google',
    or: 'Oppure',
    email: 'Email',
    emailPlaceholder: 'tua@email.it',
    password: 'Password',
    passwordPlaceholder: 'La tua password',
    processing: 'Elaborazione...',
    dontHaveAccount: 'Non hai un account?',
    alreadyHaveAccount: 'Hai già un account?',
  },

  // Watchlists Page
  watchlists: {
    title: 'Biblioteca',
    noWatchlists: 'Non hai ancora creato nessuna lista.',
    noWatchlistsInCategory: 'Nessuna lista in questa categoria',
    noItemsYet: 'Ancora nessun elemento',
    noItemsDescription: 'Inizia ad aggiungere film e serie alla tua lista.',
    addToWatchlist: 'Aggiungi a una lista',
    myWatchlists: 'Le mie liste',
    followed: 'Seguite',
    items: 'elementi',
    item: 'elemento',
    searchPlaceholder: 'Cerca un film o una serie...',
    noResults: 'Nessun risultato trovato',
    startSearching: 'Cerca film e serie',
    // Content types
    contentTypes: {
      movie: 'Film',
      series: 'Serie',
    },
    // Series info
    seriesInfo: {
      season: 'stagione',
      seasons: 'stagioni',
      episodes: 'episodi',
    },
    // Item Details Modal
    itemDetails: {
      loading: 'Caricamento...',
      error: 'Impossibile caricare i dettagli',
      mediaDetails: 'Dettagli del media',
      fullDetailsFor: 'Dettagli completi per',
      loadingDetails: 'Caricamento dettagli',
      notAvailable: 'N/D',
      votes: 'voti',
      synopsis: 'Sinossi',
      director: 'Regista',
      creator: 'Creatore',
      availableOn: 'Disponibile su',
      mainCast: 'Cast principale',
      seeMore: 'Vedi altro',
      showMore: 'Mostra di più',
      showLess: 'Mostra meno',
      add: 'Aggiungi',
    },
  },

  // Home Page
  home: {
    categories: {
      title: 'Liste per categoria',
      subtitle: 'Selezione Poplist',
      seeMore: 'Vedi altro',
      items: {
        // Riga 1 - Per tipo e piattaforma
        movies: {
          title: 'Film',
          description: 'Selezione di film',
        },
        series: {
          title: 'Serie',
          description: 'Selezione di serie',
        },
        netflix: {
          title: 'Netflix only',
          description: 'Esclusivamente su Netflix',
        },
        primeVideo: {
          title: 'Prime Video only',
          description: 'Esclusivamente su Prime Video',
        },
        disneyPlus: {
          title: 'Disney+ only',
          description: 'Esclusivamente su Disney+',
        },
        crunchyroll: {
          title: 'Crunchyroll only',
          description: 'Esclusivamente su Crunchyroll',
        },
        // Riga 2 - Per genere e tema
        netflixChill: {
          title: 'Netflix & Chill',
          description: 'Film popolari da guardare insieme',
        },
        films2010s: {
          title: 'Film 2010–2020',
          description: 'Imperdibili moderni',
        },
        childhood: {
          title: "Classici dell'infanzia",
          description: 'Film per ragazzi e nostalgia',
        },
        comedy: {
          title: 'Commedia',
          description: 'Per ridere e rilassarsi',
        },
        action: {
          title: 'Azione',
          description: "Film d'azione e blockbuster",
        },
        anime: {
          title: 'Anime',
          description: 'Serie animate giapponesi',
        },
      },
    },
    popularWatchlists: {
      title: 'Liste popolari',
      subtitle: 'Condivise dalla community',
      seeMore: 'Vedi altro',
      noWatchlists: 'Nessuna lista pubblica al momento',
    },
    creators: {
      title: 'I nostri creatori',
      subtitle: 'I membri più attivi della comunità',
      seeMore: 'Vedi tutto',
    },
  },

  explore: {
    title: 'Esplora',
    subtitle: 'Scopri nuove liste condivise dalla community',
    searchPlaceholder: 'Cerca una lista...',
    filters: {
      all: 'Tutto',
      movies: 'Film',
      series: 'Serie',
      trending: 'Tendenze',
      topRated: 'Più votati',
      popular: 'Popolari',
      bestRated: 'Più votati',
      yearMin: 'Anno minimo',
      yearMax: 'Anno massimo',
      search: 'Cerca...',
      noYearFound: 'Nessun anno trovato.',
      clearYears: 'Cancella anni',
    },
    genres: {
      action: 'Azione',
      adventure: 'Avventura',
      animation: 'Animazione',
      comedy: 'Commedia',
      crime: 'Crimine',
      documentary: 'Documentario',
      drama: 'Dramma',
      family: 'Famiglia',
      fantasy: 'Fantasy',
      horror: 'Horror',
      romance: 'Romantico',
      scienceFiction: 'Fantascienza',
      thriller: 'Thriller',
      actionAdventure: 'Azione e Avventura',
      kids: 'Bambini',
      mystery: 'Mistero',
      sciFiFantasy: 'Fantascienza e Fantasy',
      soap: 'Soap Opera',
      western: 'Western',
    },
    sortBy: {
      label: 'Ordina per',
      popular: 'Più popolari',
      recentlyAdded: 'Aggiunte di recente',
      mostItems: 'Più elementi',
    },
    pagination: {
      pageOf: 'Pagina {page} di {totalPages}',
    },
    noResults: 'Nessuna lista trovata',
    noResultsDescription: 'Prova a modificare i tuoi filtri o la ricerca',
  },

  categories: {
    title: 'Categorie',
    subtitle: 'Esplora liste per tema',
    list: {
      movies: { name: 'Film', description: 'I migliori film del momento' },
      series: { name: 'Serie', description: 'Serie da non perdere' },
      netflix: { name: 'Netflix', description: 'Perle di Netflix' },
      'prime-video': {
        name: 'Prime Video',
        description: 'Esclusive Amazon Prime',
      },
      'disney-plus': {
        name: 'Disney+',
        description: "L'universo Disney, Pixar, Marvel e Star Wars",
      },
      'apple-tv': {
        name: 'Apple TV+',
        description: 'Produzioni originali Apple TV+',
      },
      crunchyroll: {
        name: 'Crunchyroll',
        description: 'I migliori anime in streaming',
      },
      'hbo-max': {
        name: 'HBO Max',
        description: 'Serie e film HBO',
      },
      youtube: {
        name: 'YouTube',
        description: 'Film e serie disponibili su YouTube',
      },
      'canal-plus': {
        name: 'Canal+',
        description: 'Programmi Canal+',
      },
      ocs: {
        name: 'OCS',
        description: 'Il meglio del cinema e delle serie',
      },
      'paramount-plus': {
        name: 'Paramount+',
        description: 'Produzioni Paramount+',
      },
      'rakuten-tv': {
        name: 'Rakuten TV',
        description: 'Film e serie su Rakuten TV',
      },
      anime: {
        name: 'Animazione',
        description: 'Le migliori serie animate e film manga adattati',
      },
      action: { name: 'Azione', description: "Classici e nuovi film d'azione" },
      documentaries: {
        name: 'Documentari',
        description: 'Documentari accattivanti ed educativi',
      },
      enfant: { name: 'Bambini', description: 'Film e serie per bambini' },
      jeunesse: {
        name: 'Giovani',
        description: 'Film e serie per adolescenti e giovani adulti',
      },
    },
  },

  // Footer
  footer: {
    appName: 'Poplist',
    language: 'Lingua',
  },

  // Profile Page
  profile: {
    usernameSection: {
      title: 'Nome utente',
      description: 'Aggiorna il tuo nome utente. È così che gli altri ti vedranno.',
      label: 'Nome utente',
      placeholder: 'Inserisci il tuo nome utente',
      hint: '3-20 caratteri. Solo lettere, numeri e trattini bassi.',
      updateButton: 'Aggiorna',
      validation: {
        lengthError: 'Il nome utente deve essere compreso tra 3 e 20 caratteri',
        formatError: 'Il nome utente può contenere solo lettere, numeri e trattini bassi',
        alreadyTaken: 'Nome utente già in uso',
      },
    },
    deleteSection: {
      title: 'Elimina account',
      description: 'Azione irreversibile. Tutti i tuoi dati verranno eliminati.',
      dialogTitle: 'Elimina il tuo account',
      dialogDescription: 'Azione irreversibile. Tutti i tuoi dati verranno eliminati.',
      confirmationLabel: "Digita 'confirmer' per continuare",
      confirmationPlaceholder: 'confirmer',
      deleteButton: 'Elimina account',
      deleting: 'Eliminazione...',
      cancel: 'Annulla',
    },
  },
  userProfile: {
    profile: 'Profilo',
    publicWatchlists: 'Liste pubbliche',
    publicWatchlist: 'Lista pubblica',
    watchlists: 'liste',
    watchlist: 'lista',
    noPublicWatchlists: 'Nessuna lista pubblicata.',
    noPublicWatchlistsDescription: 'Questo utente non ha ancora pubblicato nessuna lista pubblica.',
    loading: 'Caricamento profilo...',
    notFound: 'Utente non trovato',
    notFoundDescription: "L'utente che stai cercando non esiste o è stato eliminato.",
    backToHome: 'Torna alla home',
  },
  settings: {
    tabs: {
      display: 'Schermo',
      preferences: 'Preferenze',
      account: 'Account',
    },
    display: {
      backgroundColor: 'Colore di sfondo',
      backgroundColorHint: "Tema dell'app",
      ocean: 'Oceano',
      midnight: 'Mezzanotte',
      listColumns: 'Colonne liste',
      listColumnsHint: 'Numero di colonne nella home e nelle mie liste',
      exploreColumns: 'Colonne Esplora',
      exploreColumnsHint: 'Numero di colonne nella pagina Esplora',
    },
    preferences: {
      language: 'Lingua',
      handedness: 'Mano dominante',
      handednessHint: 'Posizione dei pulsanti di azione',
      leftHanded: 'Mancino',
      rightHanded: 'Destro',
    },
  },
};
