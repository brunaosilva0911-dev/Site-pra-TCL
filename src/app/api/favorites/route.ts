import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { ensureProfile, jsonError, readJson } from "@/lib/server/api";
import { isAdultRecord } from "@/lib/server/streaming";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureProfile();
    const items = await db.select().from(favorites).where(eq(favorites.profileId, "main")).orderBy(desc(favorites.createdAt));
    return Response.json({ items });
  } catch { return jsonError("Não foi possível carregar os favoritos"); }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const itemId = String(body.itemId ?? "").slice(0, 240);
    const title = String(body.title ?? "").trim().slice(0, 240);
    const itemType = String(body.itemType ?? "");
    if (!itemId || !title || !["vod", "live", "event"].includes(itemType)) return jsonError("Dados do favorito inválidos", 400);
    if (isAdultRecord(body)) return jsonError("Conteúdo bloqueado pela política familiar", 422);
    await ensureProfile();
    const image = typeof body.image === "string" && /^https?:\/\//.test(body.image) ? body.image.slice(0, 1000) : null;
    await db.insert(favorites).values({ profileId: "main", itemId, itemType, title, image }).onConflictDoUpdate({
      target: [favorites.profileId, favorites.itemId], set: { title, image, itemType },
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch { return jsonError("Não foi possível salvar o favorito"); }
}

export async function DELETE(request: Request) {
  try {
    const itemId = new URL(request.url).searchParams.get("itemId");
    if (!itemId) return jsonError("itemId é obrigatório", 400);
    await db.delete(favorites).where(and(eq(favorites.profileId, "main"), eq(favorites.itemId, itemId)));
    return Response.json({ ok: true });
  } catch { return jsonError("Não foi possível remover o favorito"); }
}
