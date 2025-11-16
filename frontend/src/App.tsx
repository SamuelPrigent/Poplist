import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ToasterLight } from './components/ui/sonner-light';
import { Landing } from './pages/Landing';
import { HomeApp } from './pages/HomeApp';
import { Explore } from './pages/Explore';
import { Categories } from './pages/Categories';
import { CategoryDetail } from './pages/CategoryDetail';
import { CommunityWatchlists } from './pages/CommunityWatchlists';
import { Profile } from './pages/Profile';
import { Watchlists } from './pages/Account/Watchlists';
import { WatchlistsOffline } from './pages/Watchlists/WatchlistsOffline';
import { WatchlistDetail } from './pages/Watchlist/WatchlistDetail';
import { WatchlistDetailOffline } from './pages/Watchlist/WatchlistDetailOffline';
import { ProtectedRoute, PublicOnlyRoute, OnlineWatchlistRoute, OfflineWatchlistRoute } from './components/guards/RouteGuards';
import { SmartRedirect } from './components/guards/SmartRedirect';

function App() {
  return (
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
              <Route path="/community-watchlists" element={<CommunityWatchlists />} />

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

              {/* Catch-all route for 404 - redirect to home */}
              <Route path="*" element={<SmartRedirect authenticatedPath="/" unauthenticatedPath="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <ToasterLight />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
