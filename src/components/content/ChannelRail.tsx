"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import type { LiveChannel } from "@/lib/types";

export function ChannelRail({ channels, title = "Canais para assistir agora", rowId = "channels" }: { channels: LiveChannel[]; title?: string; rowId?: string }) {
  if (!channels.length) return null;
  return (
    <section className="py-7" aria-labelledby={`${rowId}-title`}>
      <div className="mb-5 px-[4.5vw]">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-[#d9ff63]">TV ao vivo</p>
        <h2 id={`${rowId}-title`} className="text-3xl font-bold tracking-[-0.035em] lg:text-4xl">{title}</h2>
      </div>
      <div data-nav-row={rowId} className="no-scrollbar flex snap-x gap-6 overflow-x-auto px-[4.5vw] py-5">
        {channels.map((channel) => (
          <Link key={channel.id} href={`/assistir/canal-${channel.id}`} data-tv-focus="true" data-nav-row={rowId} tabIndex={0}
            className="focus-card group relative aspect-[16/10] w-[330px] shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 bg-[#121718] md:w-[370px]">
            {channel.preview && <Image src={channel.preview} alt="" fill sizes="370px" className="object-cover opacity-55 transition duration-500 group-focus:scale-105 group-focus:opacity-75" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
            <div className="absolute left-5 top-5 flex h-20 w-28 items-center justify-center rounded-2xl bg-white/95 p-3 shadow-xl">
              {channel.image ? <Image src={channel.image} alt={channel.name} width={100} height={64} className="max-h-16 w-auto object-contain" /> : <span className="text-lg font-black text-black">{channel.name}</span>}
            </div>
            <span className="absolute right-5 top-5 rounded-full bg-[#ff4d53] px-3 py-1 text-xs font-black uppercase tracking-widest">Live</span>
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-2xl font-bold">{channel.name}</h3>
                <p className="mt-1 line-clamp-1 text-base text-white/50">{channel.categoryNames.join(" • ") || "Entretenimento"}</p>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#d9ff63] text-black"><Play className="ml-0.5 h-5 w-5 fill-current" /></span>
            </div>
          </Link>
        ))}
        <div className="w-[2vw] shrink-0" />
      </div>
    </section>
  );
}
