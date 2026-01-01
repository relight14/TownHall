import { 
  type User, 
  type InsertUser, 
  type Series, 
  type InsertSeries, 
  type Episode, 
  type InsertEpisode,
  type UpsertUser,
  type AdminSettings,
  type SiteSettings,
  type InsertSiteSettings,
  type FeaturedEpisode,
  type Article,
  type InsertArticle,
  users,
  series as seriesTable,
  episodes as episodesTable,
  adminSettings,
  siteSettings,
  featuredEpisodes,
  articles as articlesTable
} from "@shared/schema";
import { db } from "./db";
import { eq, asc, inArray, gt, desc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 12;

async function hashPasswordAsync(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPasswordAsync(password: string, hash: string): Promise<boolean> {
  // Handle legacy SHA-256 hashes (64 char hex string) vs bcrypt hashes (starts with $2)
  if (hash.length === 64 && !hash.startsWith('$2')) {
    // Legacy SHA-256 hash - compare directly but log for migration
    const crypto = await import('crypto');
    const legacyMatch = crypto.createHash('sha256').update(password).digest('hex') === hash;
    if (legacyMatch) {
      console.log('[SECURITY] Legacy SHA-256 password matched - will be migrated on next password change');
    }
    return legacyMatch;
  }
  return bcrypt.compare(password, hash);
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
  
  // Site settings operations
  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings>;
  
  // Featured episodes operations
  getFeaturedEpisodes(): Promise<(FeaturedEpisode & { episode: Episode })[]>;
  setFeaturedEpisodes(episodeIds: string[]): Promise<void>;
  
  // Article operations
  getAllArticles(): Promise<Article[]>;
  getArticle(id: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle & { ledewireContentId?: string }): Promise<Article>;
  updateArticle(id: string, article: Partial<InsertArticle>): Promise<Article | undefined>;
  updateArticleLedewireId(id: string, ledewireContentId: string): Promise<void>;
  deleteArticle(id: string): Promise<void>;
  getFeaturedArticles(): Promise<Article[]>;
  getArticlesByCategory(category: string): Promise<Article[]>;
  getMostReadArticles(limit?: number): Promise<Article[]>;
  getLatestArticles(limit?: number): Promise<Article[]>;
  incrementArticleViewCount(id: string): Promise<void>;
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
    const passwordHash = await hashPasswordAsync(password);
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
    const isValid = await verifyPasswordAsync(password, admin.passwordHash);
    
    // Auto-migrate legacy passwords to bcrypt on successful login
    if (isValid && admin.passwordHash.length === 64 && !admin.passwordHash.startsWith('$2')) {
      console.log('[SECURITY] Migrating legacy password to bcrypt');
      const newHash = await hashPasswordAsync(password);
      await db.update(adminSettings)
        .set({ passwordHash: newHash, updatedAt: new Date() })
        .where(eq(adminSettings.email, email));
    }
    
    return isValid;
  }

  async updateAdminPassword(email: string, newPassword: string): Promise<void> {
    const passwordHash = await hashPasswordAsync(newPassword);
    await db.update(adminSettings)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(adminSettings.email, email));
  }

  // Site settings operations
  async getSiteSettings(): Promise<SiteSettings> {
    const result = await db.select().from(siteSettings).where(eq(siteSettings.id, 'default'));
    if (result[0]) {
      return result[0];
    }
    // Create default settings if they don't exist
    const defaults = await db.insert(siteSettings)
      .values({ id: 'default' })
      .returning();
    return defaults[0];
  }

  async updateSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings> {
    const result = await db.insert(siteSettings)
      .values({ id: 'default', ...settings })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: { ...settings, updatedAt: new Date() },
      })
      .returning();
    return result[0];
  }

  // Featured episodes operations
  async getFeaturedEpisodes(): Promise<(FeaturedEpisode & { episode: Episode })[]> {
    const featured = await db.select()
      .from(featuredEpisodes)
      .orderBy(asc(featuredEpisodes.displayOrder));
    
    if (featured.length === 0) return [];
    
    const episodeIds = featured.map(f => f.episodeId);
    const episodes = await db.select()
      .from(episodesTable)
      .where(inArray(episodesTable.id, episodeIds));
    
    const episodeMap = new Map(episodes.map(e => [e.id, e]));
    
    return featured
      .filter(f => episodeMap.has(f.episodeId))
      .map(f => ({
        ...f,
        episode: episodeMap.get(f.episodeId)!,
      }));
  }

  async setFeaturedEpisodes(episodeIds: string[]): Promise<void> {
    await db.delete(featuredEpisodes);
    
    if (episodeIds.length === 0) return;
    
    const values = episodeIds.map((episodeId, index) => ({
      episodeId,
      displayOrder: index,
    }));
    
    await db.insert(featuredEpisodes).values(values);
  }

  // Article operations
  async getAllArticles(): Promise<Article[]> {
    return await db.select().from(articlesTable).orderBy(desc(articlesTable.publishedAt));
  }

  async getArticle(id: string): Promise<Article | undefined> {
    const result = await db.select().from(articlesTable).where(eq(articlesTable.id, id));
    return result[0];
  }

  async createArticle(article: InsertArticle & { ledewireContentId?: string }): Promise<Article> {
    const result = await db.insert(articlesTable).values(article).returning();
    return result[0];
  }

  async updateArticle(id: string, article: Partial<InsertArticle>): Promise<Article | undefined> {
    const result = await db.update(articlesTable)
      .set(article)
      .where(eq(articlesTable.id, id))
      .returning();
    return result[0];
  }

  async updateArticleLedewireId(id: string, ledewireContentId: string): Promise<void> {
    await db.update(articlesTable)
      .set({ ledewireContentId })
      .where(eq(articlesTable.id, id));
  }

  async deleteArticle(id: string): Promise<void> {
    await db.delete(articlesTable).where(eq(articlesTable.id, id));
  }

  async getFeaturedArticles(): Promise<Article[]> {
    const result = await db.select()
      .from(articlesTable)
      .where(gt(articlesTable.featured, 0))
      .orderBy(asc(articlesTable.featured));
    return result;
  }

  async getArticlesByCategory(category: string): Promise<Article[]> {
    return await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.category, category))
      .orderBy(desc(articlesTable.publishedAt));
  }

  async getMostReadArticles(limit: number = 10): Promise<Article[]> {
    return await db.select()
      .from(articlesTable)
      .orderBy(desc(articlesTable.viewCount))
      .limit(limit);
  }

  async getLatestArticles(limit: number = 10): Promise<Article[]> {
    return await db.select()
      .from(articlesTable)
      .orderBy(desc(articlesTable.publishedAt))
      .limit(limit);
  }

  async incrementArticleViewCount(id: string): Promise<void> {
    await db.update(articlesTable)
      .set({ viewCount: sql`${articlesTable.viewCount} + 1` })
      .where(eq(articlesTable.id, id));
  }
}

export const storage = new DatabaseStorage();
