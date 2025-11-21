import type { Response } from "express";

const isProduction = process.env.NODE_ENV === "production";
const cookieDomain = process.env.COOKIE_DOMAIN || "localhost";

const commonOptions = {
	httpOnly: true,
	sameSite: (isProduction ? "strict" : "lax") as "strict" | "lax",
	secure: isProduction,
	domain: cookieDomain,
	path: "/",
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
