import { 
  type User, 
  type InsertUser, 
  type Series, 
  type InsertSeries, 
  type Episode, 
  type InsertEpisode,
  users,
  series as seriesTable,
  episodes as episodesTable
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { ledewireAccessToken?: string; ledewireRefreshToken?: string; ledewireUserId?: string }): Promise<User>;
  updateUserLedewireTokens(id: string, accessToken: string, refreshToken: string, userId: string): Promise<void>;
  
  // Series operations
  getAllSeries(): Promise<Series[]>;
  getSeries(id: string): Promise<Series | undefined>;
  createSeries(series: InsertSeries): Promise<Series>;
  updateSeries(id: string, series: Partial<InsertSeries>): Promise<Series | undefined>;
  deleteSeries(id: string): Promise<void>;
  
  // Episode operations
  getEpisodesBySeriesId(seriesId: string): Promise<Episode[]>;
  getEpisode(id: string): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode & { ledewireContentId?: string }): Promise<Episode>;
  updateEpisode(id: string, episode: Partial<InsertEpisode>): Promise<Episode | undefined>;
  deleteEpisode(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser & { ledewireAccessToken?: string; ledewireRefreshToken?: string; ledewireUserId?: string }): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserLedewireTokens(id: string, accessToken: string, refreshToken: string, userId: string): Promise<void> {
    await db.update(users)
      .set({
        ledewireAccessToken: accessToken,
        ledewireRefreshToken: refreshToken,
        ledewireUserId: userId,
      })
      .where(eq(users.id, id));
  }

  // Series operations
  async getAllSeries(): Promise<Series[]> {
    return await db.select().from(seriesTable);
  }

  async getSeries(id: string): Promise<Series | undefined> {
    const result = await db.select().from(seriesTable).where(eq(seriesTable.id, id));
    return result[0];
  }

  async createSeries(series: InsertSeries): Promise<Series> {
    const result = await db.insert(seriesTable).values(series).returning();
    return result[0];
  }

  async updateSeries(id: string, series: Partial<InsertSeries>): Promise<Series | undefined> {
    const result = await db.update(seriesTable)
      .set(series)
      .where(eq(seriesTable.id, id))
      .returning();
    return result[0];
  }

  async deleteSeries(id: string): Promise<void> {
    await db.delete(seriesTable).where(eq(seriesTable.id, id));
  }

  // Episode operations
  async getEpisodesBySeriesId(seriesId: string): Promise<Episode[]> {
    return await db.select().from(episodesTable).where(eq(episodesTable.seriesId, seriesId));
  }

  async getEpisode(id: string): Promise<Episode | undefined> {
    const result = await db.select().from(episodesTable).where(eq(episodesTable.id, id));
    return result[0];
  }

  async createEpisode(episode: InsertEpisode & { ledewireContentId?: string }): Promise<Episode> {
    const result = await db.insert(episodesTable).values(episode).returning();
    return result[0];
  }

  async updateEpisode(id: string, episode: Partial<InsertEpisode>): Promise<Episode | undefined> {
    const result = await db.update(episodesTable)
      .set(episode)
      .where(eq(episodesTable.id, id))
      .returning();
    return result[0];
  }

  async deleteEpisode(id: string): Promise<void> {
    await db.delete(episodesTable).where(eq(episodesTable.id, id));
  }
}

export const storage = new DatabaseStorage();
