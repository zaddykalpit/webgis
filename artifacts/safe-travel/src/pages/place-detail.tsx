import { useState } from "react";
import { useParams, Link } from "wouter";
import { MapPin, Navigation, Star, Phone, ShieldCheck, ChevronLeft } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  useGetPlace, 
  useGetPlaceRatings, 
  useRatePlace,
  getGetPlaceRatingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function PlaceDetail() {
  const { id } = useParams<{ id: string }>();
  const placeId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: place, isLoading: placeLoading, error: placeError } = useGetPlace(placeId, {
    query: { enabled: !!placeId }
  });
  
  const { data: ratings, isLoading: ratingsLoading } = useGetPlaceRatings(placeId, {
    query: { enabled: !!placeId }
  });

  const rateMutation = useRatePlace();

  const [reviewForm, setReviewForm] = useState({
    user_name: "",
    rating: 5,
    review: ""
  });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.user_name.trim() || reviewForm.rating < 1 || reviewForm.rating > 5) {
      toast({
        title: "Invalid review",
        description: "Please provide a name and a valid rating.",
        variant: "destructive"
      });
      return;
    }

    rateMutation.mutate({
      id: placeId,
      data: reviewForm
    }, {
      onSuccess: () => {
        toast({
          title: "Review submitted",
          description: "Thank you for your feedback!"
        });
        setReviewForm({ user_name: "", rating: 5, review: "" });
        queryClient.invalidateQueries({ queryKey: getGetPlaceRatingsQueryKey(placeId) });
      },
      onError: () => {
        toast({
          title: "Submission failed",
          description: "Could not submit your review. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  if (placeError) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-2">Place not found</h2>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/places">Back to Places</Link>
        </Button>
      </div>
    );
  }

  if (placeLoading || !place) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-8 w-32 bg-muted rounded animate-pulse mb-6" />
        <div className="h-64 md:h-96 bg-muted rounded-xl animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="h-10 w-2/3 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
            <div className="h-24 w-full bg-muted rounded animate-pulse" />
          </div>
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/places" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Places
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Header Info */}
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex gap-2 mb-3">
                <Badge variant="secondary" className="capitalize">{place.type}</Badge>
                {place.is_main_road_accessible && (
                  <Badge variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Navigation className="w-3 h-3 mr-1" /> Road Accessible
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{place.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center text-foreground font-bold">
                  <Star className="w-4 h-4 mr-1 fill-accent text-accent" />
                  {place.rating.toFixed(1)} <span className="font-normal text-muted-foreground ml-1">({place.rating_count} reviews)</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center text-foreground font-medium">
                  {Array(place.price_level).fill('$').join('')}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {place.address}
                </span>
              </div>
            </div>
          </div>

          {/* Photo */}
          <div className="rounded-xl overflow-hidden mb-8 bg-muted border aspect-[16/9] relative">
            {place.photo_url ? (
              <img src={place.photo_url} alt={place.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <MapPin className="w-12 h-12 opacity-20" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="mb-12 prose prose-sm md:prose-base dark:prose-invert max-w-none">
            <h2 className="text-2xl font-bold mb-4">About this place</h2>
            <p className="text-muted-foreground leading-relaxed">
              {place.description || "No description available for this place."}
            </p>
            {place.phone && (
              <div className="mt-4 flex items-center text-foreground font-medium">
                <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                {place.phone}
              </div>
            )}
          </div>

          {/* Map (Read only) */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Location</h2>
            <div className="h-64 md:h-80 w-full rounded-xl overflow-hidden border bg-muted z-0 relative">
              <MapContainer 
                center={[place.lat, place.lng]} 
                zoom={15} 
                scrollWheelZoom={false} 
                className="h-full w-full"
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <Marker position={[place.lat, place.lng]}>
                  <Popup>{place.name}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          {/* Reviews List */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Reviews</h2>
            {ratingsLoading ? (
              <div className="space-y-4">
                <div className="h-24 bg-muted rounded-xl animate-pulse" />
                <div className="h-24 bg-muted rounded-xl animate-pulse" />
              </div>
            ) : ratings && ratings.length > 0 ? (
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <Card key={rating.id} className="shadow-none">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold">{rating.user_name}</div>
                        <div className="flex text-accent">
                          {Array(5).fill(0).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < rating.rating ? "fill-accent" : "text-muted"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {rating.review || "No written review provided."}
                      </p>
                      <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-muted/50 rounded-xl border border-dashed text-muted-foreground">
                No reviews yet. Be the first to rate this place!
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / Rate Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="border-primary/20 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-primary" />
                  Rate this Place
                </h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Your Name</label>
                    <Input 
                      placeholder="Jane Doe" 
                      value={reviewForm.user_name}
                      onChange={e => setReviewForm(prev => ({ ...prev, user_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Rating (1-5)</label>
                    <div className="flex justify-between bg-muted/50 p-2 rounded-lg border">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="p-1 outline-none focus:ring-2 focus:ring-ring rounded"
                          onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                        >
                          <Star 
                            className={`w-6 h-6 transition-colors ${
                              star <= reviewForm.rating ? "fill-accent text-accent" : "text-muted-foreground"
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Review (Optional)</label>
                    <Textarea 
                      placeholder="How was your experience? Was it safe?" 
                      className="resize-none"
                      rows={4}
                      value={reviewForm.review}
                      onChange={e => setReviewForm(prev => ({ ...prev, review: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={rateMutation.isPending}>
                    {rateMutation.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
