import { Router } from "express";
import { db, guidesTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import {
  ListGuidesQueryParams,
  CreateGuideBody,
  GetGuideParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const parsed = ListGuidesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { gender, min_rating, max_price, negotiable } = parsed.data;

  const conditions = [];
  if (gender && gender !== "any") conditions.push(eq(guidesTable.gender, gender));
  if (min_rating !== undefined) conditions.push(gte(guidesTable.rating, min_rating));
  if (max_price !== undefined) conditions.push(lte(guidesTable.price_per_day, max_price));
  if (negotiable !== undefined) conditions.push(eq(guidesTable.price_negotiable, negotiable));

  const guides = await db
    .select()
    .from(guidesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${guidesTable.rating} DESC`);

  res.json(guides);
});

router.post("/", async (req, res) => {
  const parsed = CreateGuideBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [guide] = await db.insert(guidesTable).values(parsed.data).returning();
  res.status(201).json(guide);
});

router.get("/:id", async (req, res) => {
  const parsed = GetGuideParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [guide] = await db.select().from(guidesTable).where(eq(guidesTable.id, parsed.data.id));
  if (!guide) {
    res.status(404).json({ error: "Guide not found" });
    return;
  }
  res.json(guide);
});

export default router;
