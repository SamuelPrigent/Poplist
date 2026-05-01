import { hc } from "hono/client";
import type { AppType } from "../../../backend/src/app";

// ========================================
// Auto-refresh on 401 + auto-logout on refresh failure
// ========================================

let onAuthError: (() => void) | null = null;

export function setAuthErrorHandler(handler: () => void) {
	onAuthError = handler;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
	if (refreshPromise) {
		return refreshPromise;
	}

	refreshPromise = (async () => {
		try {
			const response = await fetch("/api/auth/refresh", {
				method: "POST",
				credentials: "include",
			});

			if (response.ok) {
				console.log("✅ Access token refreshed successfully");
				return true;
			}

			return false;
		} catch {
			return false;
		} finally {
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

// Custom fetch passed to hc(): wraps native fetch with credentials, 401 refresh, auto-logout
async function customFetchWithRefresh(
	input: RequestInfo | URL,
	init?: RequestInit,
): Promise<Response> {
	const url =
		typeof input === "string"
			? input
			: input instanceof URL
				? input.toString()
				: input.url;

	const config: RequestInit = {
		...init,
		credentials: "include",
	};

	const response = await fetch(input, config);

	// Skip refresh on the refresh and logout endpoints to avoid loops
	const shouldAttemptRefresh =
		response.status === 401 &&
		!url.endsWith("/auth/refresh") &&
		!url.endsWith("/auth/logout");

	if (shouldAttemptRefresh) {
		console.log("🔄 Access token expired, attempting refresh...");
		const refreshed = await refreshAccessToken();

		if (refreshed) {
			console.log("🔄 Retrying original request with new token...");
			// Retry once with plain fetch to prevent any recursion
			return fetch(input, config);
		}

		console.log("🚪 Refresh failed, triggering logout...");
		if (onAuthError) {
			onAuthError();
		}
	}

	return response;
}

// ========================================
// Hono RPC client — fully typed end-to-end
// ========================================

export const client = hc<AppType>("/api", {
	fetch: customFetchWithRefresh,
});

// ========================================
// Wrapper helper: throws on !ok, returns typed JSON (full union, narrows in callers)
// ========================================

type JsonOf<R> = R extends { json: () => Promise<infer J> } ? J : never;

export async function unwrap<R extends { ok: boolean; status: number; json: () => Promise<unknown> }>(
	res: R,
): Promise<Exclude<JsonOf<R>, { error: string }>> {
	if (!res.ok) {
		const body = await res
			.json()
			.catch(() => ({ error: `Request failed: ${res.status}` }));
		throw new Error(
			(body as { error?: string }).error || `Request failed: ${res.status}`,
		);
	}
	return res.json() as Promise<Exclude<JsonOf<R>, { error: string }>>;
}
