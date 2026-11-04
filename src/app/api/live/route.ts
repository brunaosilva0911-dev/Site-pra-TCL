import { getLivePayload } from "@/lib/server/streaming";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const payload = await getLivePayload();
  const view = new URL(request.url).searchParams.get("view");
  if (view === "channels") return Response.json({ items: payload.channels, categories: payload.categories, source: payload.source, updatedAt: payload.updatedAt });
  if (view === "events") return Response.json({ items: payload.events, source: payload.source, updatedAt: payload.updatedAt });
  if (view === "epg") return Response.json({ items: payload.epg, source: payload.source, updatedAt: payload.updatedAt });
  return Response.json(payload);
}
