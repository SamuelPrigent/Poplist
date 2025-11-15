export interface Content {
  header: {
    appName: string;
    home: string;
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
    items: string;
    item: string;
    public: string;
    private: string;
    loading: string;
    accountDataBadge: string;
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
  };
  home: {
    hero: {
      title: string;
      subtitle: string;
      cta: string;
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
    toasts: {
      usernameUpdated: string;
      usernameUpdatedDesc: string;
      passwordChanged: string;
      passwordChangedDesc: string;
      error: string;
      passwordMismatch: string;
      updateFailed: string;
      passwordChangeFailed: string;
    };
  };
}
