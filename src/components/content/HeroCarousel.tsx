"use client";

import Image from "next/image";
import Link from "next/link";
import { Info, Play, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { VodItem } from "@/lib/types";
import { FavoriteButton } from "@/components/library/LibraryActions";

export function HeroCarousel({ items }: { items: VodItem[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const current = items[active];

  const next = useCallback(() => setActive((index) => (index + 1) % items.length), [items.length]);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.reducedMotion === "true";
    const autoplay = localStorage.getItem("viva-autoplay") !== "false";
    if (reduced || !autoplay) return;
    const timer = window.setInterval(next, 8500);
    return () => window.clearInterval(timer);
  }, [next, paused, items.length, active]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!rootRef.current || !mediaRef.current || !copyRef.current) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.reducedMotion === "true";
      if (reduced) return;
      const progress = Math.max(0, Math.min(1, window.scrollY / (rootRef.current.offsetHeight * 0.9)));
      mediaRef.current.style.transform = `translate3d(0, ${progress * 90}px, 0) scale(${1.04 + progress * 0.12})`;
      mediaRef.current.style.filter = `brightness(${1 - progress * 0.45})`;
      copyRef.current.style.transform = `translate3d(0, ${progress * 150}px, 0)`;
      copyRef.current.style.opacity = String(Math.max(0, 1 - progress * 1.45));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  if (!current) return null;
  return (
    <section ref={rootRef} aria-roledescription="carrossel" aria-label="Destaques VIVA" className="relative h-screen min-h-[720px] overflow-hidden supports-[height:100svh]:h-[100svh]"
      onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
      <div ref={mediaRef} className="absolute -inset-[4%] will-change-transform">
        {items.map((item, index) => (
          <Image key={item.id} src={item.backdrop} alt="" fill priority={index === 0} sizes="100vw"
            className={`object-cover object-center transition-opacity duration-1000 ${index === active ? "opacity-100" : "opacity-0"}`} />
        ))}
      </div>
      <div className="hero-vignette absolute inset-0" />
      <div className="absolute -left-24 top-1/4 h-[420px] w-[420px] rounded-full bg-[#d9ff63]/5 blur-[120px]" />
      <div ref={copyRef} className="absolute inset-x-0 bottom-[15vh] px-[4.5vw] will-change-transform">
        <div key={current.id} className="max-w-[820px]">
          <div className="animate-enter-up flex items-center gap-3 text-base font-black uppercase tracking-[0.24em] text-[#d9ff63]">
            <span className="h-px w-10 bg-[#d9ff63]" /> {current.eyebrow}
          </div>
          <h1 className="animate-reveal mt-5 text-balance text-[clamp(4rem,6.5vw,7.6rem)] font-black leading-[0.88] tracking-[-0.07em] text-white drop-shadow-2xl">{current.title}</h1>
          <div className="animate-enter-up mt-7 flex items-center gap-4 text-lg font-semibold text-white/75 [animation-delay:120ms]">
            <span className="rounded-md border border-white/30 px-2.5 py-1 text-sm">{current.maturity}</span>
            <span>{current.year}</span><span className="text-white/25">•</span><span>{current.duration}</span><span className="text-white/25">•</span><span>{current.genres[0]}</span>
          </div>
          <p className="animate-enter-up mt-5 max-w-[700px] text-balance text-xl leading-relaxed text-white/72 [animation-delay:180ms] lg:text-2xl">{current.description}</p>
          <div className="animate-enter-up mt-8 flex flex-wrap items-center gap-4 [animation-delay:240ms]">
            <Link href={`/assistir/${current.id}`} data-tv-focus="true" data-autofocus={active === 0 ? "" : undefined} tabIndex={0}
              className="tv-focus inline-flex h-16 items-center gap-3 rounded-full bg-[#d9ff63] px-8 text-xl font-black text-black">
              <Play className="h-6 w-6 fill-current" /> Assistir agora
            </Link>
            <FavoriteButton itemId={current.id} itemType="vod" title={current.title} image={current.image} />
            <Link href={`/noticias/hls-no-player-viva`} data-tv-focus="true" tabIndex={0} className="tv-focus grid h-16 w-16 place-items-center rounded-full border border-white/20 bg-white/8" aria-label="Sobre a reprodução">
              <Info className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>
      <div className="absolute bottom-[7vh] right-[4.5vw] flex items-center gap-3">
        {items.map((item, index) => (
          <button key={item.id} type="button" data-tv-focus="true" tabIndex={0} onClick={() => setActive(index)} aria-label={`Mostrar ${item.title}`} aria-current={index === active ? "true" : undefined}
            className={`tv-focus h-3 rounded-full ${index === active ? "w-16 bg-[#d9ff63]" : "w-8 bg-white/35"}`} />
        ))}
      </div>
      <div className="absolute bottom-7 left-[4.5vw] flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/35">
        <ShieldCheck className="h-4 w-4" /> Curadoria segura para toda a família
      </div>
    </section>
  );
}
