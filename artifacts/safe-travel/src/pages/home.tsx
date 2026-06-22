import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, MapPin, Sparkles, Users, ArrowRight, User, CheckCircle2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetDashboardStats, useGetTopRatedPlaces } from "@workspace/api-client-react";
import { PlaceCard } from "@/components/place-card";
import { useSocket } from "@/context/socket-context";

export default function Home() {
  const [, setLocation] = useLocation();
  const { username, setUsername, connected } = useSocket();
  const [nameInput, setNameInput] = useState("");
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: topPlaces, isLoading: placesLoading } = useGetTopRatedPlaces({ limit: 3 });
  const topRatedPlaces = Array.isArray(topPlaces) ? topPlaces : [];

  function handleAccountSetup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    setUsername(name);
    setNameInput("");
  }

  return (
    <div className="flex flex-col w-full">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="currentColor" strokeWidth="1" fill="none"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>
        </div>

        <div className="container mx-auto px-4 relative z-10 grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left — headline */}
          <div className="text-center lg:text-left">
            <Badge className="mb-6 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20 text-sm py-1.5 px-4 backdrop-blur">
              <Shield className="w-4 h-4 mr-2" />
              Your Safety-First Travel Companion
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl text-balance">
              {username ? (
                <>Welcome back, <span className="text-accent">{username}</span>.</>
              ) : (
                <>Travel Nepal with <span className="text-accent">confidence</span>.</>
              )}
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl text-balance lg:mx-0 mx-auto">
              {username
                ? "Your dashboard is ready. Explore verified places, match with local guides, and keep safety tools close while you travel."
                : "Set your name so Yatra can personalise your dashboard and connect you to live SOS alerts while you explore Nepal."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center lg:justify-start max-w-md lg:max-w-none">
              <Button
                size="lg"
                className="h-14 px-8 bg-accent text-accent-foreground hover:bg-accent/90 text-lg rounded-full"
                onClick={() => setLocation(username ? "/places" : "/map")}
              >
                <MapPin className="mr-2 w-5 h-5" />
                {username ? "Explore Safely" : "Open Safety Map"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 border-primary-foreground/20 hover:bg-primary-foreground/10 text-lg rounded-full"
                onClick={() => setLocation("/suggest")}
              >
                <Sparkles className="mr-2 w-5 h-5" /> Mood Wizard
              </Button>
            </div>
          </div>

          {/* Right — account card */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[2rem] border border-primary-foreground/15 bg-background p-3 text-foreground shadow-2xl">
              <div className="rounded-[1.5rem] border border-border bg-card p-6 shadow-lg">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                      Travel dashboard
                    </p>
                    <h2 className="mt-2 text-3xl font-bold">
                      {username ? "You're in" : "Get started"}
                    </h2>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {username ? <CheckCircle2 className="h-6 w-6" /> : <User className="h-6 w-6" />}
                  </div>
                </div>

                {username ? (
                  <div className="space-y-5">
                    <div className="rounded-2xl border bg-secondary/50 p-4">
                      <p className="text-sm text-muted-foreground">Signed in as</p>
                      <p className="mt-1 text-2xl font-bold text-primary">{username}</p>
                      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`} />
                        {connected ? "Connected to live SOS alerts" : "Saved locally"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button className="h-12 rounded-full" onClick={() => setLocation("/places")}>
                        Places
                      </Button>
                      <Button variant="outline" className="h-12 rounded-full" onClick={() => setLocation("/map?safety=1")}>
                        <Map className="w-4 h-4 mr-1.5" /> Safety Map
                      </Button>
                    </div>
                    <Button variant="ghost" className="h-10 w-full rounded-full text-sm" onClick={() => setLocation("/guides")}>
                      Find a Guide <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={handleAccountSetup}>
                    <div>
                      <label htmlFor="hero-username" className="mb-2 block text-sm font-medium">
                        Choose your display name
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="hero-username"
                          value={nameInput}
                          onChange={e => setNameInput(e.target.value)}
                          placeholder="e.g. Priya, Ravi, Sarah…"
                          className="h-12 rounded-xl bg-background pl-10"
                          maxLength={30}
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 w-full rounded-full text-base"
                      disabled={!nameInput.trim()}
                    >
                      Save &amp; Connect <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="h-12 w-full rounded-full bg-background text-base"
                      onClick={() => setLocation("/places")}
                    >
                      Browse without account
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────── */}
      <section className="py-12 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { value: statsLoading ? "—" : String(stats?.total_places ?? 0),      label: "Safe Places" },
              { value: statsLoading ? "—" : String(stats?.total_guides ?? 0),      label: "Verified Guides" },
              { value: statsLoading ? "—" : String(stats?.total_ratings ?? 0),     label: "Community Reviews" },
              { value: statsLoading ? "—" : (stats?.avg_rating?.toFixed(1) ?? "0.0"), label: "Average Rating" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center text-center p-4">
                <span className="text-4xl font-bold text-primary mb-2">{value}</span>
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOP RATED ─────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">Top Rated Places</h2>
              <p className="text-muted-foreground">Highly recommended by our community</p>
            </div>
            <Button variant="ghost" onClick={() => setLocation("/places")} className="hidden sm:flex group">
              View All <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {placesLoading
              ? Array(3).fill(0).map((_, i) => <div key={i} className="h-80 bg-muted rounded-xl animate-pulse" />)
              : topRatedPlaces.length > 0
                ? topRatedPlaces.map(place => <PlaceCard key={place.id} place={place} />)
                : <div className="col-span-3 text-center py-12 text-muted-foreground">No places found.</div>
            }
          </div>
          <Button variant="outline" onClick={() => setLocation("/places")} className="w-full mt-6 sm:hidden">
            View All Places
          </Button>
        </div>
      </section>

      {/* ── SAFETY MAP CTA ────────────────────────────────────── */}
      <section className="py-16 bg-background border-y">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="rounded-3xl bg-primary/5 border border-primary/10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
                <Map className="w-7 h-7" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Emergency Safety Map</h2>
              <p className="text-muted-foreground text-lg">
                One tap shows your live location, draws the shortest road route to the nearest hospital and police station — all inside Yatra, no external apps needed.
              </p>
            </div>
            <Button
              size="lg"
              className="rounded-full h-14 px-10 text-lg shrink-0"
              onClick={() => setLocation("/map?safety=1")}
            >
              Open Safety Map <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── GUIDES CTA ────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Need a local friend?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with verified, background-checked local guides who know every corner of Kathmandu and Dhulikhel. Filter by language, specialty, and gender.
          </p>
          <Button size="lg" className="rounded-full h-14 px-8 text-lg" onClick={() => setLocation("/guides")}>
            Find a Guide
          </Button>
        </div>
      </section>

    </div>
  );
}

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${className ?? ""}`}>
      {children}
    </span>
  );
}
