import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, profiles } from "@/db/schema";
import { ensureProfile, jsonError, readJson } from "@/lib/server/api";
import { containsAdultMarker } from "@/lib/server/streaming";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const channelId = new URL(request.url).searchParams.get("channelId");
    if (!channelId) return jsonError("channelId é obrigatório", 400);
    const items = await db.select().from(chatMessages).where(eq(chatMessages.channelId, channelId.slice(0, 240))).orderBy(asc(chatMessages.createdAt)).limit(80);
    return Response.json({ items, scope: "room" });
  } catch { return jsonError("Não foi possível carregar o chat"); }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const channelId = String(body.channelId ?? "").trim().slice(0, 240);
    const message = String(body.message ?? "").trim().replace(/\s+/g, " ").slice(0, 280);
    const requestedAuthor = String(body.author ?? "").trim().slice(0, 40);
    if (!channelId || !message) return jsonError("Escreva uma mensagem antes de enviar", 400);
    await ensureProfile();
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, "main")).limit(1);
    const author = requestedAuthor || profile?.name || "Sala de estar";
    if (containsAdultMarker(message) || containsAdultMarker(author)) return jsonError("Mensagem bloqueada pela política familiar", 422);
    const [item] = await db.insert(chatMessages).values({ profileId: "main", channelId, message, author }).returning();
    return Response.json({ item, scope: "room" }, { status: 201 });
  } catch { return jsonError("Não foi possível enviar a mensagem"); }
}
