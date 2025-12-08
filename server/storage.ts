import { 
  type User, 
  type InsertUser, 
  type Series, 
  type InsertSeries, 
  type Episode, 
  type InsertEpisode,
  type UpsertUser,
  type AdminSettings,
  users,
  series as seriesTable,
  episodes as episodesTable,
  adminSettings
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByLedewireId(ledewireUserId: string): Promise<User | undefined>;
  createUser(user: InsertUser & { ledewireAccessToken?: string; ledewireRefreshToken?: string; ledewireUserId?: string }): Promise<User>;
  updateUserLedewireTokens(id: string, accessToken: string, refreshToken: string, userId: string): Promise<void>;
  updateUserGoogleId(id: string, googleId: string): Promise<void>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
  
  // Admin settings operations
  getAdminByEmail(email: string): Promise<AdminSettings | undefined>;
  createOrUpdateAdmin(email: string, password: string): Promise<AdminSettings>;
  verifyAdminPassword(email: string, password: string): Promise<boolean>;
  updateAdminPassword(email: string, newPassword: string): Promise<void>;
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

  async getUserByLedewireId(ledewireUserId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.ledewireUserId, ledewireUserId));
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

  async updateUserGoogleId(id: string, googleId: string): Promise<void> {
    await db.update(users)
      .set({
        googleId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        name: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}`.trim()
          : userData.firstName || userData.lastName || userData.email || 'User',
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          name: userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}`.trim()
            : userData.firstName || userData.lastName || userData.email || 'User',
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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

  // Admin settings operations
  async getAdminByEmail(email: string): Promise<AdminSettings | undefined> {
    const result = await db.select().from(adminSettings).where(eq(adminSettings.email, email));
    return result[0];
  }

  async createOrUpdateAdmin(email: string, password: string): Promise<AdminSettings> {
    const passwordHash = hashPassword(password);
    const existing = await this.getAdminByEmail(email);
    
    if (existing) {
      const result = await db.update(adminSettings)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(adminSettings.email, email))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(adminSettings)
        .values({ email, passwordHash })
        .returning();
      return result[0];
    }
  }

  async verifyAdminPassword(email: string, password: string): Promise<boolean> {
    const admin = await this.getAdminByEmail(email);
    if (!admin) return false;
    return verifyPassword(password, admin.passwordHash);
  }

  async updateAdminPassword(email: string, newPassword: string): Promise<void> {
    const passwordHash = hashPassword(newPassword);
    await db.update(adminSettings)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(adminSettings.email, email));
  }
}

export const storage = new DatabaseStorage();
