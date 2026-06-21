import { Router } from "express";
import { db, placesTable, guidesTable, ratingsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const [placesCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(placesTable);
  const [guidesCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(guidesTable);
  const [ratingsAgg] = await db
    .select({
      count: sql<number>`COUNT(*)`,
      avg: sql<number>`COALESCE(AVG(${ratingsTable.rating}), 0)`,
    })
    .from(ratingsTable);

  const topCategoryResult = await db
    .select({
      type: placesTable.type,
      count: sql<number>`COUNT(*)`,
    })
    .from(placesTable)
    .groupBy(placesTable.type)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(1);

  res.json({
    total_places: Number(placesCount?.count ?? 0),
    total_guides: Number(guidesCount?.count ?? 0),
    total_ratings: Number(ratingsAgg?.count ?? 0),
    avg_rating: Number((ratingsAgg?.avg ?? 0).toFixed(1)),
    top_category: topCategoryResult[0]?.type ?? "restaurant",
  });
});

export default router;
