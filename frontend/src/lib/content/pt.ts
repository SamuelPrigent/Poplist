import type { Content } from "@/types/content";

export const pt: Content = {
  // Header
  header: {
    appName: "WatchlistHub",
    home: "Início",
    login: "Entrar",
    signup: "Registar",
    logout: "Sair",
  },

  // Auth Drawer
  auth: {
    loginTitle: "Entrar",
    loginDescription: "Bem-vindo de volta! Inicie sessão para aceder às suas watchlists.",
    signupTitle: "Registar",
    signupDescription: "Crie uma conta para guardar as suas watchlists.",
    continueWithGoogle: "Continuar com Google",
    or: "Ou",
    email: "Email",
    emailPlaceholder: "seu@email.pt",
    password: "Palavra-passe",
    passwordPlaceholder: "••••••••",
    processing: "A processar...",
    dontHaveAccount: "Não tem uma conta?",
    alreadyHaveAccount: "Já tem uma conta?",
  },

  // Watchlists Page
  watchlists: {
    title: "As suas watchlists",
    createWatchlist: "Criar",
    createWatchlistDescription:
      "Crie uma nova watchlist para organizar os seus filmes e séries.",
    notLoggedInWarning: "Dados locais",
    noWatchlists: "Ainda não criou nenhuma watchlist.",
    items: "itens",
    item: "item",
    public: "Público",
    private: "Privado",
    loading: "A carregar...",
    accountDataBadge: "Dados da conta de utilizador",
    name: "Nome",
    namePlaceholder: "A minha watchlist",
    description: "Descrição",
    descriptionPlaceholder: "Descrição da sua watchlist",
    coverImage: "Imagem de capa",
    uploadImage: "Carregar imagem",
    changeImage: "Alterar imagem",
    imageUploadHint: "PNG, JPG ou WEBP (máx. 5MB)",
    makePublic: "Tornar pública",
    cancel: "Cancelar",
    create: "Criar",
    creating: "A criar...",
    back: "Voltar",
    noItemsYet: "Ainda sem itens",
    noItemsDescription:
      "Comece a adicionar filmes e séries à sua watchlist para organizar a sua fila de visualização.",
    editWatchlist: "Editar watchlist",
    editWatchlistDescription: "Edite as informações da sua watchlist.",
    deleteWatchlist: "Eliminar watchlist",
    deleteWatchlistConfirm:
      'Tem a certeza de que deseja eliminar "{name}"? Esta ação é irreversível.',
    deleteWatchlistWarning:
      "Esta watchlist contém {count} item(ns) que também serão eliminados.",
    saving: "A guardar...",
    save: "Guardar",
    deleting: "A eliminar...",
    delete: "Eliminar",
    addItem: "Adicionar",
    searchMoviesAndSeries: "Pesquise e adicione filmes ou séries à sua watchlist",
    searchPlaceholder: "Pesquisar um filme ou série...",
    searching: "A pesquisar...",
    noResults: "Nenhum resultado encontrado",
    startSearching: "Comece a digitar para pesquisar filmes e séries",
    add: "Adicionar",
    added: "Adicionado",
    inWatchlist: "Na watchlist",
    // Table headers
    tableHeaders: {
      number: "#",
      title: "Título",
      type: "Tipo",
      platforms: "Plataformas",
      duration: "Duração",
    },
    // Content types
    contentTypes: {
      movie: "Filme",
      series: "Série",
    },
    // Series info
    seriesInfo: {
      season: "temporada",
      seasons: "temporadas",
      episodes: "episódios",
    },
    // Item Details Modal
    itemDetails: {
      loading: "A carregar...",
      error: "Falha ao carregar os detalhes",
      mediaDetails: "Detalhes do conteúdo",
      fullDetailsFor: "Detalhes completos de",
      loadingDetails: "A carregar detalhes",
      notAvailable: "N/D",
      votes: "votos",
      synopsis: "Sinopse",
      director: "Realizador",
      creator: "Criador",
      availableOn: "Disponível em",
      mainCast: "Elenco principal",
      seeMore: "Ver mais",
    },
  },

  // Home Page
  home: {
    hero: {
      title: "WatchlistHub",
      subtitle: "Crie e partilhe watchlists dos seus filmes e séries favoritos.",
    },
    trending: {
      title: "Tendências de hoje",
      noImage: "Sem imagem",
    },
  },

  // Footer
  footer: {
    appName: "WatchlistHub",
    language: "Idioma",
  },

  // Profile Page
  profile: {
    title: "Definições do perfil",
    subtitle: "Gerir as definições e preferências da sua conta",
    userInformation: "Informações do utilizador",
    usernameSection: {
      title: "Nome de utilizador",
      description: "Atualize o seu nome de utilizador. É assim que os outros o verão.",
      label: "Nome de utilizador",
      placeholder: "Introduza o seu nome de utilizador",
      hint: "3-20 caracteres. Apenas letras, números e sublinhados.",
      updateButton: "Atualizar",
    },
    passwordSection: {
      title: "Palavra-passe",
      description: "Altere a sua palavra-passe. Certifique-se de que tem pelo menos 8 caracteres.",
      currentPasswordLabel: "Palavra-passe",
      currentPasswordPlaceholder: "Introduza a sua palavra-passe atual",
      newPasswordLabel: "Nova palavra-passe",
      newPasswordPlaceholder: "Nova palavra-passe",
      confirmPasswordLabel: "Confirmação",
      confirmPasswordPlaceholder: "Nova palavra-passe",
      changeButton: "Alterar palavra-passe",
    },
    toasts: {
      usernameUpdated: "Nome de utilizador atualizado",
      usernameUpdatedDesc: "O seu nome de utilizador foi atualizado com sucesso.",
      passwordChanged: "Palavra-passe alterada",
      passwordChangedDesc: "A sua palavra-passe foi alterada com sucesso.",
      error: "Erro",
      passwordMismatch: "As novas palavras-passe não correspondem",
      updateFailed: "Falha ao atualizar o nome de utilizador",
      passwordChangeFailed: "Falha ao alterar a palavra-passe",
    },
  },
};
