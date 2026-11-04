import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { watchHistory } from "@/db/schema";
import { ensureProfile, jsonError, readJson } from "@/lib/server/api";
import { isAdultRecord } from "@/lib/server/streaming";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await ensureProfile();
    const itemId = new URL(request.url).searchParams.get("itemId");
    const items = await db.select().from(watchHistory).where(itemId
      ? and(eq(watchHistory.profileId, "main"), eq(watchHistory.itemId, itemId))
      : eq(watchHistory.profileId, "main")).orderBy(desc(watchHistory.updatedAt)).limit(60);
    return Response.json({ items });
  } catch { return jsonError("Não foi possível carregar o histórico"); }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const itemId = String(body.itemId ?? "").slice(0, 240);
    const title = String(body.title ?? "").trim().slice(0, 240);
    const itemType = String(body.itemType ?? "");
    const position = Math.max(0, Number(body.position) || 0);
    const duration = Math.max(0, Number(body.duration) || 0);
    if (!itemId || !title || !["vod", "live", "event"].includes(itemType)) return jsonError("Dados do histórico inválidos", 400);
    if (isAdultRecord({ ...body, position: undefined, duration: undefined })) return jsonError("Conteúdo bloqueado pela política familiar", 422);
    await ensureProfile();
    const image = typeof body.image === "string" && /^https?:\/\//.test(body.image) ? body.image.slice(0, 1000) : null;
    await db.insert(watchHistory).values({ profileId: "main", itemId, itemType, title, image, position, duration, updatedAt: new Date() }).onConflictDoUpdate({
      target: [watchHistory.profileId, watchHistory.itemId], set: { itemType, title, image, position, duration, updatedAt: new Date() },
    });
    return Response.json({ ok: true });
  } catch { return jsonError("Não foi possível salvar o progresso"); }
}

export async function DELETE(request: Request) {
  try {
    const itemId = new URL(request.url).searchParams.get("itemId");
    await db.delete(watchHistory).where(itemId
      ? and(eq(watchHistory.profileId, "main"), eq(watchHistory.itemId, itemId))
      : eq(watchHistory.profileId, "main"));
    return Response.json({ ok: true });
  } catch { return jsonError("Não foi possível limpar o histórico"); }
}
