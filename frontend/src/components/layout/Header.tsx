import { Link } from "react-router-dom";
import { Bookmark, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useState } from "react";
import { AuthDrawer } from "@/features/auth/AuthDrawer";
import { useLanguageStore } from "@/store/language";
import play from "../../../public/4.png";

export function Header() {
  const { isAuthenticated, logout } = useAuth();
  const { content } = useLanguageStore();
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

  return (
    <>
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src={play} className="h-4 w-4" alt="" />
            <Link to="/" className="text-xl font-bold text-white">
              {content.header.appName}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/account/watchlists">
              <Button variant="ghost" size="icon">
                <Bookmark className="h-5 w-5" />
              </Button>
            </Link>

            {isAuthenticated ? (
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4" />
                {content.header.logout}
              </Button>
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
