import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Sparkles, Mountain, Coffee, Compass, Users, ArrowRight,
  Star, MapPin, Percent, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useListPlaces } from "@workspace/api-client-react";
import type { Place } from "@workspace/api-client-react";
import { YatraLogo } from "@/components/yatra-logo";

// ─── Types ───────────────────────────────────────────────────────────────────

type Mood       = "adventure" | "relaxing" | "cultural" | "spiritual";
type Budget     = "low" | "medium" | "high";
type TravelType = "solo" | "family" | "friends";

interface Prefs { mood: Mood; budget: Budget; travelType: TravelType }
interface ScoredPlace extends Place { score: number }

const PREFS_KEY = "yatra_recommend_prefs";

// ─── Algorithm ───────────────────────────────────────────────────────────────

function score(place: Place, prefs: Prefs): number {
  const moodMatch   = place.mood        === prefs.mood        ? 1 : 0;
  const budgetMatch = place.budget_level === prefs.budget      ? 1 : 0;
  const travelMatch = place.travel_type  === prefs.travelType  ? 1 : 0;
  return moodMatch * 0.5 + budgetMatch * 0.3 + travelMatch * 0.2;
}

function recommend(places: Place[], prefs: Prefs): ScoredPlace[] {
  return places
    .filter(p => ["attraction", "hotel", "restaurant"].includes(p.type))
    .map(p => ({ ...p, score: score(p, prefs) }))
    .sort((a, b) => b.score - a.score || b.rating - a.rating)
    .slice(0, 5);
}

// ─── Option components ────────────────────────────────────────────────────────

function OptionBtn({
  icon, label, sub, selected, onClick,
}: { icon: React.ReactNode; label: string; sub?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all text-center ${
        selected
          ? "border-primary bg-primary/8 text-primary shadow-md"
          : "border-border hover:border-primary/40 hover:bg-muted"
      }`}
    >
      <span className={selected ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      <span className="font-bold text-sm">{label}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </button>
  );
}

// ─── Match badge ──────────────────────────────────────────────────────────────

function MatchBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? "bg-green-100 text-green-700 border-green-300"
    : pct >= 50 ? "bg-yellow-100 text-yellow-700 border-yellow-300"
    : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${color}`}>
      <Percent className="w-3 h-3" />
      {pct}% match
    </span>
  );
}

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({ place, onViewMap }: { place: ScoredPlace; onViewMap: (p: ScoredPlace) => void }) {
  return (
    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-44 bg-muted">
        {place.photo_url ? (
          <img src={place.photo_url} alt={place.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <MapPin className="w-10 h-10 text-primary/30" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <MatchBadge score={place.score} />
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="text-xs font-semibold bg-black/60 text-white px-2.5 py-1 rounded-full capitalize">
            {place.type}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-base leading-tight">{place.name}</h3>
          <span className="flex items-center gap-1 text-sm font-semibold text-amber-500 shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            {place.rating.toFixed(1)}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {place.description ?? place.address}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs bg-primary/8 text-primary px-2 py-0.5 rounded-full capitalize font-medium">
            {place.mood}
          </span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize font-medium">
            {place.budget_level === "low" ? "Budget" : place.budget_level === "high" ? "Luxury" : "Moderate"}
          </span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize font-medium">
            {place.travel_type}
          </span>
        </div>

        <Button
          size="sm"
          className="w-full rounded-xl"
          onClick={() => onViewMap(place)}
        >
          <MapPin className="w-3.5 h-3.5 mr-1.5" />
          View on Map
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const DEFAULT_PREFS: Prefs = { mood: "cultural", budget: "medium", travelType: "solo" };

export default function Suggest() {
  const [, navigate] = useLocation();
  const { data: allPlaces = [], isLoading } = useListPlaces({});

  // Load saved prefs from localStorage
  const [prefs, setPrefs] = useState<Prefs>(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      return saved ? (JSON.parse(saved) as Prefs) : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  const [step, setStep]         = useState<1 | 2 | 3>(1);
  const [results, setResults]   = useState<ScoredPlace[] | null>(null);
  const [loading, setLoading]   = useState(false);

  // Save prefs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  function setPref<K extends keyof Prefs>(key: K, val: Prefs[K]) {
    setPrefs(p => ({ ...p, [key]: val }));
  }

  function handleGetRecommendations() {
    setLoading(true);
    setResults(null);
    // Simulate brief loading for UX
    setTimeout(() => {
      setResults(recommend(allPlaces, prefs));
      setLoading(false);
    }, 900);
  }

  function handleViewMap(place: ScoredPlace) {
    navigate(`/map?zoom=${place.lat},${place.lng}`);
  }

  function handleReset() {
    setResults(null);
    setStep(1);
  }

  // ── Results view ────────────────────────────────────────────────────────────
  if (results !== null || loading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Your Recommendations</h1>
            <p className="text-sm text-muted-foreground">
              {prefs.mood} · {prefs.budget} budget · {prefs.travelType}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center gap-6">
            <div className="text-primary">
              <YatraLogo size={56} />
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-muted-foreground text-lg">Finding the best places for you…</p>
          </div>
        ) : results && results.length > 0 ? (
          <>
            <p className="text-muted-foreground mb-6">
              Showing top <span className="font-semibold text-foreground">{results.length}</span> places matching your preferences, sorted by match score.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map(place => (
                <ResultCard key={place.id} place={place} onViewMap={handleViewMap} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg">No places matched your preferences.</p>
            <Button className="mt-4" onClick={handleReset}>Try again</Button>
          </div>
        )}
      </div>
    );
  }

  // ── Wizard view ─────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Find Places for Me</h1>
        <p className="text-muted-foreground">
          Tell us your preferences and we'll match the best Nepal destinations for you.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {(["Mood", "Budget", "Travel Type"] as const).map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex flex-col items-center`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step === n ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : step > n  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
                }`}>{n}</div>
                <span className={`text-xs mt-1 font-medium ${step === n ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
              </div>
              {i < 2 && <div className={`w-12 h-0.5 mb-4 transition-colors ${step > n ? "bg-primary/40" : "bg-muted"}`} />}
            </div>
          );
        })}
      </div>

      <Card className="border shadow-lg">
        <CardContent className="p-6 md:p-10">

          {/* Step 1: Mood */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
              <h2 className="text-xl font-bold text-center mb-6">What's your travel mood?</h2>
              <div className="grid grid-cols-2 gap-3">
                <OptionBtn icon={<Mountain className="w-7 h-7" />} label="Adventure"
                  sub="Trekking, thrills, outdoors"
                  selected={prefs.mood === "adventure"}
                  onClick={() => setPref("mood", "adventure")} />
                <OptionBtn icon={<Coffee className="w-7 h-7" />} label="Relaxing"
                  sub="Peaceful, slow-paced stays"
                  selected={prefs.mood === "relaxing"}
                  onClick={() => setPref("mood", "relaxing")} />
                <OptionBtn icon={<Compass className="w-7 h-7" />} label="Cultural"
                  sub="Heritage, history, arts"
                  selected={prefs.mood === "cultural"}
                  onClick={() => setPref("mood", "cultural")} />
                <OptionBtn icon={<Sparkles className="w-7 h-7" />} label="Spiritual"
                  sub="Temples, monasteries, peace"
                  selected={prefs.mood === "spiritual"}
                  onClick={() => setPref("mood", "spiritual")} />
              </div>
            </div>
          )}

          {/* Step 2: Budget */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-400">
              <h2 className="text-xl font-bold text-center mb-6">What's your budget?</h2>
              <div className="flex flex-col gap-3">
                {([
                  { val: "low",    label: "Low",    price: "$",    sub: "Free or cheap — local experiences" },
                  { val: "medium", label: "Medium",  price: "$$",   sub: "Comfortable, balanced spending" },
                  { val: "high",   label: "High",    price: "$$$",  sub: "Premium, luxury experiences" },
                ] as const).map(({ val, label, price, sub }) => (
                  <button
                    key={val}
                    onClick={() => setPref("budget", val)}
                    className={`flex items-center justify-between text-left px-5 py-4 rounded-2xl border-2 transition-all ${
                      prefs.budget === val
                        ? "border-primary bg-primary/8 text-primary"
                        : "border-border hover:border-primary/40 hover:bg-muted"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-base">{label}</p>
                      <p className="text-sm text-muted-foreground">{sub}</p>
                    </div>
                    <span className={`font-black text-xl ${prefs.budget === val ? "text-primary" : "text-muted-foreground"}`}>{price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Travel Type */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-400">
              <h2 className="text-xl font-bold text-center mb-6">Who are you traveling with?</h2>
              <div className="grid grid-cols-3 gap-3">
                <OptionBtn icon={<Compass className="w-7 h-7" />} label="Solo"
                  sub="Just me"
                  selected={prefs.travelType === "solo"}
                  onClick={() => setPref("travelType", "solo")} />
                <OptionBtn icon={<Users className="w-7 h-7" />} label="Family"
                  sub="With loved ones"
                  selected={prefs.travelType === "family"}
                  onClick={() => setPref("travelType", "family")} />
                <OptionBtn icon={<Users className="w-7 h-7" />} label="Friends"
                  sub="Group trip"
                  selected={prefs.travelType === "friends"}
                  onClick={() => setPref("travelType", "friends")} />
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="mt-10 flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)} disabled={step === 1} className="w-24">
              Back
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)} className="w-32">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleGetRecommendations}
                disabled={isLoading}
                className="w-48 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isLoading ? "Loading…" : "Get Recommendations"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-4">
        Your preferences are saved automatically for next time.
      </p>
    </div>
  );
}
