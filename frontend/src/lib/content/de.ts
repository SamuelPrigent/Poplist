import type { Content } from "@/types/content";

export const de: Content = {
  // Header
  header: {
    appName: "WatchlistHub",
    home: "Startseite",
    login: "Anmelden",
    signup: "Registrieren",
    logout: "Abmelden",
  },

  // Auth Drawer
  auth: {
    loginTitle: "Anmelden",
    loginDescription: "Willkommen zurück! Melden Sie sich an, um auf Ihre Watchlists zuzugreifen.",
    signupTitle: "Registrieren",
    signupDescription: "Erstellen Sie ein Konto, um Ihre Watchlists zu speichern.",
    continueWithGoogle: "Mit Google fortfahren",
    or: "Oder",
    email: "E-Mail",
    emailPlaceholder: "ihre@email.de",
    password: "Passwort",
    passwordPlaceholder: "••••••••",
    processing: "Wird verarbeitet...",
    dontHaveAccount: "Noch kein Konto?",
    alreadyHaveAccount: "Bereits ein Konto?",
  },

  // Watchlists Page
  watchlists: {
    title: "Ihre Watchlists",
    createWatchlist: "Erstellen",
    createWatchlistDescription:
      "Erstellen Sie eine neue Watchlist, um Ihre Filme und Serien zu organisieren.",
    notLoggedInWarning: "Lokale Daten",
    noWatchlists: "Sie haben noch keine Watchlists erstellt.",
    items: "Elemente",
    item: "Element",
    public: "Öffentlich",
    private: "Privat",
    loading: "Lädt...",
    accountDataBadge: "Benutzerkontodaten",
    name: "Name",
    namePlaceholder: "Meine Watchlist",
    description: "Beschreibung",
    descriptionPlaceholder: "Beschreibung Ihrer Watchlist",
    coverImage: "Titelbild",
    uploadImage: "Bild hochladen",
    changeImage: "Bild ändern",
    imageUploadHint: "PNG, JPG oder WEBP (max. 5MB)",
    makePublic: "Öffentlich machen",
    cancel: "Abbrechen",
    create: "Erstellen",
    creating: "Wird erstellt...",
    back: "Zurück",
    noItemsYet: "Noch keine Elemente",
    noItemsDescription:
      "Beginnen Sie damit, Filme und Serien zu Ihrer Watchlist hinzuzufügen, um Ihre Warteschlange zu organisieren.",
    edit: "Bearbeiten",
    editWatchlist: "Watchlist bearbeiten",
    editWatchlistDescription: "Bearbeiten Sie die Informationen Ihrer Watchlist.",
    deleteWatchlist: "Watchlist löschen",
    deleteWatchlistConfirm:
      'Möchten Sie "{name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
    deleteWatchlistWarning:
      "Diese Watchlist enthält {count} Element(e), die ebenfalls gelöscht werden.",
    saving: "Wird gespeichert...",
    save: "Speichern",
    deleting: "Wird gelöscht...",
    delete: "Löschen",
    addItem: "Hinzufügen",
    searchMoviesAndSeries: "Suchen und fügen Sie Filme oder Serien zu Ihrer Watchlist hinzu",
    searchPlaceholder: "Nach einem Film oder einer Serie suchen...",
    searching: "Sucht...",
    noResults: "Keine Ergebnisse gefunden",
    startSearching: "Beginnen Sie mit der Eingabe, um nach Filmen und Serien zu suchen",
    add: "Hinzufügen",
    added: "Hinzugefügt",
    inWatchlist: "In Watchlist",
    // Table headers
    tableHeaders: {
      number: "#",
      title: "Titel",
      type: "Typ",
      platforms: "Plattformen",
      duration: "Dauer",
    },
    // Content types
    contentTypes: {
      movie: "Film",
      series: "Serie",
    },
    // Series info
    seriesInfo: {
      season: "Staffel",
      seasons: "Staffeln",
      episodes: "Episoden",
    },
    // Item Details Modal
    itemDetails: {
      loading: "Lädt...",
      error: "Fehler beim Laden der Details",
      mediaDetails: "Mediendetails",
      fullDetailsFor: "Vollständige Details für",
      loadingDetails: "Details werden geladen",
      notAvailable: "N/V",
      votes: "Stimmen",
      synopsis: "Zusammenfassung",
      director: "Regisseur",
      creator: "Schöpfer",
      availableOn: "Verfügbar auf",
      mainCast: "Hauptbesetzung",
      seeMore: "Mehr sehen",
    },
  },

  // Home Page
  home: {
    hero: {
      title: "Entdecken, erstellen und teilen Sie Ihre Watchlists.",
      subtitle: "Ihr Film-Universum, organisiert und mit Freunden geteilt.",
      cta: "Watchlist erstellen",
    },
    categories: {
      title: "Watchlists nach Thema",
      subtitle: "WatchlistHub-Auswahl",
      seeMore: "Mehr sehen",
      items: {
        // Zeile 1 - Nach Typ und Plattform
        movies: {
          title: "Filme",
          description: "Filmauswahl",
        },
        series: {
          title: "Serien",
          description: "Serienauswahl",
        },
        netflix: {
          title: "Netflix only",
          description: "Exklusiv auf Netflix",
        },
        primeVideo: {
          title: "Prime Video only",
          description: "Exklusiv auf Prime Video",
        },
        disneyPlus: {
          title: "Disney+ only",
          description: "Exklusiv auf Disney+",
        },
        crunchyroll: {
          title: "Crunchyroll only",
          description: "Exklusiv auf Crunchyroll",
        },
        // Zeile 2 - Nach Genre und Thema
        netflixChill: {
          title: "Netflix & Chill",
          description: "Beliebte Filme zum Zusammenschauen",
        },
        films2010s: {
          title: "Filme 2010–2020",
          description: "Moderne Must-Sees",
        },
        childhood: {
          title: "Kindheitsklassiker",
          description: "Jugendfilme und Nostalgie",
        },
        comedy: {
          title: "Komödie",
          description: "Zum Lachen und Entspannen",
        },
        action: {
          title: "Action",
          description: "Actionfilme und Blockbuster",
        },
        anime: {
          title: "Anime",
          description: "Japanische Animationsserien",
        },
      },
    },
    popularWatchlists: {
      title: "Beliebte Watchlists",
      subtitle: "Von der Community geteilt",
      seeMore: "Mehr sehen",
      noWatchlists: "Momentan keine öffentlichen Watchlists",
    },
    faq: {
      title: "Häufig gestellte Fragen",
      subtitle: "Alles, was Sie wissen müssen, um loszulegen",
      questions: {
        privateWatchlists: {
          question: "Wie funktionieren private Watchlists?",
          answer:
            "Private Watchlists ermöglichen es Ihnen, Ihre Auswahl für sich zu behalten. Sie sind nur für Sie sichtbar und können nicht mit anderen Benutzern geteilt werden. Sie können jederzeit in den Einstellungen Ihrer Watchlist zwischen privat und öffentlich wechseln.",
        },
        pricing: {
          question: "Ist die Nutzung kostenlos?",
          answer:
            "Ja, die App ist völlig kostenlos! Sie können so viele Watchlists erstellen, wie Sie möchten, sie mit Ihren Freunden teilen und Tausende von Filmen und Serien ohne Gebühren erkunden.",
        },
        exploreSection: {
          question: "Wofür ist der Bereich Erkunden?",
          answer:
            "Der Bereich Erkunden ermöglicht es Ihnen, neue Inhalte zu entdecken, indem Sie aktuelle Trends, die beliebtesten oder am besten bewerteten Filme und Serien durchsuchen. Sie können nach Genre filtern, um genau das zu finden, was Sie suchen, und Elemente direkt zu Ihren Watchlists hinzufügen.",
        },
        whatMakesDifferent: {
          question: "Was macht diese App anders?",
          answer:
            "Diese Anwendung zielt darauf ab, einfach zu bleiben mit wenigen Funktionen und Seiten, um klar und einfach zu bedienen zu sein. Die Erfahrung soll natürlich und intuitiv sein, ohne unnötige Komplexität. Wir konzentrieren uns auf das Wesentliche: Ihre Lieblingsfilme und -serien organisieren und teilen.",
        },
        streaming: {
          question: "Kann ich Serien oder Filme ansehen?",
          answer:
            "Nein, der Zweck dieser Anwendung ist nicht das Streaming, sondern das einfache Teilen von Inhalten, die Ihnen auf Ihren Lieblingsplattformen gefallen haben. Wir helfen Ihnen, zu organisieren, was Sie sehen möchten, und es mit Ihrer Community zu teilen, aber um den Inhalt anzusehen, müssen Sie zu den entsprechenden Streaming-Plattformen gehen.",
        },
      },
    },
    trending: {
      title: "Heute im Trend",
      noImage: "Kein Bild",
    },
  },

  // Footer
  footer: {
    appName: "WatchlistHub",
    language: "Sprache",
  },

  // Profile Page
  profile: {
    title: "Profileinstellungen",
    subtitle: "Verwalten Sie Ihre Kontoeinstellungen und Präferenzen",
    userInformation: "Benutzerinformationen",
    usernameSection: {
      title: "Benutzername",
      description: "Aktualisieren Sie Ihren Benutzernamen. So werden Sie von anderen gesehen.",
      label: "Benutzername",
      placeholder: "Geben Sie Ihren Benutzernamen ein",
      hint: "3-20 Zeichen. Nur Buchstaben, Zahlen und Unterstriche.",
      updateButton: "Aktualisieren",
    },
    passwordSection: {
      title: "Passwort",
      description: "Ändern Sie Ihr Passwort. Stellen Sie sicher, dass es mindestens 8 Zeichen lang ist.",
      currentPasswordLabel: "Passwort",
      currentPasswordPlaceholder: "Geben Sie Ihr aktuelles Passwort ein",
      newPasswordLabel: "Neues Passwort",
      newPasswordPlaceholder: "Neues Passwort",
      confirmPasswordLabel: "Bestätigung",
      confirmPasswordPlaceholder: "Neues Passwort",
      changeButton: "Passwort ändern",
    },
    toasts: {
      usernameUpdated: "Benutzername aktualisiert",
      usernameUpdatedDesc: "Ihr Benutzername wurde erfolgreich aktualisiert.",
      passwordChanged: "Passwort geändert",
      passwordChangedDesc: "Ihr Passwort wurde erfolgreich geändert.",
      error: "Fehler",
      passwordMismatch: "Die neuen Passwörter stimmen nicht überein",
      updateFailed: "Fehler beim Aktualisieren des Benutzernamens",
      passwordChangeFailed: "Fehler beim Ändern des Passworts",
    },
  },
};
