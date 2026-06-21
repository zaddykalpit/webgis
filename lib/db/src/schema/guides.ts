import { pgTable, serial, text, real, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const guidesTable = pgTable("guides", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company_name: text("company_name").notNull(),
  gender: text("gender").notNull(), // male | female
  rating: real("rating").notNull().default(0),
  rating_count: integer("rating_count").notNull().default(0),
  price_per_day: real("price_per_day").notNull(),
  price_negotiable: boolean("price_negotiable").notNull().default(false),
  languages: text("languages").array().notNull().default([]),
  specialty: text("specialty").notNull(),
  verified: boolean("verified").notNull().default(false),
  experience_years: integer("experience_years").notNull().default(1),
  photo_url: text("photo_url"),
  bio: text("bio"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertGuideSchema = createInsertSchema(guidesTable).omit({ id: true, created_at: true });
export type InsertGuide = z.infer<typeof insertGuideSchema>;
export type Guide = typeof guidesTable.$inferSelect;
