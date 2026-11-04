"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell, CalendarClock, ChevronLeft, ChevronRight, Clock3, Play, Radio, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChannelCategory, EpgProgram, LiveChannel } from "@/lib/types";
import { ReminderButton } from "@/components/library/LibraryActions";
import { useLibrary } from "@/components/library/LibraryProvider";

const SLOT_MINUTES = 30;
const SLOT_COUNT = 12;
const SLOT_WIDTH = 190;
const CHANNEL_WIDTH = 260;
const HOUR = 60 * 60 * 1000;
const WINDOW_MS = SLOT_MINUTES * SLOT_COUNT * 60 * 1000;
const TIMELINE_WIDTH = SLOT_COUNT * SLOT_WIDTH;

function hourFloor(date: Date) {
  const value = new Date(date);
  value.setMinutes(0, 0, 0);
  return value;
}

function timeLabel(value: Date | string, withDay = false) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    ...(withDay ? { weekday: "short", day: "2-digit", month: "2-digit" } : {}),
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

type SelectedProgram = { program: EpgProgram; channel: LiveChannel };

function ProgramDialog({ selected, now, onClose }: { selected: SelectedProgram; now: number; onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const { program, channel } = selected;
  const live = new Date(program.startsAt).getTime() <= now && new Date(program.endsAt).getTime() > now;
  const future = new Date(program.startsAt).getTime() > now;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => {
      const preferred = dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]");
      const target = preferred?.matches('[data-tv-focus="true"]') ? preferred : preferred?.querySelector<HTMLElement>('[data-tv-focus="true"]');
      (target ?? dialogRef.current?.querySelector<HTMLElement>('[data-tv-focus="true"]'))?.focus();
    }, 80);
    const onBack = (event: Event) => { event.preventDefault(); onClose(); };
    window.addEventListener("viva:back", onBack);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("viva:back", onBack);
      previous?.focus({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/75 p-12 backdrop-blur-md" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} data-focus-trap role="dialog" aria-modal="true" aria-labelledby="program-title" className="animate-enter-up w-full max-w-[900px] overflow-hidden rounded-[32px] border border-white/15 bg-[#121718] shadow-2xl">
        <div className="flex items-start justify-between gap-6 border-b border-white/10 p-8">
          <div className="flex items-center gap-5">
            <div className="grid h-20 w-28 place-items-center rounded-2xl bg-white p-3">{channel.image && <Image src={channel.image} alt={channel.name} width={100} height={65} className="max-h-14 object-contain" />}</div>
            <div><p className="text-lg font-semibold text-white/45">{channel.name}</p><p className={`mt-1 flex items-center gap-2 text-sm font-black uppercase tracking-widest ${live ? "text-[#ff6b70]" : "text-[#d9ff63]"}`}>{live ? <><span className="live-dot h-2 w-2 rounded-full bg-[#ff4d53]" /> No ar agora</> : future ? "Em breve" : "Exibido"}</p></div>
          </div>
          <button type="button" data-tv-focus="true" tabIndex={0} onClick={onClose} className="tv-focus grid h-14 w-14 place-items-center rounded-full bg-white/8" aria-label="Fechar detalhes"><X className="h-7 w-7" /></button>
        </div>
        <div className="p-9">
          <h2 id="program-title" className="text-5xl font-black leading-tight tracking-[-0.05em]">{program.title}</h2>
          <p className="mt-5 flex items-center gap-3 text-xl font-semibold text-[#d9ff63]"><Clock3 className="h-6 w-6" /> {timeLabel(program.startsAt, true)} — {timeLabel(program.endsAt)}</p>
          <p className="mt-6 text-2xl leading-relaxed text-white/60">{program.description}</p>
          <div className="mt-9 flex items-center gap-4">
            {live && <button type="button" data-tv-focus="true" data-autofocus tabIndex={0} onClick={() => router.push(`/assistir/canal-${channel.id}`)} className="tv-focus flex h-16 items-center gap-3 rounded-full bg-[#d9ff63] px-8 text-xl font-black text-black"><Play className="h-6 w-6 fill-current" /> Assistir ao vivo</button>}
            {future && <div data-autofocus><ReminderButton eventId={`epg-${program.id}`} title={`${program.title} — ${channel.name}`} startsAt={program.startsAt} /></div>}
            {!live && !future && <span className="rounded-full bg-white/8 px-6 py-4 text-lg font-semibold text-white/45">Este programa já foi exibido</span>}
            <button type="button" data-tv-focus="true" data-autofocus={!live && !future ? "" : undefined} tabIndex={0} onClick={onClose} className="tv-focus h-16 rounded-full border border-white/15 px-7 text-lg font-bold">Voltar à grade</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EpgGrid({ channels, categories, programs }: { channels: LiveChannel[]; categories: ChannelCategory[]; programs: EpgProgram[] }) {
  const [windowStart, setWindowStart] = useState(() => hourFloor(new Date()));
  const [now, setNow] = useState(() => Date.now());
  const [category, setCategory] = useState(0);
  const [limit, setLimit] = useState(16);
  const [selected, setSelected] = useState<SelectedProgram | null>(null);
  const { isReminder } = useLibrary();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredChannels = useMemo(() => channels.filter((channel) => category === 0 || channel.categories.includes(category)), [channels, category]);
  const visibleChannels = filteredChannels.slice(0, limit);
  const windowEnd = windowStart.getTime() + WINDOW_MS;
  const channelMap = useMemo(() => new Map(channels.map((channel) => [channel.id, channel])), [channels]);
  const slots = Array.from({ length: SLOT_COUNT }, (_, index) => new Date(windowStart.getTime() + index * SLOT_MINUTES * 60 * 1000));
  const nowPosition = CHANNEL_WIDTH + ((now - windowStart.getTime()) / WINDOW_MS) * TIMELINE_WIDTH;

  if (!channels.length) return <div className="mx-[4.5vw] my-16 rounded-3xl border border-white/10 bg-[#111516] p-12 text-center"><Radio className="mx-auto h-14 w-14 text-white/30" /><h2 className="mt-5 text-3xl font-bold">Guia indisponível</h2><p className="mt-3 text-xl text-white/45">Não foi possível obter uma grade segura da fonte externa.</p></div>;

  return (
    <div className="py-7">
      <div className="flex flex-wrap items-center gap-4 px-[4.5vw]">
        <div data-nav-row="epg-time" className="flex items-center gap-3">
          <button type="button" data-tv-focus="true" data-nav-row="epg-time" tabIndex={0} onClick={() => setWindowStart((value) => new Date(value.getTime() - 3 * HOUR))} className="tv-focus flex h-14 items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 font-bold"><ChevronLeft className="h-5 w-5" /> 3 horas</button>
          <button type="button" data-tv-focus="true" data-autofocus data-nav-row="epg-time" tabIndex={0} onClick={() => setWindowStart(hourFloor(new Date()))} className="tv-focus flex h-14 items-center gap-2 rounded-full bg-[#d9ff63] px-6 font-black text-black"><CalendarClock className="h-5 w-5" /> Agora</button>
          <button type="button" data-tv-focus="true" data-nav-row="epg-time" tabIndex={0} onClick={() => setWindowStart((value) => new Date(value.getTime() + 3 * HOUR))} className="tv-focus flex h-14 items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 font-bold">3 horas <ChevronRight className="h-5 w-5" /></button>
        </div>
        <div className="ml-3"><strong className="block text-xl capitalize">{timeLabel(windowStart, true)}</strong><span className="text-sm text-white/40">Janela de seis horas</span></div>
        <span className="ml-auto text-base text-white/40">Selecione um programa para ver detalhes</span>
      </div>
      <div data-nav-row="epg-categories" className="no-scrollbar mt-5 flex gap-3 overflow-x-auto px-[4.5vw] py-3">
        {[{ id: 0, name: "Todos os canais" }, ...categories].map((item) => <button key={item.id} type="button" data-tv-focus="true" data-nav-row="epg-categories" tabIndex={0} onClick={() => { setCategory(item.id); setLimit(16); }} aria-pressed={category === item.id} className={`tv-focus shrink-0 rounded-full border px-5 py-3 text-base font-bold ${category === item.id ? "border-[#d9ff63] bg-[#d9ff63]/12 text-[#e4ff91]" : "border-white/10 text-white/45"}`}>{item.name}</button>)}
      </div>

      <div className="no-scrollbar mx-[4.5vw] mt-4 max-h-[980px] overflow-auto rounded-3xl border border-white/10 bg-[#0d1112]">
        <div style={{ width: CHANNEL_WIDTH + TIMELINE_WIDTH }} className="relative">
          <div className="sticky top-0 z-40 flex h-[74px] bg-[#121718]/95 backdrop-blur-xl">
            <div className="sticky left-0 z-50 flex w-[260px] shrink-0 items-center border-b border-r border-white/10 bg-[#121718] px-6 text-sm font-black uppercase tracking-widest text-white/40">Canal / Horário</div>
            {slots.map((slot) => <div key={slot.toISOString()} style={{ width: SLOT_WIDTH }} className="flex shrink-0 items-center border-b border-r border-white/8 px-5 text-lg font-bold tabular-nums text-white/55">{timeLabel(slot)}</div>)}
          </div>
          {now >= windowStart.getTime() && now <= windowEnd && <div className="pointer-events-none absolute bottom-0 top-[74px] z-30 w-0.5 bg-[#ff4d53]" style={{ left: nowPosition }}><span className="absolute -left-1 top-0 h-2.5 w-2.5 rounded-full bg-[#ff4d53]" /></div>}
          {visibleChannels.map((channel) => {
            const channelPrograms = programs.filter((program) => program.channelId === channel.id && new Date(program.endsAt).getTime() > windowStart.getTime() && new Date(program.startsAt).getTime() < windowEnd);
            return (
              <div key={channel.id} className="flex h-[142px] border-b border-white/8">
                <button type="button" data-tv-focus="true" tabIndex={0} onClick={() => { const current = programs.find((program) => program.channelId === channel.id && new Date(program.startsAt).getTime() <= now && new Date(program.endsAt).getTime() > now); if (current) setSelected({ program: current, channel }); }}
                  className="tv-focus sticky left-0 z-20 flex w-[260px] shrink-0 items-center gap-4 border-r border-white/10 bg-[#121718] px-5 text-left">
                  <span className="grid h-16 w-20 shrink-0 place-items-center rounded-xl bg-white p-2">{channel.image ? <Image src={channel.image} alt="" width={72} height={52} className="max-h-12 object-contain" /> : <Radio className="h-7 w-7 text-black" />}</span>
                  <span className="min-w-0"><strong className="block truncate text-lg">{channel.name}</strong><span className="mt-1 block truncate text-xs text-white/35">{channel.categoryNames[0] ?? "Ao vivo"}</span></span>
                </button>
                <div className="relative h-full shrink-0" style={{ width: TIMELINE_WIDTH }}>
                  {slots.map((slot) => <span key={slot.toISOString()} className="absolute inset-y-0 border-r border-white/6" style={{ left: (slot.getTime() - windowStart.getTime()) / WINDOW_MS * TIMELINE_WIDTH, width: SLOT_WIDTH }} />)}
                  {channelPrograms.map((program) => {
                    const start = new Date(program.startsAt).getTime();
                    const end = new Date(program.endsAt).getTime();
                    const clippedStart = Math.max(start, windowStart.getTime());
                    const clippedEnd = Math.min(end, windowEnd);
                    const left = (clippedStart - windowStart.getTime()) / WINDOW_MS * TIMELINE_WIDTH;
                    const width = Math.max(54, (clippedEnd - clippedStart) / WINDOW_MS * TIMELINE_WIDTH - 7);
                    const live = start <= now && end > now;
                    const future = start > now;
                    const reminder = isReminder(`epg-${program.id}`);
                    return (
                      <button key={program.id} type="button" data-tv-focus="true" data-nav-row={`epg-${channel.id}`} tabIndex={0} onClick={() => setSelected({ program, channel })}
                        style={{ left, width }} className={`tv-focus absolute inset-y-[10px] overflow-hidden rounded-xl border p-4 text-left ${live ? "border-[#d9ff63]/50 bg-[#d9ff63]/15" : future ? "border-white/10 bg-[#1a2021]" : "border-white/6 bg-[#141819] opacity-55"}`}>
                        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">{live && <span className="h-2 w-2 rounded-full bg-[#d9ff63]" />}{timeLabel(program.startsAt)}{reminder && <Bell className="h-3.5 w-3.5 text-[#d9ff63]" />}</span>
                        <strong className="mt-2 line-clamp-2 text-lg leading-tight">{program.title}</strong>
                      </button>
                    );
                  })}
                  {!channelPrograms.length && <div className="absolute inset-0 grid place-items-center text-base text-white/20">Sem informações nesta janela</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {limit < filteredChannels.length && <button type="button" data-tv-focus="true" tabIndex={0} onClick={() => setLimit((value) => value + 16)} className="tv-focus mx-auto mt-7 block rounded-full border border-white/15 bg-white/6 px-8 py-4 text-lg font-bold">Mostrar mais {Math.min(16, filteredChannels.length - limit)} canais</button>}
      {selected && channelMap.has(selected.channel.id) && <ProgramDialog selected={selected} now={now} onClose={() => setSelected(null)} />}
    </div>
  );
}
