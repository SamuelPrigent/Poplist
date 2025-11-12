import type { Content } from "@/types/content";

export const en: Content = {
  // Header
  header: {
    appName: "WatchlistHub",
    home: "Home",
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
    // Series info
    seriesInfo: {
      season: "season",
      seasons: "seasons",
      episodes: "episodes",
    },
    // Item Details Modal
    itemDetails: {
      loading: "Loading...",
      error: "Failed to load details",
      mediaDetails: "Media Details",
      fullDetailsFor: "Full details for",
      loadingDetails: "Loading details",
      notAvailable: "N/A",
      votes: "votes",
      synopsis: "Synopsis",
      director: "Director",
      creator: "Creator",
      availableOn: "Available on",
      mainCast: "Main Cast",
      seeMore: "See more",
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

  // Profile Page
  profile: {
    title: "Profile Settings",
    subtitle: "Manage your account settings and preferences",
    userInformation: "User Information",
    usernameSection: {
      title: "Username",
      description: "Update your username. This is how others will see you.",
      label: "Username",
      placeholder: "Enter your username",
      hint: "3-20 characters. Letters, numbers, and underscores only.",
      updateButton: "Update",
    },
    passwordSection: {
      title: "Password",
      description: "Change your password. Make sure it's at least 8 characters.",
      currentPasswordLabel: "Password",
      currentPasswordPlaceholder: "Enter your current password",
      newPasswordLabel: "New Password",
      newPasswordPlaceholder: "New password",
      confirmPasswordLabel: "Confirmation",
      confirmPasswordPlaceholder: "New password",
      changeButton: "Change Password",
    },
    toasts: {
      usernameUpdated: "Username updated",
      usernameUpdatedDesc: "Your username has been updated successfully.",
      passwordChanged: "Password changed",
      passwordChangedDesc: "Your password has been changed successfully.",
      error: "Error",
      passwordMismatch: "New passwords do not match",
      updateFailed: "Failed to update username",
      passwordChangeFailed: "Failed to change password",
    },
  },
};
