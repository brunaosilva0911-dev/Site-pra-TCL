import { catalog, getVod } from "@/lib/content";
import { jsonError } from "@/lib/server/api";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  const collection = params.get("collection");
  if (id) {
    const item = getVod(id);
    return item ? Response.json({ item }) : jsonError("Título não encontrado", 404);
  }
  const items = collection ? catalog.filter((item) => item.collections.includes(collection)) : catalog;
  return Response.json({ items, total: items.length, policy: "family-safe" });
}
