import { Router } from "express";
import { db, ratingsTable, placesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { RatePlaceParams, RatePlaceBody, GetPlaceRatingsParams } from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.post("/", async (req, res) => {
  const paramsParsed = RatePlaceParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid place id" });
    return;
  }
  const bodyParsed = RatePlaceBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const { id } = paramsParsed.data;
  const { user_name, rating, review } = bodyParsed.data;

  const [ratingRow] = await db
    .insert(ratingsTable)
    .values({ place_id: id, user_name, rating, review })
    .returning();

  // Recalculate the place's average rating
  const avgResult = await db
    .select({
      avg: sql<number>`AVG(${ratingsTable.rating})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratingsTable)
    .where(eq(ratingsTable.place_id, id));

  if (avgResult[0]) {
    await db
      .update(placesTable)
      .set({
        rating: Number(avgResult[0].avg.toFixed(1)),
        rating_count: Number(avgResult[0].count),
      })
      .where(eq(placesTable.id, id));
  }

  res.status(201).json(ratingRow);
});

router.get("/", async (req, res) => {
  const parsed = GetPlaceRatingsParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const ratings = await db
    .select()
    .from(ratingsTable)
    .where(eq(ratingsTable.place_id, parsed.data.id))
    .orderBy(sql`${ratingsTable.created_at} DESC`);

  res.json(ratings);
});

export default router;
