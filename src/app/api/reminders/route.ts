import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reminders } from "@/db/schema";
import { ensureProfile, jsonError, readJson } from "@/lib/server/api";
import { isAdultRecord } from "@/lib/server/streaming";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureProfile();
    const items = await db.select().from(reminders).where(eq(reminders.profileId, "main")).orderBy(desc(reminders.createdAt));
    return Response.json({ items });
  } catch { return jsonError("Não foi possível carregar os lembretes"); }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const eventId = String(body.eventId ?? "").slice(0, 240);
    const title = String(body.title ?? "").trim().slice(0, 240);
    const date = new Date(String(body.startsAt ?? ""));
    if (!eventId || !title || Number.isNaN(date.getTime())) return jsonError("Dados do lembrete inválidos", 400);
    if (isAdultRecord(body)) return jsonError("Conteúdo bloqueado pela política familiar", 422);
    await ensureProfile();
    await db.insert(reminders).values({ profileId: "main", eventId, title, startsAt: date }).onConflictDoUpdate({
      target: [reminders.profileId, reminders.eventId], set: { title, startsAt: date },
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch { return jsonError("Não foi possível salvar o lembrete"); }
}

export async function DELETE(request: Request) {
  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return jsonError("eventId é obrigatório", 400);
    await db.delete(reminders).where(and(eq(reminders.profileId, "main"), eq(reminders.eventId, eventId)));
    return Response.json({ ok: true });
  } catch { return jsonError("Não foi possível remover o lembrete"); }
}
