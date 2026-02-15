export interface Content {
	header: {
		appName: string;
		home: string;
		explore: string;
		login: string;
		signup: string;
		logout: string;
	};
	auth: {
		loginTitle: string;
		loginDescription: string;
		signupTitle: string;
		signupDescription: string;
		continueWithGoogle: string;
		or: string;
		email: string;
		emailPlaceholder: string;
		password: string;
		passwordPlaceholder: string;
		processing: string;
		dontHaveAccount: string;
		alreadyHaveAccount: string;
	};
	watchlists: {
		title: string;
		createWatchlist: string;
		createWatchlistDescription: string;
		notLoggedInWarning: string;
		noWatchlists: string;
		myWatchlists: string;
		followed: string;
		noWatchlistsInCategory: string;
		adjustFilters: string;
		items: string;
		item: string;
		headerPublic: string;
		headerPrivate: string;
		public: string;
		private: string;
		loading: string;
		accountDataBadge: string;
		preview: string;
		categories: string;
		categoriesDescription: string;
		genreCategories: string;
		platformCategories: string;
		platformsDescription: string;
		name: string;
		namePlaceholder: string;
		description: string;
		descriptionPlaceholder: string;
		coverImage: string;
		uploadImage: string;
		changeImage: string;
		imageUploadHint: string;
		makePublic: string;
		cancel: string;
		create: string;
		creating: string;
		back: string;
		noItemsYet: string;
		noItemsDescription: string;
		edit: string;
		editWatchlist: string;
		editWatchlistDescription: string;
		deleteWatchlist: string;
		deleteWatchlistConfirm: string;
		deleteWatchlistWarning: string;
		saving: string;
		save: string;
		deleting: string;
		delete: string;
		addItem: string;
		searchMoviesAndSeries: string;
		searchPlaceholder: string;
		searching: string;
		noResults: string;
		startSearching: string;
		add: string;
		added: string;
		inWatchlist: string;
		tableHeaders: {
			number: string;
			title: string;
			type: string;
			platforms: string;
			duration: string;
		};
		contentTypes: {
			movie: string;
			series: string;
		};
		seriesInfo: {
			season: string;
			seasons: string;
			episodes: string;
		};
		itemDetails: {
			loading: string;
			error: string;
			mediaDetails: string;
			fullDetailsFor: string;
			loadingDetails: string;
			notAvailable: string;
			votes: string;
			synopsis: string;
			director: string;
			creator: string;
			availableOn: string;
			mainCast: string;
			seeMore: string;
		};
		tooltips: {
			share: string;
			save: string;
			unsave: string;
			duplicate: string;
			inviteCollaborator: string;
		};
		contextMenu: {
			addToWatchlist: string;
			removeFromWatchlist: string;
			moveToFirst: string;
			moveToLast: string;
		};
		collaborators: {
			addTitle: string;
			addDescription: string;
			usernamePlaceholder: string;
			add: string;
			adding: string;
			addSuccess: string;
			addError: string;
			currentTitle: string;
			remove: string;
			removeSuccess: string;
			removeError: string;
			leaveTitle: string;
			leaveDescription: string;
			leave: string;
			leaving: string;
			leaveSuccess: string;
			leaveError: string;
		};
		addToWatchlist: string;
		noWatchlist: string;
		offlinePopover: {
			title: string;
			accessEverywhere: string;
			collaborativeLists: string;
			shareWithFriends: string;
			signup: string;
		};
		toasts?: {
			linkCopied: string;
			linkCopyError: string;
			listSaved: string;
			listUnsaved: string;
			listSaveError: string;
			duplicating: string;
			listDuplicated: string;
			duplicateError: string;
		};
	};
	landing: {
		hero: {
			tagline: string;
			title: string;
			subtitle: string;
			cta: string;
		};
		features: {
			sectionTitle: string;
			sectionSubtitle: string;
			organize: {
				tagline: string;
				title: string;
				description: string;
			};
			collaborate: {
				tagline: string;
				title: string;
				description: string;
			};
			share: {
				tagline: string;
				title: string;
				description: string;
			};
			discover: {
				tagline: string;
				title: string;
				description: string;
			};
		};
		startInSeconds: {
			title: string;
			subtitle: string;
			step1: {
				title: string;
				description: string;
			};
			step2: {
				title: string;
				description: string;
			};
			step3: {
				title: string;
				description: string;
			};
		};
		testimonials: {
			title: string;
			subtitle: string;
			testimonial1: {
				text: string;
				author: string;
				pseudo: string;
			};
			testimonial2: {
				text: string;
				author: string;
				pseudo: string;
			};
			testimonial3: {
				text: string;
				author: string;
				pseudo: string;
			};
		};
		finalCta: {
			title: string;
			subtitle: string;
			button: string;
			disclaimer: string;
		};
	};
	home: {
		hero: {
			title: string;
			subtitle: string;
			cta: string;
			ctaSecondary: string;
			pills: {
				organize: string;
				share: string;
				discover: string;
			};
		};
		library: {
			title: string;
			subtitle: string;
			seeAll: string;
		};
		categories: {
			title: string;
			subtitle: string;
			seeMore: string;
			items: {
				movies: {
					title: string;
					description: string;
				};
				series: {
					title: string;
					description: string;
				};
				netflix: {
					title: string;
					description: string;
				};
				primeVideo: {
					title: string;
					description: string;
				};
				disneyPlus: {
					title: string;
					description: string;
				};
				crunchyroll: {
					title: string;
					description: string;
				};
				netflixChill: {
					title: string;
					description: string;
				};
				films2010s: {
					title: string;
					description: string;
				};
				childhood: {
					title: string;
					description: string;
				};
				comedy: {
					title: string;
					description: string;
				};
				action: {
					title: string;
					description: string;
				};
				anime: {
					title: string;
					description: string;
				};
			};
		};
		platformsSection: {
			title: string;
			subtitle: string;
			seeAll: string;
		};
		popularWatchlists: {
			title: string;
			subtitle: string;
			seeMore: string;
			noWatchlists: string;
		};
		faq: {
			title: string;
			subtitle: string;
			questions: {
				privateWatchlists: {
					question: string;
					answer: string;
				};
				pricing: {
					question: string;
					answer: string;
				};
				exploreSection: {
					question: string;
					answer: string;
				};
				whatMakesDifferent: {
					question: string;
					answer: string;
				};
				streaming: {
					question: string;
					answer: string;
				};
			};
		};
		trending: {
			title: string;
			noImage: string;
		};
		recommendations: {
			title: string;
			subtitle: string;
			seeMore: string;
		};
		creators: {
			title: string;
			subtitle: string;
			seeMore: string;
		};
		communityWatchlists: {
			title: string;
			subtitle: string;
		};
	};
	explore: {
		title: string;
		subtitle: string;
		searchPlaceholder: string;
		filters: {
			all: string;
			movies: string;
			series: string;
			trending: string;
			topRated: string;
			popular: string;
			bestRated: string;
			yearMin: string;
			yearMax: string;
			search: string;
			noYearFound: string;
			clearYears: string;
		};
		genres: {
			action: string;
			adventure: string;
			animation: string;
			comedy: string;
			crime: string;
			documentary: string;
			drama: string;
			family: string;
			fantasy: string;
			horror: string;
			romance: string;
			scienceFiction: string;
			thriller: string;
			actionAdventure: string;
			kids: string;
			mystery: string;
			sciFiFantasy: string;
			soap: string;
			western: string;
		};
		sortBy: {
			label: string;
			popular: string;
			recentlyAdded: string;
			mostItems: string;
		};
		pagination: {
			pageOf: string;
		};
		noResults: string;
		noResultsDescription: string;
	};
	categories: {
		title: string;
		subtitle: string;
		list: {
			movies: { name: string; description: string };
			series: { name: string; description: string };
			netflix: { name: string; description: string };
			"prime-video": { name: string; description: string };
			"disney-plus": { name: string; description: string };
			"apple-tv": { name: string; description: string };
			crunchyroll: { name: string; description: string };
			"hbo-max": { name: string; description: string };
			youtube: { name: string; description: string };
			"canal-plus": { name: string; description: string };
			ocs: { name: string; description: string };
			"paramount-plus": { name: string; description: string };
			"rakuten-tv": { name: string; description: string };
			anime: { name: string; description: string };
			action: { name: string; description: string };
			documentaries: { name: string; description: string };
			enfant: { name: string; description: string };
			jeunesse: { name: string; description: string };
		};
	};
	footer: {
		appName: string;
		language: string;
	};
	profile: {
		title: string;
		subtitle: string;
		userInformation: string;
		avatarSection: {
			title: string;
			description: string;
			uploadButton: string;
			changeButton: string;
			deleteButton: string;
			uploading: string;
			deleting: string;
			hint: string;
			validation: {
				invalidFileType: string;
				fileTooLarge: string;
				uploadFailed: string;
				deleteFailed: string;
				readFailed: string;
			};
			toasts: {
				updated: string;
				updatedDesc: string;
				deleted: string;
				deletedDesc: string;
			};
		};
		usernameSection: {
			title: string;
			description: string;
			label: string;
			placeholder: string;
			hint: string;
			updateButton: string;
			validation: {
				lengthError: string;
				formatError: string;
				alreadyTaken: string;
			};
		};
		passwordSection: {
			title: string;
			description: string;
			currentPasswordLabel: string;
			currentPasswordPlaceholder: string;
			newPasswordLabel: string;
			newPasswordPlaceholder: string;
			confirmPasswordLabel: string;
			confirmPasswordPlaceholder: string;
			changeButton: string;
		};
		deleteSection: {
			title: string;
			description: string;
			dialogTitle: string;
			dialogDescription: string;
			confirmationLabel: string;
			confirmationPlaceholder: string;
			deleteButton: string;
			deleting: string;
			cancel: string;
		};
		themeSection: {
			title: string;
			description: string;
			ocean: string;
			oceanDescription: string;
			midnight: string;
			midnightDescription: string;
		};
		toasts: {
			usernameUpdated: string;
			usernameUpdatedDesc: string;
			passwordChanged: string;
			passwordChangedDesc: string;
			accountDeleted: string;
			accountDeletedDesc: string;
			error: string;
			passwordMismatch: string;
			updateFailed: string;
			passwordChangeFailed: string;
			accountDeleteFailed: string;
		};
	};
	userProfile: {
		profile: string;
		publicWatchlists: string;
		publicWatchlist: string;
		watchlists: string;
		watchlist: string;
		noPublicWatchlists: string;
		noPublicWatchlistsDescription: string;
		loading: string;
		notFound: string;
		notFoundDescription: string;
		backToHome: string;
	};
}
