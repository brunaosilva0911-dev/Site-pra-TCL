"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";
import type { NewsArticle } from "@/lib/types";

function articleDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

export function Newsroom({ articles }: { articles: NewsArticle[] }) {
  const categories = useMemo(() => ["Todas", ...new Set(articles.map((article) => article.category))], [articles]);
  const [category, setCategory] = useState("Todas");
  const visible = category === "Todas" ? articles : articles.filter((article) => article.category === category);
  const [lead, ...rest] = visible;
  return (
    <div className="px-[4.5vw] py-8">
      <div data-nav-row="news-categories" className="no-scrollbar flex gap-3 overflow-x-auto py-3">
        {categories.map((item, index) => <button key={item} type="button" data-tv-focus="true" data-autofocus={index === 0 ? "" : undefined} data-nav-row="news-categories" tabIndex={0} onClick={() => setCategory(item)} aria-pressed={category === item} className={`tv-focus shrink-0 rounded-full border px-6 py-3 text-lg font-bold ${category === item ? "border-[#d9ff63] bg-[#d9ff63] text-black" : "border-white/10 text-white/50"}`}>{item}</button>)}
      </div>
      {lead && <Link href={`/noticias/${lead.slug}`} data-tv-focus="true" tabIndex={0} className="focus-card group mt-7 grid min-h-[500px] overflow-hidden rounded-[32px] border border-white/10 bg-[#111516] lg:grid-cols-[58%_1fr]">
        <div className="relative min-h-[360px] overflow-hidden"><Image src={lead.image} alt="" fill priority sizes="900px" className="object-cover transition duration-700 group-focus:scale-105" /><div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#111516]/25" /></div>
        <div className="flex flex-col justify-center p-9 xl:p-12"><p className="text-sm font-black uppercase tracking-[0.2em] text-[#d9ff63]">Destaque • {lead.category}</p><h2 className="mt-5 text-5xl font-black leading-[1.02] tracking-[-0.055em]">{lead.title}</h2><p className="mt-6 text-xl leading-relaxed text-white/50">{lead.summary}</p><div className="mt-8 flex items-center justify-between text-base text-white/40"><span>{articleDate(lead.publishedAt)}</span><span className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> {lead.readTime}</span></div><span className="mt-8 flex w-fit items-center gap-2 text-xl font-bold text-[#d9ff63]">Ler artigo <ArrowUpRight className="h-6 w-6" /></span></div>
      </Link>}
      <div className="mt-12 grid gap-7 md:grid-cols-2 2xl:grid-cols-3">{rest.map((article) => <Link key={article.slug} href={`/noticias/${article.slug}`} data-tv-focus="true" tabIndex={0} className="focus-card group overflow-hidden rounded-3xl border border-white/10 bg-[#111516]"><div className="relative aspect-video overflow-hidden"><Image src={article.image} alt="" fill sizes="550px" className="object-cover transition duration-500 group-focus:scale-105" /><span className="absolute left-5 top-5 rounded-full bg-black/60 px-4 py-2 text-xs font-black uppercase tracking-wider backdrop-blur-md">{article.category}</span></div><div className="p-6"><h2 className="text-3xl font-bold leading-tight tracking-[-0.035em]">{article.title}</h2><p className="mt-4 line-clamp-3 text-lg leading-relaxed text-white/45">{article.summary}</p><div className="mt-6 flex justify-between border-t border-white/8 pt-4 text-sm text-white/35"><span>{articleDate(article.publishedAt)}</span><span>{article.readTime} de leitura</span></div></div></Link>)}</div>
    </div>
  );
}
