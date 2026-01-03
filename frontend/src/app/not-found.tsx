import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
			<div className="text-center">
				<h1 className="mb-2 text-8xl font-bold text-white">404</h1>
				<h2 className="mb-4 text-2xl font-semibold text-white">
					Page introuvable
				</h2>
				<p className="text-muted-foreground mb-8 max-w-md">
					La page que vous recherchez n'existe pas ou a été déplacée.
				</p>
				<Button asChild>
					<Link href="/">Retour à l'accueil</Link>
				</Button>
			</div>
		</div>
	);
}
