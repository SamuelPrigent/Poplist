"use client";

import { Eye, EyeOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";
import { useLanguageStore } from "@/store/language";

// URL backend pour la vérification d'origine OAuth (le popup s'ouvre sur le backend)
const BACKEND_ORIGIN =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface AuthDrawerProps {
	open: boolean;
	onClose: () => void;
	initialMode?: "login" | "signup";
}

interface AuthError {
	message?: string;
}

const DEFAULT_AUTH_ERROR_MESSAGE = "Authentication failed";

function getAuthErrorMessage(error: unknown): string {
	if (typeof error === "string") {
		return error;
	}

	if (error && typeof error === "object" && "message" in error) {
		const { message } = error as AuthError;

		if (typeof message === "string" && message.trim().length > 0) {
			return message;
		}
	}

	return DEFAULT_AUTH_ERROR_MESSAGE;
}

export function AuthDrawer({
	open,
	onClose,
	initialMode = "login",
}: AuthDrawerProps) {
	const { content } = useLanguageStore();
	const router = useRouter();
	const pathname = usePathname();
	const [mode, setMode] = useState<"login" | "signup">(initialMode);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const { login, signup, refetch } = useAuth();

	useEffect(() => {
		setMode(initialMode);
	}, [initialMode]);

	useEffect(() => {
		if (open) {
			setEmail("");
			setPassword("");
			setError("");
		}
	}, [open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			if (mode === "login") {
				await login(email, password);
			} else {
				await signup(email, password);
			}

			// If user was on an offline list page, redirect to lists page
			if (pathname.includes("/offline-")) {
				router.push("/account/lists");
			}

			onClose();
		} catch (error: unknown) {
			setError(getAuthErrorMessage(error));
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleLogin = () => {
		const width = 500;
		const height = 600;
		const left = window.screen.width / 2 - width / 2;
		const top = window.screen.height / 2 - height / 2;

		window.open(
			"/api/auth/google",
			"Google Login",
			`width=${width},height=${height},left=${left},top=${top}`,
		);

		// Listen for postMessage from popup
		const handleMessage = async (event: MessageEvent) => {
			// Check that message comes from our backend
			if (event.origin !== BACKEND_ORIGIN) {
				return;
			}

			if (event.data.status === "success") {
				window.removeEventListener("message", handleMessage);

				try {
					// Set tokens via proxy to have cookies on frontend domain
					const { accessToken, refreshToken } = event.data;
					if (accessToken && refreshToken) {
						await fetch("/api/auth/set-tokens", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							credentials: "include",
							body: JSON.stringify({ accessToken, refreshToken }),
						});
					}

					// Refetch user after cookies are set
					await refetch();

					// Close drawer after user is updated
					onClose();

					// If user was on an offline list page, redirect to lists page
					if (pathname.includes("/offline-")) {
						router.push("/account/lists");
					}
				} catch (err) {
					console.error("Failed to set OAuth tokens:", err);
					setError("Failed to complete authentication");
				}
			} else if (event.data.status === "error") {
				window.removeEventListener("message", handleMessage);
				setError(event.data.message || "Google authentication failed");
			}
		};

		// Auto cleanup after 5 minutes (in case popup is closed manually)
		const cleanupTimeout = window.setTimeout(
			() => {
				window.removeEventListener("message", handleMessage);
			},
			5 * 60 * 1000,
		);

		window.addEventListener("message", handleMessage);

		return () => {
			clearTimeout(cleanupTimeout);
		};
	};

	return (
		<Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>
						{mode === "login"
							? content.auth.loginTitle
							: content.auth.signupTitle}
					</SheetTitle>
					<SheetDescription>
						{mode === "login"
							? content.auth.loginDescription
							: content.auth.signupDescription}
					</SheetDescription>
				</SheetHeader>

				<div className="mt-6 space-y-4">
					<Button
						type="button"
						variant="outline"
						className="w-full cursor-pointer"
						onClick={handleGoogleLogin}
					>
						<svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
							<path
								fill="currentColor"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="currentColor"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="currentColor"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="currentColor"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						{content.auth.continueWithGoogle}
					</Button>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="border-border w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background text-muted-foreground px-2">
								{content.auth.or}
							</span>
						</div>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label htmlFor="email" className="text-sm font-medium">
								{content.auth.email}
							</label>
							<Input
								id="email"
								type="email"
								autoComplete="email"
								placeholder={content.auth.emailPlaceholder}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="mt-1"
							/>
						</div>

						<div>
							<label htmlFor="password" className="text-sm font-medium">
								{content.auth.password}
							</label>
							<div className="relative mt-1">
								<Input
									id="password"
									type={password.length === 0 ? "text" : showPassword ? "text" : "password"}
									placeholder={content.auth.passwordPlaceholder}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									minLength={8}
									className="pr-10"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
									tabIndex={-1}
								>
									{showPassword ? (
										<Eye className="h-4 w-4" />
									) : (
										<EyeOff className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>

						{error && (
							<div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
								{error}
							</div>
						)}

						<Button
							type="submit"
							className="w-full cursor-pointer select-none"
							disabled={loading}
						>
							{loading
								? content.auth.processing
								: mode === "login"
									? content.auth.loginTitle
									: content.auth.signupTitle}
						</Button>
					</form>

					<div className="text-muted-foreground text-center text-sm">
						{mode === "login" ? (
							<p className="select-none">
								{content.auth.dontHaveAccount}{" "}
								<button
									type="button"
									onClick={() => setMode("signup")}
									className="text-primary cursor-pointer underline"
								>
									{content.auth.signupTitle}
								</button>
							</p>
						) : (
							<p className="select-none">
								{content.auth.alreadyHaveAccount}{" "}
								<button
									type="button"
									onClick={() => setMode("login")}
									className="text-primary cursor-pointer underline"
								>
									{content.auth.loginTitle}
								</button>
							</p>
						)}
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
