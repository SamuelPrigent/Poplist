import type { Content } from "@/types/content";

export const it: Content = {
  // Header
  header: {
    appName: "WatchlistHub",
    home: "Home",
    explore: "Esplora",
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
    myWatchlists: "Le mie watchlist",
    followed: "Seguite",
    noWatchlistsInCategory: "Nessuna watchlist in questa categoria",
    adjustFilters: "Regola i filtri per vedere più watchlist",
    items: "elementi",
    item: "elemento",
    public: "Pubblico",
    private: "Privato",
    loading: "Caricamento...",
    accountDataBadge: "Dati dell'account utente",
    preview: "Anteprima",
    categories: "Categorie / Tag",
    categoriesDescription: "Seleziona una o più categorie per facilitare la scoperta della tua watchlist",
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
    tooltips: {
      share: "Condividi",
      save: "Aggiungi alla libreria",
      unsave: "Rimuovi dalla libreria",
      duplicate: "Duplica nel mio spazio",
      inviteCollaborator: "Invita un collaboratore",
    },
    contextMenu: {
      addToWatchlist: "Aggiungi alla watchlist",
      removeFromWatchlist: "Rimuovi dalla watchlist",
      moveToFirst: "Sposta in prima posizione",
      moveToLast: "Sposta in ultima posizione",
    },
    collaborators: {
      addTitle: "Aggiungi Collaboratore",
      addDescription: "Inserisci il nome utente per invitare un collaboratore",
      usernamePlaceholder: "Nome utente",
      add: "Aggiungi",
      adding: "Aggiunta...",
      addSuccess: "Collaboratore aggiunto con successo",
      addError: "Impossibile aggiungere il collaboratore",
      currentTitle: "Collaboratori Attuali",
      remove: "Rimuovi",
      removeSuccess: "Collaboratore rimosso",
      removeError: "Impossibile rimuovere il collaboratore",
      leaveTitle: "Lasciare la watchlist?",
      leaveDescription: "Sei sicuro di voler lasciare questa watchlist? Perderai i tuoi diritti di collaboratore.",
      leave: "Lascia",
      leaving: "Uscita...",
      leaveSuccess: "Hai lasciato la watchlist",
      leaveError: "Impossibile lasciare la watchlist",
    },
    addToWatchlist: "Aggiungi a una watchlist",
    noWatchlist: "Nessuna watchlist",
  },

  landing: {
    hero: {
      tagline: "Pianifica, segui e goditi i tuoi film insieme",
      title: "Le tue Watchlist perfettamente organizzate",
      subtitle: "Organizza le tue serate TV e condividi le tue scoperte con i tuoi amici",
      cta: "Crea una watchlist",
    },
    features: {
      organize: {
        tagline: "Organizzazione",
        title: "Crea watchlist",
        description:
          "Crea la tua collezione personale di film e serie da non perdere.",
      },
      discover: {
        tagline: "Scoperta",
        title: "Scopri film e serie",
        description:
          "Usa la funzione di esplorazione per trovare contenuti da aggiungere alle tue watchlist.",
      },
      share: {
        tagline: "Condivisione",
        title: "Segui le watchlist di altri utenti",
        description: "Aggiungi watchlist al tuo spazio personale.",
      },
    },
    startInSeconds: {
      title: "Inizia in secondi",
      subtitle: "Nessuna configurazione complicata, solo tu e i tuoi contenuti preferiti",
      step1: {
        title: "Crea la tua watchlist",
        description: "Inizia con \"I miei film preferiti\" o diventa nostalgico con \"Film dell'infanzia\".",
      },
      step2: {
        title: "Aggiungi film",
        description: "Cerca un film o una serie usando una parola chiave e aggiungilo alla tua watchlist attuale.",
      },
      step3: {
        title: "Condividi con i tuoi amici",
        description: "Rendi le tue watchlist \"pubbliche\" e condividile facilmente con un link.",
      },
    },
    testimonials: {
      title: "Amato dagli appassionati",
      subtitle: "Unisciti a una comunità di utenti soddisfatti",
      testimonial1: {
        text: "App perfetta per organizzare le mie watchlist. Interfaccia chiara e intuitiva.",
        author: "— Marie L.",
      },
      testimonial2: {
        text: "Molto pratico! Aiuta a tenere traccia di ciò che abbiamo visto e di ciò che vogliamo consigliare.",
        author: "— Thomas D.",
      },
      testimonial3: {
        text: "Semplice, efficace, esattamente quello che cercavo per gestire i miei film da vedere.",
        author: "— Julie M.",
      },
    },
    finalCta: {
      title: "Inizia a creare le tue watchlist facilmente",
      subtitle: "Unisciti a WatchlistHub e organizza i tuoi contenuti preferiti in pochi clic.",
      button: "Crea la mia watchlist",
      disclaimer: "Applicazione gratuita • Nessuna carta richiesta",
    },
  },

  // Home Page
  home: {
    hero: {
      title: "Scopri, crea e condividi le tue watchlist.",
      subtitle: "Il tuo universo cinematografico, organizzato e condiviso con gli amici.",
      cta: "Crea una watchlist",
      pills: {
        organize: "Organizza i tuoi film",
        share: "Condividi con gli amici",
        discover: "Scopri perle",
      },
    },
    library: {
      title: "Biblioteca",
      subtitle: "Le tue watchlist personali",
      seeAll: "Vedi tutto",
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
    recommendations: {
      title: "Titoli che potrebbero piacerti",
      subtitle: "Basato sulle tendenze attuali",
      seeMore: "Vedi tutto",
    },
  },

  explore: {
    title: "Esplora",
    subtitle: "Scopri nuove watchlist condivise dalla community",
    searchPlaceholder: "Cerca una watchlist...",
    filters: {
      all: "Tutto",
      movies: "Film",
      series: "Serie",
      trending: "Tendenze",
      topRated: "Più votati",
    },
    sortBy: {
      label: "Ordina per",
      popular: "Più popolari",
      recentlyAdded: "Aggiunte di recente",
      mostItems: "Più elementi",
    },
    pagination: {
      pageOf: "Pagina {page} di {totalPages}",
    },
    noResults: "Nessuna watchlist trovata",
    noResultsDescription: "Prova a modificare i tuoi filtri o la ricerca",
  },

  categories: {
    title: "Categorie",
    subtitle: "Esplora watchlist per tema",
    list: {
      movies: { name: "Film", description: "I migliori film del momento" },
      series: { name: "Serie", description: "Serie da non perdere" },
      netflix: { name: "Netflix", description: "Perle di Netflix" },
      "prime-video": { name: "Prime Video", description: "Esclusive Amazon Prime" },
      "disney-plus": { name: "Disney+", description: "L'universo Disney, Pixar, Marvel e Star Wars" },
      anime: { name: "Animazione", description: "Le migliori serie animate e film manga adattati" },
      action: { name: "Azione", description: "Classici e nuovi film d'azione" },
      documentaries: { name: "Documentari", description: "Documentari accattivanti ed educativi" },
      enfant: { name: "Bambini", description: "Film e serie per bambini" },
      jeunesse: { name: "Giovani", description: "Film e serie per adolescenti e giovani adulti" },
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
    avatarSection: {
      title: "Foto del profilo",
      description: "Carica una foto del profilo per personalizzare il tuo account",
      uploadButton: "Carica",
      changeButton: "Modifica",
      deleteButton: "Elimina",
      uploading: "Caricamento...",
      deleting: "Eliminazione...",
      hint: "Consigliato: Immagine quadrata, max 5MB",
      validation: {
        invalidFileType: "Seleziona un file immagine valido",
        fileTooLarge: "La dimensione dell'immagine deve essere inferiore a 5MB",
        uploadFailed: "Caricamento avatar fallito",
        deleteFailed: "Eliminazione avatar fallita",
        readFailed: "Lettura del file immagine fallita",
      },
      toasts: {
        updated: "Avatar aggiornato",
        updatedDesc: "Il tuo avatar è stato aggiornato con successo",
        deleted: "Avatar eliminato",
        deletedDesc: "Il tuo avatar è stato eliminato con successo",
      },
    },
    usernameSection: {
      title: "Nome utente",
      description: "Aggiorna il tuo nome utente. È così che gli altri ti vedranno.",
      label: "Nome utente",
      placeholder: "Inserisci il tuo nome utente",
      hint: "3-20 caratteri. Solo lettere, numeri e trattini bassi.",
      updateButton: "Aggiorna",
      validation: {
        lengthError: "Il nome utente deve essere compreso tra 3 e 20 caratteri",
        formatError: "Il nome utente può contenere solo lettere, numeri e trattini bassi",
        alreadyTaken: "Nome utente già in uso",
      },
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
    deleteSection: {
      title: "Elimina account",
      description: "Azione irreversibile. Tutti i tuoi dati verranno eliminati.",
      dialogTitle: "Elimina il tuo account",
      dialogDescription: "Azione irreversibile. Tutti i tuoi dati verranno eliminati.",
      confirmationLabel: "Digita 'confirmer' per continuare",
      confirmationPlaceholder: "confirmer",
      deleteButton: "Elimina account",
      deleting: "Eliminazione...",
      cancel: "Annulla",
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
      accountDeleted: "Account eliminato",
      accountDeletedDesc: "Il tuo account è stato eliminato con successo.",
      accountDeleteFailed: "Impossibile eliminare l'account",
    },
  },
};
