import { env } from "../../config/env";

export type AiRequestOptions = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

export class AiHttpError extends Error {
  status: number;
  details?: unknown;

  constructor(params: { message: string; status: number; details?: unknown }) {
    super(params.message);
    this.name = "AiHttpError";
    this.status = params.status;
    this.details = params.details;
  }
}

const buildUrl = (baseUrl: string, path: string, query?: AiRequestOptions["query"]) => {
  const cleanedBase = baseUrl.replace(/\/+$/, "");
  const cleanedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(cleanedBase + cleanedPath);

  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }

  return url.toString();
};

const withTimeout = async <T>(
  promise: Promise<Response>,
  timeoutMs: number,
  signal: AbortSignal
): Promise<Response> => {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise;

  const timeoutPromise = new Promise<Response>((_, reject) => {
    const timer = setTimeout(() => {
      reject(new AiHttpError({ message: "AI service request timed out", status: 504 }));
    }, timeoutMs);

    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
      },
      { once: true }
    );
  });

  return Promise.race([promise, timeoutPromise]);
};

export class AiHttpClient {
  async request<T>(options: AiRequestOptions): Promise<T> {
    if (!env.AI_SERVICE_URL) {
      throw new AiHttpError({
        message: "AI_SERVICE_URL is not configured",
        status: 500,
      });
    }

    const timeoutMs = options.timeoutMs ?? env.AI_SERVICE_TIMEOUT_MS;
    const controller = new AbortController();

    const url = buildUrl(env.AI_SERVICE_URL, options.path, options.query);

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

      return payload as T;
    } catch (err: any) {
      if (err instanceof AiHttpError) throw err;

      throw new AiHttpError({
        message: err?.message ? `AI service request failed: ${err.message}` : "AI service request failed",
        status: 502,
        details: err,
      });
    } finally {
      controller.abort();
    }
  }
}

export const aiHttpClient = new AiHttpClient();

