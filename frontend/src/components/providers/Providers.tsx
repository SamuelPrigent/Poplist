"use client";

import { Toaster } from "@/components/ui/sonner";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { AuthProvider } from "./AuthProvider";

function AuthRedirectHandler({ children }: { children: React.ReactNode }) {
	// Surveille les changements d'état auth et redirige si nécessaire
	useAuthRedirect();
	return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<AuthProvider>
			<AuthRedirectHandler>{children}</AuthRedirectHandler>
			<Toaster />
		</AuthProvider>
	);
}
