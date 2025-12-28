import { Bookmark, LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { AuthDrawer } from "@/features/auth/AuthDrawer";
import { useLanguageStore } from "@/store/language";
import play from "../../assets/play.png";

export function Header() {
	const { isAuthenticated, user, logout } = useAuth();
	const { content } = useLanguageStore();
	const navigate = useNavigate();
	const location = useLocation();
	const [authDrawerOpen, setAuthDrawerOpen] = useState(false);
	const [authMode, setAuthMode] = useState<"login" | "signup">("login");

	const openLogin = () => {
		setAuthMode("login");
		setAuthDrawerOpen(true);
	};

	const openSignup = () => {
		setAuthMode("signup");
		setAuthDrawerOpen(true);
	};

	const handleLogout = async () => {
		await logout();

		// Smart redirect based on current route
		if (location.pathname === "/account/lists") {
			navigate("/local/lists");
		} else if (location.pathname.startsWith("/account/")) {
			navigate("/home");
		}
		// For other pages, no redirect needed (stays on current page)
	};

	return (
		<>
			<header className="border-border bg-background border-b">
				<div className="mx-auto flex h-16 w-[92%] max-w-(--maxWidth) items-center justify-between px-4">
					<div className="flex items-center gap-6">
						<div className="flex items-center gap-2">
							<img src={play} className="h-4 w-4" alt="" />
							<Link to="/" className="rounded text-xl font-bold text-white">
								{content.header.appName}
							</Link>
						</div>
						<Link
							to="/home"
							className="text-muted-foreground rounded p-1 text-sm font-medium transition-colors hover:text-white"
						>
							{content.header.home}
						</Link>
						<Link
							to="/explore"
							className="text-muted-foreground rounded p-1 text-sm font-medium transition-colors hover:text-white"
						>
							{content.header.explore}
						</Link>
					</div>

					<div className="flex items-center gap-4">
						<Link
							to="/lists"
							className="hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors focus-visible:border-white focus-visible:ring-[3px] focus-visible:ring-white focus-visible:outline-none"
						>
							<Bookmark
								className={`h-5 w-5 ${isAuthenticated ? "fill-white" : ""}`}
							/>
						</Link>

						{isAuthenticated ? (
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => navigate("/account")}
									className="bg-muted/50 hover:bg-muted flex cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 transition-colors"
								>
									<div className="bg-muted flex h-5 w-5 items-center justify-center overflow-hidden rounded-full">
										{user?.avatarUrl ? (
											<img
												src={user.avatarUrl}
												alt={user.username}
												className="h-full w-full object-cover"
											/>
										) : (
											<UserIcon className="h-3.5 w-3.5" />
										)}
									</div>
									<span className="text-sm font-medium">{user?.username}</span>
								</button>
								<Button
									className="cursor-pointer"
									variant="ghost"
									size="icon"
									onClick={handleLogout}
								>
									<LogOut className="h-4 w-4" />
								</Button>
							</div>
						) : (
							<>
								<Button
									className="focus-visible:ring-offset-background rounded-squircle cursor-pointer focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-white"
									variant="outline"
									onClick={openLogin}
								>
									{content.header.login}
								</Button>
								<Button
									className="focus-visible:ring-offset-background rounded-squircle cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
									onClick={openSignup}
								>
									{content.header.signup}
								</Button>
							</>
						)}
					</div>
				</div>
			</header>

			<AuthDrawer
				open={authDrawerOpen}
				onClose={() => setAuthDrawerOpen(false)}
				initialMode={authMode}
			/>
		</>
	);
}
