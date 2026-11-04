"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Clock3, Heart, History, Play, Settings2, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { HistoryRecord, ProfileSettings } from "@/lib/types";
import { FavoriteButton, ReminderButton } from "./LibraryActions";
import { useLibrary } from "./LibraryProvider";
import { eventTime } from "@/components/content/LiveEventsRail";

type Tab = "overview" | "favorites" | "history" | "reminders" | "settings";
const tabs: { id: Tab; label: string; icon: typeof Heart }[] = [
  { id: "overview", label: "Visão geral", icon: Heart },
  { id: "favorites", label: "Favoritos", icon: Heart },
  { id: "history", label: "Continuar", icon: History },
  { id: "reminders", label: "Lembretes", icon: Bell },
  { id: "settings", label: "Ajustes", icon: Settings2 },
];

function EmptyState({ title, copy, href, action }: { title: string; copy: string; href: string; action: string }) {
  return <div className="rounded-3xl border border-dashed border-white/15 px-8 py-16 text-center"><h3 className="text-3xl font-bold">{title}</h3><p className="mx-auto mt-3 max-w-[600px] text-xl leading-relaxed text-white/45">{copy}</p><Link href={href} data-tv-focus="true" tabIndex={0} className="tv-focus mt-7 inline-flex rounded-full bg-[#d9ff63] px-7 py-4 text-lg font-black text-black">{action}</Link></div>;
}

export function MyListDashboard() {
  const { favorites, reminders, loading, error } = useLibrary();
  const [tab, setTab] = useState<Tab>("overview");
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileSettings>({ id: "main", name: "Sala de estar", avatarColor: "#d9ff63", autoplay: true, reducedMotion: false });
  const [saveMessage, setSaveMessage] = useState("");

  const loadHistory = useCallback(async () => {
    try { const response = await fetch("/api/history"); if (response.ok) { const data = await response.json(); setHistory(data.items ?? []); } }
    finally { setHistoryLoading(false); }
  }, []);
  useEffect(() => { void loadHistory(); }, [loadHistory]);
  useEffect(() => {
    fetch("/api/profile").then((response) => response.ok ? response.json() : null).then((data) => { if (data) setProfile(data); }).catch(() => undefined);
  }, []);

  const removeHistory = async (itemId?: string) => {
    await fetch(itemId ? `/api/history?itemId=${encodeURIComponent(itemId)}` : "/api/history", { method: "DELETE" });
    setHistory((current) => itemId ? current.filter((item) => item.itemId !== itemId) : []);
  };
  const saveProfile = async () => {
    const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
    if (response.ok) {
      localStorage.setItem("viva-autoplay", String(profile.autoplay));
      document.documentElement.dataset.reducedMotion = String(profile.reducedMotion);
      setSaveMessage("Ajustes salvos neste perfil."); window.setTimeout(() => setSaveMessage(""), 2500);
    } else setSaveMessage("Não foi possível salvar. Tente novamente.");
  };

  const favoriteCards = (limit?: number) => {
    const items = typeof limit === "number" ? favorites.slice(0, limit) : favorites;
    if (!items.length) return <EmptyState title="Sua lista está pronta para começar" copy="Use o botão Minha lista nos destaques ou o símbolo de adicionar nos canais para guardar o que você quer assistir." href="/" action="Explorar o catálogo" />;
    return <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">{items.map((item) => <article key={item.itemId} className="overflow-hidden rounded-3xl border border-white/10 bg-[#111516]"><Link href={`/assistir/${item.itemId}`} data-tv-focus="true" tabIndex={0} className="focus-card group relative block aspect-video overflow-hidden">{item.image ? <Image src={item.image} alt="" fill sizes="500px" className="object-cover transition duration-500 group-focus:scale-105" /> : <div className="grid h-full place-items-center bg-white/5"><Play className="h-12 w-12 text-white/25" /></div>}<div className="card-sheen absolute inset-0" /><div className="absolute inset-x-5 bottom-5"><span className="text-xs font-black uppercase tracking-widest text-[#d9ff63]">{item.itemType === "live" ? "Canal ao vivo" : item.itemType === "event" ? "Evento" : "Sob demanda"}</span><h3 className="mt-2 line-clamp-2 text-2xl font-bold">{item.title}</h3></div></Link><div className="flex items-center justify-between px-5 py-4"><span className="text-sm text-white/35">Salvo em {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(item.createdAt))}</span><FavoriteButton itemId={item.itemId} itemType={item.itemType} title={item.title} image={item.image ?? undefined} compact /></div></article>)}</div>;
  };

  const historyList = (limit?: number) => {
    const items = typeof limit === "number" ? history.slice(0, limit) : history;
    if (historyLoading) return <p className="py-12 text-xl text-white/45">Carregando seu progresso…</p>;
    if (!items.length) return <EmptyState title="Nenhum progresso salvo" copy="Ao assistir um filme, a VIVA guarda sua posição para você continuar do ponto certo." href="/" action="Escolher um filme" />;
    return <div className="space-y-4">{items.map((item) => { const progress = item.duration > 0 ? Math.min(100, item.position / item.duration * 100) : 0; return <article key={item.itemId} className="flex items-center gap-5 rounded-3xl border border-white/10 bg-[#111516] p-4"><Link href={`/assistir/${item.itemId}`} data-tv-focus="true" tabIndex={0} className="tv-focus relative h-[130px] w-[220px] shrink-0 overflow-hidden rounded-2xl bg-white/5">{item.image && <Image src={item.image} alt="" fill sizes="220px" className="object-cover" />}<span className="absolute inset-0 grid place-items-center bg-black/20"><Play className="h-9 w-9 fill-white" /></span></Link><div className="min-w-0 flex-1"><h3 className="truncate text-2xl font-bold">{item.title}</h3><p className="mt-2 text-base text-white/40">{item.itemType === "vod" ? `${Math.round(progress)}% assistido` : "Abrir transmissão ao vivo"}</p>{item.duration > 0 && <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[#d9ff63]" style={{ width: `${progress}%` }} /></div>}</div><Link href={`/assistir/${item.itemId}`} data-tv-focus="true" tabIndex={0} className="tv-focus rounded-full bg-[#d9ff63] px-6 py-4 text-lg font-black text-black">Continuar</Link><button type="button" data-tv-focus="true" tabIndex={0} onClick={() => void removeHistory(item.itemId)} className="tv-focus grid h-13 w-13 place-items-center rounded-full bg-white/6" aria-label={`Remover ${item.title} do histórico`}><Trash2 className="h-5 w-5" /></button></article>; })}</div>;
  };

  const reminderList = (limit?: number) => {
    const items = typeof limit === "number" ? reminders.slice(0, limit) : reminders;
    if (!items.length) return <EmptyState title="Nenhum lembrete agendado" copy="Selecione um jogo futuro ou um programa no Guia de TV para encontrá-lo aqui." href="/guia" action="Abrir o Guia de TV" />;
    return <div className="space-y-4">{items.map((item) => <article key={item.eventId} className="flex items-center gap-5 rounded-3xl border border-white/10 bg-[#111516] p-6"><span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#d9ff63]/10"><Bell className="h-7 w-7 text-[#d9ff63]" /></span><div className="min-w-0 flex-1"><h3 className="truncate text-2xl font-bold">{item.title}</h3><p className="mt-2 flex items-center gap-2 text-lg text-white/45"><Clock3 className="h-5 w-5" /> {eventTime(item.startsAt)}</p></div><ReminderButton eventId={item.eventId} title={item.title} startsAt={item.startsAt} /></article>)}</div>;
  };

  return (
    <div className="px-[4.5vw] py-8">
      <div data-nav-row="library-tabs" className="no-scrollbar flex gap-3 overflow-x-auto py-3">
        {tabs.map(({ id, label, icon: Icon }, index) => <button key={id} type="button" data-tv-focus="true" data-autofocus={index === 0 ? "" : undefined} data-nav-row="library-tabs" tabIndex={0} onClick={() => setTab(id)} aria-pressed={tab === id} className={`tv-focus flex h-14 shrink-0 items-center gap-3 rounded-full border px-6 text-lg font-bold ${tab === id ? "border-[#d9ff63] bg-[#d9ff63] text-black" : "border-white/10 bg-white/5 text-white/55"}`}><Icon className="h-5 w-5" /> {label}{id === "favorites" && favorites.length > 0 && <span className="rounded-full bg-black/15 px-2 text-sm">{favorites.length}</span>}</button>)}
      </div>
      {error && <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-lg text-white/55">{error}</p>}
      {loading ? <p className="py-16 text-2xl text-white/45">Sincronizando sua biblioteca…</p> : <>
        {tab === "overview" && <div className="mt-8 space-y-14"><section><div className="mb-5 flex items-center justify-between"><h2 className="text-3xl font-bold">Continue de onde parou</h2>{history.length > 3 && <button type="button" data-tv-focus="true" tabIndex={0} onClick={() => setTab("history")} className="tv-focus rounded-full px-4 py-2 text-lg text-[#d9ff63]">Ver todo o histórico</button>}</div>{historyList(3)}</section><section><h2 className="mb-5 text-3xl font-bold">Seus favoritos</h2>{favoriteCards(3)}</section><section><h2 className="mb-5 text-3xl font-bold">Próximos lembretes</h2>{reminderList(3)}</section></div>}
        {tab === "favorites" && <section className="mt-8"><div className="mb-6"><h2 className="text-3xl font-bold">Títulos e canais salvos</h2><p className="mt-2 text-lg text-white/40">{favorites.length} itens neste perfil</p></div>{favoriteCards()}</section>}
        {tab === "history" && <section className="mt-8"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-3xl font-bold">Histórico e progresso</h2><p className="mt-2 text-lg text-white/40">O progresso é atualizado durante a reprodução e ao pausar.</p></div>{history.length > 0 && <button type="button" data-tv-focus="true" tabIndex={0} onClick={() => void removeHistory()} className="tv-focus flex items-center gap-2 rounded-full border border-white/12 px-5 py-3 font-bold"><Trash2 className="h-5 w-5" /> Limpar histórico</button>}</div>{historyList()}</section>}
        {tab === "reminders" && <section className="mt-8"><h2 className="mb-6 text-3xl font-bold">Agenda de lembretes</h2>{reminderList()}</section>}
      </>}
      {tab === "settings" && <section className="mt-8 grid max-w-[1100px] gap-6">
        <div className="rounded-3xl border border-white/10 bg-[#111516] p-8"><div className="flex items-center gap-5"><span className="grid h-20 w-20 place-items-center rounded-full text-black" style={{ background: profile.avatarColor }}><UserRound className="h-9 w-9" /></span><div><h2 className="text-3xl font-bold">Perfil da sala</h2><p className="mt-1 text-lg text-white/40">Preferências salvas no PostgreSQL</p></div></div><label className="mt-8 block text-base font-bold uppercase tracking-wider text-white/45" htmlFor="profile-name">Nome do perfil</label><input id="profile-name" data-tv-focus="true" tabIndex={0} value={profile.name} maxLength={40} onChange={(event) => setProfile((value) => ({ ...value, name: event.target.value }))} className="mt-3 h-16 w-full rounded-2xl border border-white/12 bg-white/5 px-5 text-2xl outline-none focus:border-[#d9ff63]" /></div>
        {[{ key: "autoplay" as const, title: "Reprodução automática", copy: "Inicia o vídeo ou stream assim que o player abrir." }, { key: "reducedMotion" as const, title: "Reduzir movimento", copy: "Desativa parallax, transições amplas e rotação automática do destaque." }].map((setting) => <div key={setting.key} className="flex items-center justify-between gap-8 rounded-3xl border border-white/10 bg-[#111516] p-7"><div><h3 className="text-2xl font-bold">{setting.title}</h3><p className="mt-2 text-lg text-white/45">{setting.copy}</p></div><button type="button" role="switch" aria-checked={profile[setting.key]} data-tv-focus="true" tabIndex={0} onClick={() => setProfile((value) => ({ ...value, [setting.key]: !value[setting.key] }))} className={`tv-focus relative h-12 w-24 shrink-0 rounded-full p-1 ${profile[setting.key] ? "bg-[#d9ff63]" : "bg-white/15"}`}><span className={`block h-10 w-10 rounded-full bg-white shadow transition-transform ${profile[setting.key] ? "translate-x-12" : ""}`} /></button></div>)}
        <div className="flex items-center gap-2 rounded-2xl bg-[#d9ff63]/8 p-5 text-lg text-[#e4ff91]"><ShieldCheck className="h-6 w-6 shrink-0" /> A proteção contra conteúdo adulto é permanente e não pode ser desativada.</div>
        <div className="flex items-center gap-5"><button type="button" data-tv-focus="true" tabIndex={0} onClick={() => void saveProfile()} className="tv-focus rounded-full bg-[#d9ff63] px-8 py-4 text-xl font-black text-black">Salvar ajustes</button><span aria-live="polite" className="text-lg text-white/55">{saveMessage}</span></div>
      </section>}
    </div>
  );
}
