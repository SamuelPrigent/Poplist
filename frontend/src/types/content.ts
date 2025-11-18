export interface Content {
  header: {
    appName: string;
    home: string;
    explore: string;
    login: string;
    signup: string;
    logout: string;
  };
  auth: {
    loginTitle: string;
    loginDescription: string;
    signupTitle: string;
    signupDescription: string;
    continueWithGoogle: string;
    or: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    processing: string;
    dontHaveAccount: string;
    alreadyHaveAccount: string;
  };
  watchlists: {
    title: string;
    createWatchlist: string;
    createWatchlistDescription: string;
    notLoggedInWarning: string;
    noWatchlists: string;
    myWatchlists: string;
    followed: string;
    noWatchlistsInCategory: string;
    adjustFilters: string;
    items: string;
    item: string;
    public: string;
    private: string;
    loading: string;
    accountDataBadge: string;
    preview: string;
    categories: string;
    categoriesDescription: string;
    name: string;
    namePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    coverImage: string;
    uploadImage: string;
    changeImage: string;
    imageUploadHint: string;
    makePublic: string;
    cancel: string;
    create: string;
    creating: string;
    back: string;
    noItemsYet: string;
    noItemsDescription: string;
    edit: string;
    editWatchlist: string;
    editWatchlistDescription: string;
    deleteWatchlist: string;
    deleteWatchlistConfirm: string;
    deleteWatchlistWarning: string;
    saving: string;
    save: string;
    deleting: string;
    delete: string;
    addItem: string;
    searchMoviesAndSeries: string;
    searchPlaceholder: string;
    searching: string;
    noResults: string;
    startSearching: string;
    add: string;
    added: string;
    inWatchlist: string;
    tableHeaders: {
      number: string;
      title: string;
      type: string;
      platforms: string;
      duration: string;
    };
    contentTypes: {
      movie: string;
      series: string;
    };
    seriesInfo: {
      season: string;
      seasons: string;
      episodes: string;
    };
    itemDetails: {
      loading: string;
      error: string;
      mediaDetails: string;
      fullDetailsFor: string;
      loadingDetails: string;
      notAvailable: string;
      votes: string;
      synopsis: string;
      director: string;
      creator: string;
      availableOn: string;
      mainCast: string;
      seeMore: string;
    };
    tooltips: {
      share: string;
      save: string;
      unsave: string;
      duplicate: string;
      inviteCollaborator: string;
    };
    contextMenu: {
      addToWatchlist: string;
      removeFromWatchlist: string;
      moveToFirst: string;
      moveToLast: string;
    };
    addToWatchlist: string;
    noWatchlist: string;
  };
  landing: {
    hero: {
      tagline: string;
      title: string;
      subtitle: string;
      cta: string;
    };
    features: {
      organize: {
        tagline: string;
        title: string;
        description: string;
      };
      discover: {
        tagline: string;
        title: string;
        description: string;
      };
      share: {
        tagline: string;
        title: string;
        description: string;
      };
    };
    startInSeconds: {
      title: string;
      subtitle: string;
      step1: {
        title: string;
        description: string;
      };
      step2: {
        title: string;
        description: string;
      };
      step3: {
        title: string;
        description: string;
      };
    };
    testimonials: {
      title: string;
      subtitle: string;
      testimonial1: {
        text: string;
        author: string;
      };
      testimonial2: {
        text: string;
        author: string;
      };
      testimonial3: {
        text: string;
        author: string;
      };
    };
    finalCta: {
      title: string;
      subtitle: string;
      button: string;
      disclaimer: string;
    };
  };
  home: {
    hero: {
      title: string;
      subtitle: string;
      cta: string;
      pills: {
        organize: string;
        share: string;
        discover: string;
      };
    };
    library: {
      title: string;
      subtitle: string;
      seeAll: string;
    };
    categories: {
      title: string;
      subtitle: string;
      seeMore: string;
      items: {
        movies: {
          title: string;
          description: string;
        };
        series: {
          title: string;
          description: string;
        };
        netflix: {
          title: string;
          description: string;
        };
        primeVideo: {
          title: string;
          description: string;
        };
        disneyPlus: {
          title: string;
          description: string;
        };
        crunchyroll: {
          title: string;
          description: string;
        };
        netflixChill: {
          title: string;
          description: string;
        };
        films2010s: {
          title: string;
          description: string;
        };
        childhood: {
          title: string;
          description: string;
        };
        comedy: {
          title: string;
          description: string;
        };
        action: {
          title: string;
          description: string;
        };
        anime: {
          title: string;
          description: string;
        };
      };
    };
    popularWatchlists: {
      title: string;
      subtitle: string;
      seeMore: string;
      noWatchlists: string;
    };
    faq: {
      title: string;
      subtitle: string;
      questions: {
        privateWatchlists: {
          question: string;
          answer: string;
        };
        pricing: {
          question: string;
          answer: string;
        };
        exploreSection: {
          question: string;
          answer: string;
        };
        whatMakesDifferent: {
          question: string;
          answer: string;
        };
        streaming: {
          question: string;
          answer: string;
        };
      };
    };
    trending: {
      title: string;
      noImage: string;
    };
    recommendations: {
      title: string;
      subtitle: string;
      seeMore: string;
    };
  };
  explore: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filters: {
      all: string;
      movies: string;
      series: string;
      trending: string;
      topRated: string;
    };
    sortBy: {
      label: string;
      popular: string;
      recentlyAdded: string;
      mostItems: string;
    };
    pagination: {
      pageOf: string;
    };
    noResults: string;
    noResultsDescription: string;
  };
  categories: {
    title: string;
    subtitle: string;
    list: {
      movies: { name: string; description: string };
      series: { name: string; description: string };
      netflix: { name: string; description: string };
      "prime-video": { name: string; description: string };
      "disney-plus": { name: string; description: string };
      anime: { name: string; description: string };
      action: { name: string; description: string };
      documentaries: { name: string; description: string };
      enfant: { name: string; description: string };
      jeunesse: { name: string; description: string };
    };
  };
  footer: {
    appName: string;
    language: string;
  };
  profile: {
    title: string;
    subtitle: string;
    userInformation: string;
    usernameSection: {
      title: string;
      description: string;
      label: string;
      placeholder: string;
      hint: string;
      updateButton: string;
      validation: {
        lengthError: string;
        formatError: string;
        alreadyTaken: string;
      };
    };
    passwordSection: {
      title: string;
      description: string;
      currentPasswordLabel: string;
      currentPasswordPlaceholder: string;
      newPasswordLabel: string;
      newPasswordPlaceholder: string;
      confirmPasswordLabel: string;
      confirmPasswordPlaceholder: string;
      changeButton: string;
    };
    deleteSection: {
      title: string;
      description: string;
      dialogTitle: string;
      dialogDescription: string;
      confirmationLabel: string;
      confirmationPlaceholder: string;
      deleteButton: string;
      deleting: string;
      cancel: string;
    };
    toasts: {
      usernameUpdated: string;
      usernameUpdatedDesc: string;
      passwordChanged: string;
      passwordChangedDesc: string;
      accountDeleted: string;
      accountDeletedDesc: string;
      error: string;
      passwordMismatch: string;
      updateFailed: string;
      passwordChangeFailed: string;
      accountDeleteFailed: string;
    };
  };
}
