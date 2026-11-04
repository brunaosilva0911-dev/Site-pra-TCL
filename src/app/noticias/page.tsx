import type { Metadata } from "next";
import { Newsroom } from "@/components/content/Newsroom";
import { PageHeader } from "@/components/layout/PageHeader";
import { news } from "@/lib/content";

export const metadata: Metadata = { title: "Notícias" };

export default function NewsPage() {
  return <div className="pb-24"><PageHeader eyebrow="Redação VIVA" title="Notícias & guias" description="Tecnologia explicada sem complicação, dicas para a sua Android TV e bastidores da curadoria. Conteúdo editorial para você aproveitar cada sessão." /><Newsroom articles={news} /></div>;
}
