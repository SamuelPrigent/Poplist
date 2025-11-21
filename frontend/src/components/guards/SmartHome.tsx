import { useAuth } from "@/context/auth-context";
import { HomeApp } from "@/pages/HomeApp";
import { Landing } from "@/pages/Landing";

export function SmartHome() {
	const { user } = useAuth();

	// Show HomeApp if logged in, Landing if not
	return user ? <HomeApp /> : <Landing />;
}
