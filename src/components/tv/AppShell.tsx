"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, CalendarDays, Heart, Home, Newspaper, Radio, ShieldCheck, Trophy } from "lucide-react";

const links = [
  { href: "/", label: "Início", icon: Home },
  { href: "/canais", label: "Canais ao vivo", icon: Radio },
  { href: "/esportes", label: "Esportes", icon: Trophy },
  { href: "/guia", label: "Guia de TV", icon: CalendarDays },
  { href: "/minha-lista", label: "Minha lista", icon: Heart },
  { href: "/noticias", label: "Notícias", icon: Newspaper },
];

function Clock() {
  const [time, setTime] = useState("--:--");
  useEffect(() => {
    const update = () => setTime(new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date()));
    update();
    const timer = window.setInterval(update, 30000);
    return () => window.clearInterval(timer);
  }, []);
  return <span className="tabular-nums">{time}</span>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPlayer = pathname.startsWith("/assistir/");

  useEffect(() => {
    fetch("/api/profile").then((response) => response.ok ? response.json() : null).then((profile) => {
      if (profile?.reducedMotion) document.documentElement.dataset.reducedMotion = "true";
      if (typeof profile?.autoplay === "boolean") localStorage.setItem("viva-autoplay", String(profile.autoplay));
    }).catch(() => undefined);
  }, []);

  if (isPlayer) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#080b0c]">
      <aside data-sidebar className="sidebar group fixed inset-y-0 left-0 z-50 flex w-[108px] flex-col overflow-hidden border-r border-white/8 bg-[#0b0e10]/95 py-7 shadow-2xl backdrop-blur-xl transition-[width] duration-300 ease-out focus-within:w-[330px] hover:w-[330px]">
        <Link href="/" data-tv-focus="true" tabIndex={0} className="tv-focus mx-5 mb-10 flex h-16 shrink-0 items-center gap-5 rounded-2xl px-2" aria-label="VIVA — Início">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#d9ff63] text-2xl font-black italic tracking-[-0.12em] text-black">V</span>
          <span className="whitespace-nowrap text-3xl font-black tracking-[-0.06em] text-white opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">VIVA<span className="text-[#d9ff63]">.</span></span>
        </Link>
        <nav aria-label="Navegação principal" className="flex flex-col gap-2 px-4">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} data-tv-focus="true" data-nav="sidebar" tabIndex={0} aria-current={active ? "page" : undefined}
                className={`tv-focus relative flex h-[70px] shrink-0 items-center gap-5 rounded-2xl px-5 text-lg font-semibold transition-colors ${active ? "bg-white/10 text-[#e4ff91]" : "text-white/60"}`}>
                {active && <span className="absolute left-0 h-8 w-1 rounded-r-full bg-[#d9ff63]" />}
                <Icon className="h-7 w-7 shrink-0" strokeWidth={active ? 2.5 : 1.8} />
                <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-4">
          <div className="mx-2 mb-5 hidden whitespace-nowrap border-t border-white/10 pt-5 text-xs font-bold uppercase tracking-[0.18em] text-white/45 group-focus-within:flex group-hover:flex">
            <ShieldCheck className="mr-3 h-5 w-5 text-[#d9ff63]" /> Ambiente familiar
          </div>
          <Link href="/guia" data-tv-focus="true" tabIndex={0} className="tv-focus flex h-16 items-center gap-5 rounded-2xl px-5 text-white/65">
            <BookOpen className="h-7 w-7 shrink-0" />
            <span className="whitespace-nowrap text-base opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">Ajuda do controle</span>
          </Link>
        </div>
      </aside>
      <div className="pointer-events-none fixed right-8 top-6 z-40 flex items-center gap-5 rounded-full border border-white/10 bg-black/35 px-5 py-2.5 text-base font-medium text-white/75 backdrop-blur-md">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#d9ff63]" /> VIVA</span>
        <Clock />
      </div>
      <main id="main-content" className="ml-[108px] min-h-screen overflow-hidden">{children}</main>
      <div className="pointer-events-none fixed bottom-5 right-7 z-40 hidden items-center gap-3 rounded-full bg-black/45 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/45 backdrop-blur-md lg:flex">
        <span className="remote-key">↑↓←→</span> navegar <span className="remote-key">OK</span> selecionar <span className="remote-key">↩</span> voltar
      </div>
    </div>
  );
}
