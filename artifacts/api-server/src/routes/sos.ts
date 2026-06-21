import { Router } from "express";
import { db, sosAlertsTable, sosContactsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  TriggerSosAlertBody,
  CreateSosContactBody,
  DeleteSosContactParams,
} from "@workspace/api-zod";

const router = Router();

router.post("/alert", async (req, res) => {
  const parsed = TriggerSosAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  // Count active contacts to report how many were "notified"
  const contacts = await db.select().from(sosContactsTable);
  const contactsCount = contacts.length;

  const [alert] = await db
    .insert(sosAlertsTable)
    .values({ ...parsed.data, contacts_notified: contactsCount })
    .returning();

  res.status(201).json(alert);
});

router.get("/contacts", async (_req, res) => {
  const contacts = await db
    .select()
    .from(sosContactsTable)
    .orderBy(sql`${sosContactsTable.created_at} DESC`);
  res.json(contacts);
});

router.post("/contacts", async (req, res) => {
  const parsed = CreateSosContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [contact] = await db.insert(sosContactsTable).values(parsed.data).returning();
  res.status(201).json(contact);
});

router.delete("/contacts/:id", async (req, res) => {
  const parsed = DeleteSosContactParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(sosContactsTable).where(eq(sosContactsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
