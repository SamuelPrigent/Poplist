import { useAuth } from "@/context/auth-context";
import { Landing } from "@/pages/Landing";
import { HomeApp } from "@/pages/HomeApp";

export function SmartHome() {
  const { user } = useAuth();

  // Show HomeApp if logged in, Landing if not
  return user ? <HomeApp /> : <Landing />;
}
