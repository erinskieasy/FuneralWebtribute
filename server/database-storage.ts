import { eq, and, desc } from 'drizzle-orm';
import { db } from './db';
import { 
  users, User, InsertUser, 
  tributes, Tribute, InsertTribute,
  gallery, GalleryImage, InsertGalleryImage,
  settings, Setting, InsertSetting,
  funeralProgram, FuneralProgram, InsertFuneralProgram,
  candles, Candle, InsertCandle
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import pg from 'pg';
import { IStorage } from './storage';

const { Pool } = pg;

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using 'any' to resolve SessionStore type issue
  pool: any; // Using 'any' to resolve Pool type issue

  constructor() {
    // Create a pool for the session store connection
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // Initialize session store
    this.sessionStore = new PostgresSessionStore({
      pool: this.pool,
      createTableIfMissing: true
    });

    // Initialize default data if needed
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    try {
      // Check if we have any settings
      const existingSettings = await this.getAllSettings();
      
      if (existingSettings.length === 0) {
        // Initialize default settings
        await this.upsertSetting({ key: "backgroundImage", value: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e" });
        await this.upsertSetting({ key: "tributeImage", value: "https://images.unsplash.com/photo-1552058544-f2b08422138a" });
        await this.upsertSetting({ key: "footerMessage", value: "\"As long as we live, they too will live, for they are now a part of us, as we remember them.\"" });
        
        // Add sample gallery image
        await this.createGalleryImage({
          imageUrl: "https://images.unsplash.com/photo-1472791108553-c9405341e398",
          caption: "Chris at the beach",
          isFeatured: true,
          order: 1
        });

        // Initialize funeral program
        await this.updateFuneralProgram({
          date: "Saturday, October 21, 2023",
          time: "1:00 PM - 3:00 PM",
          location: "Seaside Memorial Chapel",
          address: "1234 Coastal Highway, Oceanview, CA 92123",
          streamLink: "https://example.com/stream",
          programPdfUrl: "https://example.com/program.pdf"
        });
        
        console.log("Default data initialized successfully");
      }
    } catch (error) {
      console.error("Error initializing default data:", error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username));
      return result[0];
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values(user).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      const result = await db.update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  // Tribute methods
  async getTributes(limit?: number, offset = 0): Promise<Tribute[]> {
    try {
      let result = await db.select().from(tributes).orderBy(desc(tributes.createdAt));
      
      if (limit !== undefined) {
        result = result.slice(offset, offset + limit);
      }
      
      return result;
    } catch (error) {
      console.error("Error getting tributes:", error);
      return [];
    }
  }

  async getTributeById(id: number): Promise<Tribute | undefined> {
    try {
      const result = await db.select().from(tributes).where(eq(tributes.id, id));
      return result[0];
    } catch (error) {
      console.error("Error getting tribute by id:", error);
      return undefined;
    }
  }

  async getTributesByUserId(userId: number): Promise<Tribute[]> {
    try {
      return await db.select().from(tributes).where(eq(tributes.userId, userId));
    } catch (error) {
      console.error("Error getting tributes by user id:", error);
      return [];
    }
  }

  async createTribute(tribute: InsertTribute): Promise<Tribute> {
    try {
      const result = await db.insert(tributes).values({
        ...tribute,
        createdAt: new Date(),
        candleCount: 0
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating tribute:", error);
      throw error;
    }
  }

  async updateTribute(id: number, tributeData: Partial<Tribute>): Promise<Tribute | undefined> {
    try {
      const result = await db.update(tributes)
        .set(tributeData)
        .where(eq(tributes.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating tribute:", error);
      return undefined;
    }
  }

  async deleteTribute(id: number): Promise<boolean> {
    try {
      // First delete associated candles
      await db.delete(candles).where(eq(candles.tributeId, id));
      
      // Then delete the tribute
      const result = await db.delete(tributes).where(eq(tributes.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting tribute:", error);
      return false;
    }
  }

  // Gallery methods
  async getGalleryImages(limit?: number, offset = 0): Promise<GalleryImage[]> {
    try {
      let result = await db.select().from(gallery).orderBy(gallery.order);
      
      if (limit !== undefined) {
        result = result.slice(offset, offset + limit);
      }
      
      return result;
    } catch (error) {
      console.error("Error getting gallery images:", error);
      return [];
    }
  }

  async getFeaturedGalleryImages(): Promise<GalleryImage[]> {
    try {
      return await db.select()
        .from(gallery)
        .where(eq(gallery.isFeatured, true))
        .orderBy(gallery.order);
    } catch (error) {
      console.error("Error getting featured gallery images:", error);
      return [];
    }
  }

  async getGalleryImageById(id: number): Promise<GalleryImage | undefined> {
    try {
      const result = await db.select().from(gallery).where(eq(gallery.id, id));
      return result[0];
    } catch (error) {
      console.error("Error getting gallery image by id:", error);
      return undefined;
    }
  }

  async createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage> {
    try {
      const result = await db.insert(gallery).values(image).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating gallery image:", error);
      throw error;
    }
  }

  async updateGalleryImage(id: number, imageData: Partial<GalleryImage>): Promise<GalleryImage | undefined> {
    try {
      const result = await db.update(gallery)
        .set(imageData)
        .where(eq(gallery.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating gallery image:", error);
      return undefined;
    }
  }

  async deleteGalleryImage(id: number): Promise<boolean> {
    try {
      const result = await db.delete(gallery).where(eq(gallery.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      return false;
    }
  }

  // Settings methods
  async getAllSettings(): Promise<Setting[]> {
    try {
      return await db.select().from(settings);
    } catch (error) {
      console.error("Error getting all settings:", error);
      return [];
    }
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    try {
      const result = await db.select().from(settings).where(eq(settings.key, key));
      return result[0];
    } catch (error) {
      console.error("Error getting setting by key:", error);
      return undefined;
    }
  }

  async upsertSetting(setting: InsertSetting): Promise<Setting> {
    try {
      // Check if setting exists
      const existingSetting = await this.getSetting(setting.key);
      
      if (existingSetting) {
        // Update existing setting
        const result = await db.update(settings)
          .set({ value: setting.value })
          .where(eq(settings.key, setting.key))
          .returning();
        return result[0];
      } else {
        // Insert new setting
        const result = await db.insert(settings).values(setting).returning();
        return result[0];
      }
    } catch (error) {
      console.error("Error upserting setting:", error);
      throw error;
    }
  }

  // Funeral program methods
  async getFuneralProgram(): Promise<FuneralProgram | undefined> {
    try {
      const result = await db.select().from(funeralProgram);
      return result[0];
    } catch (error) {
      console.error("Error getting funeral program:", error);
      return undefined;
    }
  }

  async updateFuneralProgram(program: InsertFuneralProgram): Promise<FuneralProgram> {
    try {
      // Check if program exists
      const existingProgram = await this.getFuneralProgram();
      
      if (existingProgram) {
        // Update existing program
        const result = await db.update(funeralProgram)
          .set(program)
          .where(eq(funeralProgram.id, existingProgram.id))
          .returning();
        return result[0];
      } else {
        // Insert new program
        const result = await db.insert(funeralProgram).values(program).returning();
        return result[0];
      }
    } catch (error) {
      console.error("Error updating funeral program:", error);
      throw error;
    }
  }

  // Candle methods
  async addCandle(candle: InsertCandle): Promise<Candle> {
    try {
      // Check if user has already lit a candle for this tribute
      const hasCandle = await this.hasUserLitCandle(candle.userId, candle.tributeId);
      
      if (hasCandle) {
        // Return existing candle
        const existing = await db.select()
          .from(candles)
          .where(
            and(
              eq(candles.userId, candle.userId),
              eq(candles.tributeId, candle.tributeId)
            )
          );
        return existing[0];
      }
      
      // Insert new candle
      const result = await db.insert(candles).values(candle).returning();
      
      // Update tribute candle count
      const tribute = await this.getTributeById(candle.tributeId);
      if (tribute) {
        await this.updateTribute(tribute.id, { 
          candleCount: tribute.candleCount + 1 
        });
      }
      
      return result[0];
    } catch (error) {
      console.error("Error adding candle:", error);
      throw error;
    }
  }

  async removeCandle(userId: number, tributeId: number): Promise<boolean> {
    try {
      // Remove the candle
      const result = await db.delete(candles)
        .where(
          and(
            eq(candles.userId, userId),
            eq(candles.tributeId, tributeId)
          )
        )
        .returning();
      
      // Update tribute candle count if candle was found and deleted
      if (result.length > 0) {
        const tribute = await this.getTributeById(tributeId);
        if (tribute && tribute.candleCount > 0) {
          await this.updateTribute(tribute.id, { 
            candleCount: tribute.candleCount - 1 
          });
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error removing candle:", error);
      return false;
    }
  }

  async getCandles(tributeId: number): Promise<Candle[]> {
    try {
      return await db.select()
        .from(candles)
        .where(eq(candles.tributeId, tributeId));
    } catch (error) {
      console.error("Error getting candles:", error);
      return [];
    }
  }

  async hasUserLitCandle(userId: number, tributeId: number): Promise<boolean> {
    try {
      const result = await db.select()
        .from(candles)
        .where(
          and(
            eq(candles.userId, userId),
            eq(candles.tributeId, tributeId)
          )
        );
      return result.length > 0;
    } catch (error) {
      console.error("Error checking if user lit candle:", error);
      return false;
    }
  }
}