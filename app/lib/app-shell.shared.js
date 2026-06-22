/** True when React Router / Remix threw a redirect or Response. */
export function isThrownResponse(error) {
  return error instanceof Response;
}

/** Detect Prisma / Postgres connectivity failures. */
export function isDatabaseUnavailable(error) {
  const msg = String(error?.message ?? error ?? "");
  const code = String(error?.code ?? "");
  return (
    error?.name === "PrismaClientInitializationError" ||
    code.startsWith("P10") ||
    msg.includes("Can't reach database") ||
    msg.includes("Connection timed out") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ECONNRESET") ||
    msg.includes("Connection pool timeout")
  );
}
