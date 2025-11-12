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
    },
  },

  // Home Page
  home: {
    hero: {
      title: "WatchlistHub",
      subtitle: "Erstellen und teilen Sie Watchlists Ihrer Lieblingsfilme und -serien.",
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
      currentPasswordLabel: "Aktuelles Passwort",
      currentPasswordPlaceholder: "Geben Sie Ihr aktuelles Passwort ein",
      newPasswordLabel: "Neues Passwort",
      newPasswordPlaceholder: "Geben Sie Ihr neues Passwort ein",
      confirmPasswordLabel: "Neues Passwort bestätigen",
      confirmPasswordPlaceholder: "Bestätigen Sie Ihr neues Passwort",
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
