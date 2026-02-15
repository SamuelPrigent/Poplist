"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { runMigrations } from "@/lib/localStorageVersion";

function AuthRedirectHandler({ children }: { children: React.ReactNode }) {
	// Surveille les changements d'état auth et redirige si nécessaire
	useAuthRedirect();
	return <>{children}</>;
}

function StorageMigrationHandler({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		// Run localStorage migrations on app startup
		runMigrations();
	}, []);
	return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<StorageMigrationHandler>
			<ThemeProvider>
				<AuthProvider>
					<AuthRedirectHandler>{children}</AuthRedirectHandler>
					<Toaster />
				</AuthProvider>
			</ThemeProvider>
		</StorageMigrationHandler>
	);
}
