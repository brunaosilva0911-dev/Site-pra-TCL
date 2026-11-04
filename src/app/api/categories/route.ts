import { catalog, collectionLabels } from "@/lib/content";

export function GET() {
  const collections = Object.entries(collectionLabels).map(([id, name]) => ({
    id, name, count: catalog.filter((item) => item.collections.includes(id)).length,
  }));
  const genres = [...new Set(catalog.flatMap((item) => item.genres))].sort().map((name) => ({
    id: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-"),
    name,
    count: catalog.filter((item) => item.genres.includes(name)).length,
  }));
  return Response.json({ collections, genres });
}
