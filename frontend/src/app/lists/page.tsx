"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";

export default function ListsRedirectPage() {
	const router = useRouter();
	const { isAuthenticated, isLoading } = useAuth();

	useEffect(() => {
		console.log("[ListsRedirect]", { isLoading, isAuthenticated });
		if (isLoading) return;

		if (isAuthenticated) {
			console.log("[ListsRedirect] -> /account/lists");
			router.replace("/account/lists");
		} else {
			console.log("[ListsRedirect] -> /local/lists");
			router.replace("/local/lists");
		}
	}, [isAuthenticated, isLoading, router]);

	return (
		<div className="flex min-h-[50vh] items-center justify-center">
			<div className="text-muted-foreground">Chargement...</div>
		</div>
	);
}
