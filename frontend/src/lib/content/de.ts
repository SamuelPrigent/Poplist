import type { Content } from "@/types/content";

export const de: Content = {
	// Header
	header: {
		appName: "Poplist",
		home: "Startseite",
		explore: "Erkunden",
		login: "Anmelden",
		signup: "Registrieren",
		logout: "Abmelden",
	},

	// Auth Drawer
	auth: {
		loginTitle: "Anmelden",
		loginDescription:
			"Willkommen zurück! Melden Sie sich an, um auf Ihre Listen zuzugreifen.",
		signupTitle: "Registrieren",
		signupDescription: "Erstellen Sie ein Konto, um Ihre Listen zu speichern.",
		continueWithGoogle: "Mit Google fortfahren",
		or: "Oder",
		email: "E-Mail",
		emailPlaceholder: "ihre@email.de",
		password: "Passwort",
		passwordPlaceholder: "••••••••",
		processing: "Wird verarbeitet...",
		dontHaveAccount: "Noch kein Konto?",
		alreadyHaveAccount: "Bereits ein Konto?",
	},

	// Watchlists Page
	watchlists: {
		title: "Bibliothek",
		createWatchlist: "Neue Liste",
		createWatchlistDescription:
			"Erstellen Sie eine neue Liste, um Ihre Filme und Serien zu organisieren.",
		notLoggedInWarning: "Lokale Daten",
		noWatchlists: "Sie haben noch keine Listen erstellt.",
		myWatchlists: "Meine Listen",
		followed: "Gefolgt",
		noWatchlistsInCategory: "Keine Listen in dieser Kategorie",
		adjustFilters: "Passen Sie die Filter an, um mehr Listen zu sehen",
		items: "Elemente",
		item: "Element",
		headerPublic: "Öffentliche liste",
		headerPrivate: "Private liste",
		public: "Öffentlich",
		private: "Privat",
		loading: "Lädt...",
		accountDataBadge: "Benutzerkontodaten",
		preview: "Vorschau",
		categories: "Kategorien / Tags",
		categoriesDescription:
			"Wählen Sie eine oder mehrere Kategorien aus, um Ihre Liste leichter auffindbar zu machen",
		genreCategories: "Genre-Kategorien",
		platformCategories: "Streaming-Plattformen",
		platformsDescription:
			"Wählen Sie die Plattformen aus, auf denen Ihre Liste verfügbar ist",
		name: "Name",
		namePlaceholder: "Meine Liste",
		description: "Beschreibung",
		descriptionPlaceholder: "Beschreibung Ihrer Liste",
		coverImage: "Titelbild",
		uploadImage: "Bild hochladen",
		changeImage: "Bild ändern",
		imageUploadHint: "PNG, JPG oder WEBP (max. 5MB)",
		makePublic: "Öffentlich machen",
		cancel: "Abbrechen",
		create: "Erstellen",
		creating: "Wird erstellt...",
		back: "Zurück",
		noItemsYet: "Noch keine Elemente",
		noItemsDescription:
			"Beginnen Sie damit, Filme und Serien zu Ihrer Liste hinzuzufügen, um Ihre Warteschlange zu organisieren.",
		edit: "Bearbeiten",
		editWatchlist: "Liste bearbeiten",
		editWatchlistDescription: "Bearbeiten Sie die Informationen Ihrer Liste.",
		deleteWatchlist: "Liste löschen",
		deleteWatchlistConfirm:
			'Möchten Sie "{name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
		deleteWatchlistWarning:
			"Diese Liste enthält {count} Element(e), die ebenfalls gelöscht werden.",
		saving: "Wird gespeichert...",
		save: "Speichern",
		deleting: "Wird gelöscht...",
		delete: "Löschen",
		addItem: "Hinzufügen",
		searchMoviesAndSeries:
			"Suchen und fügen Sie Filme oder Serien zu Ihrer Liste hinzu",
		searchPlaceholder: "Nach einem Film oder einer Serie suchen...",
		searching: "Sucht...",
		noResults: "Keine Ergebnisse gefunden",
		startSearching:
			"Beginnen Sie mit der Eingabe, um nach Filmen und Serien zu suchen",
		add: "Hinzufügen",
		added: "Hinzugefügt",
		inWatchlist: "In Liste",
		// Table headers
		tableHeaders: {
			number: "#",
			title: "Titel",
			type: "Typ",
			platforms: "Plattformen",
			duration: "Dauer",
		},
		// Content types
		contentTypes: {
			movie: "Film",
			series: "Serie",
		},
		// Series info
		seriesInfo: {
			season: "Staffel",
			seasons: "Staffeln",
			episodes: "Episoden",
		},
		// Item Details Modal
		itemDetails: {
			loading: "Lädt...",
			error: "Fehler beim Laden der Details",
			mediaDetails: "Mediendetails",
			fullDetailsFor: "Vollständige Details für",
			loadingDetails: "Details werden geladen",
			notAvailable: "N/V",
			votes: "Stimmen",
			synopsis: "Zusammenfassung",
			director: "Regisseur",
			creator: "Schöpfer",
			availableOn: "Verfügbar auf",
			mainCast: "Hauptbesetzung",
			seeMore: "Mehr sehen",
		},
		tooltips: {
			share: "Teilen",
			save: "Zur Bibliothek hinzufügen",
			unsave: "Aus Bibliothek entfernen",
			duplicate: "In meinen Bereich duplizieren",
			inviteCollaborator: "Mitarbeiter einladen",
		},
		contextMenu: {
			addToWatchlist: "Zu Liste hinzufügen",
			removeFromWatchlist: "Aus Liste entfernen",
			moveToFirst: "An erste Position verschieben",
			moveToLast: "An letzte Position verschieben",
		},
		collaborators: {
			addTitle: "Mitarbeiter hinzufügen",
			addDescription: "Benutzername eingeben, um einen Mitarbeiter einzuladen",
			usernamePlaceholder: "Benutzername",
			add: "Hinzufügen",
			adding: "Wird hinzugefügt...",
			addSuccess: "Mitarbeiter erfolgreich hinzugefügt",
			addError: "Mitarbeiter konnte nicht hinzugefügt werden",
			currentTitle: "Aktuelle Mitarbeiter",
			remove: "Entfernen",
			removeSuccess: "Mitarbeiter entfernt",
			removeError: "Mitarbeiter konnte nicht entfernt werden",
			leaveTitle: "Liste verlassen?",
			leaveDescription:
				"Möchten Sie diese Liste wirklich verlassen? Sie verlieren Ihre Mitarbeiterrechte.",
			leave: "Verlassen",
			leaving: "Wird verlassen...",
			leaveSuccess: "Sie haben die Liste verlassen",
			leaveError: "Liste konnte nicht verlassen werden",
		},
		addToWatchlist: "Zu einer Liste hinzufügen",
		noWatchlist: "Keine Liste",
		offlinePopover: {
			title: "Warum registrieren?",
			accessEverywhere: "Greifen Sie überall auf Ihre Listen zu",
			collaborativeLists: "Erstellen Sie kollaborative Listen",
			shareWithFriends: "Teilen Sie Ihre Listen mit Freunden",
			signup: "Registrieren",
		},
	},

	landing: {
		hero: {
			tagline: "Planen, verfolgen und genießen Sie Ihre Filme gemeinsam",
			title: "Erstellen und teilen Sie Listen Ihrer Lieblingsfilme und -serien",
			subtitle:
				"Organisieren Sie Ihre TV-Abende und teilen Sie Ihre Entdeckungen mit Ihren Freunden",
			cta: "Liste erstellen",
		},
		features: {
			organize: {
				tagline: "Organisation",
				title: "Erstellung kollaborativer Listen",
				description:
					"Erstellen Sie persönliche oder kollaborative Listen von Filmen und Serien.",
			},
			discover: {
				tagline: "Entdeckung",
				title: "Filme und Serien entdecken",
				description:
					"Nutzen Sie die Erkundungsfunktion, um Inhalte zu finden, die Sie Ihren Listen hinzufügen können.",
			},
			share: {
				tagline: "Teilen",
				title: "Folgen Sie Community-Listen",
				description:
					"Fügen Sie die Listen anderer Benutzer zu Ihrem persönlichen Bereich hinzu.",
			},
		},
		startInSeconds: {
			title: "In Sekunden starten",
			subtitle:
				"Keine komplizierte Einrichtung, nur Sie und Ihre Lieblingsinhalte",
			step1: {
				title: "Erstellen Sie Ihre Liste",
				description:
					'Beginnen Sie mit "Meine Lieblingsfilme" oder werden Sie nostalgisch mit "Kindheitsfilme".',
			},
			step2: {
				title: "Filme hinzufügen",
				description:
					"Suchen Sie mit einem Stichwort nach einem Film oder einer Serie und fügen Sie ihn zu Ihrer aktuellen Liste hinzu.",
			},
			step3: {
				title: "Mit Freunden teilen",
				description:
					'Machen Sie Ihre Listen "öffentlich" und teilen Sie sie einfach mit einem Link.',
			},
		},
		testimonials: {
			title: "Beliebt bei Enthusiasten",
			subtitle: "Treten Sie einer Gemeinschaft zufriedener Nutzer bei",
			testimonial1: {
				text: "Perfekte App zum Organisieren meiner Listen. Klare und intuitive Benutzeroberfläche.",
				author: "— Marie L.",
			},
			testimonial2: {
				text: "Sehr praktisch! Hilft dabei, den Überblick zu behalten, was wir gesehen haben und was wir empfehlen möchten.",
				author: "— Thomas D.",
			},
			testimonial3: {
				text: "Einfach, effektiv, genau das, was ich gesucht habe, um meine zu sehenden Filme zu verwalten.",
				author: "— Julie M.",
			},
		},
		finalCta: {
			title: "Beginnen Sie einfach mit der Erstellung Ihrer Listen",
			subtitle:
				"Treten Sie Poplist bei und organisieren Sie Ihre Lieblingsinhalte mit nur wenigen Klicks.",
			button: "Meine Liste erstellen",
			disclaimer: "Kostenlose Anwendung • Keine Karte erforderlich",
		},
	},

	// Home Page
	home: {
		hero: {
			title: "Ihre Listen perfekt organisiert",
			subtitle: "Ihr Film-Universum, organisiert und mit Freunden geteilt.",
			cta: "Liste erstellen",
			ctaSecondary: "Mehr erfahren",
			pills: {
				organize: "Organisieren Sie Ihre Filme",
				share: "Mit Freunden teilen",
				discover: "Entdecken Sie Perlen",
			},
		},
		library: {
			title: "Bibliothek",
			subtitle: "Ihre persönlichen Listen",
			seeAll: "Alle anzeigen",
		},
		categories: {
			title: "Listen nach Kategorie",
			subtitle: "Poplist-Auswahl",
			seeMore: "Mehr sehen",
			items: {
				// Zeile 1 - Nach Typ und Plattform
				movies: {
					title: "Filme",
					description: "Filmauswahl",
				},
				series: {
					title: "Serien",
					description: "Serienauswahl",
				},
				netflix: {
					title: "Netflix only",
					description: "Exklusiv auf Netflix",
				},
				primeVideo: {
					title: "Prime Video only",
					description: "Exklusiv auf Prime Video",
				},
				disneyPlus: {
					title: "Disney+ only",
					description: "Exklusiv auf Disney+",
				},
				crunchyroll: {
					title: "Crunchyroll only",
					description: "Exklusiv auf Crunchyroll",
				},
				// Zeile 2 - Nach Genre und Thema
				netflixChill: {
					title: "Netflix & Chill",
					description: "Beliebte Filme zum Zusammenschauen",
				},
				films2010s: {
					title: "Filme 2010–2020",
					description: "Moderne Must-Sees",
				},
				childhood: {
					title: "Kindheitsklassiker",
					description: "Jugendfilme und Nostalgie",
				},
				comedy: {
					title: "Komödie",
					description: "Zum Lachen und Entspannen",
				},
				action: {
					title: "Action",
					description: "Actionfilme und Blockbuster",
				},
				anime: {
					title: "Anime",
					description: "Japanische Animationsserien",
				},
			},
		},
		platformsSection: {
			title: "Listen nach Plattform",
			subtitle: "Ihre Lieblingsplattformen",
			seeAll: "Alle anzeigen",
		},
		popularWatchlists: {
			title: "Beliebte Listen",
			subtitle: "Von der Community geteilt",
			seeMore: "Mehr sehen",
			noWatchlists: "Momentan keine öffentlichen Listen",
		},
		faq: {
			title: "Häufig gestellte Fragen",
			subtitle: "Alles, was Sie wissen müssen, um loszulegen",
			questions: {
				privateWatchlists: {
					question: "Wie funktionieren private Listen?",
					answer:
						"Private Listen ermöglichen es Ihnen, Ihre Auswahl für sich zu behalten. Sie sind nur für Sie sichtbar und können nicht mit anderen Benutzern geteilt werden. Sie können jederzeit in den Einstellungen Ihrer Liste zwischen privat und öffentlich wechseln.",
				},
				pricing: {
					question: "Ist die Nutzung kostenlos?",
					answer:
						"Ja, die App ist völlig kostenlos! Sie können so viele Listen erstellen, wie Sie möchten, sie mit Ihren Freunden teilen und Tausende von Filmen und Serien ohne Gebühren erkunden.",
				},
				exploreSection: {
					question: "Wofür ist der Bereich Erkunden?",
					answer:
						"Der Bereich Erkunden ermöglicht es Ihnen, neue Inhalte zu entdecken, indem Sie aktuelle Trends, die beliebtesten oder am besten bewerteten Filme und Serien durchsuchen. Sie können nach Genre filtern, um genau das zu finden, was Sie suchen, und Elemente direkt zu Ihren Listen hinzufügen.",
				},
				whatMakesDifferent: {
					question: "Was macht diese App anders?",
					answer:
						"Diese Anwendung zielt darauf ab, einfach zu bleiben mit wenigen Funktionen und Seiten, um klar und einfach zu bedienen zu sein. Die Erfahrung soll natürlich und intuitiv sein, ohne unnötige Komplexität. Wir konzentrieren uns auf das Wesentliche: Ihre Lieblingsfilme und -serien organisieren und teilen.",
				},
				streaming: {
					question: "Kann ich Serien oder Filme ansehen?",
					answer:
						"Nein, der Zweck dieser Anwendung ist nicht das Streaming, sondern das einfache Teilen von Inhalten, die Ihnen auf Ihren Lieblingsplattformen gefallen haben. Wir helfen Ihnen, zu organisieren, was Sie sehen möchten, und es mit Ihrer Community zu teilen, aber um den Inhalt anzusehen, müssen Sie zu den entsprechenden Streaming-Plattformen gehen.",
				},
			},
		},
		trending: {
			title: "Heute im Trend",
			noImage: "Kein Bild",
		},
		recommendations: {
			title: "Gerade im Trend",
			subtitle: "Die angesagtesten Titel dieser Woche.",
			seeMore: "Alle anzeigen",
		},
		communityWatchlists: {
			title: "Community-Listen",
			subtitle: "Entdecken Sie von unseren Nutzern geteilte Sammlungen",
		},
	},

	explore: {
		title: "Erkunden",
		subtitle: "Entdecken Sie neue Listen, die von der Community geteilt werden",
		searchPlaceholder: "Nach einer Liste suchen...",
		filters: {
			all: "Alle",
			movies: "Filme",
			series: "Serien",
			trending: "Trends",
			topRated: "Am besten bewertet",
			popular: "Beliebt",
			bestRated: "Am besten bewertet",
			yearMin: "Mindestjahr",
			yearMax: "Maximaljahr",
			search: "Suchen...",
			noYearFound: "Kein Jahr gefunden.",
			clearYears: "Jahre löschen",
		},
		genres: {
			action: "Action",
			adventure: "Abenteuer",
			animation: "Animation",
			comedy: "Komödie",
			crime: "Krimi",
			documentary: "Dokumentarfilm",
			drama: "Drama",
			family: "Familie",
			fantasy: "Fantasy",
			horror: "Horror",
			romance: "Romantik",
			scienceFiction: "Science-Fiction",
			thriller: "Thriller",
			actionAdventure: "Action & Abenteuer",
			kids: "Kinder",
			mystery: "Mystery",
			sciFiFantasy: "Sci-Fi & Fantasy",
			soap: "Seifenoper",
			western: "Western",
		},
		sortBy: {
			label: "Sortieren nach",
			popular: "Am beliebtesten",
			recentlyAdded: "Kürzlich hinzugefügt",
			mostItems: "Meiste Elemente",
		},
		pagination: {
			pageOf: "Seite {page} von {totalPages}",
		},
		noResults: "Keine Listen gefunden",
		noResultsDescription: "Versuchen Sie, Ihre Filter oder Suche anzupassen",
	},

	categories: {
		title: "Kategorien",
		subtitle: "Erkunden Sie Listen nach Thema",
		list: {
			movies: { name: "Filme", description: "Die besten Filme des Moments" },
			series: {
				name: "Serien",
				description: "Serien, die Sie nicht verpassen sollten",
			},
			netflix: { name: "Netflix", description: "Netflix-Perlen" },
			"prime-video": {
				name: "Prime Video",
				description: "Amazon Prime Exklusivtitel",
			},
			"disney-plus": {
				name: "Disney+",
				description: "Das Disney-, Pixar-, Marvel- und Star Wars-Universum",
			},
			"apple-tv": {
				name: "Apple TV+",
				description: "Apple TV+ Originalproduktionen",
			},
			crunchyroll: {
				name: "Crunchyroll",
				description: "Die besten Anime-Streams",
			},
			"hbo-max": {
				name: "HBO Max",
				description: "HBO-Serien und -Filme",
			},
			youtube: {
				name: "YouTube",
				description: "Auf YouTube verfügbare Filme und Serien",
			},
			"canal-plus": {
				name: "Canal+",
				description: "Canal+ Programme",
			},
			ocs: {
				name: "OCS",
				description: "Das Beste aus Kino und Serien",
			},
			"paramount-plus": {
				name: "Paramount+",
				description: "Paramount+ Produktionen",
			},
			"rakuten-tv": {
				name: "Rakuten TV",
				description: "Filme und Serien auf Rakuten TV",
			},
			anime: {
				name: "Animation",
				description: "Die besten Animationsserien und adaptierten Manga-Filme",
			},
			action: { name: "Action", description: "Klassiker und neue Actionfilme" },
			documentaries: {
				name: "Dokumentarfilme",
				description: "Fesselnde und lehrreiche Dokumentarfilme",
			},
			enfant: { name: "Kinder", description: "Filme und Serien für Kinder" },
			jeunesse: {
				name: "Jugend",
				description: "Filme und Serien für Jugendliche und junge Erwachsene",
			},
		},
	},

	// Footer
	footer: {
		appName: "Poplist",
		language: "Sprache",
	},

	// Profile Page
	profile: {
		title: "Profileinstellungen",
		subtitle: "Verwalten Sie Ihre Kontoeinstellungen und Präferenzen",
		userInformation: "Benutzerinformationen",
		avatarSection: {
			title: "Profilbild",
			description:
				"Laden Sie ein Profilbild hoch, um Ihr Konto zu personalisieren",
			uploadButton: "Hochladen",
			changeButton: "Ändern",
			deleteButton: "Löschen",
			uploading: "Wird hochgeladen...",
			deleting: "Wird gelöscht...",
			hint: "Empfohlen: Quadratisches Bild, max. 5MB",
			validation: {
				invalidFileType: "Bitte wählen Sie eine gültige Bilddatei",
				fileTooLarge: "Die Bildgröße muss weniger als 5MB betragen",
				uploadFailed: "Fehler beim Hochladen des Avatars",
				deleteFailed: "Fehler beim Löschen des Avatars",
				readFailed: "Fehler beim Lesen der Bilddatei",
			},
			toasts: {
				updated: "Avatar aktualisiert",
				updatedDesc: "Ihr Avatar wurde erfolgreich aktualisiert",
				deleted: "Avatar gelöscht",
				deletedDesc: "Ihr Avatar wurde erfolgreich gelöscht",
			},
		},
		usernameSection: {
			title: "Benutzername",
			description:
				"Aktualisieren Sie Ihren Benutzernamen. So werden Sie von anderen gesehen.",
			label: "Benutzername",
			placeholder: "Geben Sie Ihren Benutzernamen ein",
			hint: "3-20 Zeichen. Nur Buchstaben, Zahlen und Unterstriche.",
			updateButton: "Aktualisieren",
			validation: {
				lengthError: "Benutzername muss zwischen 3 und 20 Zeichen lang sein",
				formatError:
					"Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten",
				alreadyTaken: "Benutzername bereits vergeben",
			},
		},
		passwordSection: {
			title: "Passwort",
			description:
				"Ändern Sie Ihr Passwort. Stellen Sie sicher, dass es mindestens 8 Zeichen lang ist.",
			currentPasswordLabel: "Passwort",
			currentPasswordPlaceholder: "Geben Sie Ihr aktuelles Passwort ein",
			newPasswordLabel: "Neues Passwort",
			newPasswordPlaceholder: "Neues Passwort",
			confirmPasswordLabel: "Bestätigung",
			confirmPasswordPlaceholder: "Neues Passwort",
			changeButton: "Passwort ändern",
		},
		deleteSection: {
			title: "Konto löschen",
			description: "Unwiderrufliche Aktion. Alle Ihre Daten werden gelöscht.",
			dialogTitle: "Ihr Konto löschen",
			dialogDescription:
				"Unwiderrufliche Aktion. Alle Ihre Daten werden gelöscht.",
			confirmationLabel: "Geben Sie 'confirmer' ein, um fortzufahren",
			confirmationPlaceholder: "confirmer",
			deleteButton: "Konto löschen",
			deleting: "Löschen...",
			cancel: "Abbrechen",
		},
		toasts: {
			usernameUpdated: "Benutzername aktualisiert",
			usernameUpdatedDesc: "Ihr Benutzername wurde erfolgreich aktualisiert.",
			passwordChanged: "Passwort geändert",
			passwordChangedDesc: "Ihr Passwort wurde erfolgreich geändert.",
			error: "Fehler",
			passwordMismatch: "Die neuen Passwörter stimmen nicht überein",
			updateFailed: "Fehler beim Aktualisieren des Benutzernamens",
			passwordChangeFailed: "Fehler beim Ändern des Passworts",
			accountDeleted: "Konto gelöscht",
			accountDeletedDesc: "Ihr Konto wurde erfolgreich gelöscht.",
			accountDeleteFailed: "Fehler beim Löschen des Kontos",
		},
	},
	userProfile: {
		profile: "Profil",
		publicWatchlists: "Öffentliche Listen",
		publicWatchlist: "Öffentliche Liste",
		watchlists: "Listen",
		watchlist: "Liste",
		noPublicWatchlists: "Keine Listen veröffentlicht.",
		noPublicWatchlistsDescription:
			"Dieser Benutzer hat noch keine öffentlichen Listen veröffentlicht.",
		loading: "Profil wird geladen...",
		notFound: "Benutzer nicht gefunden",
		notFoundDescription:
			"Der gesuchte Benutzer existiert nicht oder wurde gelöscht.",
		backToHome: "Zurück zur Startseite",
	},
};
