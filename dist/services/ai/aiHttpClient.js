"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiHttpClient = exports.AiHttpClient = exports.AiHttpError = void 0;
const env_1 = require("../../config/env");
class AiHttpError extends Error {
    status;
    details;
    constructor(params) {
        super(params.message);
        this.name = "AiHttpError";
        this.status = params.status;
        this.details = params.details;
    }
}
exports.AiHttpError = AiHttpError;
const buildUrl = (baseUrl, path, query) => {
    const cleanedBase = baseUrl.replace(/\/+$/, "");
    const cleanedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(cleanedBase + cleanedPath);
    if (query) {
        for (const [k, v] of Object.entries(query)) {
            if (v === undefined)
                continue;
            url.searchParams.set(k, String(v));
        }
    }
    return url.toString();
};
const withTimeout = async (promise, timeoutMs, signal) => {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
        return promise;
    const timeoutPromise = new Promise((_, reject) => {
        const timer = setTimeout(() => {
            reject(new AiHttpError({ message: "AI service request timed out", status: 504 }));
        }, timeoutMs);
        signal.addEventListener("abort", () => {
            clearTimeout(timer);
        }, { once: true });
    });
    return Promise.race([promise, timeoutPromise]);
};
class AiHttpClient {
    async request(options) {
        if (!env_1.env.AI_SERVICE_URL) {
            throw new AiHttpError({
                message: "AI_SERVICE_URL is not configured",
                status: 500,
            });
        }
        const timeoutMs = options.timeoutMs ?? env_1.env.AI_SERVICE_TIMEOUT_MS;
        const controller = new AbortController();
        const url = buildUrl(env_1.env.AI_SERVICE_URL, options.path, options.query);
        try {
            const resPromise = fetch(url, {
                method: options.method,
                headers: {
                    "content-type": "application/json",
                    ...(options.headers ?? {}),
                },
                body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
                signal: controller.signal,
            });
            const res = await withTimeout(resPromise, timeoutMs, controller.signal);
            const contentType = res.headers.get("content-type") ?? "";
            const isJson = contentType.includes("application/json");
            const payload = isJson ? await res.json().catch(() => undefined) : await res.text().catch(() => undefined);
            if (!res.ok) {
                throw new AiHttpError({
                    message: `AI service responded with status ${res.status}`,
                    status: 502,
                    details: payload,
                });
            }
            return payload;
        }
        catch (err) {
            if (err instanceof AiHttpError)
                throw err;
            throw new AiHttpError({
                message: err?.message ? `AI service request failed: ${err.message}` : "AI service request failed",
                status: 502,
                details: err,
            });
        }
        finally {
            controller.abort();
        }
    }
}
exports.AiHttpClient = AiHttpClient;
exports.aiHttpClient = new AiHttpClient();
//# sourceMappingURL=aiHttpClient.js.map