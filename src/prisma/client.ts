import { PrismaClient, Prisma } from "@prisma/client";

// Prisma client singleton with cold-start resilience.
//
// The database is Neon serverless, which auto-suspends its compute when idle.
// The first query after a suspend can be slow (~5-8s) or momentarily fail while
// the compute resumes — this was surfacing to clients as a 500 on the first
// login after the app had been idle. Two mitigations work together:
//
//   1. `connect_timeout` is raised in DATABASE_URL so Prisma waits out the
//      resume instead of throwing at its 5s default.
//   2. The extension below transparently retries a small set of transient
//      connection errors with a short backoff, so a cold start self-heals
//      rather than surfacing an error on the first request.

const TRANSIENT_ERROR_CODES = new Set(["P1001", "P1002", "P1008", "P1017"]);

const isTransientConnectionError = (err: unknown): boolean => {
  // Connection could not be established / engine failed to start.
  if (err instanceof Prisma.PrismaClientInitializationError) return true;

  const code = (err as { code?: unknown })?.code;
  if (typeof code === "string" && TRANSIENT_ERROR_CODES.has(code)) return true;

  // Fall back to matching the message for driver-level socket errors that
  // don't always carry a Prisma error code.
  const message = String((err as { message?: unknown })?.message ?? "");
  return /can't reach database server|server has closed the connection|connection.*(closed|reset)|timed out|ECONNRESET|ETIMEDOUT/i.test(
    message
  );
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const createPrismaClient = () => {
  const base = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        const MAX_ATTEMPTS = 3;
        let lastError: unknown;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          try {
            return await query(args);
          } catch (err) {
            lastError = err;
            if (attempt < MAX_ATTEMPTS && isTransientConnectionError(err)) {
              // Backoff gives Neon time to finish resuming: 1.5s, then 3s.
              await sleep(attempt * 1500);
              continue;
            }
            throw err;
          }
        }
        throw lastError;
      },
    },
  });
};

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma?: ExtendedPrismaClient;
};

export const prisma: ExtendedPrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
