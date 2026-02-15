import type { Content } from '../../types/content';

export const es: Content = {
  // Header
  header: {
    appName: 'Poplist',
    tagline: 'Crea y comparte listas de tus películas y series favoritas',
    home: 'Inicio',
    explore: 'Explorar',
    login: 'Iniciar sesión',
    signup: 'Registrarse',
    logout: 'Cerrar sesión',
  },

  // Auth Drawer
  auth: {
    loginTitle: 'Iniciar sesión',
    loginDescription: '¡Bienvenido! Inicia sesión para acceder a tus listas.',
    signupTitle: 'Registrarse',
    signupDescription: 'Crea una cuenta para guardar tus listas.',
    continueWithGoogle: 'Continuar con Google',
    or: 'O',
    email: 'Correo electrónico',
    emailPlaceholder: 'tu@email.com',
    password: 'Contraseña',
    passwordPlaceholder: 'Tu contraseña',
    processing: 'Procesando...',
    dontHaveAccount: '¿No tienes una cuenta?',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
  },

  // Watchlists Page
  watchlists: {
    title: 'Biblioteca',
    noWatchlists: 'Aún no has creado ninguna lista.',
    noWatchlistsInCategory: 'No hay listas en esta categoría',
    noItemsYet: 'Aún sin elementos',
    noItemsDescription: 'Comienza a añadir películas y series a tu lista.',
    addToWatchlist: 'Añadir a una lista',
    myWatchlists: 'Mis listas',
    followed: 'Seguidas',
    items: 'elementos',
    item: 'elemento',
    searchPlaceholder: 'Buscar una película o serie...',
    noResults: 'No se encontraron resultados',
    startSearching: 'Buscar películas y series',
    // Content types
    contentTypes: {
      movie: 'Película',
      series: 'Serie',
    },
    // Series info
    seriesInfo: {
      season: 'temporada',
      seasons: 'temporadas',
      episodes: 'episodios',
    },
    // Item Details Modal
    itemDetails: {
      loading: 'Cargando...',
      error: 'Error al cargar los detalles',
      mediaDetails: 'Detalles del contenido',
      fullDetailsFor: 'Detalles completos de',
      loadingDetails: 'Cargando detalles',
      notAvailable: 'N/D',
      votes: 'votos',
      synopsis: 'Sinopsis',
      director: 'Director',
      creator: 'Creador',
      availableOn: 'Disponible en',
      mainCast: 'Reparto principal',
      seeMore: 'Ver más',
      showMore: 'Ver más',
      showLess: 'Ver menos',
      add: 'Añadir',
    },
  },

  // Home Page
  home: {
    categories: {
      title: 'Listas por categoría',
      subtitle: 'Selección Poplist',
      seeMore: 'Ver más',
      items: {
        // Línea 1 - Por tipo y plataforma
        movies: {
          title: 'Películas',
          description: 'Selección de películas',
        },
        series: {
          title: 'Series',
          description: 'Selección de series',
        },
        netflix: {
          title: 'Netflix only',
          description: 'Exclusivamente en Netflix',
        },
        primeVideo: {
          title: 'Prime Video only',
          description: 'Exclusivamente en Prime Video',
        },
        disneyPlus: {
          title: 'Disney+ only',
          description: 'Exclusivamente en Disney+',
        },
        crunchyroll: {
          title: 'Crunchyroll only',
          description: 'Exclusivamente en Crunchyroll',
        },
        // Línea 2 - Por género y tema
        netflixChill: {
          title: 'Netflix & Chill',
          description: 'Películas populares para ver juntos',
        },
        films2010s: {
          title: 'Películas 2010–2020',
          description: 'Imprescindibles modernos',
        },
        childhood: {
          title: 'Clásicos de la infancia',
          description: 'Películas juveniles y nostalgia',
        },
        comedy: {
          title: 'Comedia',
          description: 'Para reír y relajarse',
        },
        action: {
          title: 'Acción',
          description: 'Películas de acción y blockbusters',
        },
        anime: {
          title: 'Anime',
          description: 'Series animadas japonesas',
        },
      },
    },
    popularWatchlists: {
      title: 'Listas populares',
      subtitle: 'Compartidas por la comunidad',
      seeMore: 'Ver más',
      noWatchlists: 'No hay listas públicas por el momento',
    },
    creators: {
      title: 'Nuestros creadores',
      subtitle: 'Los miembros más activos de la comunidad',
      seeMore: 'Ver todo',
    },
  },

  explore: {
    title: 'Explorar',
    subtitle: 'Descubre nuevas listas compartidas por la comunidad',
    searchPlaceholder: 'Buscar una lista...',
    filters: {
      all: 'Todas',
      movies: 'Películas',
      series: 'Series',
      trending: 'Tendencias',
      topRated: 'Mejor valoradas',
      popular: 'Populares',
      bestRated: 'Mejor valoradas',
      yearMin: 'Año mínimo',
      yearMax: 'Año máximo',
      search: 'Buscar...',
      noYearFound: 'No se encontró ningún año.',
      clearYears: 'Borrar años',
    },
    genres: {
      action: 'Acción',
      adventure: 'Aventura',
      animation: 'Animación',
      comedy: 'Comedia',
      crime: 'Crimen',
      documentary: 'Documental',
      drama: 'Drama',
      family: 'Familiar',
      fantasy: 'Fantasía',
      horror: 'Terror',
      romance: 'Romance',
      scienceFiction: 'Ciencia Ficción',
      thriller: 'Thriller',
      actionAdventure: 'Acción y Aventura',
      kids: 'Niños',
      mystery: 'Misterio',
      sciFiFantasy: 'Ciencia Ficción y Fantasía',
      soap: 'Telenovela',
      western: 'Western',
    },
    sortBy: {
      label: 'Ordenar por',
      popular: 'Más populares',
      recentlyAdded: 'Añadidas recientemente',
      mostItems: 'Más elementos',
    },
    pagination: {
      pageOf: 'Página {page} de {totalPages}',
    },
    noResults: 'No se encontraron listas',
    noResultsDescription: 'Intenta ajustar tus filtros o búsqueda',
  },

  categories: {
    title: 'Categorías',
    subtitle: 'Explora listas por tema',
    list: {
      movies: {
        name: 'Películas',
        description: 'Las mejores películas del momento',
      },
      series: { name: 'Series', description: 'Series que no te puedes perder' },
      netflix: { name: 'Netflix', description: 'Joyas de Netflix' },
      'prime-video': {
        name: 'Prime Video',
        description: 'Exclusivas de Amazon Prime',
      },
      'disney-plus': {
        name: 'Disney+',
        description: 'El universo Disney, Pixar, Marvel y Star Wars',
      },
      'apple-tv': {
        name: 'Apple TV+',
        description: 'Producciones originales de Apple TV+',
      },
      crunchyroll: {
        name: 'Crunchyroll',
        description: 'Los mejores animes en streaming',
      },
      'hbo-max': {
        name: 'HBO Max',
        description: 'Series y películas de HBO',
      },
      youtube: {
        name: 'YouTube',
        description: 'Películas y series disponibles en YouTube',
      },
      'canal-plus': {
        name: 'Canal+',
        description: 'Programas de Canal+',
      },
      ocs: {
        name: 'OCS',
        description: 'Lo mejor del cine y las series',
      },
      'paramount-plus': {
        name: 'Paramount+',
        description: 'Producciones de Paramount+',
      },
      'rakuten-tv': {
        name: 'Rakuten TV',
        description: 'Películas y series en Rakuten TV',
      },
      anime: {
        name: 'Animación',
        description: 'Las mejores series animadas y películas de manga adaptadas',
      },
      action: {
        name: 'Acción',
        description: 'Clásicos y nuevas películas de acción',
      },
      documentaries: {
        name: 'Documentales',
        description: 'Documentales cautivadores y educativos',
      },
      enfant: {
        name: 'Infantil',
        description: 'Películas y series para niños',
      },
      jeunesse: {
        name: 'Juvenil',
        description: 'Películas y series para adolescentes y adultos jóvenes',
      },
    },
  },

  // Footer
  footer: {
    appName: 'Poplist',
    language: 'Idioma',
  },

  // Profile Page
  profile: {
    usernameSection: {
      title: 'Nombre de usuario',
      description: 'Actualiza tu nombre de usuario. Así es como te verán los demás.',
      label: 'Nombre de usuario',
      placeholder: 'Introduce tu nombre de usuario',
      hint: '3-20 caracteres. Solo letras, números y guiones bajos.',
      updateButton: 'Actualizar',
      validation: {
        lengthError: 'El nombre de usuario debe tener entre 3 y 20 caracteres',
        formatError: 'El nombre de usuario solo puede contener letras, números y guiones bajos',
        alreadyTaken: 'El nombre de usuario ya está en uso',
      },
    },
    deleteSection: {
      title: 'Eliminar cuenta',
      description: 'Acción irreversible. Todos tus datos serán eliminados.',
      dialogTitle: 'Eliminar tu cuenta',
      dialogDescription: 'Acción irreversible. Todos tus datos serán eliminados.',
      confirmationLabel: "Escribe 'confirmar' para continuar",
      confirmationPlaceholder: 'confirmar',
      deleteButton: 'Eliminar cuenta',
      deleting: 'Eliminando...',
      cancel: 'Cancelar',
    },
  },
  userProfile: {
    profile: 'Perfil',
    publicWatchlists: 'Listas públicas',
    publicWatchlist: 'Lista pública',
    watchlists: 'listas',
    watchlist: 'lista',
    noPublicWatchlists: 'No hay listas publicadas.',
    noPublicWatchlistsDescription: 'Este usuario aún no ha publicado ninguna lista pública.',
    loading: 'Cargando perfil...',
    notFound: 'Usuario no encontrado',
    notFoundDescription: 'El usuario que buscas no existe o ha sido eliminado.',
    backToHome: 'Volver al inicio',
  },
  settings: {
    tabs: {
      display: 'Pantalla',
      preferences: 'Preferencias',
      account: 'Cuenta',
    },
    display: {
      backgroundColor: 'Color de fondo',
      backgroundColorHint: 'Tema de la aplicación',
      ocean: 'Océano',
      midnight: 'Medianoche',
      listColumns: 'Columnas de listas',
      listColumnsHint: 'Número de columnas en las páginas de inicio y mis listas',
      exploreColumns: 'Columnas Explorar',
      exploreColumnsHint: 'Número de columnas en la página Explorar',
    },
    preferences: {
      language: 'Idioma',
      handedness: 'Mano dominante',
      handednessHint: 'Posición de los botones de acción',
      leftHanded: 'Zurdo',
      rightHanded: 'Diestro',
    },
  },
};
