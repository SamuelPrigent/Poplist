export interface Content {
  header: {
    appName: string;
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
  };
  home: {
    hero: {
      title: string;
      subtitle: string;
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
}
