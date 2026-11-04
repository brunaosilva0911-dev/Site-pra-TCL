import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { ensureProfile, jsonError, readJson } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureProfile();
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, "main")).limit(1);
    return Response.json(profile);
  } catch { return jsonError("Não foi possível carregar o perfil"); }
}

export async function PATCH(request: Request) {
  try {
    const body = await readJson(request);
    await ensureProfile();
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 40) : undefined;
    const avatarColor = typeof body.avatarColor === "string" && /^#[0-9a-f]{6}$/i.test(body.avatarColor) ? body.avatarColor : undefined;
    const [profile] = await db.update(profiles).set({
      ...(name ? { name } : {}),
      ...(avatarColor ? { avatarColor } : {}),
      ...(typeof body.autoplay === "boolean" ? { autoplay: body.autoplay } : {}),
      ...(typeof body.reducedMotion === "boolean" ? { reducedMotion: body.reducedMotion } : {}),
    }).where(eq(profiles.id, "main")).returning();
    return Response.json(profile);
  } catch { return jsonError("Não foi possível atualizar o perfil"); }
}
