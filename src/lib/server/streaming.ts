import { cache } from "react";
import type {
  ChannelCategory,
  EpgProgram,
  LiveChannel,
  LivePayload,
  SportEvent,
} from "@/lib/types";

const ENDPOINTS = {
  channels: "https://embedtv.cc/api/channels",
  events: "https://embedtv.cc/api/events",
  epg: "https://embedtv.cc/api/epg_all",
} as const;

type UnknownRecord = Record<string, unknown>;

const adultPattern = /(?:^|[^a-z0-9])(adult(?:o|a|os|as)?|adultswim|nsfw|xxx+|porn(?:o|ografia|ografico|ografica)?|pornographic|erotic(?:o|a)?|sex(?:o|ual)?|sexy|hentai|playboy|onlyfans|18\+|\+18|18 anos|maiores de 18|somente maiores)(?:[^a-z0-9]|$)/i;
const adultFlagKeys = new Set(["adult", "isadult", "is_adult", "nsfw", "isnsfw", "is_nsfw", "porn", "pornographic", "xxx", "over18", "over_18"]);
const ageKeys = new Set(["agerating", "age_rating", "minimumage", "minimum_age", "minage", "min_age"]);

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function containsAdultMarker(value: string) {
  return adultPattern.test(normalizeText(value));
}

/** Conservative recursive inspection: unsafe records never reach a client component. */
export function isAdultRecord(value: unknown, key = ""): boolean {
  const normalizedKey = normalizeText(key).replace(/\s/g, "");
  if (adultFlagKeys.has(normalizedKey) && value === true) return true;
  if (ageKeys.has(normalizedKey) && Number(value) >= 18) return true;
  if (typeof value === "string") return containsAdultMarker(value);
  if (Array.isArray(value)) return value.some((entry) => isAdultRecord(entry, key));
  if (value && typeof value === "object") {
    return Object.entries(value as UnknownRecord).some(([childKey, childValue]) =>
      isAdultRecord(childValue, childKey),
    );
  }
  return false;
}

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

function httpUrl(value: unknown) {
  const url = text(value);
  return /^https?:\/\//i.test(url) ? url : "";
}

async function fetchUpstream(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7500);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json", "User-Agent": "VIVA-TV/1.0" },
    });
    if (!response.ok) throw new Error(`Upstream ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function safeDate(value: unknown) {
  const raw = text(value);
  const date = new Date(raw);
  return raw && !Number.isNaN(date.getTime()) ? date.toISOString() : "";
}

export const getLivePayload = cache(async (): Promise<LivePayload> => {
  const results = await Promise.allSettled([
    fetchUpstream(ENDPOINTS.channels),
    fetchUpstream(ENDPOINTS.events),
    fetchUpstream(ENDPOINTS.epg),
  ]);
  const channelRaw = results[0].status === "fulfilled" ? results[0].value : null;
  const eventRaw = results[1].status === "fulfilled" ? results[1].value : null;
  const epgRaw = results[2].status === "fulfilled" ? results[2].value : null;
  let blockedItems = 0;

  const rawCategories = list(record(channelRaw).categories);
  const blockedCategoryIds = new Set<number>();
  const categories: ChannelCategory[] = rawCategories.flatMap((entry) => {
    const item = record(entry);
    const id = Number(item.id);
    const name = text(item.name);
    if (!Number.isFinite(id) || !name || id === 0) return [];
    if (isAdultRecord(item)) {
      blockedCategoryIds.add(id);
      blockedItems += 1;
      return [];
    }
    return [{ id, name }];
  });
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  const channels: LiveChannel[] = list(record(channelRaw).channels).flatMap((entry) => {
    const item = record(entry);
    const id = text(item.id);
    const name = text(item.name);
    const url = httpUrl(item.url);
    const categoryIds = list(item.categories).map(Number).filter(Number.isFinite);
    if (!id || !name || !url || isAdultRecord(item) || categoryIds.some((category) => blockedCategoryIds.has(category))) {
      blockedItems += 1;
      return [];
    }
    return [{
      id,
      name,
      url,
      image: httpUrl(item.image),
      preview: httpUrl(item.preview) || undefined,
      categories: categoryIds.filter((category) => category !== 0),
      categoryNames: categoryIds.flatMap((category) => categoryNames.get(category) ?? []),
    }];
  });
  const safeChannelIds = new Set(channels.map((channel) => channel.id));

  const events: SportEvent[] = list(eventRaw).flatMap((entry) => {
    const item = record(entry);
    const startsAt = safeDate(item.time_start ?? item.start_date ?? item.startsAt);
    const endsAt = safeDate(item.time_end ?? item.end_date) ||
      (startsAt ? new Date(new Date(startsAt).getTime() + 2 * 60 * 60 * 1000).toISOString() : "");
    const league = record(item.league);
    const teams = record(item.teams);
    const home = record(teams.home);
    const away = record(teams.away);
    if (!text(item.id) || !startsAt || isAdultRecord(item)) {
      blockedItems += 1;
      return [];
    }
    const players = list(item.players).map(httpUrl).filter((url) => {
      if (!url) return false;
      const blocked = channels.length > 0 && !channels.some((channel) => url === channel.url || url.endsWith(`/${channel.id}`));
      if (blocked) blockedItems += 1;
      return !blocked;
    });
    return [{
      id: text(item.id),
      slug: text(item.slug, `evento-${text(item.id)}`),
      title: text(item.title, `${text(home.name, "Evento")} x ${text(away.name, "ao vivo")}`),
      league: text(league.name, "Esportes"),
      leagueImage: httpUrl(league.image) || undefined,
      startsAt,
      endsAt,
      homeTeam: text(home.name, "Mandante"),
      awayTeam: text(away.name, "Visitante"),
      homeImage: httpUrl(home.image) || undefined,
      awayImage: httpUrl(away.image) || undefined,
      players,
    }];
  }).sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const epg: EpgProgram[] = list(epgRaw).flatMap((entry) => {
    const item = record(entry);
    const channelId = text(item.id);
    if (!channelId || (channels.length > 0 && !safeChannelIds.has(channelId)) || isAdultRecord({ id: channelId })) {
      blockedItems += 1;
      return [];
    }
    const programmes = list(item.data)
      .filter((program) => {
        const safe = !isAdultRecord(program);
        if (!safe) blockedItems += 1;
        return safe;
      })
      .map((program) => record(program))
      .sort((a, b) => text(a.start_date).localeCompare(text(b.start_date)));
    return programmes.flatMap((program, index) => {
      const startsAt = safeDate(program.start_date ?? program.start);
      if (!startsAt) return [];
      const nextStart = safeDate(programmes[index + 1]?.start_date);
      const endsAt = safeDate(program.end_date ?? program.end) || nextStart ||
        new Date(new Date(startsAt).getTime() + 30 * 60 * 1000).toISOString();
      const title = text(program.title, "Programação da emissora");
      return [{
        id: `${channelId}-${startsAt}`,
        channelId,
        title,
        description: text(program.desc ?? program.description, "Sinopse não disponibilizada pela emissora."),
        startsAt,
        endsAt,
      }];
    });
  });

  const available = results.some((result) => result.status === "fulfilled");
  return {
    channels,
    categories,
    events,
    epg,
    source: available ? "embedtv" : "unavailable",
    updatedAt: new Date().toISOString(),
    blockedItems,
  };
});
