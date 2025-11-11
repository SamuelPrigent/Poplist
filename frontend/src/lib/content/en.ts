import type { Content } from "@/types/content";

export const en: Content = {
  // Header
  header: {
    appName: "WatchlistHub",
    login: "Login",
    signup: "Sign Up",
    logout: "Logout",
  },

  // Auth Drawer
  auth: {
    loginTitle: "Login",
    loginDescription: "Welcome back! Login to access your watchlists.",
    signupTitle: "Sign Up",
    signupDescription: "Create an account to save your watchlists.",
    continueWithGoogle: "Continue with Google",
    or: "Or",
    email: "Email",
    emailPlaceholder: "your@email.com",
    password: "Password",
    passwordPlaceholder: "••••••••",
    processing: "Processing...",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
  },

  // Watchlists Page
  watchlists: {
    title: "Your watchlists",
    createWatchlist: "Create",
    createWatchlistDescription:
      "Create a new watchlist to organize your movies and series.",
    notLoggedInWarning: "Local data",
    noWatchlists: "You haven't created any watchlists yet.",
    items: "items",
    item: "item",
    public: "Public",
    private: "Private",
    loading: "Loading...",
    accountDataBadge: "User account data",
    name: "Name",
    namePlaceholder: "My watchlist",
    description: "Description",
    descriptionPlaceholder: "Description of your watchlist",
    coverImage: "Cover image",
    uploadImage: "Upload image",
    changeImage: "Change image",
    imageUploadHint: "PNG, JPG or WEBP (max. 5MB)",
    makePublic: "Make public",
    cancel: "Cancel",
    create: "Create",
    creating: "Creating...",
    back: "Back",
    noItemsYet: "No items yet",
    noItemsDescription:
      "Start adding movies and series to your watchlist to organize your viewing queue.",
    editWatchlist: "Edit Watchlist",
    editWatchlistDescription: "Edit your watchlist information.",
    deleteWatchlist: "Delete Watchlist",
    deleteWatchlistConfirm:
      'Are you sure you want to delete "{name}"? This action cannot be undone.',
    deleteWatchlistWarning:
      "This watchlist contains {count} item(s) that will also be deleted.",
    saving: "Saving...",
    save: "Save",
    deleting: "Deleting...",
    delete: "Delete",
    addItem: "Add",
    searchMoviesAndSeries: "Search and add movies or series to your watchlist",
    searchPlaceholder: "Search for a movie or series...",
    searching: "Searching...",
    noResults: "No results found",
    startSearching: "Start typing to search for movies and series",
    add: "Add",
    added: "Added",
    inWatchlist: "In watchlist",
    // Table headers
    tableHeaders: {
      number: "#",
      title: "Title",
      type: "Type",
      platforms: "Platforms",
      duration: "Duration",
    },
    // Content types
    contentTypes: {
      movie: "Movie",
      series: "Series",
    },
  },

  // Home Page
  home: {
    hero: {
      title: "WatchlistHub",
      subtitle:
        "Your platform to create and share personal or collaborative watchlists.",
    },
    trending: {
      title: "Trending Today",
      noImage: "No Image",
    },
  },

  // Footer
  footer: {
    appName: "WatchlistHub",
    language: "Language",
  },
};
