import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void {
	console.error("Error:", err);

	if (err instanceof ZodError) {
		res.status(400).json({
			error: "Validation error",
			details: err.errors,
		});
		return;
	}

	if (err.name === "JsonWebTokenError") {
		res.status(401).json({ error: "Invalid token" });
		return;
	}

	if (err.name === "TokenExpiredError") {
		res.status(401).json({ error: "Token expired" });
		return;
	}

	// MongoDB duplicate key error
	if ("code" in err && err.code === 11000) {
		res.status(409).json({ error: "Resource already exists" });
		return;
	}

	res.status(500).json({
		error: "Internal server error",
		message: process.env.NODE_ENV === "development" ? err.message : undefined,
	});
}
