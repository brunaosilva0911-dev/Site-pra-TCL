"use client";

import { CalendarDays, Radio, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { SportEvent } from "@/lib/types";
import { EventCard, eventStatus } from "./LiveEventsRail";

type Filter = "all" | "live" | "upcoming";

export function SportsBoard({ events }: { events: SportEvent[] }) {
  const [now, setNow] = useState(() => Date.now());
  const [filter, setFilter] = useState<Filter>("all");
  const [league, setLeague] = useState("all");
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const active = useMemo(() => events.filter((event) => eventStatus(event, now) !== "ended"), [events, now]);
  const leagues = useMemo(() => [...new Set(active.map((event) => event.league))].sort(), [active]);
  const visible = active.filter((event) => (filter === "all" || eventStatus(event, now) === filter) && (league === "all" || event.league === league));
  const liveCount = active.filter((event) => eventStatus(event, now) === "live").length;

  if (!active.length) return (
    <div className="mx-[4.5vw] my-16 rounded-3xl border border-white/10 bg-[#111516] p-12 text-center">
      <Trophy className="mx-auto h-14 w-14 text-white/25" /><h2 className="mt-6 text-3xl font-bold">Nenhum evento disponível agora</h2>
      <p className="mt-3 text-xl text-white/45">A agenda externa está vazia ou temporariamente indisponível. Nenhum horário foi simulado.</p>
    </div>
  );

  return (
    <div className="px-[4.5vw] py-9">
      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl border border-[#ff4d53]/20 bg-[#ff4d53]/8 p-6"><Radio className="h-7 w-7 text-[#ff6b70]" /><strong className="mt-4 block text-4xl">{liveCount}</strong><span className="text-lg text-white/50">eventos no ar</span></div>
        <div className="rounded-3xl border border-white/10 bg-white/4 p-6"><CalendarDays className="h-7 w-7 text-[#d9ff63]" /><strong className="mt-4 block text-4xl">{active.length - liveCount}</strong><span className="text-lg text-white/50">próximos eventos</span></div>
        <div className="rounded-3xl border border-white/10 bg-white/4 p-6"><Trophy className="h-7 w-7 text-[#d9ff63]" /><strong className="mt-4 block text-4xl">{leagues.length}</strong><span className="text-lg text-white/50">competições</span></div>
      </div>
      <div className="mt-9 flex flex-wrap items-center gap-3" data-nav-row="sports-status">
        {([{ id: "all", label: "Todos" }, { id: "live", label: "Ao vivo" }, { id: "upcoming", label: "Próximos" }] as { id: Filter; label: string }[]).map((item, index) => (
          <button key={item.id} type="button" data-tv-focus="true" data-autofocus={index === 0 ? "" : undefined} data-nav-row="sports-status" tabIndex={0} onClick={() => setFilter(item.id)} aria-pressed={filter === item.id}
            className={`tv-focus rounded-full border px-7 py-4 text-lg font-bold ${filter === item.id ? "border-[#d9ff63] bg-[#d9ff63] text-black" : "border-white/12 bg-white/5 text-white/65"}`}>{item.label}</button>
        ))}
        <span className="ml-auto text-lg text-white/40">Horários em Brasília</span>
      </div>
      <div data-nav-row="leagues" className="no-scrollbar mt-5 flex gap-3 overflow-x-auto py-3">
        {["all", ...leagues].map((item) => (
          <button key={item} type="button" data-tv-focus="true" data-nav-row="leagues" tabIndex={0} onClick={() => setLeague(item)} aria-pressed={league === item}
            className={`tv-focus shrink-0 rounded-xl border px-5 py-3 text-base font-semibold ${league === item ? "border-white/60 bg-white/15 text-white" : "border-white/8 text-white/45"}`}>{item === "all" ? "Todas as competições" : item}</button>
        ))}
      </div>
      <div className="mb-6 mt-5 flex items-center justify-between"><h2 className="text-3xl font-bold">{filter === "live" ? "Acontecendo agora" : filter === "upcoming" ? "Na agenda" : "Agenda esportiva"}</h2><span className="text-lg text-white/40">{visible.length} eventos</span></div>
      {visible.length ? <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">{visible.map((event) => <EventCard key={event.id} event={event} now={now} rowId="sports-grid" fluid />)}</div> : (
        <div className="rounded-3xl border border-dashed border-white/15 py-16 text-center"><p className="text-2xl text-white/50">Nenhum evento corresponde a estes filtros.</p><button type="button" data-tv-focus="true" tabIndex={0} onClick={() => { setFilter("all"); setLeague("all"); }} className="tv-focus mt-6 rounded-full bg-white/10 px-6 py-4 text-lg font-bold">Mostrar toda a agenda</button></div>
      )}
    </div>
  );
}
