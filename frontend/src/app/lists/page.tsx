"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";

export default function ListsRedirectPage() {
	const router = useRouter();
	const { isAuthenticated, isLoading } = useAuth();

	useEffect(() => {
		if (isLoading) return;

		if (isAuthenticated) {
			router.replace("/account/lists");
		} else {
			router.replace("/local/lists");
		}
	}, [isAuthenticated, isLoading, router]);

	return (
		<div className="flex min-h-[50vh] items-center justify-center">
			<div className="text-muted-foreground">Chargement...</div>
		</div>
	);
}
