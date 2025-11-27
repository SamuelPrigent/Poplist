import type { Response } from "express";

const isProduction = process.env.NODE_ENV === "production";

// For cross-domain cookies (different domains), don't set domain attribute
// Browser will automatically set cookie for the current domain
const commonOptions = {
	httpOnly: true,
	sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
	secure: isProduction,
	path: "/",
	// domain: undefined in production for cross-domain cookies
};

export function setAccessTokenCookie(res: Response, token: string): void {
	res.cookie("accessToken", token, {
		...commonOptions,
		maxAge: 60 * 60 * 1000, // 1 hour
	});
}

export function setRefreshTokenCookie(res: Response, token: string): void {
	res.cookie("refreshToken", token, {
		...commonOptions,
		maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
	});
}

export function clearAuthCookies(res: Response): void {
	res.clearCookie("accessToken", commonOptions);
	res.clearCookie("refreshToken", commonOptions);
}
