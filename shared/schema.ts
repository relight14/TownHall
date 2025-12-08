import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique(),
  name: text("name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  googleId: text("google_id"),
  ledewireAccessToken: text("ledewire_access_token"),
  ledewireRefreshToken: text("ledewire_refresh_token"),
  ledewireUserId: text("ledewire_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default("default"),
  heroHeading: text("hero_heading").notNull().default("Nurturing artists.\nShaping culture."),
  heroSubheading: text("hero_subheading").notNull().default("Accessible space, community, and education for artists of all levels, mediums, and backgrounds—transforming society through the power of culture."),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const featuredEpisodes = pgTable("featured_episodes", {
  episodeId: varchar("episode_id").primaryKey().references(() => episodes.id, { onDelete: 'cascade' }),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
  googleId: true,
  profileImageUrl: true,
});

export type UpsertUser = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
};

export const insertSeriesSchema = createInsertSchema(series).omit({
  id: true,
  createdAt: true,
}).extend({
  trailerUrl: z.string().nullable().optional(),
  trailerType: z.string().nullable().optional(),
});

export const insertEpisodeSchema = createInsertSchema(episodes).omit({
  id: true,
  createdAt: true,
  ledewireContentId: true,
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertFeaturedEpisodeSchema = createInsertSchema(featuredEpisodes).omit({
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSeries = z.infer<typeof insertSeriesSchema>;
export type Series = typeof series.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Episode = typeof episodes.$inferSelect;
export type AdminSettings = typeof adminSettings.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type FeaturedEpisode = typeof featuredEpisodes.$inferSelect;
export type InsertFeaturedEpisode = z.infer<typeof insertFeaturedEpisodeSchema>;
