import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bookmark, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useState } from "react";
import { AuthDrawer } from "@/features/auth/AuthDrawer";
import { useLanguageStore } from "@/store/language";
import play from "../../assets/play.png";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { content } = useLanguageStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const openLogin = () => {
    setAuthMode("login");
    setAuthDrawerOpen(true);
  };

  const openSignup = () => {
    setAuthMode("signup");
    setAuthDrawerOpen(true);
  };

  const handleLogout = async () => {
    await logout();

    // Smart redirect based on current route
    if (location.pathname === "/account/watchlists") {
      navigate("/local/watchlists");
    } else if (location.pathname.startsWith("/account/")) {
      navigate("/home");
    }
    // For other pages, no redirect needed (stays on current page)
  };

  return (
    <>
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <img src={play} className="h-4 w-4" alt="" />
              <Link to="/" className="text-xl font-bold text-white">
                {content.header.appName}
              </Link>
            </div>
            <Link
              to="/home"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-white"
            >
              {content.header.home}
            </Link>
            <Link
              to="/explore"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-white"
            >
              {content.header.explore}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/watchlists">
              <Button variant="ghost" size="icon">
                <Bookmark
                  className={`h-5 w-5 ${isAuthenticated ? "fill-white" : ""}`}
                />
              </Button>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-1.5 transition-colors hover:bg-muted"
                >
                  <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{user?.username}</span>
                </button>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Button variant="outline" onClick={openLogin}>
                  {content.header.login}
                </Button>
                <Button onClick={openSignup}>{content.header.signup}</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthDrawer
        open={authDrawerOpen}
        onClose={() => setAuthDrawerOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
