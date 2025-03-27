import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTributeSchema, insertGallerySchema, insertSettingsSchema } from "@shared/schema";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { z } from "zod";
import multer from "multer";

const scryptAsync = promisify(scrypt);

// Utility functions for password handling
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      name: string;
      email?: string;
      isAdmin: boolean;
    }
  }
}

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "chris-murphey-memorial",
      resave: false,
      saveUninitialized: false,
      store: storage.sessionStore,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username" });
        }

        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize/deserialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // ====== API Routes ======

  // User Authentication Routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        isAdmin: false, // Ensure no self-registration of admins
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      // Log user in
      req.login(userWithoutPassword, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after registration" });
        }
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      const { password, ...userWithoutPassword } = req.user;
      return res.json(userWithoutPassword);
    }
    return res.status(401).json({ message: "Not authenticated" });
  });

  // Tribute Routes
  app.get("/api/tributes", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const tributes = await storage.getTributes(limit, offset);
      
      // Enhance tributes with user information
      const enhancedTributes = await Promise.all(
        tributes.map(async (tribute) => {
          const user = await storage.getUser(tribute.userId);
          return {
            ...tribute,
            user: user ? { 
              id: user.id, 
              username: user.username, 
              name: user.name
            } : undefined,
            // If user is authenticated, include whether they've lit a candle
            hasLitCandle: req.isAuthenticated() 
              ? await storage.hasUserLitCandle(req.user.id, tribute.id)
              : false
          };
        })
      );
      
      res.json(enhancedTributes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tributes" });
    }
  });

  app.get("/api/tributes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tribute = await storage.getTributeById(id);
      
      if (!tribute) {
        return res.status(404).json({ message: "Tribute not found" });
      }
      
      const user = await storage.getUser(tribute.userId);
      
      res.json({
        ...tribute,
        user: user ? { 
          id: user.id, 
          username: user.username, 
          name: user.name
        } : undefined,
        hasLitCandle: req.isAuthenticated() 
          ? await storage.hasUserLitCandle(req.user.id, tribute.id)
          : false
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tribute" });
    }
  });

  app.post("/api/tributes", isAuthenticated, async (req, res) => {
    try {
      const tributeData = insertTributeSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const tribute = await storage.createTribute(tributeData);
      
      res.status(201).json({
        ...tribute,
        user: { 
          id: req.user.id, 
          username: req.user.username, 
          name: req.user.name
        },
        hasLitCandle: false
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tribute data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create tribute" });
    }
  });

  app.delete("/api/tributes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tribute = await storage.getTributeById(id);
      
      if (!tribute) {
        return res.status(404).json({ message: "Tribute not found" });
      }
      
      // Only allow deletion by the tribute creator or an admin
      if (tribute.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const deleted = await storage.deleteTribute(id);
      
      if (deleted) {
        res.status(200).json({ message: "Tribute deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete tribute" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tribute" });
    }
  });

  // Candle Routes
  app.post("/api/tributes/:id/candle", isAuthenticated, async (req, res) => {
    try {
      const tributeId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const tribute = await storage.getTributeById(tributeId);
      if (!tribute) {
        return res.status(404).json({ message: "Tribute not found" });
      }
      
      const hasLit = await storage.hasUserLitCandle(userId, tributeId);
      
      if (hasLit) {
        // If already lit, remove the candle
        await storage.removeCandle(userId, tributeId);
        res.json({ lit: false, candleCount: tribute.candleCount - 1 });
      } else {
        // If not lit, add a candle
        await storage.addCandle({ userId, tributeId });
        res.json({ lit: true, candleCount: tribute.candleCount + 1 });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle candle" });
    }
  });

  // Gallery Routes
  app.get("/api/gallery", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const images = await storage.getGalleryImages(limit, offset);
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gallery images" });
    }
  });

  app.get("/api/gallery/featured", async (req, res) => {
    try {
      const featuredImages = await storage.getFeaturedGalleryImages();
      res.json(featuredImages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured gallery images" });
    }
  });

  app.post("/api/gallery", isAdmin, async (req, res) => {
    try {
      const imageData = insertGallerySchema.parse(req.body);
      const image = await storage.createGalleryImage(imageData);
      res.status(201).json(image);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid gallery image data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create gallery image" });
    }
  });
  
  // Handle image uploads
  app.post("/api/gallery/upload", isAdmin, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      // Convert the image buffer to base64
      const base64Image = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64Image}`;
      
      // Extract other form data
      const caption = req.body.caption || null;
      const isFeatured = req.body.isFeatured === "true";
      const order = parseInt(req.body.order || "0");
      
      // Create the gallery image entry
      const imageData = {
        imageUrl: dataUrl,
        caption,
        isFeatured,
        order
      };
      
      const image = await storage.createGalleryImage(imageData as any);
      res.status(201).json(image);
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload and process image" });
    }
  });

  app.put("/api/gallery/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const imageData = req.body;
      
      const image = await storage.updateGalleryImage(id, imageData);
      
      if (!image) {
        return res.status(404).json({ message: "Gallery image not found" });
      }
      
      res.json(image);
    } catch (error) {
      res.status(500).json({ message: "Failed to update gallery image" });
    }
  });

  app.delete("/api/gallery/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGalleryImage(id);
      
      if (deleted) {
        res.status(200).json({ message: "Gallery image deleted successfully" });
      } else {
        res.status(404).json({ message: "Gallery image not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete gallery image" });
    }
  });

  // Settings Routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      
      // Convert to key-value object
      const settingsObj = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);
      
      res.json(settingsObj);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const key = req.params.key;
      const setting = await storage.getSetting(key);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json({ value: setting.value });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  app.put("/api/settings/:key", isAdmin, async (req, res) => {
    try {
      const key = req.params.key;
      const { value } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: "Value is required" });
      }
      
      const settingData = insertSettingsSchema.parse({ key, value });
      const setting = await storage.upsertSetting(settingData);
      
      res.json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid setting data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Funeral Program Routes
  app.get("/api/funeral-program", async (req, res) => {
    try {
      const program = await storage.getFuneralProgram();
      
      if (!program) {
        return res.status(404).json({ message: "Funeral program not found" });
      }
      
      res.json(program);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch funeral program" });
    }
  });

  app.put("/api/funeral-program", isAdmin, async (req, res) => {
    try {
      const programData = req.body;
      const program = await storage.updateFuneralProgram(programData);
      res.json(program);
    } catch (error) {
      res.status(500).json({ message: "Failed to update funeral program" });
    }
  });

  // Create the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
