import type { Content } from "./fr";

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
    title: "Your Watchlists",
    createWatchlist: "Create Watchlist",
    notLoggedInWarning:
      "You're not logged in. Watchlists are stored locally and will be synced when you log in.",
    noWatchlists: "You haven't created any watchlists yet.",
    createFirstWatchlist: "Create Your First Watchlist",
    items: "items",
    item: "item",
    public: "Public",
    loading: "Loading...",
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
