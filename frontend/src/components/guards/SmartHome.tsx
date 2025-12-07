import { useAuth } from "@/context/auth-context";
import { Home } from "@/pages/Home";
import { Landing } from "@/pages/Landing";

export function SmartHome() {
	const { user } = useAuth();

	// Show Home if logged in, Landing if not
	return user ? <Home /> : <Landing />;
}
