import type { Content } from "@/types/content";

export const es: Content = {
  // Header
  header: {
    appName: "WatchlistHub",
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
  },

  // Home Page
  home: {
    hero: {
      title: "WatchlistHub",
      subtitle: "Crea y comparte listas de tus películas y series favoritas.",
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
};
