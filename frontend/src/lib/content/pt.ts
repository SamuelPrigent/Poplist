import type { Content } from "@/types/content";

export const pt: Content = {
	// Header
	header: {
		appName: "Poplist",
		home: "Início",
		explore: "Explorar",
		login: "Entrar",
		signup: "Registar",
		logout: "Sair",
	},

	// Auth Drawer
	auth: {
		loginTitle: "Entrar",
		loginDescription:
			"Bem-vindo de volta! Inicie sessão para aceder às suas listas.",
		signupTitle: "Registar",
		signupDescription: "Crie uma conta para guardar as suas listas.",
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
		title: "Biblioteca",
		createWatchlist: "Nova lista",
		createWatchlistDescription:
			"Crie uma nova lista para organizar os seus filmes e séries.",
		notLoggedInWarning: "Dados locais",
		noWatchlists: "Ainda não criou nenhuma lista.",
		myWatchlists: "As minhas listas",
		followed: "Seguidas",
		noWatchlistsInCategory: "Nenhuma lista nesta categoria",
		adjustFilters: "Ajuste os filtros para ver mais listas",
		items: "itens",
		item: "item",
		headerPublic: "Lista pública",
		headerPrivate: "Lista privada",
		public: "Público",
		private: "Privado",
		loading: "A carregar...",
		accountDataBadge: "Dados da conta de utilizador",
		preview: "Pré-visualização",
		categories: "Categorias / Etiquetas",
		categoriesDescription:
			"Selecione uma ou mais categorias para facilitar a descoberta da sua lista",
		genreCategories: "Categorias de género",
		platformCategories: "Plataformas de streaming",
		platformsDescription:
			"Selecione as plataformas onde a sua lista está disponível",
		name: "Nome",
		namePlaceholder: "A minha lista",
		description: "Descrição",
		descriptionPlaceholder: "Descrição da sua lista",
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
			"Comece a adicionar filmes e séries à sua lista para organizar a sua fila de visualização.",
		edit: "Editar",
		editWatchlist: "Editar lista",
		editWatchlistDescription: "Edite as informações da sua lista.",
		deleteWatchlist: "Eliminar lista",
		deleteWatchlistConfirm:
			'Tem a certeza de que deseja eliminar "{name}"? Esta ação é irreversível.',
		deleteWatchlistWarning:
			"Esta lista contém {count} item(ns) que também serão eliminados.",
		saving: "A guardar...",
		save: "Guardar",
		deleting: "A eliminar...",
		delete: "Eliminar",
		addItem: "Adicionar",
		searchMoviesAndSeries:
			"Pesquise e adicione filmes ou séries à sua lista",
		searchPlaceholder: "Pesquisar um filme ou série...",
		searching: "A pesquisar...",
		noResults: "Nenhum resultado encontrado",
		startSearching: "Comece a digitar para pesquisar filmes e séries",
		add: "Adicionar",
		added: "Adicionado",
		inWatchlist: "Na lista",
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
		tooltips: {
			share: "Partilhar",
			save: "Adicionar à biblioteca",
			unsave: "Remover da biblioteca",
			duplicate: "Duplicar no meu espaço",
			inviteCollaborator: "Convidar um colaborador",
		},
		contextMenu: {
			addToWatchlist: "Adicionar à lista",
			removeFromWatchlist: "Remover da lista",
			moveToFirst: "Mover para primeira posição",
			moveToLast: "Mover para última posição",
		},
		collaborators: {
			addTitle: "Adicionar Colaborador",
			addDescription: "Digite o nome de usuário para convidar um colaborador",
			usernamePlaceholder: "Nome de usuário",
			add: "Adicionar",
			adding: "Adicionando...",
			addSuccess: "Colaborador adicionado com sucesso",
			addError: "Falha ao adicionar colaborador",
			currentTitle: "Colaboradores Atuais",
			remove: "Remover",
			removeSuccess: "Colaborador removido",
			removeError: "Falha ao remover colaborador",
			leaveTitle: "Sair da lista?",
			leaveDescription:
				"Tem certeza de que deseja sair desta lista? Você perderá seus direitos de colaborador.",
			leave: "Sair",
			leaving: "Saindo...",
			leaveSuccess: "Você saiu da lista",
			leaveError: "Falha ao sair da lista",
		},
		addToWatchlist: "Adicionar a uma lista",
		noWatchlist: "Nenhuma lista",
		offlinePopover: {
			title: "Por que se registar?",
			accessEverywhere: "Aceda às suas listas em qualquer lugar",
			collaborativeLists: "Crie listas colaborativas",
			shareWithFriends: "Partilhe as suas listas com amigos",
			signup: "Registar",
		},
	},

	landing: {
		hero: {
			tagline: "Planeje, acompanhe e aproveite seus filmes juntos",
			title: "Crie e compartilhe listas dos seus filmes e séries favoritos",
			subtitle:
				"Organize suas noites de TV e compartilhe suas descobertas com seus amigos",
			cta: "Criar uma lista",
		},
		features: {
			organize: {
				tagline: "Organização",
				title: "Criação de listas colaborativas",
				description:
					"Crie listas pessoais ou colaborativas de filmes e séries.",
			},
			discover: {
				tagline: "Descoberta",
				title: "Descubra filmes e séries",
				description:
					"Use a função de exploração para encontrar conteúdo para adicionar às suas listas.",
			},
			share: {
				tagline: "Compartilhamento",
				title: "Siga as listas da comunidade",
				description:
					"Adicione as listas de outros usuários ao seu espaço pessoal.",
			},
		},
		startInSeconds: {
			title: "Comece em segundos",
			subtitle:
				"Sem configuração complicada, apenas você e seu conteúdo favorito",
			step1: {
				title: "Crie sua lista",
				description:
					'Comece com "Meus filmes favoritos" ou fique nostálgico com "Filmes de infância".',
			},
			step2: {
				title: "Adicione filmes",
				description:
					"Procure um filme ou série usando uma palavra-chave e adicione-o à sua lista atual.",
			},
			step3: {
				title: "Compartilhe com seus amigos",
				description:
					'Torne suas listas "públicas" e compartilhe-as facilmente com um link.',
			},
		},
		testimonials: {
			title: "Amado pelos entusiastas",
			subtitle: "Junte-se a uma comunidade de usuários satisfeitos",
			testimonial1: {
				text: "Aplicativo perfeito para organizar minhas listas. Interface clara e intuitiva.",
				author: "— Marie L.",
			},
			testimonial2: {
				text: "Muito prático! Ajuda a manter o controle do que assistimos e do que queremos recomendar.",
				author: "— Thomas D.",
			},
			testimonial3: {
				text: "Simples, eficaz, exatamente o que eu procurava para gerenciar meus filmes para assistir.",
				author: "— Julie M.",
			},
		},
		finalCta: {
			title: "Comece a criar suas listas facilmente",
			subtitle:
				"Junte-se ao Poplist e organize seus conteúdos favoritos em poucos cliques.",
			button: "Criar minha lista",
			disclaimer: "Aplicativo gratuito • Não é necessário cartão",
		},
	},

	// Home Page
	home: {
		hero: {
			title: "Suas listas perfeitamente organizadas",
			subtitle:
				"O seu universo cinematográfico, organizado e partilhado com amigos.",
			cta: "Criar uma lista",
			ctaSecondary: "Saber mais",
			pills: {
				organize: "Organize seus filmes",
				share: "Compartilhe com seus amigos",
				discover: "Descubra pérolas",
			},
		},
		library: {
			title: "Biblioteca",
			subtitle: "Suas listas pessoais",
			seeAll: "Ver tudo",
		},
		categories: {
			title: "Listas por categoria",
			subtitle: "Seleção Poplist",
			seeMore: "Ver mais",
			items: {
				// Linha 1 - Por tipo e plataforma
				movies: {
					title: "Filmes",
					description: "Seleção de filmes",
				},
				series: {
					title: "Séries",
					description: "Seleção de séries",
				},
				netflix: {
					title: "Netflix only",
					description: "Exclusivamente na Netflix",
				},
				primeVideo: {
					title: "Prime Video only",
					description: "Exclusivamente no Prime Video",
				},
				disneyPlus: {
					title: "Disney+ only",
					description: "Exclusivamente no Disney+",
				},
				crunchyroll: {
					title: "Crunchyroll only",
					description: "Exclusivamente no Crunchyroll",
				},
				// Linha 2 - Por género e tema
				netflixChill: {
					title: "Netflix & Chill",
					description: "Filmes populares para ver juntos",
				},
				films2010s: {
					title: "Filmes 2010–2020",
					description: "Imperdíveis modernos",
				},
				childhood: {
					title: "Clássicos da infância",
					description: "Filmes juvenis e nostalgia",
				},
				comedy: {
					title: "Comédia",
					description: "Para rir e relaxar",
				},
				action: {
					title: "Ação",
					description: "Filmes de ação e blockbusters",
				},
				anime: {
					title: "Anime",
					description: "Séries animadas japonesas",
				},
			},
		},
		platformsSection: {
			title: "Listas por plataforma",
			subtitle: "As suas plataformas favoritas",
			seeAll: "Ver tudo",
		},
		popularWatchlists: {
			title: "Listas populares",
			subtitle: "Partilhadas pela comunidade",
			seeMore: "Ver mais",
			noWatchlists: "Nenhuma lista pública no momento",
		},
		faq: {
			title: "Perguntas frequentes",
			subtitle: "Tudo o que precisa saber para começar",
			questions: {
				privateWatchlists: {
					question: "Como funcionam as listas privadas?",
					answer:
						"As listas privadas permitem-lhe manter as suas seleções para si. São visíveis apenas para si e não podem ser partilhadas com outros utilizadores. Pode alternar entre privado e público a qualquer momento nas definições da sua lista.",
				},
				pricing: {
					question: "É gratuito para usar?",
					answer:
						"Sim, a aplicação é completamente gratuita! Pode criar tantas listas quantas quiser, partilhá-las com os seus amigos e explorar milhares de filmes e séries sem qualquer custo.",
				},
				exploreSection: {
					question: "Para que serve a secção Explorar?",
					answer:
						"A secção Explorar permite-lhe descobrir novos conteúdos navegando pelas tendências atuais, os filmes e séries mais populares ou mais bem classificados. Pode filtrar por género para encontrar exatamente o que procura e adicionar elementos diretamente às suas listas.",
				},
				whatMakesDifferent: {
					question: "O que torna esta aplicação diferente?",
					answer:
						"Esta aplicação visa manter-se simples com poucas funcionalidades e páginas para ser clara e fácil de usar. A experiência pretende ser natural e intuitiva, sem complexidade desnecessária. Focamo-nos no essencial: organizar e partilhar os seus filmes e séries favoritos.",
				},
				streaming: {
					question: "Posso ver séries ou filmes?",
					answer:
						"Não, o objetivo desta aplicação não é o streaming mas a partilha fácil de conteúdos que gostou nas suas plataformas favoritas. Ajudamos-lhe a organizar o que quer ver e a partilhá-lo com a sua comunidade, mas para visualizar o conteúdo, terá de ir às plataformas de streaming apropriadas.",
				},
			},
		},
		trending: {
			title: "Tendências de hoje",
			noImage: "Sem imagem",
		},
		recommendations: {
			title: "Tendências do momento",
			subtitle: "Os títulos em alta esta semana.",
			seeMore: "Ver tudo",
		},
		communityWatchlists: {
			title: "Listas da comunidade",
			subtitle: "Descubra coleções compartilhadas por nossos usuários",
		},
	},

	explore: {
		title: "Explorar",
		subtitle: "Descubra novas listas partilhadas pela comunidade",
		searchPlaceholder: "Pesquisar uma lista...",
		filters: {
			all: "Todas",
			movies: "Filmes",
			series: "Séries",
			trending: "Tendências",
			topRated: "Mais votados",
			popular: "Populares",
			bestRated: "Mais votados",
			yearMin: "Ano mínimo",
			yearMax: "Ano máximo",
			search: "Pesquisar...",
			noYearFound: "Nenhum ano encontrado.",
			clearYears: "Limpar anos",
		},
		genres: {
			action: "Ação",
			adventure: "Aventura",
			animation: "Animação",
			comedy: "Comédia",
			crime: "Crime",
			documentary: "Documentário",
			drama: "Drama",
			family: "Família",
			fantasy: "Fantasia",
			horror: "Terror",
			romance: "Romance",
			scienceFiction: "Ficção Científica",
			thriller: "Thriller",
			actionAdventure: "Ação e Aventura",
			kids: "Crianças",
			mystery: "Mistério",
			sciFiFantasy: "Ficção Científica e Fantasia",
			soap: "Novela",
			western: "Western",
		},
		sortBy: {
			label: "Ordenar por",
			popular: "Mais populares",
			recentlyAdded: "Adicionadas recentemente",
			mostItems: "Mais itens",
		},
		pagination: {
			pageOf: "Página {page} de {totalPages}",
		},
		noResults: "Nenhuma lista encontrada",
		noResultsDescription: "Tente ajustar os seus filtros ou pesquisa",
	},

	categories: {
		title: "Categorias",
		subtitle: "Explore listas por tema",
		list: {
			movies: { name: "Filmes", description: "Os melhores filmes do momento" },
			series: { name: "Séries", description: "Séries imperdíveis" },
			netflix: { name: "Netflix", description: "Pérolas da Netflix" },
			"prime-video": {
				name: "Prime Video",
				description: "Exclusivos Amazon Prime",
			},
			"disney-plus": {
				name: "Disney+",
				description: "O universo Disney, Pixar, Marvel e Star Wars",
			},
			"apple-tv": {
				name: "Apple TV+",
				description: "Produções originais Apple TV+",
			},
			crunchyroll: {
				name: "Crunchyroll",
				description: "Os melhores animes em streaming",
			},
			"hbo-max": {
				name: "HBO Max",
				description: "Séries e filmes HBO",
			},
			youtube: {
				name: "YouTube",
				description: "Filmes e séries disponíveis no YouTube",
			},
			"canal-plus": {
				name: "Canal+",
				description: "Programas Canal+",
			},
			ocs: {
				name: "OCS",
				description: "O melhor do cinema e das séries",
			},
			"paramount-plus": {
				name: "Paramount+",
				description: "Produções Paramount+",
			},
			"rakuten-tv": {
				name: "Rakuten TV",
				description: "Filmes e séries no Rakuten TV",
			},
			anime: {
				name: "Animação",
				description: "As melhores séries animadas e filmes de mangá adaptados",
			},
			action: { name: "Ação", description: "Clássicos e novos filmes de ação" },
			documentaries: {
				name: "Documentários",
				description: "Documentários cativantes e educativos",
			},
			enfant: {
				name: "Infantil",
				description: "Filmes e séries para crianças",
			},
			jeunesse: {
				name: "Jovens",
				description: "Filmes e séries para adolescentes e jovens adultos",
			},
		},
	},

	// Footer
	footer: {
		appName: "Poplist",
		language: "Idioma",
	},

	// Profile Page
	profile: {
		title: "Definições do perfil",
		subtitle: "Gerir as definições e preferências da sua conta",
		userInformation: "Informações do utilizador",
		avatarSection: {
			title: "Foto de perfil",
			description: "Carregue uma foto de perfil para personalizar sua conta",
			uploadButton: "Carregar",
			changeButton: "Alterar",
			deleteButton: "Excluir",
			uploading: "Carregando...",
			deleting: "Excluindo...",
			hint: "Recomendado: Imagem quadrada, máx. 5MB",
			validation: {
				invalidFileType: "Por favor, selecione um arquivo de imagem válido",
				fileTooLarge: "O tamanho da imagem deve ser inferior a 5MB",
				uploadFailed: "Falha ao carregar o avatar",
				deleteFailed: "Falha ao excluir o avatar",
				readFailed: "Falha ao ler o arquivo de imagem",
			},
			toasts: {
				updated: "Avatar atualizado",
				updatedDesc: "Seu avatar foi atualizado com sucesso",
				deleted: "Avatar excluído",
				deletedDesc: "Seu avatar foi excluído com sucesso",
			},
		},
		usernameSection: {
			title: "Nome de utilizador",
			description:
				"Atualize o seu nome de utilizador. É assim que os outros o verão.",
			label: "Nome de utilizador",
			placeholder: "Introduza o seu nome de utilizador",
			hint: "3-20 caracteres. Apenas letras, números e sublinhados.",
			updateButton: "Atualizar",
			validation: {
				lengthError: "O nome de utilizador deve ter entre 3 e 20 caracteres",
				formatError:
					"O nome de utilizador só pode conter letras, números e sublinhados",
				alreadyTaken: "Nome de utilizador já em uso",
			},
		},
		passwordSection: {
			title: "Palavra-passe",
			description:
				"Altere a sua palavra-passe. Certifique-se de que tem pelo menos 8 caracteres.",
			currentPasswordLabel: "Palavra-passe",
			currentPasswordPlaceholder: "Introduza a sua palavra-passe atual",
			newPasswordLabel: "Nova palavra-passe",
			newPasswordPlaceholder: "Nova palavra-passe",
			confirmPasswordLabel: "Confirmação",
			confirmPasswordPlaceholder: "Nova palavra-passe",
			changeButton: "Alterar palavra-passe",
		},
		deleteSection: {
			title: "Eliminar conta",
			description: "Ação irreversível. Todos os seus dados serão eliminados.",
			dialogTitle: "Eliminar a sua conta",
			dialogDescription:
				"Ação irreversível. Todos os seus dados serão eliminados.",
			confirmationLabel: "Digite 'confirmar' para continuar",
			confirmationPlaceholder: "confirmar",
			deleteButton: "Eliminar conta",
			deleting: "A eliminar...",
			cancel: "Cancelar",
		},
		toasts: {
			usernameUpdated: "Nome de utilizador atualizado",
			usernameUpdatedDesc:
				"O seu nome de utilizador foi atualizado com sucesso.",
			passwordChanged: "Palavra-passe alterada",
			passwordChangedDesc: "A sua palavra-passe foi alterada com sucesso.",
			error: "Erro",
			passwordMismatch: "As novas palavras-passe não correspondem",
			updateFailed: "Falha ao atualizar o nome de utilizador",
			passwordChangeFailed: "Falha ao alterar a palavra-passe",
			accountDeleted: "Conta eliminada",
			accountDeletedDesc: "A sua conta foi eliminada com sucesso.",
			accountDeleteFailed: "Falha ao eliminar a conta",
		},
	},
	userProfile: {
		profile: "Perfil",
		publicWatchlists: "Listas públicas",
		publicWatchlist: "Lista pública",
		watchlists: "listas",
		watchlist: "lista",
		noPublicWatchlists: "Nenhuma lista publicada.",
		noPublicWatchlistsDescription:
			"Este utilizador ainda não publicou nenhuma lista pública.",
		loading: "A carregar perfil...",
		notFound: "Utilizador não encontrado",
		notFoundDescription:
			"O utilizador que procura não existe ou foi eliminado.",
		backToHome: "Voltar ao início",
	},
};
