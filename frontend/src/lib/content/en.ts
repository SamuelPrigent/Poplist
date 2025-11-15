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
    edit: "Edit",
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
      title: "Discover, create and share your watchlists.",
      subtitle: "Your movie universe, organized and shared with friends.",
      cta: "Create a watchlist",
    },
    categories: {
      title: "Watchlists by theme",
      subtitle: "WatchlistHub selection",
      seeMore: "See more",
      items: {
        // Line 1 - By type and platform
        movies: {
          title: "Movies",
          description: "Movie selection",
        },
        series: {
          title: "Series",
          description: "Series selection",
        },
        netflix: {
          title: "Netflix only",
          description: "Exclusively on Netflix",
        },
        primeVideo: {
          title: "Prime Video only",
          description: "Exclusively on Prime Video",
        },
        disneyPlus: {
          title: "Disney+ only",
          description: "Exclusively on Disney+",
        },
        crunchyroll: {
          title: "Crunchyroll only",
          description: "Exclusively on Crunchyroll",
        },
        // Line 2 - By genre and theme
        netflixChill: {
          title: "Netflix & Chill",
          description: "Popular movies to watch together",
        },
        films2010s: {
          title: "Films 2010–2020",
          description: "Modern must-sees",
        },
        childhood: {
          title: "Childhood Classics",
          description: "Youth films and nostalgia",
        },
        comedy: {
          title: "Comedy",
          description: "Laugh and relax",
        },
        action: {
          title: "Action",
          description: "Action films and blockbusters",
        },
        anime: {
          title: "Anime",
          description: "Japanese animated series",
        },
      },
    },
    popularWatchlists: {
      title: "Popular watchlists",
      subtitle: "Shared by the community",
      seeMore: "See more",
      noWatchlists: "No public watchlists at the moment",
    },
    faq: {
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know to get started",
      questions: {
        privateWatchlists: {
          question: "How do private watchlists work?",
          answer:
            "Private watchlists allow you to keep your selections to yourself. They are only visible to you and cannot be shared with other users. You can switch between private and public at any time from your watchlist settings.",
        },
        pricing: {
          question: "Is it free to use?",
          answer:
            "Yes, the app is completely free! You can create as many watchlists as you want, share them with your friends, and explore thousands of movies and series without any fees.",
        },
        exploreSection: {
          question: "What is the Explore section for?",
          answer:
            "The Explore section allows you to discover new content by browsing current trends, the most popular or best-rated movies and series. You can filter by genre to find exactly what you're looking for and add items directly to your watchlists.",
        },
        whatMakesDifferent: {
          question: "What makes this app different?",
          answer:
            "This application aims to remain simple with few features and pages to be clear and easy to use. The experience is intended to be natural and intuitive, without unnecessary complexity. We focus on the essentials: organizing and sharing your favorite movies and series.",
        },
        streaming: {
          question: "Can I watch series or movies?",
          answer:
            "No, the purpose of this application is not streaming but easy sharing of content you enjoyed on your favorite platforms. We help you organize what you want to watch and share it with your community, but to view the content, you'll need to go to the appropriate streaming platforms.",
        },
      },
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
