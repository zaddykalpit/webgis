import { useState } from "react";
import { Link } from "wouter";
import { Sparkles, Map, Mountain, Coffee, Utensils, Users, ArrowRight, Loader2, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation, DEFAULT_LOCATION } from "@/lib/location";
import { 
  useGetTravelSuggestions,
  TravelPreferenceInputMood,
  TravelPreferenceInputEnergyLevel,
  TravelPreferenceInputBudget
} from "@workspace/api-client-react";
import { PlaceCard } from "@/components/place-card";
import { GuideCard } from "@/components/guide-card";

type Step = 1 | 2 | 3 | 4;

export default function Suggest() {
  const { location } = useGeolocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>(1);
  const [preferences, setPreferences] = useState({
    mood: TravelPreferenceInputMood.relaxed,
    energy_level: TravelPreferenceInputEnergyLevel.medium,
    budget: TravelPreferenceInputBudget.moderate,
  });

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const getSuggestions = useGetTravelSuggestions();

  const handleNext = () => setStep(s => (s + 1) as Step);
  const handlePrev = () => setStep(s => (s - 1) as Step);

  const handleSubmit = () => {
    const loc = location || DEFAULT_LOCATION;
    setHasSubmitted(true);
    getSuggestions.mutate({
      data: {
        ...preferences,
        lat: loc.lat,
        lng: loc.lng
      }
    });
  };

  const resetForm = () => {
    setHasSubmitted(false);
    setStep(1);
    getSuggestions.reset();
  };

  if (hasSubmitted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Button variant="ghost" size="icon" onClick={resetForm}>
            <ArrowRight className="w-5 h-5 rotate-180" />
          </Button>
          <h1 className="text-2xl font-bold">Your Personalized Plan</h1>
        </div>

        {getSuggestions.isPending ? (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <h2 className="text-xl font-medium">Crafting your perfect journey...</h2>
            <p className="text-muted-foreground max-w-md">
              We're analyzing safe spots, matching guides, and building a tailored experience based on your mood.
            </p>
          </div>
        ) : getSuggestions.isSuccess && getSuggestions.data ? (
          <div className="space-y-12">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex gap-4 items-start">
                  <Sparkles className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Our Recommendation</h3>
                    <p className="text-foreground leading-relaxed">
                      {getSuggestions.data.message}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {getSuggestions.data.places.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Map className="w-6 h-6 mr-2 text-primary" /> Curated Places
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getSuggestions.data.places.map(place => (
                    <PlaceCard key={place.id} place={place} />
                  ))}
                </div>
              </div>
            )}

            {getSuggestions.data.guides.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Users className="w-6 h-6 mr-2 text-primary" /> Recommended Guides
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getSuggestions.data.guides.map(guide => (
                    <GuideCard key={guide.id} guide={guide} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : getSuggestions.isError ? (
          <div className="text-center py-24">
            <h2 className="text-xl font-bold text-destructive mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">We couldn't generate your suggestions. Please try again.</p>
            <Button onClick={handleSubmit}>Retry</Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Travel Mood Wizard</h1>
        <p className="text-muted-foreground">Tell us how you're feeling, and we'll craft a safe, tailored experience just for you.</p>
      </div>

      <div className="mb-8 flex justify-center">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                step === i ? "bg-primary text-primary-foreground" : 
                step > i ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {i}
              </div>
              {i < 3 && (
                <div className={`w-12 h-1 ml-2 transition-colors ${step > i ? "bg-primary/20" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="border shadow-lg">
        <CardContent className="p-6 md:p-10">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-center mb-8">What's your mood today?</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MoodOption 
                  icon={<Mountain className="w-8 h-8 mb-2" />} label="Adventurous" 
                  selected={preferences.mood === "adventurous"} 
                  onClick={() => setPreferences({ ...preferences, mood: TravelPreferenceInputMood.adventurous })} 
                />
                <MoodOption 
                  icon={<Coffee className="w-8 h-8 mb-2" />} label="Relaxed" 
                  selected={preferences.mood === "relaxed"} 
                  onClick={() => setPreferences({ ...preferences, mood: TravelPreferenceInputMood.relaxed })} 
                />
                <MoodOption 
                  icon={<Compass className="w-8 h-8 mb-2" />} label="Cultural" 
                  selected={preferences.mood === "cultural"} 
                  onClick={() => setPreferences({ ...preferences, mood: TravelPreferenceInputMood.cultural })} 
                />
                <MoodOption 
                  icon={<Utensils className="w-8 h-8 mb-2" />} label="Foodie" 
                  selected={preferences.mood === "foodie"} 
                  onClick={() => setPreferences({ ...preferences, mood: TravelPreferenceInputMood.foodie })} 
                />
                <MoodOption 
                  icon={<Users className="w-8 h-8 mb-2" />} label="Social" 
                  selected={preferences.mood === "social"} 
                  onClick={() => setPreferences({ ...preferences, mood: TravelPreferenceInputMood.social })} 
                />
                <MoodOption 
                  icon={<Sparkles className="w-8 h-8 mb-2" />} label="Spiritual" 
                  selected={preferences.mood === "spiritual"} 
                  onClick={() => setPreferences({ ...preferences, mood: TravelPreferenceInputMood.spiritual })} 
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-center mb-8">What's your energy level?</h2>
              <div className="flex flex-col gap-4 max-w-md mx-auto">
                <EnergyOption 
                  title="Low Energy" desc="Take it easy, slow pace." 
                  selected={preferences.energy_level === "low"} 
                  onClick={() => setPreferences({ ...preferences, energy_level: TravelPreferenceInputEnergyLevel.low })} 
                />
                <EnergyOption 
                  title="Medium Energy" desc="Active but not exhausting." 
                  selected={preferences.energy_level === "medium"} 
                  onClick={() => setPreferences({ ...preferences, energy_level: TravelPreferenceInputEnergyLevel.medium })} 
                />
                <EnergyOption 
                  title="High Energy" desc="Ready for anything, fast pace." 
                  selected={preferences.energy_level === "high"} 
                  onClick={() => setPreferences({ ...preferences, energy_level: TravelPreferenceInputEnergyLevel.high })} 
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-center mb-8">What's your budget style?</h2>
              <div className="flex flex-col gap-4 max-w-md mx-auto">
                <BudgetOption 
                  title="Budget" desc="Cost-effective, local favorites." price="$"
                  selected={preferences.budget === "budget"} 
                  onClick={() => setPreferences({ ...preferences, budget: TravelPreferenceInputBudget.budget })} 
                />
                <BudgetOption 
                  title="Moderate" desc="Comfortable, balanced spending." price="$$"
                  selected={preferences.budget === "moderate"} 
                  onClick={() => setPreferences({ ...preferences, budget: TravelPreferenceInputBudget.moderate })} 
                />
                <BudgetOption 
                  title="Luxury" desc="Premium experiences, high-end." price="$$$"
                  selected={preferences.budget === "luxury"} 
                  onClick={() => setPreferences({ ...preferences, budget: TravelPreferenceInputBudget.luxury })} 
                />
              </div>
            </div>
          )}

          <div className="mt-12 flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={handlePrev} disabled={step === 1} className="w-24">
              Back
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext} className="w-32">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="w-40 bg-accent text-accent-foreground hover:bg-accent/90">
                <Sparkles className="w-4 h-4 mr-2" /> Generate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MoodOption({ icon, label, selected, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
        selected 
          ? "border-primary bg-primary/5 text-primary" 
          : "border-border hover:border-primary/30 hover:bg-muted"
      }`}
    >
      {icon}
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function EnergyOption({ title, desc, selected, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all ${
        selected 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/30 hover:bg-muted"
      }`}
    >
      <span className={`font-bold text-lg ${selected ? "text-primary" : "text-foreground"}`}>{title}</span>
      <span className="text-sm text-muted-foreground">{desc}</span>
    </button>
  );
}

function BudgetOption({ title, desc, price, selected, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between text-left p-4 rounded-xl border-2 transition-all ${
        selected 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/30 hover:bg-muted"
      }`}
    >
      <div>
        <span className={`font-bold text-lg block ${selected ? "text-primary" : "text-foreground"}`}>{title}</span>
        <span className="text-sm text-muted-foreground">{desc}</span>
      </div>
      <div className={`font-black text-xl ${selected ? "text-primary" : "text-muted-foreground"}`}>
        {price}
      </div>
    </button>
  );
}
