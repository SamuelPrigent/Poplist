import type { Content } from '../../types/content';

export const pt: Content = {
  // Header
  header: {
    appName: 'Poplist',
    tagline: 'Crie e partilhe listas dos seus filmes e séries favoritos',
    home: 'Início',
    explore: 'Explorar',
    login: 'Entrar',
    signup: 'Registar',
    logout: 'Sair',
  },

  // Auth Drawer
  auth: {
    loginTitle: 'Entrar',
    loginDescription: 'Bem-vindo de volta! Inicie sessão para aceder às suas listas.',
    signupTitle: 'Registar',
    signupDescription: 'Crie uma conta para guardar as suas listas.',
    continueWithGoogle: 'Continuar com Google',
    or: 'Ou',
    email: 'Email',
    emailPlaceholder: 'seu@email.pt',
    password: 'Palavra-passe',
    passwordPlaceholder: 'A sua palavra-passe',
    processing: 'A processar...',
    dontHaveAccount: 'Não tem uma conta?',
    alreadyHaveAccount: 'Já tem uma conta?',
  },

  // Watchlists Page
  watchlists: {
    title: 'Biblioteca',
    noWatchlists: 'Ainda não criou nenhuma lista.',
    noWatchlistsInCategory: 'Nenhuma lista nesta categoria',
    noItemsYet: 'Ainda sem itens',
    noItemsDescription: 'Comece a adicionar filmes e séries à sua lista.',
    addToWatchlist: 'Adicionar a uma lista',
    myWatchlists: 'As minhas listas',
    followed: 'Seguidas',
    items: 'itens',
    item: 'item',
    searchPlaceholder: 'Pesquisar um filme ou série...',
    noResults: 'Nenhum resultado encontrado',
    startSearching: 'Pesquisar filmes e séries',
    // Content types
    contentTypes: {
      movie: 'Filme',
      series: 'Série',
    },
    // Series info
    seriesInfo: {
      season: 'temporada',
      seasons: 'temporadas',
      episodes: 'episódios',
    },
    // Item Details Modal
    itemDetails: {
      loading: 'A carregar...',
      error: 'Falha ao carregar os detalhes',
      mediaDetails: 'Detalhes do conteúdo',
      fullDetailsFor: 'Detalhes completos de',
      loadingDetails: 'A carregar detalhes',
      notAvailable: 'N/D',
      votes: 'votos',
      synopsis: 'Sinopse',
      director: 'Realizador',
      creator: 'Criador',
      availableOn: 'Disponível em',
      mainCast: 'Elenco principal',
      seeMore: 'Ver mais',
      showMore: 'Ver mais',
      showLess: 'Ver menos',
      add: 'Adicionar',
    },
  },

  // Home Page
  home: {
    categories: {
      title: 'Listas por categoria',
      subtitle: 'Seleção Poplist',
      seeMore: 'Ver mais',
      items: {
        // Linha 1 - Por tipo e plataforma
        movies: {
          title: 'Filmes',
          description: 'Seleção de filmes',
        },
        series: {
          title: 'Séries',
          description: 'Seleção de séries',
        },
        netflix: {
          title: 'Netflix only',
          description: 'Exclusivamente na Netflix',
        },
        primeVideo: {
          title: 'Prime Video only',
          description: 'Exclusivamente no Prime Video',
        },
        disneyPlus: {
          title: 'Disney+ only',
          description: 'Exclusivamente no Disney+',
        },
        crunchyroll: {
          title: 'Crunchyroll only',
          description: 'Exclusivamente no Crunchyroll',
        },
        // Linha 2 - Por género e tema
        netflixChill: {
          title: 'Netflix & Chill',
          description: 'Filmes populares para ver juntos',
        },
        films2010s: {
          title: 'Filmes 2010–2020',
          description: 'Imperdíveis modernos',
        },
        childhood: {
          title: 'Clássicos da infância',
          description: 'Filmes juvenis e nostalgia',
        },
        comedy: {
          title: 'Comédia',
          description: 'Para rir e relaxar',
        },
        action: {
          title: 'Ação',
          description: 'Filmes de ação e blockbusters',
        },
        anime: {
          title: 'Anime',
          description: 'Séries animadas japonesas',
        },
      },
    },
    popularWatchlists: {
      title: 'Listas populares',
      subtitle: 'Partilhadas pela comunidade',
      seeMore: 'Ver mais',
      noWatchlists: 'Nenhuma lista pública no momento',
    },
    creators: {
      title: 'Nossos criadores',
      subtitle: 'Os membros mais ativos da comunidade',
      seeMore: 'Ver tudo',
    },
  },

  explore: {
    title: 'Explorar',
    subtitle: 'Descubra novas listas partilhadas pela comunidade',
    searchPlaceholder: 'Pesquisar uma lista...',
    filters: {
      all: 'Todas',
      movies: 'Filmes',
      series: 'Séries',
      trending: 'Tendências',
      topRated: 'Mais votados',
      popular: 'Populares',
      bestRated: 'Mais votados',
      yearMin: 'Ano mínimo',
      yearMax: 'Ano máximo',
      search: 'Pesquisar...',
      noYearFound: 'Nenhum ano encontrado.',
      clearYears: 'Limpar anos',
    },
    genres: {
      action: 'Ação',
      adventure: 'Aventura',
      animation: 'Animação',
      comedy: 'Comédia',
      crime: 'Crime',
      documentary: 'Documentário',
      drama: 'Drama',
      family: 'Família',
      fantasy: 'Fantasia',
      horror: 'Terror',
      romance: 'Romance',
      scienceFiction: 'Ficção Científica',
      thriller: 'Thriller',
      actionAdventure: 'Ação e Aventura',
      kids: 'Crianças',
      mystery: 'Mistério',
      sciFiFantasy: 'Ficção Científica e Fantasia',
      soap: 'Novela',
      western: 'Western',
    },
    sortBy: {
      label: 'Ordenar por',
      popular: 'Mais populares',
      recentlyAdded: 'Adicionadas recentemente',
      mostItems: 'Mais itens',
    },
    pagination: {
      pageOf: 'Página {page} de {totalPages}',
    },
    noResults: 'Nenhuma lista encontrada',
    noResultsDescription: 'Tente ajustar os seus filtros ou pesquisa',
  },

  categories: {
    title: 'Categorias',
    subtitle: 'Explore listas por tema',
    list: {
      movies: { name: 'Filmes', description: 'Os melhores filmes do momento' },
      series: { name: 'Séries', description: 'Séries imperdíveis' },
      netflix: { name: 'Netflix', description: 'Pérolas da Netflix' },
      'prime-video': {
        name: 'Prime Video',
        description: 'Exclusivos Amazon Prime',
      },
      'disney-plus': {
        name: 'Disney+',
        description: 'O universo Disney, Pixar, Marvel e Star Wars',
      },
      'apple-tv': {
        name: 'Apple TV+',
        description: 'Produções originais Apple TV+',
      },
      crunchyroll: {
        name: 'Crunchyroll',
        description: 'Os melhores animes em streaming',
      },
      'hbo-max': {
        name: 'HBO Max',
        description: 'Séries e filmes HBO',
      },
      youtube: {
        name: 'YouTube',
        description: 'Filmes e séries disponíveis no YouTube',
      },
      'canal-plus': {
        name: 'Canal+',
        description: 'Programas Canal+',
      },
      ocs: {
        name: 'OCS',
        description: 'O melhor do cinema e das séries',
      },
      'paramount-plus': {
        name: 'Paramount+',
        description: 'Produções Paramount+',
      },
      'rakuten-tv': {
        name: 'Rakuten TV',
        description: 'Filmes e séries no Rakuten TV',
      },
      anime: {
        name: 'Animação',
        description: 'As melhores séries animadas e filmes de mangá adaptados',
      },
      action: { name: 'Ação', description: 'Clássicos e novos filmes de ação' },
      documentaries: {
        name: 'Documentários',
        description: 'Documentários cativantes e educativos',
      },
      enfant: {
        name: 'Infantil',
        description: 'Filmes e séries para crianças',
      },
      jeunesse: {
        name: 'Jovens',
        description: 'Filmes e séries para adolescentes e jovens adultos',
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
      title: 'Nome de utilizador',
      description: 'Atualize o seu nome de utilizador. É assim que os outros o verão.',
      label: 'Nome de utilizador',
      placeholder: 'Introduza o seu nome de utilizador',
      hint: '3-20 caracteres. Apenas letras, números e sublinhados.',
      updateButton: 'Atualizar',
      validation: {
        lengthError: 'O nome de utilizador deve ter entre 3 e 20 caracteres',
        formatError: 'O nome de utilizador só pode conter letras, números e sublinhados',
        alreadyTaken: 'Nome de utilizador já em uso',
      },
    },
    deleteSection: {
      title: 'Eliminar conta',
      description: 'Ação irreversível. Todos os seus dados serão eliminados.',
      dialogTitle: 'Eliminar a sua conta',
      dialogDescription: 'Ação irreversível. Todos os seus dados serão eliminados.',
      confirmationLabel: "Digite 'confirmar' para continuar",
      confirmationPlaceholder: 'confirmar',
      deleteButton: 'Eliminar conta',
      deleting: 'A eliminar...',
      cancel: 'Cancelar',
    },
  },
  userProfile: {
    profile: 'Perfil',
    publicWatchlists: 'Listas públicas',
    publicWatchlist: 'Lista pública',
    watchlists: 'listas',
    watchlist: 'lista',
    noPublicWatchlists: 'Nenhuma lista publicada.',
    noPublicWatchlistsDescription: 'Este utilizador ainda não publicou nenhuma lista pública.',
    loading: 'A carregar perfil...',
    notFound: 'Utilizador não encontrado',
    notFoundDescription: 'O utilizador que procura não existe ou foi eliminado.',
    backToHome: 'Voltar ao início',
  },
  settings: {
    tabs: {
      display: 'Visualização',
      preferences: 'Preferências',
      account: 'Conta',
    },
    display: {
      backgroundColor: 'Cor de fundo',
      backgroundColorHint: 'Tema da aplicação',
      ocean: 'Oceano',
      midnight: 'Meia-noite',
      listColumns: 'Colunas das listas',
      listColumnsHint: 'Número de colunas na página inicial e as minhas listas',
      exploreColumns: 'Colunas Explorar',
      exploreColumnsHint: 'Número de colunas na página Explorar',
    },
    preferences: {
      language: 'Idioma',
      handedness: 'Mão dominante',
      handednessHint: 'Posição dos botões de ação',
      leftHanded: 'Canhoto',
      rightHanded: 'Destro',
    },
  },
};
