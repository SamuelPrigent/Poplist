import type { Content } from "@/types/content";

export const es: Content = {
	// Header
	header: {
		appName: "WatchlistHub",
		home: "Inicio",
		explore: "Explorar",
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
		title: "Biblioteca",
		createWatchlist: "Nueva lista",
		createWatchlistDescription:
			"Crea una nueva lista para organizar tus películas y series.",
		notLoggedInWarning: "Datos locales",
		noWatchlists: "Aún no has creado ninguna lista.",
		myWatchlists: "Mis listas",
		followed: "Seguidas",
		noWatchlistsInCategory: "No hay listas en esta categoría",
		adjustFilters: "Ajusta los filtros para ver más listas",
		items: "elementos",
		item: "elemento",
		headerPublic: "Lista pública",
		headerPrivate: "Lista privada",
		public: "Público",
		private: "Privado",
		loading: "Cargando...",
		accountDataBadge: "Datos de la cuenta de usuario",
		preview: "Vista previa",
		categories: "Categorías / Etiquetas",
		categoriesDescription:
			"Selecciona una o más categorías para facilitar el descubrimiento de tu lista",
		genreCategories: "Categorías por género",
		platformCategories: "Plataformas de streaming",
		platformsDescription:
			"Selecciona las plataformas donde tu lista está disponible",
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
		tooltips: {
			share: "Compartir",
			save: "Añadir a la biblioteca",
			unsave: "Eliminar de la biblioteca",
			duplicate: "Duplicar en mi espacio",
			inviteCollaborator: "Invitar a un colaborador",
		},
		contextMenu: {
			addToWatchlist: "Añadir a una watchlist",
			removeFromWatchlist: "Eliminar de la watchlist",
			moveToFirst: "Mover a la primera posición",
			moveToLast: "Mover a la última posición",
		},
		collaborators: {
			addTitle: "Añadir Colaborador",
			addDescription:
				"Introduce el nombre de usuario para invitar a un colaborador",
			usernamePlaceholder: "Nombre de usuario",
			add: "Añadir",
			adding: "Añadiendo...",
			addSuccess: "Colaborador añadido correctamente",
			addError: "Error al añadir colaborador",
			currentTitle: "Colaboradores Actuales",
			remove: "Eliminar",
			removeSuccess: "Colaborador eliminado",
			removeError: "Error al eliminar colaborador",
			leaveTitle: "¿Salir de la watchlist?",
			leaveDescription:
				"¿Estás seguro de que quieres salir de esta watchlist? Perderás tus derechos de colaborador.",
			leave: "Salir",
			leaving: "Saliendo...",
			leaveSuccess: "Has salido de la watchlist",
			leaveError: "Error al salir de la watchlist",
		},
		addToWatchlist: "Añadir a una watchlist",
		noWatchlist: "Ninguna watchlist",
	},

	landing: {
		hero: {
			tagline: "Planifica, sigue y disfruta de tus películas juntos",
			title: "Crea y comparte listas de tus películas y series favoritas",
			subtitle:
				"Organiza tus noches de TV y comparte tus descubrimientos con tus amigos",
			cta: "Crear una watchlist",
		},
		features: {
			organize: {
				tagline: "Organización",
				title: "Creación de listas colaborativas",
				description:
					"Crea listas personales o colaborativas de películas y series.",
			},
			discover: {
				tagline: "Descubrimiento",
				title: "Descubre películas y series",
				description:
					"Utiliza la función de exploración para encontrar contenido que añadir a tus listas.",
			},
			share: {
				tagline: "Compartir",
				title: "Sigue las watchlists de la comunidad",
				description:
					"Añade las watchlists de otros usuarios a tu espacio personal.",
			},
		},
		startInSeconds: {
			title: "Comienza en segundos",
			subtitle: "Sin configuración complicada, solo tú y tu contenido favorito",
			step1: {
				title: "Crea tu watchlist",
				description:
					'Comienza con "Mis películas favoritas" o ponte nostálgico con "Películas de infancia".',
			},
			step2: {
				title: "Añade películas",
				description:
					"Busca una película o serie usando una palabra clave y añádela a tu watchlist actual.",
			},
			step3: {
				title: "Compártela con tus amigos",
				description:
					'Haz tus watchlists "públicas" y compártelas fácilmente con un enlace.',
			},
		},
		testimonials: {
			title: "Amado por los entusiastas",
			subtitle: "Únete a una comunidad de usuarios satisfechos",
			testimonial1: {
				text: "Aplicación perfecta para organizar mis watchlists. Interfaz clara e intuitiva.",
				author: "— Marie L.",
			},
			testimonial2: {
				text: "¡Muy práctico! Ayuda a mantener un registro de lo que hemos visto y lo que queremos recomendar.",
				author: "— Thomas D.",
			},
			testimonial3: {
				text: "Simple, efectivo, exactamente lo que buscaba para gestionar mis películas por ver.",
				author: "— Julie M.",
			},
		},
		finalCta: {
			title: "Comienza a crear tus watchlists fácilmente",
			subtitle:
				"Únete a WatchlistHub y organiza tu contenido favorito en unos pocos clics.",
			button: "Crear mi watchlist",
			disclaimer: "Aplicación gratuita • No se requiere tarjeta",
		},
	},

	// Home Page
	home: {
		hero: {
			title: "Tus Watchlists perfectamente organizadas",
			subtitle: "Tu universo del cine, organizado y compartido con amigos.",
			cta: "Crear una watchlist",
			ctaSecondary: "Saber más",
			pills: {
				organize: "Organiza tus películas",
				share: "Comparte con tus amigos",
				discover: "Descubre joyas",
			},
		},
		library: {
			title: "Biblioteca",
			subtitle: "Tus watchlists personales",
			seeAll: "Ver todo",
		},
		categories: {
			title: "Listas por categoría",
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
		platformsSection: {
			title: "Listas por plataforma",
			subtitle: "Tus plataformas favoritas",
			seeAll: "Ver todo",
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
		recommendations: {
			title: "Tendencias del momento",
			subtitle: "Los títulos que están de moda esta semana.",
			seeMore: "Ver todo",
		},
		communityWatchlists: {
			title: "Listas de la comunidad",
			subtitle: "Descubre colecciones compartidas por nuestros usuarios",
		},
	},

	explore: {
		title: "Explorar",
		subtitle: "Descubre nuevas listas compartidas por la comunidad",
		searchPlaceholder: "Buscar una lista...",
		filters: {
			all: "Todas",
			movies: "Películas",
			series: "Series",
			trending: "Tendencias",
			topRated: "Mejor valoradas",
			popular: "Populares",
			bestRated: "Mejor valoradas",
			yearMin: "Año mínimo",
			yearMax: "Año máximo",
			search: "Buscar...",
			noYearFound: "No se encontró ningún año.",
			clearYears: "Borrar años",
		},
		genres: {
			action: "Acción",
			adventure: "Aventura",
			animation: "Animación",
			comedy: "Comedia",
			crime: "Crimen",
			documentary: "Documental",
			drama: "Drama",
			family: "Familiar",
			fantasy: "Fantasía",
			horror: "Terror",
			romance: "Romance",
			scienceFiction: "Ciencia Ficción",
			thriller: "Thriller",
			actionAdventure: "Acción y Aventura",
			kids: "Niños",
			mystery: "Misterio",
			sciFiFantasy: "Ciencia Ficción y Fantasía",
			soap: "Telenovela",
			western: "Western",
		},
		sortBy: {
			label: "Ordenar por",
			popular: "Más populares",
			recentlyAdded: "Añadidas recientemente",
			mostItems: "Más elementos",
		},
		pagination: {
			pageOf: "Página {page} de {totalPages}",
		},
		noResults: "No se encontraron listas",
		noResultsDescription: "Intenta ajustar tus filtros o búsqueda",
	},

	categories: {
		title: "Categorías",
		subtitle: "Explora listas por tema",
		list: {
			movies: {
				name: "Películas",
				description: "Las mejores películas del momento",
			},
			series: { name: "Series", description: "Series que no te puedes perder" },
			netflix: { name: "Netflix", description: "Joyas de Netflix" },
			"prime-video": {
				name: "Prime Video",
				description: "Exclusivas de Amazon Prime",
			},
			"disney-plus": {
				name: "Disney+",
				description: "El universo Disney, Pixar, Marvel y Star Wars",
			},
			"apple-tv": {
				name: "Apple TV+",
				description: "Producciones originales de Apple TV+",
			},
			crunchyroll: {
				name: "Crunchyroll",
				description: "Los mejores animes en streaming",
			},
			"hbo-max": {
				name: "HBO Max",
				description: "Series y películas de HBO",
			},
			youtube: {
				name: "YouTube",
				description: "Películas y series disponibles en YouTube",
			},
			"canal-plus": {
				name: "Canal+",
				description: "Programas de Canal+",
			},
			ocs: {
				name: "OCS",
				description: "Lo mejor del cine y las series",
			},
			"paramount-plus": {
				name: "Paramount+",
				description: "Producciones de Paramount+",
			},
			"rakuten-tv": {
				name: "Rakuten TV",
				description: "Películas y series en Rakuten TV",
			},
			anime: {
				name: "Animación",
				description:
					"Las mejores series animadas y películas de manga adaptadas",
			},
			action: {
				name: "Acción",
				description: "Clásicos y nuevas películas de acción",
			},
			documentaries: {
				name: "Documentales",
				description: "Documentales cautivadores y educativos",
			},
			enfant: {
				name: "Infantil",
				description: "Películas y series para niños",
			},
			jeunesse: {
				name: "Juvenil",
				description: "Películas y series para adolescentes y adultos jóvenes",
			},
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
		avatarSection: {
			title: "Foto de perfil",
			description: "Sube una foto de perfil para personalizar tu cuenta",
			uploadButton: "Subir",
			changeButton: "Cambiar",
			deleteButton: "Eliminar",
			uploading: "Subiendo...",
			deleting: "Eliminando...",
			hint: "Recomendado: Imagen cuadrada, máx. 5MB",
			validation: {
				invalidFileType: "Por favor, selecciona un archivo de imagen válido",
				fileTooLarge: "El tamaño de la imagen debe ser inferior a 5MB",
				uploadFailed: "Error al subir el avatar",
				deleteFailed: "Error al eliminar el avatar",
				readFailed: "Error al leer el archivo de imagen",
			},
			toasts: {
				updated: "Avatar actualizado",
				updatedDesc: "Tu avatar se ha actualizado correctamente",
				deleted: "Avatar eliminado",
				deletedDesc: "Tu avatar se ha eliminado correctamente",
			},
		},
		usernameSection: {
			title: "Nombre de usuario",
			description:
				"Actualiza tu nombre de usuario. Así es como te verán los demás.",
			label: "Nombre de usuario",
			placeholder: "Introduce tu nombre de usuario",
			hint: "3-20 caracteres. Solo letras, números y guiones bajos.",
			updateButton: "Actualizar",
			validation: {
				lengthError: "El nombre de usuario debe tener entre 3 y 20 caracteres",
				formatError:
					"El nombre de usuario solo puede contener letras, números y guiones bajos",
				alreadyTaken: "El nombre de usuario ya está en uso",
			},
		},
		passwordSection: {
			title: "Contraseña",
			description:
				"Cambia tu contraseña. Asegúrate de que tenga al menos 8 caracteres.",
			currentPasswordLabel: "Contraseña",
			currentPasswordPlaceholder: "Introduce tu contraseña actual",
			newPasswordLabel: "Nueva contraseña",
			newPasswordPlaceholder: "Nueva contraseña",
			confirmPasswordLabel: "Confirmación",
			confirmPasswordPlaceholder: "Nueva contraseña",
			changeButton: "Cambiar contraseña",
		},
		deleteSection: {
			title: "Eliminar cuenta",
			description: "Acción irreversible. Todos tus datos serán eliminados.",
			dialogTitle: "Eliminar tu cuenta",
			dialogDescription:
				"Acción irreversible. Todos tus datos serán eliminados.",
			confirmationLabel: "Escribe 'confirmar' para continuar",
			confirmationPlaceholder: "confirmar",
			deleteButton: "Eliminar cuenta",
			deleting: "Eliminando...",
			cancel: "Cancelar",
		},
		toasts: {
			usernameUpdated: "Nombre de usuario actualizado",
			usernameUpdatedDesc:
				"Tu nombre de usuario se ha actualizado correctamente.",
			passwordChanged: "Contraseña cambiada",
			passwordChangedDesc: "Tu contraseña se ha cambiado correctamente.",
			error: "Error",
			passwordMismatch: "Las nuevas contraseñas no coinciden",
			updateFailed: "Error al actualizar el nombre de usuario",
			passwordChangeFailed: "Error al cambiar la contraseña",
			accountDeleted: "Cuenta eliminada",
			accountDeletedDesc: "Tu cuenta ha sido eliminada correctamente.",
			accountDeleteFailed: "Error al eliminar la cuenta",
		},
	},
	userProfile: {
		profile: "Profile",
		publicWatchlists: "Public Playlists",
		watchlists: "watchlists",
		watchlist: "watchlist",
		noPublicWatchlists: "No watchlists published.",
		noPublicWatchlistsDescription:
			"This user hasn't published any public watchlists yet.",
		loading: "Loading profile...",
		notFound: "User not found",
		notFoundDescription:
			"The user you're looking for doesn't exist or has been deleted.",
		backToHome: "Back to home",
	},
};
