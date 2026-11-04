import { getNews, news } from "@/lib/content";
import { jsonError } from "@/lib/server/api";

export function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug");
  if (slug) {
    const article = getNews(slug);
    return article ? Response.json({ article }) : jsonError("Notícia não encontrada", 404);
  }
  return Response.json({ items: news, total: news.length });
}
