import type { Content } from '../../types/content';

export const it: Content = {
  // Header
  header: {
    appName: 'Poplist',
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
    createWatchlist: 'Nuova lista',
    createWatchlistDescription: 'Crea una nuova lista per organizzare i tuoi film e serie.',
    notLoggedInWarning: 'Modalità offline',
    noWatchlists: 'Non hai ancora creato nessuna lista.',
    myWatchlists: 'Le mie liste',
    followed: 'Seguite',
    noWatchlistsInCategory: 'Nessuna lista in questa categoria',
    adjustFilters: 'Regola i filtri per vedere più liste',
    items: 'elementi',
    item: 'elemento',
    headerPublic: 'Lista pubblica',
    headerPrivate: 'Lista privata',
    public: 'Pubblico',
    private: 'Privato',
    loading: 'Caricamento...',
    accountDataBadge: "Dati dell'account utente",
    preview: 'Anteprima',
    categories: 'Categorie / Tag',
    categoriesDescription:
      'Seleziona una o più categorie per facilitare la scoperta della tua lista',
    genreCategories: 'Categorie di genere',
    platformCategories: 'Piattaforme di streaming',
    platformsDescription: 'Seleziona le piattaforme su cui la tua lista è disponibile',
    name: 'Nome',
    namePlaceholder: 'La mia lista',
    description: 'Descrizione',
    descriptionPlaceholder: 'Descrizione della tua lista',
    coverImage: 'Immagine di copertina',
    uploadImage: 'Carica immagine',
    changeImage: 'Cambia immagine',
    imageUploadHint: 'PNG, JPG o WEBP (max. 5MB)',
    makePublic: 'Rendi pubblica',
    cancel: 'Annulla',
    create: 'Crea',
    creating: 'Creazione...',
    back: 'Indietro',
    noItemsYet: 'Ancora nessun elemento',
    noItemsDescription:
      'Inizia ad aggiungere film e serie alla tua lista per organizzare la tua coda di visualizzazione.',
    edit: 'Modifica',
    editWatchlist: 'Modifica lista',
    editWatchlistDescription: 'Modifica le informazioni della tua lista.',
    deleteWatchlist: 'Elimina lista',
    deleteWatchlistConfirm:
      'Sei sicuro di voler eliminare "{name}"? Questa azione è irreversibile.',
    deleteWatchlistWarning: 'Questa lista contiene {count} elemento/i che verranno eliminati.',
    saving: 'Salvataggio...',
    save: 'Salva',
    deleting: 'Eliminazione...',
    delete: 'Elimina',
    addItem: 'Aggiungi',
    searchMoviesAndSeries: 'Cerca e aggiungi film o serie alla tua lista',
    searchPlaceholder: 'Cerca un film o una serie...',
    searching: 'Ricerca...',
    noResults: 'Nessun risultato trovato',
    startSearching: 'Cerca film e serie',
    add: 'Aggiungi',
    added: 'Aggiunto',
    inWatchlist: 'Nella lista',
    // Table headers
    tableHeaders: {
      number: '#',
      title: 'Titolo',
      type: 'Tipo',
      platforms: 'Piattaforme',
      duration: 'Durata',
    },
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
    },
    tooltips: {
      share: 'Condividi',
      save: 'Aggiungi alla libreria',
      unsave: 'Rimuovi dalla libreria',
      duplicate: 'Duplica nel mio spazio',
      inviteCollaborator: 'Invita un collaboratore',
    },
    contextMenu: {
      addToWatchlist: 'Aggiungi alla lista',
      removeFromWatchlist: 'Rimuovi dalla lista',
      moveToFirst: 'Sposta in prima posizione',
      moveToLast: 'Sposta in ultima posizione',
    },
    collaborators: {
      addTitle: 'Aggiungi Collaboratore',
      addDescription: 'Inserisci il nome utente del collaboratore',
      usernamePlaceholder: 'Nome utente',
      add: 'Aggiungi',
      adding: 'Aggiunta...',
      addSuccess: 'Collaboratore aggiunto con successo',
      addError: 'Impossibile aggiungere il collaboratore',
      currentTitle: 'Collaboratori Attuali',
      remove: 'Rimuovi',
      removeSuccess: 'Collaboratore rimosso',
      removeError: 'Impossibile rimuovere il collaboratore',
      leaveTitle: 'Lasciare la lista?',
      leaveDescription:
        'Sei sicuro di voler lasciare questa lista? Perderai i tuoi diritti di collaboratore.',
      leave: 'Lascia',
      leaving: 'Uscita...',
      leaveSuccess: 'Hai lasciato la lista',
      leaveError: 'Impossibile lasciare la lista',
    },
    addToWatchlist: 'Aggiungi a una lista',
    noWatchlist: 'Nessuna lista',
    offlinePopover: {
      title: 'Perché registrarsi?',
      accessEverywhere: 'Accedi alle tue liste ovunque',
      collaborativeLists: 'Crea liste collaborative',
      shareWithFriends: 'Condividi le tue liste con gli amici',
      signup: 'Registrati',
    },
    toasts: {
      linkCopied: 'Link copiato',
      linkCopyError: 'Impossibile copiare il link',
      listSaved: 'Lista aggiunta',
      listUnsaved: 'Lista rimossa',
      listSaveError: 'Impossibile aggiornare la lista',
      duplicating: 'Duplicazione in corso...',
      listDuplicated: 'Lista duplicata',
      duplicateError: 'Impossibile duplicare la lista',
    },
  },

  landing: {
    hero: {
      tagline: 'Pianifica, segui e goditi i tuoi film insieme',
      title: 'Crea e condividi liste dei tuoi film e serie preferiti',
      subtitle: 'Organizza le tue serate TV e condividi le tue scoperte con i tuoi amici',
      cta: 'Crea una lista',
    },
    features: {
      sectionTitle: 'Condividi il tuo universo cinematografico',
      sectionSubtitle: 'Scopri tutte le nostre funzionalità',
      organize: {
        tagline: 'Organizzazione',
        title: 'Crea liste',
        description: 'Crea liste personali di film e serie da guardare.',
      },
      collaborate: {
        tagline: 'Collaborazione',
        title: 'Aggiungi collaboratori',
        description: 'Invita amici a contribuire alle tue liste in tempo reale.',
      },
      share: {
        tagline: 'Condivisione',
        title: 'Condividi le tue liste',
        description: 'Condividi le tue liste con un semplice link ai tuoi amici.',
      },
      discover: {
        tagline: 'Scoperta',
        title: 'Segui le liste della community',
        description: 'Esplora e segui le liste di altri utenti.',
      },
    },
    startInSeconds: {
      title: 'Inizia in secondi',
      subtitle: 'Nessuna configurazione complicata, solo tu e i tuoi contenuti preferiti',
      step1: {
        title: 'Crea la tua lista',
        description: 'Dai un nome alla tua lista e inizia a organizzare.',
      },
      step2: {
        title: 'Aggiungi film',
        description: 'Aggiungi film e serie in pochi clic.',
      },
      step3: {
        title: 'Condividi con i tuoi amici',
        description: 'Un link è tutto ciò che serve per condividere.',
      },
    },
    testimonials: {
      title: 'Amato dagli appassionati',
      subtitle: 'Unisciti a una comunità di utenti soddisfatti',
      testimonial1: {
        text: 'App perfetta per organizzare le mie liste. Interfaccia chiara e intuitiva.',
        author: 'Marie L.',
        pseudo: '@maried',
      },
      testimonial2: {
        text: 'Molto pratico! Aiuta a tenere traccia di ciò che abbiamo visto e di ciò che vogliamo consigliare.',
        author: 'Thomas D.',
        pseudo: '@thomasdlm',
      },
      testimonial3: {
        text: 'Semplice, efficace, esattamente quello che cercavo per gestire i miei film da vedere.',
        author: 'Julie M.',
        pseudo: '@juliem',
      },
    },
    finalCta: {
      title: 'Inizia a creare le tue liste facilmente',
      subtitle: 'Unisciti a Poplist e organizza i tuoi contenuti preferiti in pochi clic.',
      button: 'Crea la mia lista',
      disclaimer: 'Applicazione gratuita • Nessuna carta richiesta',
    },
  },

  // Home Page
  home: {
    hero: {
      title: 'Le tue liste perfettamente organizzate',
      subtitle: 'Il tuo universo cinematografico, organizzato e condiviso con gli amici.',
      cta: 'Crea una lista',
      ctaSecondary: 'Scopri di più',
      pills: {
        organize: 'Organizza i tuoi film',
        share: 'Condividi con gli amici',
        discover: 'Scopri perle',
      },
    },
    library: {
      title: 'Biblioteca',
      subtitle: 'Le tue liste personali',
      seeAll: 'Vedi tutto',
    },
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
    platformsSection: {
      title: 'Liste per piattaforma',
      subtitle: 'Le tue piattaforme preferite',
      seeAll: 'Vedi tutto',
    },
    popularWatchlists: {
      title: 'Liste popolari',
      subtitle: 'Condivise dalla community',
      seeMore: 'Vedi altro',
      noWatchlists: 'Nessuna lista pubblica al momento',
    },
    faq: {
      title: 'Domande frequenti',
      subtitle: 'Tutto ciò che devi sapere per iniziare',
      questions: {
        privateWatchlists: {
          question: 'Come funzionano le liste private?',
          answer:
            'Le liste private ti permettono di mantenere le tue selezioni per te. Sono visibili solo a te e non possono essere condivise con altri utenti. Puoi passare da privato a pubblico in qualsiasi momento dalle impostazioni della tua lista.',
        },
        pricing: {
          question: 'È gratuito da usare?',
          answer:
            "Sì, l'app è completamente gratuita! Puoi creare tutte le liste che vuoi, condividerle con i tuoi amici ed esplorare migliaia di film e serie senza alcun costo.",
        },
        exploreSection: {
          question: 'A cosa serve la sezione Esplora?',
          answer:
            'La sezione Esplora ti permette di scoprire nuovi contenuti navigando tra le tendenze attuali, i film e le serie più popolari o meglio valutati. Puoi filtrare per genere per trovare esattamente quello che cerchi e aggiungere elementi direttamente alle tue liste.',
        },
        whatMakesDifferent: {
          question: 'Cosa rende questa app diversa?',
          answer:
            "Questa applicazione mira a rimanere semplice con poche funzionalità e pagine per essere chiara e facile da usare. L'esperienza vuole essere naturale e intuitiva, senza complessità inutili. Ci concentriamo sull'essenziale: organizzare e condividere i tuoi film e serie preferiti.",
        },
        streaming: {
          question: 'Posso guardare serie o film?',
          answer:
            'No, lo scopo di questa applicazione non è lo streaming ma la condivisione facile di contenuti che ti sono piaciuti sulle tue piattaforme preferite. Ti aiutiamo a organizzare cosa vuoi guardare e a condividerlo con la tua community, ma per visualizzare il contenuto dovrai recarti sulle piattaforme di streaming appropriate.',
        },
      },
    },
    trending: {
      title: 'Tendenze di oggi',
      noImage: 'Nessuna immagine',
    },
    recommendations: {
      title: 'Tendenze del momento',
      subtitle: 'I titoli di tendenza questa settimana.',
      seeMore: 'Vedi tutto',
    },
    creators: {
      title: 'I nostri creatori',
      subtitle: 'I membri più attivi della comunità',
      seeMore: 'Vedi tutto',
    },
    communityWatchlists: {
      title: 'Liste della comunità',
      subtitle: 'Scopri le collezioni condivise dai nostri utenti',
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
    title: 'Impostazioni del profilo',
    subtitle: 'Gestisci le impostazioni e le preferenze del tuo account',
    userInformation: 'Informazioni utente',
    avatarSection: {
      title: 'Foto del profilo',
      description: 'Carica una foto del profilo per personalizzare il tuo account',
      uploadButton: 'Carica',
      changeButton: 'Modifica',
      deleteButton: 'Elimina',
      uploading: 'Caricamento...',
      deleting: 'Eliminazione...',
      hint: 'Consigliato: Immagine quadrata, max 5MB',
      validation: {
        invalidFileType: 'Seleziona un file immagine valido',
        fileTooLarge: "La dimensione dell'immagine deve essere inferiore a 5MB",
        uploadFailed: 'Caricamento avatar fallito',
        deleteFailed: 'Eliminazione avatar fallita',
        readFailed: 'Lettura del file immagine fallita',
      },
      toasts: {
        updated: 'Avatar aggiornato',
        updatedDesc: 'Il tuo avatar è stato aggiornato con successo',
        deleted: 'Avatar eliminato',
        deletedDesc: 'Il tuo avatar è stato eliminato con successo',
      },
    },
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
    passwordSection: {
      title: 'Password',
      description: 'Cambia la tua password. Assicurati che sia lunga almeno 8 caratteri.',
      currentPasswordLabel: 'Password',
      currentPasswordPlaceholder: 'Inserisci la tua password attuale',
      newPasswordLabel: 'Nuova password',
      newPasswordPlaceholder: 'Nuova password',
      confirmPasswordLabel: 'Conferma',
      confirmPasswordPlaceholder: 'Nuova password',
      changeButton: 'Cambia password',
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
    toasts: {
      usernameUpdated: 'Nome utente aggiornato',
      usernameUpdatedDesc: 'Il tuo nome utente è stato aggiornato con successo.',
      passwordChanged: 'Password cambiata',
      passwordChangedDesc: 'La tua password è stata cambiata con successo.',
      error: 'Errore',
      passwordMismatch: 'Le nuove password non corrispondono',
      updateFailed: 'Impossibile aggiornare il nome utente',
      passwordChangeFailed: 'Impossibile cambiare la password',
      accountDeleted: 'Account eliminato',
      accountDeletedDesc: 'Il tuo account è stato eliminato con successo.',
      accountDeleteFailed: "Impossibile eliminare l'account",
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
};
