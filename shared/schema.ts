import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  ledewireAccessToken: text("ledewire_access_token"),
  ledewireRefreshToken: text("ledewire_refresh_token"),
  ledewireUserId: text("ledewire_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const series = pgTable("series", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnail: text("thumbnail").notNull(),
  trailerUrl: text("trailer_url"),
  trailerType: text("trailer_type"), // 'vimeo' | 'youtube'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const episodes = pgTable("episodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seriesId: varchar("series_id").notNull().references(() => series.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url").notNull(),
  videoType: text("video_type").notNull(), // 'vimeo' | 'youtube'
  price: integer("price_cents").notNull(), // price in cents
  thumbnail: text("thumbnail").notNull(),
  ledewireContentId: text("ledewire_content_id"), // ID from Ledewire for this episode
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
});

export const insertSeriesSchema = createInsertSchema(series).omit({
  id: true,
  createdAt: true,
});

export const insertEpisodeSchema = createInsertSchema(episodes).omit({
  id: true,
  createdAt: true,
  ledewireContentId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSeries = z.infer<typeof insertSeriesSchema>;
export type Series = typeof series.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Episode = typeof episodes.$inferSelect;
