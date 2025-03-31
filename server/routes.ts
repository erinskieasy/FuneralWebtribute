import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
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
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Ensure upload directories exist
const uploadDirs = ['./uploads', './uploads/background', './uploads/tribute', './uploads/gallery'];
for (const dir of uploadDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Configure multer for disk storage
const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the destination folder based on the route
    let folder = './uploads';
    
    if (req.originalUrl.includes('/settings/upload/backgroundImage')) {
      folder = './uploads/background';
    } else if (req.originalUrl.includes('/settings/upload/tributeImage')) {
      folder = './uploads/tribute';
    } else if (req.originalUrl.includes('/gallery')) {
      folder = './uploads/gallery';
    }
    
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename to prevent overwriting
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
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
  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  // Set up session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "chris-murphey-memorial",
      resave: false,
      saveUninitialized: false,
      store: dbStorage.sessionStore,
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
        const user = await dbStorage.getUserByUsername(username);
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
      const user = await dbStorage.getUser(id);
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
      const existingUser = await dbStorage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(userData.password);
      const user = await dbStorage.createUser({
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
      
      const tributes = await dbStorage.getTributes(limit, offset);
      
      // Enhance tributes with user information
      const enhancedTributes = await Promise.all(
        tributes.map(async (tribute) => {
          const user = await dbStorage.getUser(tribute.userId);
          return {
            ...tribute,
            user: user ? { 
              id: user.id, 
              username: user.username, 
              name: user.name
            } : undefined,
            // If user is authenticated, include whether they've lit a candle
            hasLitCandle: req.isAuthenticated() 
              ? await dbStorage.hasUserLitCandle(req.user.id, tribute.id)
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
      const tribute = await dbStorage.getTributeById(id);
      
      if (!tribute) {
        return res.status(404).json({ message: "Tribute not found" });
      }
      
      const user = await dbStorage.getUser(tribute.userId);
      
      res.json({
        ...tribute,
        user: user ? { 
          id: user.id, 
          username: user.username, 
          name: user.name
        } : undefined,
        hasLitCandle: req.isAuthenticated() 
          ? await dbStorage.hasUserLitCandle(req.user.id, tribute.id)
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
      
      const tribute = await dbStorage.createTribute(tributeData);
      
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
      const tribute = await dbStorage.getTributeById(id);
      
      if (!tribute) {
        return res.status(404).json({ message: "Tribute not found" });
      }
      
      // Only allow deletion by the tribute creator or an admin
      if (tribute.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const deleted = await dbStorage.deleteTribute(id);
      
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
      
      const tribute = await dbStorage.getTributeById(tributeId);
      if (!tribute) {
        return res.status(404).json({ message: "Tribute not found" });
      }
      
      const hasLit = await dbStorage.hasUserLitCandle(userId, tributeId);
      
      if (hasLit) {
        // If already lit, remove the candle
        await dbStorage.removeCandle(userId, tributeId);
        res.json({ lit: false, candleCount: tribute.candleCount - 1 });
      } else {
        // If not lit, add a candle
        await dbStorage.addCandle({ userId, tributeId });
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
      
      const images = await dbStorage.getGalleryImages(limit, offset);
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gallery images" });
    }
  });

  app.get("/api/gallery/featured", async (req, res) => {
    try {
      const featuredImages = await dbStorage.getFeaturedGalleryImages();
      res.json(featuredImages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured gallery images" });
    }
  });

  app.post("/api/gallery", isAdmin, async (req, res) => {
    try {
      const imageData = insertGallerySchema.parse(req.body);
      const image = await dbStorage.createGalleryImage(imageData);
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
      
      // The file has been saved to disk by multer
      // Create a URL path to the file
      const imagePath = `/uploads/gallery/${req.file.filename}`;
      
      // Extract other form data
      const caption = req.body.caption || null;
      const isFeatured = req.body.isFeatured === "true";
      const order = parseInt(req.body.order || "0");
      
      // Create the gallery image entry with the file path
      const imageData = {
        imageUrl: imagePath,
        caption,
        isFeatured,
        order
      };
      
      const image = await dbStorage.createGalleryImage(imageData as any);
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
      
      const image = await dbStorage.updateGalleryImage(id, imageData);
      
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
      const deleted = await dbStorage.deleteGalleryImage(id);
      
      if (deleted) {
        res.status(200).json({ message: "Gallery image deleted successfully" });
      } else {
        res.status(404).json({ message: "Gallery image not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete gallery image" });
    }
  });

  // User Management Routes (Admin only)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      // This endpoint is for admin to get a list of all users
      const users = await Promise.all(
        (await dbStorage.getAllUsers()).map(user => {
          // Remove password field for security
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        })
      );
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.put("/api/users/:id/role", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isAdmin } = req.body;
      
      // Validate the isAdmin field is provided
      if (typeof isAdmin !== 'boolean') {
        return res.status(400).json({ message: "isAdmin field must be a boolean" });
      }
      
      // Don't allow users to remove their own admin status
      if (req.user.id === userId && !isAdmin) {
        return res.status(403).json({ message: "You cannot remove your own admin status" });
      }
      
      const updatedUser = await dbStorage.updateUser(userId, { isAdmin });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  
  app.put("/api/users/:id/reset-password", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      // Validate the new password
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      const updatedUser = await dbStorage.updateUser(userId, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Settings Routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await dbStorage.getAllSettings();
      
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
      const setting = await dbStorage.getSetting(key);
      
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
      const setting = await dbStorage.upsertSetting(settingData);
      
      res.json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid setting data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update setting" });
    }
  });
  
  // Handle setting image uploads (for tribute image and background image)
  app.post("/api/settings/upload/:key", isAdmin, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      const key = req.params.key;
      
      // Only allow certain keys to be updated via file upload
      if (key !== "tributeImage" && key !== "backgroundImage") {
        return res.status(400).json({ message: "Invalid setting key for image upload" });
      }
      
      // Determine the appropriate folder based on the key
      const folder = key === "tributeImage" ? "tribute" : "background";
      
      // Create a URL path to the file
      const imagePath = `/uploads/${folder}/${req.file.filename}`;
      
      // Update the setting with the file path
      const settingData = insertSettingsSchema.parse({ key, value: imagePath });
      const setting = await dbStorage.upsertSetting(settingData);
      
      res.json(setting);
    } catch (error) {
      console.error("Error uploading setting image:", error);
      res.status(500).json({ message: "Failed to upload and process image" });
    }
  });

  // Funeral Program Routes
  app.get("/api/funeral-program", async (req, res) => {
    try {
      const program = await dbStorage.getFuneralProgram();
      
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
      const program = await dbStorage.updateFuneralProgram(programData);
      res.json(program);
    } catch (error) {
      res.status(500).json({ message: "Failed to update funeral program" });
    }
  });

  // Create the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
