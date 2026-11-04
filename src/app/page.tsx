import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { CarouselRow } from "@/components/content/CarouselRow";
import { ChannelRail } from "@/components/content/ChannelRail";
import { HeroCarousel } from "@/components/content/HeroCarousel";
import { LiveEventsRail } from "@/components/content/LiveEventsRail";
import { catalog, collectionLabels, getCollection, news } from "@/lib/content";
import { getLivePayload } from "@/lib/server/streaming";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const live = await getLivePayload();
  const featured = catalog.filter((item) => item.featured);
  const featuredChannels = [...live.channels].sort((a, b) => {
    const aSport = a.categoryNames.includes("Esportes") ? 0 : 1;
    const bSport = b.categoryNames.includes("Esportes") ? 0 : 1;
    return aSport - bSport;
  }).slice(0, 10);

  return (
    <>
      <HeroCarousel items={featured} />
      <div className="relative z-10 -mt-16 pb-20">
        {live.source === "unavailable" && (
          <div className="mx-[4.5vw] mb-10 flex items-center gap-5 rounded-3xl border border-white/10 bg-[#121617] p-6">
            <Radio className="h-8 w-8 shrink-0 text-white/45" />
            <div>
              <h2 className="text-xl font-bold">O sinal externo está temporariamente indisponível</h2>
              <p className="mt-1 text-lg text-white/55">O cinema aberto continua disponível. Canais, jogos e EPG voltam automaticamente quando a fonte responder.</p>
            </div>
          </div>
        )}
        <LiveEventsRail events={live.events} title="No ar e começando em breve" />
        <CarouselRow rowId="open-cinema" title={collectionLabels["open-cinema"]} eyebrow="Seleção VIVA" items={getCollection("open-cinema")} />
        <ChannelRail channels={featuredChannels} />
        <CarouselRow rowId="animation" title={collectionLabels.animation} eyebrow="Do clássico ao surreal" items={getCollection("animation")} />

        <section className="mx-[4.5vw] my-14 overflow-hidden rounded-[36px] border border-white/10 bg-[#d9ff63] text-[#0b0e0c]">
          <div className="grid items-center gap-10 p-10 lg:grid-cols-[1.3fr_1fr] lg:p-14">
            <div>
              <p className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.22em]"><Sparkles className="h-5 w-5" /> Feita para a sua sala</p>
              <h2 className="mt-5 max-w-[760px] text-5xl font-black leading-[1.02] tracking-[-0.055em] xl:text-6xl">Menos distração.<br />Mais histórias na tela.</h2>
              <p className="mt-6 max-w-[720px] text-xl font-medium leading-relaxed text-black/65">Navegue com as setas, selecione com OK e volte sem surpresas. Letras grandes, foco visível e controles que aparecem quando você precisa.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              {[["4", "setas para tudo"], ["100%", "sem conteúdo adulto"], ["1", "lista sincronizada"], ["0", "barras de rolagem"]].map(([value, label]) => (
                <div key={label} className="rounded-3xl border border-black/10 bg-black/6 p-6">
                  <strong className="block text-4xl font-black tracking-[-0.05em]">{value}</strong>
                  <span className="mt-2 block text-sm font-bold uppercase tracking-wider text-black/55">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CarouselRow rowId="shorts" title={collectionLabels.shorts} eyebrow="Sessão de curtas" items={getCollection("shorts")} />
        <CarouselRow rowId="mobility" title={collectionLabels.mobility} eyebrow="Sobre quatro rodas" items={getCollection("mobility")} />

        <section className="px-[4.5vw] py-16" aria-labelledby="news-heading">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-[#d9ff63]">Redação VIVA</p>
              <h2 id="news-heading" className="text-4xl font-bold tracking-[-0.04em]">Aproveite melhor a sua TV</h2>
            </div>
            <Link href="/noticias" data-tv-focus="true" tabIndex={0} className="tv-focus flex items-center gap-3 rounded-full px-5 py-3 text-lg font-bold text-white/70">Todas as notícias <ArrowRight className="h-5 w-5" /></Link>
          </div>
          <div className="grid gap-7 xl:grid-cols-2">
            {news.slice(0, 2).map((article) => (
              <Link key={article.slug} href={`/noticias/${article.slug}`} data-tv-focus="true" tabIndex={0} className="focus-card group grid min-h-[270px] overflow-hidden rounded-3xl border border-white/10 bg-[#111516] sm:grid-cols-[42%_1fr]">
                <div className="relative min-h-[240px]"><Image src={article.image} alt="" fill sizes="400px" className="object-cover transition duration-500 group-focus:scale-105" /></div>
                <div className="p-7">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d9ff63]">{article.category}</p>
                  <h3 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.035em]">{article.title}</h3>
                  <p className="mt-4 line-clamp-3 text-lg leading-relaxed text-white/50">{article.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mx-[4.5vw] mt-8 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 py-10 text-base text-white/40">
          <span className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#d9ff63]" /> Filtro familiar ativo em canais, eventos e EPG.</span>
          <span>{live.source === "embedtv" ? `${live.channels.length} canais seguros disponíveis` : "Modo de catálogo local"} • VIVA TV</span>
        </footer>
      </div>
    </>
  );
}
