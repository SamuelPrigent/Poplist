import type { NextFunction, Request, Response } from "express";
import { type AccessTokenPayload, verifyAccessToken } from "../lib/jwt.js";

declare module "express-serve-static-core" {
	interface Request {
		user?: AccessTokenPayload;
	}
}

export function requireAuth(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const accessToken = req.cookies.accessToken;

		if (!accessToken) {
			res.status(401).json({ error: "Authentication required" });
			return;
		}

		const payload = verifyAccessToken(accessToken);
		req.user = payload;
		next();
	} catch (error) {
		console.log(error);
		return;
	}
}

export function optionalAuth(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const accessToken = req.cookies.accessToken;

		if (accessToken) {
			const payload = verifyAccessToken(accessToken);
			req.user = payload;
		}
	} catch (error) {
		// Silently fail for optional auth
		res.status(500).json({ error: error });
		return;
	}

	next();
}
