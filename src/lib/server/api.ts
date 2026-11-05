export async function ensureProfile() {
  const { db } = await import("@/db");
  const { profiles } = await import("@/db/schema");

  await db.insert(profiles).values({ id: "main" }).onConflictDoNothing();
}

export function jsonError(message: string, status = 500) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const value: unknown = await request.json();
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}
