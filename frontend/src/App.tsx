import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import {
	OfflineWatchlistRoute,
	OnlineWatchlistRoute,
	ProtectedRoute,
	PublicOnlyRoute,
} from "./components/guards/RouteGuards";
import { SmartRedirect } from "./components/guards/SmartRedirect";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { ToasterLight } from "./components/ui/sonner-light";
import { AuthProvider } from "./context/AuthContext";
import { Categories } from "./pages/Categories";
import { CategoryDetail } from "./pages/CategoryDetail";
import { CommunityWatchlists } from "./pages/CommunityWatchlists";
import { Explore } from "./pages/Explore";
import { HomeApp } from "./pages/HomeApp";
import { Landing } from "./pages/Landing";
import { Profile } from "./pages/Profile";
import { UserProfile } from "./pages/User/UserProfile";
import { WatchlistDetail } from "./pages/Watchlist/WatchlistDetail";
import { WatchlistDetailOffline } from "./pages/Watchlist/WatchlistDetailOffline";
import { Watchlists } from "./pages/Watchlists/Watchlists";
import { WatchlistsOffline } from "./pages/Watchlists/WatchlistsOffline";

function App() {
	return (
		<ErrorBoundary>
			<BrowserRouter>
				<AuthProvider>
					<div className="flex min-h-screen flex-col bg-background">
						<Header />
						<main className="flex-1">
							<Routes>
								<Route path="/" element={<Landing />} />
								<Route path="/home" element={<HomeApp />} />
								<Route path="/explore" element={<Explore />} />
								<Route path="/categories" element={<Categories />} />
								<Route path="/category/:id" element={<CategoryDetail />} />
								<Route
									path="/community-watchlists"
									element={<CommunityWatchlists />}
								/>

								{/* Profile page */}
								<Route
									path="/profile"
									element={
										<ProtectedRoute>
											<Profile />
										</ProtectedRoute>
									}
								/>

								{/* Smart redirect for /watchlists - goes to account or local based on status */}
								<Route
									path="/watchlists"
									element={
										<SmartRedirect
											authenticatedPath="/account/watchlists"
											unauthenticatedPath="/local/watchlists"
										/>
									}
								/>

								<Route
									path="/account/watchlists"
									element={
										<ProtectedRoute>
											<Watchlists />
										</ProtectedRoute>
									}
								/>
								<Route
									path="/local/watchlists"
									element={
										<PublicOnlyRoute>
											<WatchlistsOffline />
										</PublicOnlyRoute>
									}
								/>
								<Route
									path="/account/watchlist/:id"
									element={
										<OnlineWatchlistRoute>
											<WatchlistDetail />
										</OnlineWatchlistRoute>
									}
								/>
								<Route
									path="/local/watchlist/:id"
									element={
										<OfflineWatchlistRoute>
											<WatchlistDetailOffline />
										</OfflineWatchlistRoute>
									}
								/>

							{/* Public user profile - accessible by everyone */}
							<Route path="/user/:username" element={<UserProfile />} />

								{/* Catch-all route for 404 - redirect to home */}
								<Route
									path="*"
									element={
										<SmartRedirect
											authenticatedPath="/"
											unauthenticatedPath="/"
										/>
									}
								/>
							</Routes>
						</main>
						<Footer />
					</div>
					<ToasterLight />
				</AuthProvider>
			</BrowserRouter>
		</ErrorBoundary>
	);
}

export default App;
