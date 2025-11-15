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
    edit: "Modifica",
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
      title: "Scopri, crea e condividi le tue watchlist.",
      subtitle: "Il tuo universo cinematografico, organizzato e condiviso con gli amici.",
      cta: "Crea una watchlist",
    },
    categories: {
      title: "Watchlist per tema",
      subtitle: "Selezione WatchlistHub",
      seeMore: "Vedi altro",
      items: {
        // Riga 1 - Per tipo e piattaforma
        movies: {
          title: "Film",
          description: "Selezione di film",
        },
        series: {
          title: "Serie",
          description: "Selezione di serie",
        },
        netflix: {
          title: "Netflix only",
          description: "Esclusivamente su Netflix",
        },
        primeVideo: {
          title: "Prime Video only",
          description: "Esclusivamente su Prime Video",
        },
        disneyPlus: {
          title: "Disney+ only",
          description: "Esclusivamente su Disney+",
        },
        crunchyroll: {
          title: "Crunchyroll only",
          description: "Esclusivamente su Crunchyroll",
        },
        // Riga 2 - Per genere e tema
        netflixChill: {
          title: "Netflix & Chill",
          description: "Film popolari da guardare insieme",
        },
        films2010s: {
          title: "Film 2010–2020",
          description: "Imperdibili moderni",
        },
        childhood: {
          title: "Classici dell'infanzia",
          description: "Film per ragazzi e nostalgia",
        },
        comedy: {
          title: "Commedia",
          description: "Per ridere e rilassarsi",
        },
        action: {
          title: "Azione",
          description: "Film d'azione e blockbuster",
        },
        anime: {
          title: "Anime",
          description: "Serie animate giapponesi",
        },
      },
    },
    popularWatchlists: {
      title: "Watchlist popolari",
      subtitle: "Condivise dalla community",
      seeMore: "Vedi altro",
      noWatchlists: "Nessuna watchlist pubblica al momento",
    },
    faq: {
      title: "Domande frequenti",
      subtitle: "Tutto ciò che devi sapere per iniziare",
      questions: {
        privateWatchlists: {
          question: "Come funzionano le watchlist private?",
          answer:
            "Le watchlist private ti permettono di mantenere le tue selezioni per te. Sono visibili solo a te e non possono essere condivise con altri utenti. Puoi passare da privato a pubblico in qualsiasi momento dalle impostazioni della tua watchlist.",
        },
        pricing: {
          question: "È gratuito da usare?",
          answer:
            "Sì, l'app è completamente gratuita! Puoi creare tutte le watchlist che vuoi, condividerle con i tuoi amici ed esplorare migliaia di film e serie senza alcun costo.",
        },
        exploreSection: {
          question: "A cosa serve la sezione Esplora?",
          answer:
            "La sezione Esplora ti permette di scoprire nuovi contenuti navigando tra le tendenze attuali, i film e le serie più popolari o meglio valutati. Puoi filtrare per genere per trovare esattamente quello che cerchi e aggiungere elementi direttamente alle tue watchlist.",
        },
        whatMakesDifferent: {
          question: "Cosa rende questa app diversa?",
          answer:
            "Questa applicazione mira a rimanere semplice con poche funzionalità e pagine per essere chiara e facile da usare. L'esperienza vuole essere naturale e intuitiva, senza complessità inutili. Ci concentriamo sull'essenziale: organizzare e condividere i tuoi film e serie preferiti.",
        },
        streaming: {
          question: "Posso guardare serie o film?",
          answer:
            "No, lo scopo di questa applicazione non è lo streaming ma la condivisione facile di contenuti che ti sono piaciuti sulle tue piattaforme preferite. Ti aiutiamo a organizzare cosa vuoi guardare e a condividerlo con la tua community, ma per visualizzare il contenuto dovrai recarti sulle piattaforme di streaming appropriate.",
        },
      },
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
