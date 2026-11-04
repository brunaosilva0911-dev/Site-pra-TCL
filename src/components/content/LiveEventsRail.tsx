"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CalendarClock, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import type { SportEvent } from "@/lib/types";
import { ReminderButton } from "@/components/library/LibraryActions";

export function eventStatus(event: SportEvent, now: number) {
  const start = new Date(event.startsAt).getTime();
  const end = new Date(event.endsAt).getTime();
  if (now >= start && now <= end) return "live" as const;
  if (now < start) return "upcoming" as const;
  return "ended" as const;
}

export function eventTime(value: string, includeDay = true) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    ...(includeDay ? { weekday: "short", day: "2-digit", month: "short" } : {}),
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(value)).replace(".", "");
}

export function EventCard({ event, now, rowId, fluid = false }: { event: SportEvent; now: number; rowId: string; fluid?: boolean }) {
  const router = useRouter();
  const status = eventStatus(event, now);
  const playable = status === "live" && event.players.length > 0;
  const activate = () => {
    if (playable) router.push(`/assistir/evento-${event.id}`);
  };
  return (
    <article className={`${fluid ? "w-full" : "w-[390px] shrink-0 snap-start md:w-[440px]"} overflow-hidden rounded-3xl border bg-[#111516] ${playable ? "border-white/10" : "border-white/8"}`}>
      <div
        role={playable ? "button" : "group"} tabIndex={playable ? 0 : undefined}
        data-tv-focus={playable ? "true" : undefined} data-nav-row={playable ? rowId : undefined}
        onClick={activate} onKeyDown={(keyEvent) => { if (playable && keyEvent.key === "Enter") activate(); }}
        className={`tv-focus relative min-h-[255px] p-6 ${playable ? "focus-card" : ""}`}>
        <div className="flex items-center justify-between gap-4">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em] ${status === "live" ? "bg-[#ff4d53] text-white" : "bg-white/8 text-white/60"}`}>
            {status === "live" ? <><span className="live-dot h-2 w-2 rounded-full bg-white" /> Ao vivo</> : <><CalendarClock className="h-4 w-4" /> Em breve</>}
          </span>
          <span className="truncate text-sm font-semibold text-white/50">{event.league}</span>
        </div>
        <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {[{ name: event.homeTeam, image: event.homeImage }, { name: event.awayTeam, image: event.awayImage }].map((team, index) => (
            <div key={`${team.name}-${index}`} className={index === 1 ? "col-start-3 text-right" : "col-start-1"}>
              {team.image ? <Image src={team.image} alt="" width={56} height={56} className={`mb-3 h-14 w-14 object-contain ${index === 1 ? "ml-auto" : ""}`} /> : <div className={`mb-3 h-14 w-14 rounded-full bg-white/8 ${index === 1 ? "ml-auto" : ""}`} />}
              <p className="line-clamp-2 text-xl font-bold leading-tight">{team.name}</p>
            </div>
          ))}
          <span className="row-start-1 col-start-2 self-center text-sm font-black text-white/25">X</span>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-white/8 pt-4">
          <span className="text-base font-medium text-white/60">{eventTime(event.startsAt)}</span>
          {status === "upcoming" && <ReminderButton eventId={event.id} title={event.title} startsAt={event.startsAt} compact />}
          {status === "live" && !playable && <span className="text-sm font-semibold text-white/40">Sinal indisponível</span>}
          {playable && <Radio className="h-5 w-5 text-[#d9ff63]" />}
        </div>
      </div>
    </article>
  );
}

export function LiveEventsRail({ title = "Esportes ao vivo", events, rowId = "live-events" }: { title?: string; events: SportEvent[]; rowId?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 30000);
    return () => window.clearInterval(timer);
  }, []);
  const visible = events.filter((event) => eventStatus(event, now) !== "ended").slice(0, 14);
  if (!visible.length) return null;
  return (
    <section className="py-7" aria-labelledby={`${rowId}-heading`}>
      <div className="mb-5 flex items-end justify-between px-[4.5vw]">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-[#ff6b70]">Tempo real</p>
          <h2 id={`${rowId}-heading`} className="text-3xl font-bold tracking-[-0.035em] lg:text-4xl">{title}</h2>
        </div>
        <span className="text-base text-white/40">Horários de Brasília</span>
      </div>
      <div data-nav-row={rowId} className="no-scrollbar flex snap-x gap-6 overflow-x-auto px-[4.5vw] py-5">
        {visible.map((event) => <EventCard key={event.id} event={event} now={now} rowId={rowId} />)}
        <div className="w-[2vw] shrink-0" />
      </div>
    </section>
  );
}
