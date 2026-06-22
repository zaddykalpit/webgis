import { pgTable, serial, text, real, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const placesTable = pgTable("places", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // restaurant | hotel | attraction | hospital | police
  rating: real("rating").notNull().default(0),
  rating_count: integer("rating_count").notNull().default(0),
  address: text("address").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  is_main_road_accessible: boolean("is_main_road_accessible").notNull().default(true),
  price_level: integer("price_level").notNull().default(1), // 1=budget, 2=moderate, 3=expensive
  photo_url: text("photo_url"),
  description: text("description"),
  phone: text("phone"),
  mood: text("mood").notNull().default("cultural"),
  budget_level: text("budget_level").notNull().default("medium"),
  travel_type: text("travel_type").notNull().default("solo"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlaceSchema = createInsertSchema(placesTable).omit({ id: true, created_at: true });
export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type Place = typeof placesTable.$inferSelect;
