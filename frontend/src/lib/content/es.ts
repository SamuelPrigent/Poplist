import type { Content } from "@/types/content";

export const es: Content = {
  // Header
  header: {
    appName: "WatchlistHub",
    home: "Inicio",
    login: "Iniciar sesión",
    signup: "Registrarse",
    logout: "Cerrar sesión",
  },

  // Auth Drawer
  auth: {
    loginTitle: "Iniciar sesión",
    loginDescription: "¡Bienvenido! Inicia sesión para acceder a tus listas.",
    signupTitle: "Registrarse",
    signupDescription: "Crea una cuenta para guardar tus listas.",
    continueWithGoogle: "Continuar con Google",
    or: "O",
    email: "Correo electrónico",
    emailPlaceholder: "tu@email.com",
    password: "Contraseña",
    passwordPlaceholder: "••••••••",
    processing: "Procesando...",
    dontHaveAccount: "¿No tienes una cuenta?",
    alreadyHaveAccount: "¿Ya tienes una cuenta?",
  },

  // Watchlists Page
  watchlists: {
    title: "Tus listas",
    createWatchlist: "Crear",
    createWatchlistDescription:
      "Crea una nueva lista para organizar tus películas y series.",
    notLoggedInWarning: "Datos locales",
    noWatchlists: "Aún no has creado ninguna lista.",
    items: "elementos",
    item: "elemento",
    public: "Público",
    private: "Privado",
    loading: "Cargando...",
    accountDataBadge: "Datos de la cuenta de usuario",
    name: "Nombre",
    namePlaceholder: "Mi lista",
    description: "Descripción",
    descriptionPlaceholder: "Descripción de tu lista",
    coverImage: "Imagen de portada",
    uploadImage: "Subir imagen",
    changeImage: "Cambiar imagen",
    imageUploadHint: "PNG, JPG o WEBP (máx. 5MB)",
    makePublic: "Hacer pública",
    cancel: "Cancelar",
    create: "Crear",
    creating: "Creando...",
    back: "Volver",
    noItemsYet: "Aún no hay elementos",
    noItemsDescription:
      "Comienza a añadir películas y series a tu lista para organizar tu cola de visualización.",
    edit: "Editar",
    editWatchlist: "Editar lista",
    editWatchlistDescription: "Edita la información de tu lista.",
    deleteWatchlist: "Eliminar lista",
    deleteWatchlistConfirm:
      '¿Estás seguro de que deseas eliminar "{name}"? Esta acción es irreversible.',
    deleteWatchlistWarning:
      "Esta lista contiene {count} elemento(s) que también se eliminarán.",
    saving: "Guardando...",
    save: "Guardar",
    deleting: "Eliminando...",
    delete: "Eliminar",
    addItem: "Añadir",
    searchMoviesAndSeries: "Busca y añade películas o series a tu lista",
    searchPlaceholder: "Buscar una película o serie...",
    searching: "Buscando...",
    noResults: "No se encontraron resultados",
    startSearching: "Empieza a escribir para buscar películas y series",
    add: "Añadir",
    added: "Añadido",
    inWatchlist: "En la lista",
    // Table headers
    tableHeaders: {
      number: "#",
      title: "Título",
      type: "Tipo",
      platforms: "Plataformas",
      duration: "Duración",
    },
    // Content types
    contentTypes: {
      movie: "Película",
      series: "Serie",
    },
    // Series info
    seriesInfo: {
      season: "temporada",
      seasons: "temporadas",
      episodes: "episodios",
    },
    // Item Details Modal
    itemDetails: {
      loading: "Cargando...",
      error: "Error al cargar los detalles",
      mediaDetails: "Detalles del contenido",
      fullDetailsFor: "Detalles completos de",
      loadingDetails: "Cargando detalles",
      notAvailable: "N/D",
      votes: "votos",
      synopsis: "Sinopsis",
      director: "Director",
      creator: "Creador",
      availableOn: "Disponible en",
      mainCast: "Reparto principal",
      seeMore: "Ver más",
    },
  },

  // Home Page
  home: {
    hero: {
      title: "Descubre, crea y comparte tus listas.",
      subtitle: "Tu universo del cine, organizado y compartido con amigos.",
      cta: "Crear una lista",
    },
    categories: {
      title: "Watchlists por tema",
      subtitle: "Selección WatchlistHub",
      seeMore: "Ver más",
      items: {
        // Línea 1 - Por tipo y plataforma
        movies: {
          title: "Películas",
          description: "Selección de películas",
        },
        series: {
          title: "Series",
          description: "Selección de series",
        },
        netflix: {
          title: "Netflix only",
          description: "Exclusivamente en Netflix",
        },
        primeVideo: {
          title: "Prime Video only",
          description: "Exclusivamente en Prime Video",
        },
        disneyPlus: {
          title: "Disney+ only",
          description: "Exclusivamente en Disney+",
        },
        crunchyroll: {
          title: "Crunchyroll only",
          description: "Exclusivamente en Crunchyroll",
        },
        // Línea 2 - Por género y tema
        netflixChill: {
          title: "Netflix & Chill",
          description: "Películas populares para ver juntos",
        },
        films2010s: {
          title: "Películas 2010–2020",
          description: "Imprescindibles modernos",
        },
        childhood: {
          title: "Clásicos de la infancia",
          description: "Películas juveniles y nostalgia",
        },
        comedy: {
          title: "Comedia",
          description: "Para reír y relajarse",
        },
        action: {
          title: "Acción",
          description: "Películas de acción y blockbusters",
        },
        anime: {
          title: "Anime",
          description: "Series animadas japonesas",
        },
      },
    },
    popularWatchlists: {
      title: "Watchlists populares",
      subtitle: "Compartidas por la comunidad",
      seeMore: "Ver más",
      noWatchlists: "No hay listas públicas por el momento",
    },
    faq: {
      title: "Preguntas frecuentes",
      subtitle: "Todo lo que necesitas saber para empezar",
      questions: {
        privateWatchlists: {
          question: "¿Cómo funcionan las listas privadas?",
          answer:
            "Las listas privadas te permiten mantener tus selecciones para ti solo. Solo son visibles para ti y no pueden ser compartidas con otros usuarios. Puedes cambiar entre privado y público en cualquier momento desde la configuración de tu lista.",
        },
        pricing: {
          question: "¿Es gratis usar la aplicación?",
          answer:
            "¡Sí, la aplicación es completamente gratuita! Puedes crear tantas listas como quieras, compartirlas con tus amigos y explorar miles de películas y series sin ningún costo.",
        },
        exploreSection: {
          question: "¿Para qué sirve la sección Explorar?",
          answer:
            "La sección Explorar te permite descubrir nuevo contenido navegando por las tendencias actuales, las películas y series más populares o mejor valoradas. Puedes filtrar por género para encontrar exactamente lo que buscas y agregar elementos directamente a tus listas.",
        },
        whatMakesDifferent: {
          question: "¿Qué hace que esta aplicación sea diferente?",
          answer:
            "Esta aplicación tiene como objetivo mantenerse simple con pocas funciones y páginas para ser clara y fácil de usar. La experiencia pretende ser natural e intuitiva, sin complejidad innecesaria. Nos centramos en lo esencial: organizar y compartir tus películas y series favoritas.",
        },
        streaming: {
          question: "¿Puedo ver series o películas?",
          answer:
            "No, el propósito de esta aplicación no es el streaming sino compartir fácilmente contenido que te gustó en tus plataformas favoritas. Te ayudamos a organizar lo que quieres ver y compartirlo con tu comunidad, pero para ver el contenido, deberás ir a las plataformas de streaming apropiadas.",
        },
      },
    },
    trending: {
      title: "Tendencias de hoy",
      noImage: "Sin imagen",
    },
  },

  // Footer
  footer: {
    appName: "WatchlistHub",
    language: "Idioma",
  },

  // Profile Page
  profile: {
    title: "Configuración del perfil",
    subtitle: "Administra la configuración y preferencias de tu cuenta",
    userInformation: "Información del usuario",
    usernameSection: {
      title: "Nombre de usuario",
      description: "Actualiza tu nombre de usuario. Así es como te verán los demás.",
      label: "Nombre de usuario",
      placeholder: "Introduce tu nombre de usuario",
      hint: "3-20 caracteres. Solo letras, números y guiones bajos.",
      updateButton: "Actualizar",
    },
    passwordSection: {
      title: "Contraseña",
      description: "Cambia tu contraseña. Asegúrate de que tenga al menos 8 caracteres.",
      currentPasswordLabel: "Contraseña",
      currentPasswordPlaceholder: "Introduce tu contraseña actual",
      newPasswordLabel: "Nueva contraseña",
      newPasswordPlaceholder: "Nueva contraseña",
      confirmPasswordLabel: "Confirmación",
      confirmPasswordPlaceholder: "Nueva contraseña",
      changeButton: "Cambiar contraseña",
    },
    toasts: {
      usernameUpdated: "Nombre de usuario actualizado",
      usernameUpdatedDesc: "Tu nombre de usuario se ha actualizado correctamente.",
      passwordChanged: "Contraseña cambiada",
      passwordChangedDesc: "Tu contraseña se ha cambiado correctamente.",
      error: "Error",
      passwordMismatch: "Las nuevas contraseñas no coinciden",
      updateFailed: "Error al actualizar el nombre de usuario",
      passwordChangeFailed: "Error al cambiar la contraseña",
    },
  },
};
