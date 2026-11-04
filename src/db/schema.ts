import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default("Sala de estar"),
  avatarColor: text("avatar_color").notNull().default("#d9ff63"),
  autoplay: boolean("autoplay").notNull().default(true),
  reducedMotion: boolean("reduced_motion").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    profileId: text("profile_id").notNull().default("main"),
    itemId: text("item_id").notNull(),
    itemType: text("item_type").notNull(),
    title: text("title").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("favorites_profile_item_idx").on(table.profileId, table.itemId)],
);

export const watchHistory = pgTable(
  "watch_history",
  {
    id: serial("id").primaryKey(),
    profileId: text("profile_id").notNull().default("main"),
    itemId: text("item_id").notNull(),
    itemType: text("item_type").notNull(),
    title: text("title").notNull(),
    image: text("image"),
    position: doublePrecision("position").notNull().default(0),
    duration: doublePrecision("duration").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("history_profile_item_idx").on(table.profileId, table.itemId)],
);

export const reminders = pgTable(
  "reminders",
  {
    id: serial("id").primaryKey(),
    profileId: text("profile_id").notNull().default("main"),
    eventId: text("event_id").notNull(),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("reminders_profile_event_idx").on(table.profileId, table.eventId)],
);

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  profileId: text("profile_id").notNull().default("main"),
  channelId: text("channel_id").notNull(),
  author: text("author").notNull().default("Sala de estar"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const catalogOverrides = pgTable("catalog_overrides", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});
