import { Router } from "express";
import { db, placesTable, guidesTable } from "@workspace/db";
import { eq, and, gte, inArray, sql } from "drizzle-orm";
import { GetTravelSuggestionsBody } from "@workspace/api-zod";

const router = Router();

const MOOD_TYPES: Record<string, string[]> = {
  adventurous: ["attraction"],
  relaxed: ["hotel", "attraction"],
  cultural: ["attraction"],
  foodie: ["restaurant"],
  social: ["restaurant", "attraction"],
  spiritual: ["attraction"],
};

const BUDGET_PRICE: Record<string, number[]> = {
  budget: [1],
  moderate: [1, 2],
  luxury: [1, 2, 3],
};

const ENERGY_MIN_RATING: Record<string, number> = {
  low: 3.5,
  medium: 4.0,
  high: 4.0,
};

const MOOD_MESSAGES: Record<string, string> = {
  adventurous: "Ready for adventure? Here are exciting attractions and activities to get your heart racing.",
  relaxed: "Taking it easy today? These calm spots and comfortable hotels are perfect for you.",
  cultural: "Immerse yourself in local culture with these top-rated cultural experiences.",
  foodie: "Your stomach is your guide today. Explore the best dining experiences nearby.",
  social: "Time to meet people and make memories — these lively spots are your playground.",
  spiritual: "Find peace and purpose at these meaningful and serene destinations.",
};

router.post("/", async (req, res) => {
  const parsed = GetTravelSuggestionsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const { mood, energy_level, budget } = parsed.data;

  const placeTypes = MOOD_TYPES[mood] ?? ["restaurant", "attraction"];
  const priceLevels = BUDGET_PRICE[budget] ?? [1, 2];
  const minRating = ENERGY_MIN_RATING[energy_level] ?? 4.0;

  const places = await db
    .select()
    .from(placesTable)
    .where(
      and(
        inArray(placesTable.type, placeTypes),
        gte(placesTable.rating, minRating),
        inArray(placesTable.price_level, priceLevels),
        eq(placesTable.is_main_road_accessible, true)
      )
    )
    .orderBy(sql`${placesTable.rating} DESC`)
    .limit(6);

  const guides = await db
    .select()
    .from(guidesTable)
    .where(
      and(
        gte(guidesTable.rating, 3.5),
        budget === "budget" ? eq(guidesTable.price_negotiable, true) : undefined
      )
    )
    .orderBy(sql`${guidesTable.rating} DESC`)
    .limit(3);

  res.json({
    places: places.map((p) => ({ ...p, distance_km: null })),
    guides,
    message: MOOD_MESSAGES[mood] ?? "Here are our top recommendations for your trip.",
  });
});

export default router;
