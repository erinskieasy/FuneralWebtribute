import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  isAdmin: true,
});

// Tribute model
export const tributes = pgTable("tributes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  candleCount: integer("candle_count").default(0).notNull(),
});

export const insertTributeSchema = createInsertSchema(tributes).pick({
  userId: true,
  content: true,
  mediaUrl: true,
  mediaType: true,
});

// Gallery model
export const gallery = pgTable("gallery", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  order: integer("order").default(0).notNull(),
});

export const insertGallerySchema = createInsertSchema(gallery).pick({
  imageUrl: true,
  caption: true,
  isFeatured: true,
  order: true,
});

// Settings model for customizable content
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
});

// Funeral program model
export const funeralProgram = pgTable("funeral_program", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  location: text("location").notNull(),
  address: text("address").notNull(),
  streamLink: text("stream_link"),
  programPdfUrl: text("program_pdf_url"),
});

export const insertFuneralProgramSchema = createInsertSchema(funeralProgram).omit({
  id: true,
});

// Candle lights by users
export const candles = pgTable("candles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tributeId: integer("tribute_id").notNull(),
});

export const insertCandleSchema = createInsertSchema(candles).pick({
  userId: true,
  tributeId: true,
});

// Define types for all tables
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Tribute = typeof tributes.$inferSelect;
export type InsertTribute = z.infer<typeof insertTributeSchema>;

export type GalleryImage = typeof gallery.$inferSelect;
export type InsertGalleryImage = z.infer<typeof insertGallerySchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingsSchema>;

export type FuneralProgram = typeof funeralProgram.$inferSelect;
export type InsertFuneralProgram = z.infer<typeof insertFuneralProgramSchema>;

export type Candle = typeof candles.$inferSelect;
export type InsertCandle = z.infer<typeof insertCandleSchema>;
