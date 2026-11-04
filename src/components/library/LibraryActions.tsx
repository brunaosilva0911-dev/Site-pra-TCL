"use client";

import { Bell, BellRing, Check, Plus } from "lucide-react";
import { useState } from "react";
import type { ContentKind } from "@/lib/types";
import { useLibrary } from "./LibraryProvider";

export function FavoriteButton({ itemId, itemType, title, image, compact = false }: {
  itemId: string; itemType: ContentKind; title: string; image?: string; compact?: boolean;
}) {
  const { isFavorite, toggleFavorite } = useLibrary();
  const [pending, setPending] = useState(false);
  const active = isFavorite(itemId);
  return (
    <button type="button" data-tv-focus="true" tabIndex={0} aria-pressed={active} disabled={pending}
      onClick={async () => { setPending(true); await toggleFavorite({ itemId, itemType, title, image }); setPending(false); }}
      className={`tv-focus inline-flex ${compact ? "h-12 w-12 justify-center" : "h-16 px-7"} items-center gap-3 rounded-full border text-lg font-bold ${active ? "border-[#d9ff63]/45 bg-[#d9ff63]/12 text-[#e4ff91]" : "border-white/20 bg-white/8 text-white"}`}>
      {active ? <Check className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      {!compact && (active ? "Na minha lista" : "Minha lista")}
    </button>
  );
}

export function ReminderButton({ eventId, title, startsAt, compact = false }: {
  eventId: string; title: string; startsAt: string; compact?: boolean;
}) {
  const { isReminder, toggleReminder } = useLibrary();
  const [pending, setPending] = useState(false);
  const active = isReminder(eventId);
  return (
    <button type="button" data-tv-focus="true" tabIndex={0} aria-pressed={active} disabled={pending}
      onClick={async (event) => { event.preventDefault(); event.stopPropagation(); setPending(true); await toggleReminder({ eventId, title, startsAt }); setPending(false); }}
      className={`tv-focus inline-flex ${compact ? "h-12 w-12 justify-center" : "h-14 px-5"} shrink-0 items-center gap-2 rounded-full border text-base font-bold ${active ? "border-[#d9ff63]/50 bg-[#d9ff63]/15 text-[#e4ff91]" : "border-white/15 bg-black/35 text-white"}`}
      aria-label={active ? `Remover lembrete de ${title}` : `Lembrar ${title}`}>
      {active ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
      {!compact && (active ? "Lembrete salvo" : "Lembrar")}
    </button>
  );
}
