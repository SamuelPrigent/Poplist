export interface Content {
	header: {
		appName: string;
		tagline: string;
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
		noWatchlists: string;
		noWatchlistsInCategory: string;
		noItemsYet: string;
		noItemsDescription: string;
		addToWatchlist: string;
		myWatchlists: string;
		followed: string;
		items: string;
		item: string;
		searchPlaceholder: string;
		noResults: string;
		startSearching: string;
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
			showMore: string;
			showLess: string;
			add: string;
		};
	};
	home: {
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
		popularWatchlists: {
			title: string;
			subtitle: string;
			seeMore: string;
			noWatchlists: string;
		};
		creators: {
			title: string;
			subtitle: string;
			seeMore: string;
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
	settings: {
		tabs: {
			display: string;
			preferences: string;
			account: string;
		};
		display: {
			backgroundColor: string;
			backgroundColorHint: string;
			ocean: string;
			midnight: string;
			listColumns: string;
			listColumnsHint: string;
			exploreColumns: string;
			exploreColumnsHint: string;
		};
		preferences: {
			language: string;
			handedness: string;
			handednessHint: string;
			leftHanded: string;
			rightHanded: string;
		};
	};
}
