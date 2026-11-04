export type ContentKind = "vod" | "live" | "event";

export interface VodItem {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  longDescription: string;
  year: number;
  maturity: string;
  duration: string;
  genres: string[];
  image: string;
  backdrop: string;
  streamUrl: string;
  collections: string[];
  featured?: boolean;
}

export interface ChannelCategory {
  id: number;
  name: string;
}

export interface LiveChannel {
  id: string;
  name: string;
  image: string;
  preview?: string;
  url: string;
  categories: number[];
  categoryNames: string[];
}

export interface SportEvent {
  id: string;
  slug: string;
  title: string;
  league: string;
  leagueImage?: string;
  startsAt: string;
  endsAt: string;
  homeTeam: string;
  awayTeam: string;
  homeImage?: string;
  awayImage?: string;
  players: string[];
}

export interface EpgProgram {
  id: string;
  channelId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
}

export interface LivePayload {
  channels: LiveChannel[];
  categories: ChannelCategory[];
  events: SportEvent[];
  epg: EpgProgram[];
  source: "embedtv" | "unavailable";
  updatedAt: string;
  blockedItems: number;
}

export interface FavoriteRecord {
  itemId: string;
  itemType: ContentKind;
  title: string;
  image?: string | null;
  createdAt: string;
}

export interface HistoryRecord {
  itemId: string;
  itemType: ContentKind;
  title: string;
  image?: string | null;
  position: number;
  duration: number;
  updatedAt: string;
}

export interface ReminderRecord {
  eventId: string;
  title: string;
  startsAt: string;
  createdAt: string;
}

export interface NewsArticle {
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
  readTime: string;
  image: string;
  body: string[];
}

export interface ProfileSettings {
  id: string;
  name: string;
  avatarColor: string;
  autoplay: boolean;
  reducedMotion: boolean;
}
