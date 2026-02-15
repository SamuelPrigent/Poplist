import type { Content } from '../../types/content';

export const en: Content = {
  // Header
  header: {
    appName: 'Poplist',
    tagline: 'Create and share lists of your favorite movies and series',
    home: 'Home',
    explore: 'Explore',
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
  },

  // Auth Drawer
  auth: {
    loginTitle: 'Login',
    loginDescription: 'Welcome back! Login to access your lists.',
    signupTitle: 'Sign Up',
    signupDescription: 'Create an account to save your lists.',
    continueWithGoogle: 'Continue with Google',
    or: 'Or',
    email: 'Email',
    emailPlaceholder: 'your@email.com',
    password: 'Password',
    passwordPlaceholder: 'Your password',
    processing: 'Processing...',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
  },

  // Watchlists Page
  watchlists: {
    title: 'Library',
    noWatchlists: "You haven't created any lists yet.",
    noWatchlistsInCategory: 'No lists in this category',
    noItemsYet: 'No items yet',
    noItemsDescription: 'Start adding movies and series to your list.',
    addToWatchlist: 'Add to a list',
    myWatchlists: 'My lists',
    followed: 'Followed',
    items: 'items',
    item: 'item',
    searchPlaceholder: 'Search for a movie or series...',
    noResults: 'No results found',
    startSearching: 'Search movies and series',
    // Content types
    contentTypes: {
      movie: 'Movie',
      series: 'Series',
    },
    // Series info
    seriesInfo: {
      season: 'season',
      seasons: 'seasons',
      episodes: 'episodes',
    },
    // Item Details Modal
    itemDetails: {
      loading: 'Loading...',
      error: 'Failed to load details',
      mediaDetails: 'Media Details',
      fullDetailsFor: 'Full details for',
      loadingDetails: 'Loading details',
      notAvailable: 'N/A',
      votes: 'votes',
      synopsis: 'Synopsis',
      director: 'Director',
      creator: 'Creator',
      availableOn: 'Available on',
      mainCast: 'Main Cast',
      seeMore: 'See more',
      showMore: 'Show more',
      showLess: 'Show less',
      add: 'Add',
    },
  },

  // Home Page
  home: {
    categories: {
      title: 'Lists by category',
      subtitle: 'Poplist selection',
      seeMore: 'See more',
      items: {
        // Line 1 - By type and platform
        movies: {
          title: 'Movies',
          description: 'Movie selection',
        },
        series: {
          title: 'Series',
          description: 'Series selection',
        },
        netflix: {
          title: 'Netflix only',
          description: 'Exclusively on Netflix',
        },
        primeVideo: {
          title: 'Prime Video only',
          description: 'Exclusively on Prime Video',
        },
        disneyPlus: {
          title: 'Disney+ only',
          description: 'Exclusively on Disney+',
        },
        crunchyroll: {
          title: 'Crunchyroll only',
          description: 'Exclusively on Crunchyroll',
        },
        // Line 2 - By genre and theme
        netflixChill: {
          title: 'Netflix & Chill',
          description: 'Popular movies to watch together',
        },
        films2010s: {
          title: 'Films 2010–2020',
          description: 'Modern must-sees',
        },
        childhood: {
          title: 'Childhood Classics',
          description: 'Youth films and nostalgia',
        },
        comedy: {
          title: 'Comedy',
          description: 'Laugh and relax',
        },
        action: {
          title: 'Action',
          description: 'Action films and blockbusters',
        },
        anime: {
          title: 'Anime',
          description: 'Japanese animated series',
        },
      },
    },
    popularWatchlists: {
      title: 'Popular lists',
      subtitle: 'Shared by the community',
      seeMore: 'See more',
      noWatchlists: 'No public lists at the moment',
    },
    creators: {
      title: 'Our Creators',
      subtitle: 'The most active members of the community',
      seeMore: 'See all',
    },
  },

  explore: {
    title: 'Explore',
    subtitle: 'Discover new lists shared by the community',
    searchPlaceholder: 'Search for a list...',
    filters: {
      all: 'All',
      movies: 'Movies',
      series: 'Series',
      trending: 'Trending',
      topRated: 'Top Rated',
      popular: 'Popular',
      bestRated: 'Best Rated',
      yearMin: 'Minimum year',
      yearMax: 'Maximum year',
      search: 'Search...',
      noYearFound: 'No year found.',
      clearYears: 'Clear years',
    },
    genres: {
      action: 'Action',
      adventure: 'Adventure',
      animation: 'Animation',
      comedy: 'Comedy',
      crime: 'Crime',
      documentary: 'Documentary',
      drama: 'Drama',
      family: 'Family',
      fantasy: 'Fantasy',
      horror: 'Horror',
      romance: 'Romance',
      scienceFiction: 'Science Fiction',
      thriller: 'Thriller',
      actionAdventure: 'Action & Adventure',
      kids: 'Kids',
      mystery: 'Mystery',
      sciFiFantasy: 'Sci-Fi & Fantasy',
      soap: 'Soap Opera',
      western: 'Western',
    },
    sortBy: {
      label: 'Sort by',
      popular: 'Most popular',
      recentlyAdded: 'Recently added',
      mostItems: 'Most items',
    },
    pagination: {
      pageOf: 'Page {page} of {totalPages}',
    },
    noResults: 'No lists found',
    noResultsDescription: 'Try adjusting your filters or search',
  },

  categories: {
    title: 'Categories',
    subtitle: 'Explore lists by theme',
    list: {
      movies: { name: 'Movies', description: 'The best movies of the moment' },
      series: { name: 'Series', description: 'Series not to be missed' },
      netflix: { name: 'Netflix', description: 'Netflix gems' },
      'prime-video': {
        name: 'Prime Video',
        description: 'Amazon Prime exclusives',
      },
      'disney-plus': {
        name: 'Disney+',
        description: 'The Disney, Pixar, Marvel and Star Wars universe',
      },
      'apple-tv': {
        name: 'Apple TV+',
        description: 'Apple TV+ original productions',
      },
      crunchyroll: {
        name: 'Crunchyroll',
        description: 'The best anime streaming',
      },
      'hbo-max': {
        name: 'HBO Max',
        description: 'HBO series and films',
      },
      youtube: {
        name: 'YouTube',
        description: 'Films and series available on YouTube',
      },
      'canal-plus': {
        name: 'Canal+',
        description: 'Canal+ programs',
      },
      ocs: {
        name: 'OCS',
        description: 'The best of cinema and series',
      },
      'paramount-plus': {
        name: 'Paramount+',
        description: 'Paramount+ productions',
      },
      'rakuten-tv': {
        name: 'Rakuten TV',
        description: 'Films and series on Rakuten TV',
      },
      anime: {
        name: 'Animation',
        description: 'The best animated series and adapted manga films',
      },
      action: { name: 'Action', description: 'Classics and new action films' },
      documentaries: {
        name: 'Documentaries',
        description: 'Captivating and educational documentaries',
      },
      enfant: { name: 'Kids', description: 'Movies and series for children' },
      jeunesse: {
        name: 'Youth',
        description: 'Movies and series for teens and young adults',
      },
    },
  },

  // Footer
  footer: {
    appName: 'Poplist',
    language: 'Language',
  },

  // Profile Page
  profile: {
    usernameSection: {
      title: 'Username',
      description: 'Update your username. This is how others will see you.',
      label: 'Username',
      placeholder: 'Enter your username',
      hint: '3-20 characters. Letters, numbers, and underscores only.',
      updateButton: 'Update',
      validation: {
        lengthError: 'Username must be between 3 and 20 characters',
        formatError: 'Username can only contain letters, numbers, and underscores',
        alreadyTaken: 'Username already taken',
      },
    },
    deleteSection: {
      title: 'Delete Account',
      description: 'Irreversible action. All your data will be deleted.',
      dialogTitle: 'Delete Your Account',
      dialogDescription: 'Irreversible action. All your data will be deleted.',
      confirmationLabel: "Type 'confirmer' to continue",
      confirmationPlaceholder: 'confirmer',
      deleteButton: 'Delete Account',
      deleting: 'Deleting...',
      cancel: 'Cancel',
    },
  },
  userProfile: {
    profile: 'Profile',
    publicWatchlists: 'Public lists',
    publicWatchlist: 'Public list',
    watchlists: 'lists',
    watchlist: 'list',
    noPublicWatchlists: 'No lists published.',
    noPublicWatchlistsDescription: "This user hasn't published any public lists yet.",
    loading: 'Loading profile...',
    notFound: 'User not found',
    notFoundDescription: "The user you're looking for doesn't exist or has been deleted.",
    backToHome: 'Back to home',
  },
  settings: {
    tabs: {
      display: 'Display',
      preferences: 'Preferences',
      account: 'Account',
    },
    display: {
      backgroundColor: 'Background color',
      backgroundColorHint: 'App theme',
      ocean: 'Ocean',
      midnight: 'Midnight',
      listColumns: 'List columns',
      listColumnsHint: 'Number of columns on home and my lists pages',
      exploreColumns: 'Explore columns',
      exploreColumnsHint: 'Number of columns on the Explore page',
    },
    preferences: {
      language: 'Language',
      handedness: 'Dominant hand',
      handednessHint: 'Action button position',
      leftHanded: 'Left-handed',
      rightHanded: 'Right-handed',
    },
  },
};
