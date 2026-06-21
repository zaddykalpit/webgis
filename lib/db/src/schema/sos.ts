import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sosAlertsTable = pgTable("sos_alerts", {
  id: serial("id").primaryKey(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  message: text("message"),
  contacts_notified: integer("contacts_notified").notNull().default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const sosContactsTable = pgTable("sos_contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertSosAlertSchema = createInsertSchema(sosAlertsTable).omit({ id: true, created_at: true });
export const insertSosContactSchema = createInsertSchema(sosContactsTable).omit({ id: true, created_at: true });

export type InsertSosAlert = z.infer<typeof insertSosAlertSchema>;
export type SosAlert = typeof sosAlertsTable.$inferSelect;
export type InsertSosContact = z.infer<typeof insertSosContactSchema>;
export type SosContact = typeof sosContactsTable.$inferSelect;
