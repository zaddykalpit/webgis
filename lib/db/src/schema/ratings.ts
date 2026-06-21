import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ratingsTable = pgTable("ratings", {
  id: serial("id").primaryKey(),
  place_id: integer("place_id").notNull(),
  user_name: text("user_name").notNull(),
  rating: real("rating").notNull(),
  review: text("review"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertRatingSchema = createInsertSchema(ratingsTable).omit({ id: true, created_at: true });
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratingsTable.$inferSelect;
