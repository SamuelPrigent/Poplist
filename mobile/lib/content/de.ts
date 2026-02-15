import type { Content } from '../../types/content';

export const de: Content = {
  // Header
  header: {
    appName: 'Poplist',
    tagline: 'Erstellen und teilen Sie Listen Ihrer Lieblingsfilme und -serien',
    home: 'Startseite',
    explore: 'Erkunden',
    login: 'Anmelden',
    signup: 'Registrieren',
    logout: 'Abmelden',
  },

  // Auth Drawer
  auth: {
    loginTitle: 'Anmelden',
    loginDescription: 'Willkommen zurück! Melden Sie sich an, um auf Ihre Listen zuzugreifen.',
    signupTitle: 'Registrieren',
    signupDescription: 'Erstellen Sie ein Konto, um Ihre Listen zu speichern.',
    continueWithGoogle: 'Mit Google fortfahren',
    or: 'Oder',
    email: 'E-Mail',
    emailPlaceholder: 'ihre@email.de',
    password: 'Passwort',
    passwordPlaceholder: 'Ihr Passwort',
    processing: 'Wird verarbeitet...',
    dontHaveAccount: 'Noch kein Konto?',
    alreadyHaveAccount: 'Bereits ein Konto?',
  },

  // Watchlists Page
  watchlists: {
    title: 'Bibliothek',
    noWatchlists: 'Sie haben noch keine Listen erstellt.',
    noWatchlistsInCategory: 'Keine Listen in dieser Kategorie',
    noItemsYet: 'Noch keine Elemente',
    noItemsDescription: 'Beginnen Sie, Filme und Serien zu Ihrer Liste hinzuzufügen.',
    addToWatchlist: 'Zu einer Liste hinzufügen',
    myWatchlists: 'Meine Listen',
    followed: 'Gefolgt',
    items: 'Elemente',
    item: 'Element',
    searchPlaceholder: 'Nach einem Film oder einer Serie suchen...',
    noResults: 'Keine Ergebnisse gefunden',
    startSearching: 'Filme und Serien suchen',
    // Content types
    contentTypes: {
      movie: 'Film',
      series: 'Serie',
    },
    // Series info
    seriesInfo: {
      season: 'Staffel',
      seasons: 'Staffeln',
      episodes: 'Episoden',
    },
    // Item Details Modal
    itemDetails: {
      loading: 'Lädt...',
      error: 'Fehler beim Laden der Details',
      mediaDetails: 'Mediendetails',
      fullDetailsFor: 'Vollständige Details für',
      loadingDetails: 'Details werden geladen',
      notAvailable: 'N/V',
      votes: 'Stimmen',
      synopsis: 'Zusammenfassung',
      director: 'Regisseur',
      creator: 'Schöpfer',
      availableOn: 'Verfügbar auf',
      mainCast: 'Hauptbesetzung',
      seeMore: 'Mehr sehen',
      showMore: 'Mehr anzeigen',
      showLess: 'Weniger anzeigen',
      add: 'Hinzufügen',
    },
  },

  // Home Page
  home: {
    categories: {
      title: 'Listen nach Kategorie',
      subtitle: 'Poplist-Auswahl',
      seeMore: 'Mehr sehen',
      items: {
        // Zeile 1 - Nach Typ und Plattform
        movies: {
          title: 'Filme',
          description: 'Filmauswahl',
        },
        series: {
          title: 'Serien',
          description: 'Serienauswahl',
        },
        netflix: {
          title: 'Netflix only',
          description: 'Exklusiv auf Netflix',
        },
        primeVideo: {
          title: 'Prime Video only',
          description: 'Exklusiv auf Prime Video',
        },
        disneyPlus: {
          title: 'Disney+ only',
          description: 'Exklusiv auf Disney+',
        },
        crunchyroll: {
          title: 'Crunchyroll only',
          description: 'Exklusiv auf Crunchyroll',
        },
        // Zeile 2 - Nach Genre und Thema
        netflixChill: {
          title: 'Netflix & Chill',
          description: 'Beliebte Filme zum Zusammenschauen',
        },
        films2010s: {
          title: 'Filme 2010–2020',
          description: 'Moderne Must-Sees',
        },
        childhood: {
          title: 'Kindheitsklassiker',
          description: 'Jugendfilme und Nostalgie',
        },
        comedy: {
          title: 'Komödie',
          description: 'Zum Lachen und Entspannen',
        },
        action: {
          title: 'Action',
          description: 'Actionfilme und Blockbuster',
        },
        anime: {
          title: 'Anime',
          description: 'Japanische Animationsserien',
        },
      },
    },
    popularWatchlists: {
      title: 'Beliebte Listen',
      subtitle: 'Von der Community geteilt',
      seeMore: 'Mehr sehen',
      noWatchlists: 'Momentan keine öffentlichen Listen',
    },
    creators: {
      title: 'Unsere Ersteller',
      subtitle: 'Die aktivsten Mitglieder der Community',
      seeMore: 'Alle anzeigen',
    },
  },

  explore: {
    title: 'Erkunden',
    subtitle: 'Entdecken Sie neue Listen, die von der Community geteilt werden',
    searchPlaceholder: 'Nach einer Liste suchen...',
    filters: {
      all: 'Alle',
      movies: 'Filme',
      series: 'Serien',
      trending: 'Trends',
      topRated: 'Am besten bewertet',
      popular: 'Beliebt',
      bestRated: 'Am besten bewertet',
      yearMin: 'Mindestjahr',
      yearMax: 'Maximaljahr',
      search: 'Suchen...',
      noYearFound: 'Kein Jahr gefunden.',
      clearYears: 'Jahre löschen',
    },
    genres: {
      action: 'Action',
      adventure: 'Abenteuer',
      animation: 'Animation',
      comedy: 'Komödie',
      crime: 'Krimi',
      documentary: 'Dokumentarfilm',
      drama: 'Drama',
      family: 'Familie',
      fantasy: 'Fantasy',
      horror: 'Horror',
      romance: 'Romantik',
      scienceFiction: 'Science-Fiction',
      thriller: 'Thriller',
      actionAdventure: 'Action & Abenteuer',
      kids: 'Kinder',
      mystery: 'Mystery',
      sciFiFantasy: 'Sci-Fi & Fantasy',
      soap: 'Seifenoper',
      western: 'Western',
    },
    sortBy: {
      label: 'Sortieren nach',
      popular: 'Am beliebtesten',
      recentlyAdded: 'Kürzlich hinzugefügt',
      mostItems: 'Meiste Elemente',
    },
    pagination: {
      pageOf: 'Seite {page} von {totalPages}',
    },
    noResults: 'Keine Listen gefunden',
    noResultsDescription: 'Versuchen Sie, Ihre Filter oder Suche anzupassen',
  },

  categories: {
    title: 'Kategorien',
    subtitle: 'Erkunden Sie Listen nach Thema',
    list: {
      movies: { name: 'Filme', description: 'Die besten Filme des Moments' },
      series: {
        name: 'Serien',
        description: 'Serien, die Sie nicht verpassen sollten',
      },
      netflix: { name: 'Netflix', description: 'Netflix-Perlen' },
      'prime-video': {
        name: 'Prime Video',
        description: 'Amazon Prime Exklusivtitel',
      },
      'disney-plus': {
        name: 'Disney+',
        description: 'Das Disney-, Pixar-, Marvel- und Star Wars-Universum',
      },
      'apple-tv': {
        name: 'Apple TV+',
        description: 'Apple TV+ Originalproduktionen',
      },
      crunchyroll: {
        name: 'Crunchyroll',
        description: 'Die besten Anime-Streams',
      },
      'hbo-max': {
        name: 'HBO Max',
        description: 'HBO-Serien und -Filme',
      },
      youtube: {
        name: 'YouTube',
        description: 'Auf YouTube verfügbare Filme und Serien',
      },
      'canal-plus': {
        name: 'Canal+',
        description: 'Canal+ Programme',
      },
      ocs: {
        name: 'OCS',
        description: 'Das Beste aus Kino und Serien',
      },
      'paramount-plus': {
        name: 'Paramount+',
        description: 'Paramount+ Produktionen',
      },
      'rakuten-tv': {
        name: 'Rakuten TV',
        description: 'Filme und Serien auf Rakuten TV',
      },
      anime: {
        name: 'Animation',
        description: 'Die besten Animationsserien und adaptierten Manga-Filme',
      },
      action: { name: 'Action', description: 'Klassiker und neue Actionfilme' },
      documentaries: {
        name: 'Dokumentarfilme',
        description: 'Fesselnde und lehrreiche Dokumentarfilme',
      },
      enfant: { name: 'Kinder', description: 'Filme und Serien für Kinder' },
      jeunesse: {
        name: 'Jugend',
        description: 'Filme und Serien für Jugendliche und junge Erwachsene',
      },
    },
  },

  // Footer
  footer: {
    appName: 'Poplist',
    language: 'Sprache',
  },

  // Profile Page
  profile: {
    usernameSection: {
      title: 'Benutzername',
      description: 'Aktualisieren Sie Ihren Benutzernamen. So werden Sie von anderen gesehen.',
      label: 'Benutzername',
      placeholder: 'Geben Sie Ihren Benutzernamen ein',
      hint: '3-20 Zeichen. Nur Buchstaben, Zahlen und Unterstriche.',
      updateButton: 'Aktualisieren',
      validation: {
        lengthError: 'Benutzername muss zwischen 3 und 20 Zeichen lang sein',
        formatError: 'Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten',
        alreadyTaken: 'Benutzername bereits vergeben',
      },
    },
    deleteSection: {
      title: 'Konto löschen',
      description: 'Unwiderrufliche Aktion. Alle Ihre Daten werden gelöscht.',
      dialogTitle: 'Ihr Konto löschen',
      dialogDescription: 'Unwiderrufliche Aktion. Alle Ihre Daten werden gelöscht.',
      confirmationLabel: "Geben Sie 'confirmer' ein, um fortzufahren",
      confirmationPlaceholder: 'confirmer',
      deleteButton: 'Konto löschen',
      deleting: 'Löschen...',
      cancel: 'Abbrechen',
    },
  },
  userProfile: {
    profile: 'Profil',
    publicWatchlists: 'Öffentliche Listen',
    publicWatchlist: 'Öffentliche Liste',
    watchlists: 'Listen',
    watchlist: 'Liste',
    noPublicWatchlists: 'Keine Listen veröffentlicht.',
    noPublicWatchlistsDescription:
      'Dieser Benutzer hat noch keine öffentlichen Listen veröffentlicht.',
    loading: 'Profil wird geladen...',
    notFound: 'Benutzer nicht gefunden',
    notFoundDescription: 'Der gesuchte Benutzer existiert nicht oder wurde gelöscht.',
    backToHome: 'Zurück zur Startseite',
  },
  settings: {
    tabs: {
      display: 'Anzeige',
      preferences: 'Einstellungen',
      account: 'Konto',
    },
    display: {
      backgroundColor: 'Hintergrundfarbe',
      backgroundColorHint: 'App-Design',
      ocean: 'Ozean',
      midnight: 'Mitternacht',
      listColumns: 'Listenspalten',
      listColumnsHint: 'Anzahl der Spalten auf der Startseite und Meine Listen',
      exploreColumns: 'Entdecken-Spalten',
      exploreColumnsHint: 'Anzahl der Spalten auf der Entdecken-Seite',
    },
    preferences: {
      language: 'Sprache',
      handedness: 'Dominante Hand',
      handednessHint: 'Position der Aktionsschaltflächen',
      leftHanded: 'Linkshänder',
      rightHanded: 'Rechtshänder',
    },
  },
};
