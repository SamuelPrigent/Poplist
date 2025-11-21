import { Component, type ReactNode } from "react";
import { Button } from "./ui/button";

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
					<div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6 max-w-lg">
						<h1 className="text-2xl font-bold text-red-500 mb-4">
							Une erreur s'est produite
						</h1>
						<p className="text-sm text-muted-foreground mb-4">
							{this.state.error?.message || "Erreur inconnue"}
						</p>
						<div className="flex gap-2">
							<Button
								onClick={() => {
									this.setState({ hasError: false, error: null });
									window.location.href = "/";
								}}
							>
								Retour à l'accueil
							</Button>
							<Button
								variant="outline"
								onClick={() => window.location.reload()}
							>
								Recharger la page
							</Button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
