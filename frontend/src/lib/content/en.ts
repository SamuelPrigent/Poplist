import type { Content } from '@/types/content';

export const en: Content = {
  // Header
  header: {
    appName: 'Poplist',
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
    createWatchlist: 'New list',
    createWatchlistDescription: 'Create a new list to organize your movies and series.',
    notLoggedInWarning: 'Local data',
    noWatchlists: "You haven't created any lists yet.",
    myWatchlists: 'My lists',
    followed: 'Followed',
    noWatchlistsInCategory: 'No lists in this category',
    adjustFilters: 'Adjust the filters to see more lists',
    items: 'items',
    item: 'item',
    headerPublic: 'Public list',
    headerPrivate: 'Private list',
    public: 'Public',
    private: 'Private',
    loading: 'Loading...',
    accountDataBadge: 'User account data',
    preview: 'Preview',
    categories: 'Categories / Tags',
    categoriesDescription: 'Select one or more categories to make your list easier to discover',
    genreCategories: 'Genre Categories',
    platformCategories: 'Streaming Platforms',
    platformsDescription: 'Select the platforms where your list is available',
    name: 'Name',
    namePlaceholder: 'My list',
    description: 'Description',
    descriptionPlaceholder: 'Description of your list',
    coverImage: 'Cover image',
    uploadImage: 'Upload image',
    changeImage: 'Change image',
    imageUploadHint: 'PNG, JPG or WEBP (max. 5MB)',
    makePublic: 'Make public',
    cancel: 'Cancel',
    create: 'Create',
    creating: 'Creating...',
    back: 'Back',
    noItemsYet: 'No items yet',
    noItemsDescription:
      'Start adding movies and series to your list to organize your viewing queue.',
    edit: 'Edit',
    editWatchlist: 'Edit list',
    editWatchlistDescription: 'Edit your list information.',
    deleteWatchlist: 'Delete list',
    deleteWatchlistConfirm:
      'Are you sure you want to delete "{name}"? This action cannot be undone.',
    deleteWatchlistWarning: 'This list contains {count} item(s) that will also be deleted.',
    saving: 'Saving...',
    save: 'Save',
    deleting: 'Deleting...',
    delete: 'Delete',
    addItem: 'Add',
    searchMoviesAndSeries: 'Search and add movies or series to your list',
    searchPlaceholder: 'Search for a movie or series...',
    searching: 'Searching...',
    noResults: 'No results found',
    startSearching: 'Start typing to search for movies and series',
    add: 'Add',
    added: 'Added',
    inWatchlist: 'In list',
    // Table headers
    tableHeaders: {
      number: '#',
      title: 'Title',
      type: 'Type',
      platforms: 'Platforms',
      duration: 'Duration',
    },
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
    },
    tooltips: {
      share: 'Share',
      save: 'Add to library',
      unsave: 'Remove from library',
      duplicate: 'Duplicate to my space',
      inviteCollaborator: 'Invite a collaborator',
    },
    contextMenu: {
      addToWatchlist: 'Add to list',
      removeFromWatchlist: 'Remove from list',
      moveToFirst: 'Move to First Position',
      moveToLast: 'Move to Last Position',
    },
    collaborators: {
      addTitle: 'Add Collaborator',
      addDescription: 'Enter username to invite a collaborator',
      usernamePlaceholder: 'Username',
      add: 'Add',
      adding: 'Adding...',
      addSuccess: 'Collaborator added successfully',
      addError: 'Failed to add collaborator',
      currentTitle: 'Current Collaborators',
      remove: 'Remove',
      removeSuccess: 'Collaborator removed',
      removeError: 'Failed to remove collaborator',
      leaveTitle: 'Leave list?',
      leaveDescription:
        'Are you sure you want to leave this list? You will lose your collaborator rights.',
      leave: 'Leave',
      leaving: 'Leaving...',
      leaveSuccess: 'You left the list',
      leaveError: 'Failed to leave list',
    },
    addToWatchlist: 'Add to a list',
    noWatchlist: 'No list',
    offlinePopover: {
      title: 'Why sign up?',
      accessEverywhere: 'Access your lists everywhere',
      collaborativeLists: 'Create collaborative lists',
      shareWithFriends: 'Share your lists with friends',
      signup: 'Sign Up',
    },
  },

  landing: {
    hero: {
      tagline: 'Plan, track and enjoy your movies together',
      title: 'Create and share lists of your favorite movies and series',
      subtitle: 'Organize your TV nights and share your discoveries with your friends',
      cta: 'Create a list',
    },
    features: {
      sectionTitle: 'Share your cinematic universe',
      sectionSubtitle: 'Discover all our features',
      organize: {
        tagline: 'Organization',
        title: 'Create lists',
        description: 'Create personal lists of movies and series to watch.',
      },
      collaborate: {
        tagline: 'Collaboration',
        title: 'Add collaborators',
        description: 'Invite friends to contribute to your lists in real-time.',
      },
      share: {
        tagline: 'Sharing',
        title: 'Share your lists',
        description: 'Share your lists with a simple link to your friends.',
      },
      discover: {
        tagline: 'Discovery',
        title: 'Follow community lists',
        description: 'Explore and follow lists from other users.',
      },
    },
    startInSeconds: {
      title: 'Start in Seconds',
      subtitle: 'No complicated setup, just you and your favorite content',
      step1: {
        title: 'Create your list',
        description: 'Name your list and start organizing.',
      },
      step2: {
        title: 'Add movies',
        description: 'Add movies and series in just a few clicks.',
      },
      step3: {
        title: 'Share with your friends',
        description: 'A link is all it takes to share.',
      },
    },
    testimonials: {
      title: 'Loved by enthusiasts',
      subtitle: 'Join a community of satisfied users',
      testimonial1: {
        text: 'Perfect app for organizing my lists. Clear and intuitive interface.',
        author: 'Marie L.',
        pseudo: '@maried',
      },
      testimonial2: {
        text: "Very practical! Helps keep track of what we've watched and what we want to recommend.",
        author: 'Thomas D.',
        pseudo: '@thomasdlm',
      },
      testimonial3: {
        text: 'Simple, effective, exactly what I was looking for to manage my movies to watch.',
        author: 'Julie M.',
        pseudo: '@juliem',
      },
    },
    finalCta: {
      title: 'Start creating your lists easily',
      subtitle: 'Join Poplist and organize your favorite content in just a few clicks.',
      button: 'Create my list',
      disclaimer: 'Free application • No card required',
    },
  },

  // Home Page
  home: {
    hero: {
      title: 'Your lists perfectly organized',
      subtitle: 'Your movie universe, organized and shared with friends.',
      cta: 'Create a list',
      ctaSecondary: 'Learn more',
      pills: {
        organize: 'Organize your movies',
        share: 'Share with your friends',
        discover: 'Discover gems',
      },
    },
    library: {
      title: 'Library',
      subtitle: 'Your personal lists',
      seeAll: 'See all',
    },
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
    platformsSection: {
      title: 'Lists by platform',
      subtitle: 'Your favorite platforms',
      seeAll: 'See all',
    },
    popularWatchlists: {
      title: 'Popular lists',
      subtitle: 'Shared by the community',
      seeMore: 'See more',
      noWatchlists: 'No public lists at the moment',
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know to get started',
      questions: {
        privateWatchlists: {
          question: 'How do private lists work?',
          answer:
            'Private lists allow you to keep your selections to yourself. They are only visible to you and cannot be shared with other users. You can switch between private and public at any time from your list settings.',
        },
        pricing: {
          question: 'Is it free to use?',
          answer:
            'Yes, the app is completely free! You can create as many lists as you want, share them with your friends, and explore thousands of movies and series without any fees.',
        },
        exploreSection: {
          question: 'What is the Explore section for?',
          answer:
            "The Explore section allows you to discover new content by browsing current trends, the most popular or best-rated movies and series. You can filter by genre to find exactly what you're looking for and add items directly to your lists.",
        },
        whatMakesDifferent: {
          question: 'What makes this app different?',
          answer:
            'This application aims to remain simple with few features and pages to be clear and easy to use. The experience is intended to be natural and intuitive, without unnecessary complexity. We focus on the essentials: organizing and sharing your favorite movies and series.',
        },
        streaming: {
          question: 'Can I watch series or movies?',
          answer:
            "No, the purpose of this application is not streaming but easy sharing of content you enjoyed on your favorite platforms. We help you organize what you want to watch and share it with your community, but to view the content, you'll need to go to the appropriate streaming platforms.",
        },
      },
    },
    trending: {
      title: 'Trending Today',
      noImage: 'No Image',
    },
    recommendations: {
      title: 'Trending Now',
      subtitle: 'Titles trending this week.',
      seeMore: 'See all',
    },
    creators: {
      title: 'Our Creators',
      subtitle: 'The most active members of the community',
      seeMore: 'See all',
    },
    communityWatchlists: {
      title: 'Community Lists',
      subtitle: 'Discover collections shared by our users',
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
    title: 'Profile Settings',
    subtitle: 'Manage your account settings and preferences',
    userInformation: 'User Information',
    avatarSection: {
      title: 'Profile Avatar',
      description: 'Upload a profile picture to personalize your account',
      uploadButton: 'Upload',
      changeButton: 'Change',
      deleteButton: 'Delete',
      uploading: 'Uploading...',
      deleting: 'Deleting...',
      hint: 'Recommended: Square image, max 5MB',
      validation: {
        invalidFileType: 'Please select a valid image file',
        fileTooLarge: 'Image size must be less than 5MB',
        uploadFailed: 'Failed to upload avatar',
        deleteFailed: 'Failed to delete avatar',
        readFailed: 'Failed to read image file',
      },
      toasts: {
        updated: 'Avatar updated',
        updatedDesc: 'Your avatar has been successfully updated',
        deleted: 'Avatar deleted',
        deletedDesc: 'Your avatar has been successfully deleted',
      },
    },
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
    passwordSection: {
      title: 'Password',
      description: "Change your password. Make sure it's at least 8 characters.",
      currentPasswordLabel: 'Password',
      currentPasswordPlaceholder: 'Enter your current password',
      newPasswordLabel: 'New Password',
      newPasswordPlaceholder: 'New password',
      confirmPasswordLabel: 'Confirmation',
      confirmPasswordPlaceholder: 'New password',
      changeButton: 'Change Password',
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
    toasts: {
      usernameUpdated: 'Username updated',
      usernameUpdatedDesc: 'Your username has been updated successfully.',
      passwordChanged: 'Password changed',
      passwordChangedDesc: 'Your password has been changed successfully.',
      accountDeleted: 'Account deleted',
      accountDeletedDesc: 'Your account has been deleted successfully.',
      error: 'Error',
      passwordMismatch: 'New passwords do not match',
      updateFailed: 'Failed to update username',
      passwordChangeFailed: 'Failed to change password',
      accountDeleteFailed: 'Failed to delete account',
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
};
