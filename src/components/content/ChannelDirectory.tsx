"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { ChannelCategory, EpgProgram, LiveChannel } from "@/lib/types";
import { FavoriteButton } from "@/components/library/LibraryActions";

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function ChannelDirectory({ channels, categories, epg }: { channels: LiveChannel[]; categories: ChannelCategory[]; epg: EpgProgram[] }) {
  const router = useRouter();
  const [category, setCategory] = useState(0);
  const [query, setQuery] = useState("");
  const now = Date.now();
  const currentPrograms = useMemo(() => new Map(epg.filter((program) => {
    const start = new Date(program.startsAt).getTime();
    return start <= now && new Date(program.endsAt).getTime() > now;
  }).map((program) => [program.channelId, program])), [epg, now]);
  const filtered = channels.filter((channel) => {
    const inCategory = category === 0 || channel.categories.includes(category);
    const haystack = normalized(`${channel.name} ${channel.categoryNames.join(" ")}`);
    return inCategory && haystack.includes(normalized(query));
  });

  if (!channels.length) return (
    <div className="mx-[4.5vw] my-16 rounded-3xl border border-white/10 bg-[#111516] p-12 text-center">
      <Radio className="mx-auto h-14 w-14 text-white/30" />
      <h2 className="mt-6 text-3xl font-bold">Nenhum canal seguro disponível</h2>
      <p className="mx-auto mt-3 max-w-[650px] text-xl text-white/50">A fonte externa pode estar offline ou os itens recebidos foram bloqueados pela política familiar.</p>
      <button type="button" data-tv-focus="true" data-autofocus tabIndex={0} onClick={() => router.refresh()} className="tv-focus mx-auto mt-8 flex h-16 items-center gap-3 rounded-full bg-[#d9ff63] px-8 text-xl font-black text-black"><RefreshCw className="h-6 w-6" /> Tentar novamente</button>
    </div>
  );

  return (
    <div className="px-[4.5vw] py-8">
      <div className="flex flex-wrap items-center gap-5">
        <label className="glass flex h-16 min-w-[360px] flex-1 items-center gap-4 rounded-full px-6 focus-within:border-[#d9ff63]">
          <Search className="h-6 w-6 text-white/45" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} data-tv-focus="true" tabIndex={0} type="search" placeholder="Buscar um canal" aria-label="Buscar um canal"
            className="h-full w-full bg-transparent text-xl text-white outline-none placeholder:text-white/35 focus:!shadow-none" />
        </label>
        <span className="flex items-center gap-2 text-base font-semibold text-white/45"><ShieldCheck className="h-5 w-5 text-[#d9ff63]" /> {channels.length} canais aprovados</span>
      </div>
      <div data-nav-row="channel-categories" className="no-scrollbar mt-7 flex gap-3 overflow-x-auto py-3">
        {[{ id: 0, name: "Todos" }, ...categories].map((item, index) => (
          <button key={item.id} type="button" data-tv-focus="true" data-autofocus={index === 0 ? "" : undefined} data-nav-row="channel-categories" tabIndex={0}
            onClick={() => setCategory(item.id)} aria-pressed={category === item.id}
            className={`tv-focus h-13 shrink-0 rounded-full border px-6 py-3 text-lg font-bold ${category === item.id ? "border-[#d9ff63] bg-[#d9ff63] text-black" : "border-white/12 bg-white/5 text-white/65"}`}>{item.name}</button>
        ))}
      </div>
      <div className="mb-6 mt-5 flex items-center justify-between">
        <p className="text-lg text-white/45"><strong className="text-white">{filtered.length}</strong> {filtered.length === 1 ? "canal encontrado" : "canais encontrados"}</p>
        <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#ff6b70]"><span className="live-dot h-2 w-2 rounded-full bg-[#ff4d53]" /> Transmissão contínua</span>
      </div>
      {filtered.length ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((channel) => {
            const program = currentPrograms.get(channel.id);
            return (
              <article key={channel.id} className="overflow-hidden rounded-3xl border border-white/10 bg-[#111516]">
                <Link href={`/assistir/canal-${channel.id}`} data-tv-focus="true" tabIndex={0} className="focus-card group relative block h-[210px] overflow-hidden">
                  {channel.preview ? <Image src={channel.preview} alt="" fill sizes="520px" className="object-cover opacity-55 transition duration-500 group-focus:scale-105 group-focus:opacity-75" /> : <div className="absolute inset-0 bg-gradient-to-br from-[#26302b] to-[#101414]" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111516] via-transparent to-black/20" />
                  <div className="absolute left-6 top-6 flex h-20 w-32 items-center justify-center rounded-2xl bg-white p-3">
                    {channel.image ? <Image src={channel.image} alt={channel.name} width={120} height={70} className="max-h-16 w-auto object-contain" /> : <span className="font-black text-black">{channel.name}</span>}
                  </div>
                  <span className="absolute right-5 top-5 rounded-full bg-[#ff4d53] px-3 py-1.5 text-xs font-black uppercase tracking-widest">Ao vivo</span>
                  <div className="absolute bottom-5 left-6 right-6">
                    <h2 className="text-3xl font-bold tracking-[-0.035em]">{channel.name}</h2>
                    <p className="mt-2 truncate text-lg text-white/55">{program ? `Agora: ${program.title}` : channel.categoryNames.join(" • ") || "Programação ao vivo"}</p>
                  </div>
                </Link>
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="truncate text-base text-white/40">{channel.categoryNames.join(" • ") || "TV aberta"}</span>
                  <FavoriteButton itemId={`canal-${channel.id}`} itemType="live" title={channel.name} image={channel.image} compact />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/15 py-20 text-center">
          <h2 className="text-3xl font-bold">Nada por aqui</h2><p className="mt-3 text-xl text-white/45">Tente outro nome ou selecione a categoria Todos.</p>
          <button type="button" data-tv-focus="true" tabIndex={0} onClick={() => { setQuery(""); setCategory(0); }} className="tv-focus mt-7 rounded-full bg-white/10 px-7 py-4 text-lg font-bold">Limpar filtros</button>
        </div>
      )}
    </div>
  );
}
