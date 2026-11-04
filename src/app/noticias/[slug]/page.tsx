import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3, ShieldCheck } from "lucide-react";
import { getNews, news } from "@/lib/content";

export function generateStaticParams() { return news.map((article) => ({ slug: article.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getNews(slug);
  return article ? { title: article.title, description: article.summary } : { title: "Notícia" };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getNews(slug);
  if (!article) notFound();
  const related = news.filter((item) => item.slug !== slug).slice(0, 2);
  return (
    <article className="pb-24">
      <header className="relative min-h-[76vh] overflow-hidden">
        <Image src={article.image} alt="" fill priority sizes="100vw" className="object-cover" /><div className="hero-vignette absolute inset-0" />
        <div className="absolute inset-x-0 bottom-16 px-[4.5vw]"><Link href="/noticias" data-tv-focus="true" tabIndex={0} className="tv-focus mb-8 inline-flex items-center gap-3 rounded-full bg-black/35 px-5 py-3 text-lg font-bold backdrop-blur-md"><ArrowLeft className="h-5 w-5" /> Notícias</Link><p className="animate-enter-up text-sm font-black uppercase tracking-[0.24em] text-[#d9ff63]">{article.category}</p><h1 className="animate-reveal mt-5 max-w-[1100px] text-balance text-6xl font-black leading-[0.98] tracking-[-0.06em] xl:text-7xl">{article.title}</h1><p className="mt-6 max-w-[850px] text-2xl leading-relaxed text-white/65">{article.summary}</p><div className="mt-6 flex items-center gap-5 text-lg text-white/45"><span>Por Redação VIVA</span><span>•</span><span>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(article.publishedAt))}</span><span className="flex items-center gap-2"><Clock3 className="h-5 w-5" /> {article.readTime}</span></div></div>
      </header>
      <div className="mx-auto max-w-[1050px] px-8 py-16"><div className="space-y-8">{article.body.map((paragraph, index) => <p key={index} className={`leading-[1.75] text-white/70 ${index === 0 ? "text-3xl font-medium text-white/85" : "text-2xl"}`}>{paragraph}</p>)}</div><div className="mt-12 flex items-start gap-4 rounded-3xl border border-[#d9ff63]/20 bg-[#d9ff63]/6 p-7"><ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-[#d9ff63]" /><p className="text-xl leading-relaxed text-white/60"><strong className="text-white">Compromisso editorial:</strong> este guia descreve recursos reais da interface VIVA. Disponibilidade de canais, eventos e horários depende das fontes externas e pode mudar.</p></div></div>
      <section className="border-t border-white/10 px-[4.5vw] py-12"><h2 className="text-3xl font-bold">Continue lendo</h2><div className="mt-7 grid gap-6 md:grid-cols-2">{related.map((item) => <Link key={item.slug} href={`/noticias/${item.slug}`} data-tv-focus="true" tabIndex={0} className="tv-focus group flex items-center justify-between gap-6 rounded-3xl border border-white/10 bg-[#111516] p-7"><div><p className="text-sm font-bold uppercase tracking-widest text-[#d9ff63]">{item.category}</p><h3 className="mt-3 text-2xl font-bold leading-tight">{item.title}</h3></div><ArrowRight className="h-7 w-7 shrink-0 text-white/40 transition group-focus:translate-x-1" /></Link>)}</div></section>
    </article>
  );
}
