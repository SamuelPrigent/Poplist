"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { AuthProvider } from "@/context/AuthContext";
import { cleanLocalStorageIfVersionMismatch } from "@/lib/localStorageVersion";

function AuthRedirectHandler({ children }: { children: React.ReactNode }) {
	// Surveille les changements d'état auth et redirige si nécessaire
	useAuthRedirect();
	return <>{children}</>;
}

function StorageVersionGate({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		// Si version localStorage absente ou différente → wipe complet + reload.
		// Le reload est nécessaire car Zustand a déjà hydraté ses stores en
		// mémoire à partir des anciennes données. Une fois la version posée,
		// ce useEffect est no-op au prochain boot.
		const wiped = cleanLocalStorageIfVersionMismatch();
		if (wiped) {
			window.location.reload();
		}
	}, []);
	return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<StorageVersionGate>
			<AuthProvider>
				<AuthRedirectHandler>{children}</AuthRedirectHandler>
				<Toaster />
			</AuthProvider>
		</StorageVersionGate>
	);
}
