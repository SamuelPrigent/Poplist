import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import {
	OfflineListRoute,
	OnlineListRoute,
	ProtectedRoute,
	PublicOnlyRoute,
} from "./components/guards/RouteGuards";
import { SmartRedirect } from "./components/guards/SmartRedirect";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { ToasterLight } from "./components/ui/sonner-light";
import { AuthProvider } from "./context/AuthContext";
import { Account } from "./pages/Account";
import { Categories } from "./pages/Categories/Categories";
import { CategoryDetail } from "./pages/Categories/CategoryDetail";
import { Explore } from "./pages/Explore";
import { PlatformDetail } from "./pages/Platforms/PlatformDetail";
import { Platforms } from "./pages/Platforms/Platforms";
import { Home } from "./pages/Home";
import { Landing } from "./pages/Landing";
import { UserProfile } from "./pages/User/UserProfile";
import { CommunityLists } from "./pages/Lists/CommunityLists";
import { ListDetail } from "./pages/Lists/ListDetail";
import { ListDetailOffline } from "./pages/Lists/ListDetailOffline";
import { Lists } from "./pages/Lists/Lists";
import { ListsOffline } from "./pages/Lists/ListsOffline";

function App() {
	return (
		<ErrorBoundary>
			<BrowserRouter>
				<AuthProvider>
					<div className="bg-background flex min-h-screen flex-col">
						<Header />
						<main className="flex-1">
							<Routes>
								<Route path="/" element={<Landing />} />
								<Route path="/home" element={<Home />} />
								<Route path="/explore" element={<Explore />} />
								<Route path="/categories" element={<Categories />} />
								<Route path="/category/:id" element={<CategoryDetail />} />
								<Route path="/platforms" element={<Platforms />} />
								<Route path="/platform/:id" element={<PlatformDetail />} />
								<Route
									path="/community-lists"
									element={<CommunityLists />}
								/>

								{/* Profile page */}
								<Route
									path="/account"
									element={
										<ProtectedRoute>
											<Account />
										</ProtectedRoute>
									}
								/>

								{/* Smart redirect for /lists - goes to account or local based on status */}
								<Route
									path="/lists"
									element={
										<SmartRedirect
											authenticatedPath="/account/lists"
											unauthenticatedPath="/local/lists"
										/>
									}
								/>

								<Route
									path="/account/lists"
									element={
										<ProtectedRoute>
											<Lists />
										</ProtectedRoute>
									}
								/>
								<Route
									path="/local/lists"
									element={
										<PublicOnlyRoute>
											<ListsOffline />
										</PublicOnlyRoute>
									}
								/>
								<Route
									path="/account/list/:id"
									element={
										<OnlineListRoute>
											<ListDetail />
										</OnlineListRoute>
									}
								/>
								<Route
									path="/local/list/:id"
									element={
										<OfflineListRoute>
											<ListDetailOffline />
										</OfflineListRoute>
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
