import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
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
              <Route path="/" element={<Home />} />

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
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
