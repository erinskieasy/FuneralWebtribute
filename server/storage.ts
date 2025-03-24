import { 
  users, User, InsertUser, 
  tributes, Tribute, InsertTribute,
  gallery, GalleryImage, InsertGalleryImage,
  settings, Setting, InsertSetting,
  funeralProgram, FuneralProgram, InsertFuneralProgram,
  candles, Candle, InsertCandle
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Define the storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Tribute methods
  getTributes(limit?: number, offset?: number): Promise<Tribute[]>;
  getTributeById(id: number): Promise<Tribute | undefined>;
  getTributesByUserId(userId: number): Promise<Tribute[]>;
  createTribute(tribute: InsertTribute): Promise<Tribute>;
  updateTribute(id: number, tribute: Partial<Tribute>): Promise<Tribute | undefined>;
  deleteTribute(id: number): Promise<boolean>;
  
  // Gallery methods
  getGalleryImages(limit?: number, offset?: number): Promise<GalleryImage[]>;
  getFeaturedGalleryImages(): Promise<GalleryImage[]>;
  getGalleryImageById(id: number): Promise<GalleryImage | undefined>;
  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
  updateGalleryImage(id: number, image: Partial<GalleryImage>): Promise<GalleryImage | undefined>;
  deleteGalleryImage(id: number): Promise<boolean>;
  
  // Settings methods
  getAllSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  upsertSetting(setting: InsertSetting): Promise<Setting>;
  
  // Funeral program methods
  getFuneralProgram(): Promise<FuneralProgram | undefined>;
  updateFuneralProgram(program: InsertFuneralProgram): Promise<FuneralProgram>;
  
  // Candle methods
  addCandle(candle: InsertCandle): Promise<Candle>;
  removeCandle(userId: number, tributeId: number): Promise<boolean>;
  getCandles(tributeId: number): Promise<Candle[]>;
  hasUserLitCandle(userId: number, tributeId: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private _users: Map<number, User>;
  private _tributes: Map<number, Tribute>;
  private _gallery: Map<number, GalleryImage>;
  private _settings: Map<string, Setting>;
  private _funeralProgram: FuneralProgram | undefined;
  private _candles: Map<number, Candle>;
  private _currentUserId: number;
  private _currentTributeId: number;
  private _currentGalleryId: number;
  private _currentSettingId: number;
  private _currentCandleId: number;
  
  sessionStore: session.SessionStore;
  
  constructor() {
    this._users = new Map();
    this._tributes = new Map();
    this._gallery = new Map();
    this._settings = new Map();
    this._candles = new Map();
    
    this._currentUserId = 1;
    this._currentTributeId = 1;
    this._currentGalleryId = 1;
    this._currentSettingId = 1;
    this._currentCandleId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Initialize with default settings
    this.upsertSetting({
      key: "backgroundImage",
      value: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
    });
    
    this.upsertSetting({
      key: "tributeImage",
      value: "https://images.unsplash.com/photo-1552058544-f2b08422138a"
    });
    
    this.upsertSetting({
      key: "footerMessage",
      value: "\"As long as we live, they too will live, for they are now a part of us, as we remember them.\""
    });
    
    // Add an admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      name: "Administrator",
      isAdmin: true,
      email: "admin@example.com"
    });
    
    // Initialize funeral program
    this.updateFuneralProgram({
      date: "Saturday, October 21, 2023",
      time: "1:00 PM - 3:00 PM",
      location: "Seaside Memorial Chapel",
      address: "1234 Coastal Highway, Oceanview, CA 92123",
      streamLink: "https://example.com/stream",
      programPdfUrl: "https://example.com/program.pdf"
    });
    
    // Add sample gallery images
    this.createGalleryImage({
      imageUrl: "https://images.unsplash.com/photo-1472791108553-c9405341e398",
      caption: "Chris at the beach",
      isFeatured: true,
      order: 1
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this._users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this._users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this._currentUserId++;
    const user: User = { ...insertUser, id };
    this._users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this._users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...userData };
    this._users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this._users.delete(id);
  }
  
  // Tribute methods
  async getTributes(limit?: number, offset = 0): Promise<Tribute[]> {
    const allTributes = Array.from(this._tributes.values())
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Sort by newest first
      });
    
    if (limit !== undefined) {
      return allTributes.slice(offset, offset + limit);
    }
    
    return allTributes;
  }
  
  async getTributeById(id: number): Promise<Tribute | undefined> {
    return this._tributes.get(id);
  }
  
  async getTributesByUserId(userId: number): Promise<Tribute[]> {
    return Array.from(this._tributes.values()).filter(
      tribute => tribute.userId === userId
    );
  }
  
  async createTribute(insertTribute: InsertTribute): Promise<Tribute> {
    const id = this._currentTributeId++;
    const createdAt = new Date();
    const tribute: Tribute = { 
      ...insertTribute, 
      id, 
      createdAt, 
      candleCount: 0 
    };
    
    this._tributes.set(id, tribute);
    return tribute;
  }
  
  async updateTribute(id: number, tributeData: Partial<Tribute>): Promise<Tribute | undefined> {
    const tribute = this._tributes.get(id);
    if (!tribute) return undefined;
    
    const updatedTribute: Tribute = { ...tribute, ...tributeData };
    this._tributes.set(id, updatedTribute);
    return updatedTribute;
  }
  
  async deleteTribute(id: number): Promise<boolean> {
    return this._tributes.delete(id);
  }
  
  // Gallery methods
  async getGalleryImages(limit?: number, offset = 0): Promise<GalleryImage[]> {
    const allImages = Array.from(this._gallery.values())
      .sort((a, b) => a.order - b.order);
    
    if (limit !== undefined) {
      return allImages.slice(offset, offset + limit);
    }
    
    return allImages;
  }
  
  async getFeaturedGalleryImages(): Promise<GalleryImage[]> {
    return Array.from(this._gallery.values())
      .filter(image => image.isFeatured)
      .sort((a, b) => a.order - b.order);
  }
  
  async getGalleryImageById(id: number): Promise<GalleryImage | undefined> {
    return this._gallery.get(id);
  }
  
  async createGalleryImage(insertImage: InsertGalleryImage): Promise<GalleryImage> {
    const id = this._currentGalleryId++;
    const image: GalleryImage = { ...insertImage, id };
    this._gallery.set(id, image);
    return image;
  }
  
  async updateGalleryImage(id: number, imageData: Partial<GalleryImage>): Promise<GalleryImage | undefined> {
    const image = this._gallery.get(id);
    if (!image) return undefined;
    
    const updatedImage: GalleryImage = { ...image, ...imageData };
    this._gallery.set(id, updatedImage);
    return updatedImage;
  }
  
  async deleteGalleryImage(id: number): Promise<boolean> {
    return this._gallery.delete(id);
  }
  
  // Settings methods
  async getAllSettings(): Promise<Setting[]> {
    return Array.from(this._settings.values());
  }
  
  async getSetting(key: string): Promise<Setting | undefined> {
    return this._settings.get(key);
  }
  
  async upsertSetting(insertSetting: InsertSetting): Promise<Setting> {
    const existingSetting = this._settings.get(insertSetting.key);
    
    if (existingSetting) {
      const updatedSetting: Setting = { 
        ...existingSetting, 
        value: insertSetting.value 
      };
      this._settings.set(insertSetting.key, updatedSetting);
      return updatedSetting;
    } else {
      const id = this._currentSettingId++;
      const setting: Setting = { 
        ...insertSetting, 
        id
      };
      this._settings.set(insertSetting.key, setting);
      return setting;
    }
  }
  
  // Funeral program methods
  async getFuneralProgram(): Promise<FuneralProgram | undefined> {
    return this._funeralProgram;
  }
  
  async updateFuneralProgram(insertProgram: InsertFuneralProgram): Promise<FuneralProgram> {
    if (!this._funeralProgram) {
      this._funeralProgram = { ...insertProgram, id: 1 };
    } else {
      this._funeralProgram = { ...this._funeralProgram, ...insertProgram };
    }
    return this._funeralProgram;
  }
  
  // Candle methods
  async addCandle(insertCandle: InsertCandle): Promise<Candle> {
    // Check if user has already lit a candle for this tribute
    const existingCandle = Array.from(this._candles.values()).find(
      candle => candle.userId === insertCandle.userId && candle.tributeId === insertCandle.tributeId
    );
    
    if (existingCandle) {
      return existingCandle;
    }
    
    const id = this._currentCandleId++;
    const candle: Candle = { ...insertCandle, id };
    this._candles.set(id, candle);
    
    // Update the tribute's candle count
    const tribute = await this.getTributeById(insertCandle.tributeId);
    if (tribute) {
      await this.updateTribute(tribute.id, { 
        candleCount: tribute.candleCount + 1 
      });
    }
    
    return candle;
  }
  
  async removeCandle(userId: number, tributeId: number): Promise<boolean> {
    const candle = Array.from(this._candles.values()).find(
      c => c.userId === userId && c.tributeId === tributeId
    );
    
    if (!candle) return false;
    
    const result = this._candles.delete(candle.id);
    
    // Update the tribute's candle count
    if (result) {
      const tribute = await this.getTributeById(tributeId);
      if (tribute && tribute.candleCount > 0) {
        await this.updateTribute(tribute.id, { 
          candleCount: tribute.candleCount - 1 
        });
      }
    }
    
    return result;
  }
  
  async getCandles(tributeId: number): Promise<Candle[]> {
    return Array.from(this._candles.values()).filter(
      candle => candle.tributeId === tributeId
    );
  }
  
  async hasUserLitCandle(userId: number, tributeId: number): Promise<boolean> {
    return Array.from(this._candles.values()).some(
      candle => candle.userId === userId && candle.tributeId === tributeId
    );
  }
}

export const storage = new MemStorage();
