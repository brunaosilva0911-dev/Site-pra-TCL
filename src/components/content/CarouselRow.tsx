"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import type { VodItem } from "@/lib/types";

export function CarouselRow({ title, eyebrow, items, rowId }: { title: string; eyebrow?: string; items: VodItem[]; rowId: string }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby={`${rowId}-title`} className="relative py-7">
      <div className="mb-6 flex items-end justify-between px-[4.5vw]">
        <div>
          {eyebrow && <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-[#d9ff63]">{eyebrow}</p>}
          <h2 id={`${rowId}-title`} className="text-3xl font-bold tracking-[-0.035em] text-white lg:text-4xl">{title}</h2>
        </div>
        <span className="pr-2 text-base font-medium text-white/40">{items.length} {items.length === 1 ? "título" : "títulos"}</span>
      </div>
      <div data-nav-row={rowId} className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto overflow-y-visible px-[4.5vw] py-5">
        {items.map((item, index) => (
          <Link key={item.id} href={`/assistir/${item.id}`} data-tv-focus="true" data-nav-row={rowId} data-autofocus={rowId === "continue" && index === 0 ? "" : undefined}
            tabIndex={0} className="focus-card group w-[330px] shrink-0 snap-start rounded-2xl md:w-[370px] xl:w-[410px]">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#141819] shadow-xl">
              <Image src={item.image} alt="" fill sizes="410px" className="object-cover transition-transform duration-500 group-focus:scale-105" />
              <div className="card-sheen absolute inset-0" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/65 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/85 backdrop-blur-sm">
                <Play className="h-3.5 w-3.5 fill-current" /> {item.duration}
              </div>
              <span className="absolute right-4 top-4 rounded-md bg-black/65 px-2.5 py-1 text-xs font-black text-white">{item.maturity}</span>
            </div>
            <div className="px-1 pt-4">
              <h3 className="truncate text-2xl font-semibold tracking-[-0.025em] text-white">{item.title}</h3>
              <p className="mt-1.5 truncate text-base text-white/48">{item.genres.slice(0, 2).join(" • ")} • {item.year}</p>
            </div>
          </Link>
        ))}
        <div className="w-[2vw] shrink-0" />
      </div>
    </section>
  );
}
