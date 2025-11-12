import type { Content } from "@/types/content";

export const it: Content = {
  // Header
  header: {
    appName: "WatchlistHub",
    home: "Home",
    login: "Accedi",
    signup: "Registrati",
    logout: "Esci",
  },

  // Auth Drawer
  auth: {
    loginTitle: "Accedi",
    loginDescription: "Bentornato! Accedi per accedere alle tue watchlist.",
    signupTitle: "Registrati",
    signupDescription: "Crea un account per salvare le tue watchlist.",
    continueWithGoogle: "Continua con Google",
    or: "Oppure",
    email: "Email",
    emailPlaceholder: "tua@email.it",
    password: "Password",
    passwordPlaceholder: "••••••••",
    processing: "Elaborazione...",
    dontHaveAccount: "Non hai un account?",
    alreadyHaveAccount: "Hai già un account?",
  },

  // Watchlists Page
  watchlists: {
    title: "Le tue watchlist",
    createWatchlist: "Crea",
    createWatchlistDescription:
      "Crea una nuova watchlist per organizzare i tuoi film e serie.",
    notLoggedInWarning: "Dati locali",
    noWatchlists: "Non hai ancora creato nessuna watchlist.",
    items: "elementi",
    item: "elemento",
    public: "Pubblico",
    private: "Privato",
    loading: "Caricamento...",
    accountDataBadge: "Dati dell'account utente",
    name: "Nome",
    namePlaceholder: "La mia watchlist",
    description: "Descrizione",
    descriptionPlaceholder: "Descrizione della tua watchlist",
    coverImage: "Immagine di copertina",
    uploadImage: "Carica immagine",
    changeImage: "Cambia immagine",
    imageUploadHint: "PNG, JPG o WEBP (max. 5MB)",
    makePublic: "Rendi pubblica",
    cancel: "Annulla",
    create: "Crea",
    creating: "Creazione...",
    back: "Indietro",
    noItemsYet: "Ancora nessun elemento",
    noItemsDescription:
      "Inizia ad aggiungere film e serie alla tua watchlist per organizzare la tua coda di visualizzazione.",
    editWatchlist: "Modifica watchlist",
    editWatchlistDescription: "Modifica le informazioni della tua watchlist.",
    deleteWatchlist: "Elimina watchlist",
    deleteWatchlistConfirm:
      'Sei sicuro di voler eliminare "{name}"? Questa azione è irreversibile.',
    deleteWatchlistWarning:
      "Questa watchlist contiene {count} elemento/i che verranno eliminati.",
    saving: "Salvataggio...",
    save: "Salva",
    deleting: "Eliminazione...",
    delete: "Elimina",
    addItem: "Aggiungi",
    searchMoviesAndSeries: "Cerca e aggiungi film o serie alla tua watchlist",
    searchPlaceholder: "Cerca un film o una serie...",
    searching: "Ricerca...",
    noResults: "Nessun risultato trovato",
    startSearching: "Inizia a digitare per cercare film e serie",
    add: "Aggiungi",
    added: "Aggiunto",
    inWatchlist: "Nella watchlist",
    // Table headers
    tableHeaders: {
      number: "#",
      title: "Titolo",
      type: "Tipo",
      platforms: "Piattaforme",
      duration: "Durata",
    },
    // Content types
    contentTypes: {
      movie: "Film",
      series: "Serie",
    },
    // Series info
    seriesInfo: {
      season: "stagione",
      seasons: "stagioni",
      episodes: "episodi",
    },
    // Item Details Modal
    itemDetails: {
      loading: "Caricamento...",
      error: "Impossibile caricare i dettagli",
      mediaDetails: "Dettagli del media",
      fullDetailsFor: "Dettagli completi per",
      loadingDetails: "Caricamento dettagli",
      notAvailable: "N/D",
      votes: "voti",
      synopsis: "Sinossi",
      director: "Regista",
      creator: "Creatore",
      availableOn: "Disponibile su",
      mainCast: "Cast principale",
      seeMore: "Vedi altro",
    },
  },

  // Home Page
  home: {
    hero: {
      title: "WatchlistHub",
      subtitle: "Crea e condividi watchlist dei tuoi film e serie preferiti.",
    },
    trending: {
      title: "Tendenze di oggi",
      noImage: "Nessuna immagine",
    },
  },

  // Footer
  footer: {
    appName: "WatchlistHub",
    language: "Lingua",
  },

  // Profile Page
  profile: {
    title: "Impostazioni del profilo",
    subtitle: "Gestisci le impostazioni e le preferenze del tuo account",
    userInformation: "Informazioni utente",
    usernameSection: {
      title: "Nome utente",
      description: "Aggiorna il tuo nome utente. È così che gli altri ti vedranno.",
      label: "Nome utente",
      placeholder: "Inserisci il tuo nome utente",
      hint: "3-20 caratteri. Solo lettere, numeri e trattini bassi.",
      updateButton: "Aggiorna",
    },
    passwordSection: {
      title: "Password",
      description: "Cambia la tua password. Assicurati che sia lunga almeno 8 caratteri.",
      currentPasswordLabel: "Password",
      currentPasswordPlaceholder: "Inserisci la tua password attuale",
      newPasswordLabel: "Nuova password",
      newPasswordPlaceholder: "Nuova password",
      confirmPasswordLabel: "Conferma",
      confirmPasswordPlaceholder: "Nuova password",
      changeButton: "Cambia password",
    },
    toasts: {
      usernameUpdated: "Nome utente aggiornato",
      usernameUpdatedDesc: "Il tuo nome utente è stato aggiornato con successo.",
      passwordChanged: "Password cambiata",
      passwordChangedDesc: "La tua password è stata cambiata con successo.",
      error: "Errore",
      passwordMismatch: "Le nuove password non corrispondono",
      updateFailed: "Impossibile aggiornare il nome utente",
      passwordChangeFailed: "Impossibile cambiare la password",
    },
  },
};
