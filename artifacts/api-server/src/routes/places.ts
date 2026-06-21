import { Router } from "express";
import { db, placesTable } from "@workspace/db";
import { eq, and, gte, inArray, sql } from "drizzle-orm";
import {
  ListPlacesQueryParams,
  CreatePlaceBody,
  GetTopRatedPlacesQueryParams,
  GetSafeSpotsQueryParams,
  GetPlaceParams,
} from "@workspace/api-zod";
import ratingsRouter from "./ratings";

const router = Router();

// Haversine distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get("/top-rated", async (req, res) => {
  const parsed = GetTopRatedPlacesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { type, limit = 10 } = parsed.data;

  const conditions = [];
  if (type && type !== "all") conditions.push(eq(placesTable.type, type));

  const places = await db
    .select()
    .from(placesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${placesTable.rating} DESC`)
    .limit(Number(limit));

  res.json(places.map((p) => ({ ...p, distance_km: null })));
});

router.get("/safe-spots", async (req, res) => {
  const parsed = GetSafeSpotsQueryParams.safeParse({
    lat: Number(req.query.lat),
    lng: Number(req.query.lng),
    radius_km: req.query.radius_km ? Number(req.query.radius_km) : undefined,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "lat and lng are required" });
    return;
  }
  const { lat, lng, radius_km = 10 } = parsed.data;

  const safeTypes = ["hospital", "police"] as const;
  const allSafe = await db
    .select()
    .from(placesTable)
    .where(inArray(placesTable.type, [...safeTypes]));

  const nearby = allSafe
    .map((p) => ({ ...p, distance_km: haversineKm(lat, lng, p.lat, p.lng) }))
    .filter((p) => p.distance_km <= radius_km)
    .sort((a, b) => a.distance_km - b.distance_km);

  res.json(nearby);
});

router.get("/", async (req, res) => {
  const parsed = ListPlacesQueryParams.safeParse({
    type: req.query.type,
    min_rating: req.query.min_rating ? Number(req.query.min_rating) : undefined,
    lat: req.query.lat ? Number(req.query.lat) : undefined,
    lng: req.query.lng ? Number(req.query.lng) : undefined,
    radius_km: req.query.radius_km ? Number(req.query.radius_km) : undefined,
    main_road_only: req.query.main_road_only === "true" ? true : req.query.main_road_only === "false" ? false : undefined,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { type, min_rating, lat, lng, radius_km = 20, main_road_only } = parsed.data;

  const conditions = [];
  if (type && type !== "all") conditions.push(eq(placesTable.type, type));
  if (min_rating !== undefined) conditions.push(gte(placesTable.rating, min_rating));
  if (main_road_only) conditions.push(eq(placesTable.is_main_road_accessible, true));

  let places = await db
    .select()
    .from(placesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${placesTable.rating} DESC`);

  let result = places.map((p) => ({ ...p, distance_km: null as number | null }));

  if (lat !== undefined && lng !== undefined) {
    result = result
      .map((p) => ({ ...p, distance_km: haversineKm(lat, lng, p.lat, p.lng) }))
      .filter((p) => p.distance_km! <= radius_km)
      .sort((a, b) => a.distance_km! - b.distance_km!);
  }

  res.json(result);
});

router.post("/", async (req, res) => {
  const parsed = CreatePlaceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [place] = await db.insert(placesTable).values(parsed.data).returning();
  res.status(201).json({ ...place, distance_km: null });
});

router.get("/:id", async (req, res) => {
  const parsed = GetPlaceParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [place] = await db.select().from(placesTable).where(eq(placesTable.id, parsed.data.id));
  if (!place) {
    res.status(404).json({ error: "Place not found" });
    return;
  }
  res.json({ ...place, distance_km: null });
});

router.use("/:id/rate", ratingsRouter);
router.use("/:id/ratings", ratingsRouter);

export default router;
