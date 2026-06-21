import { Link } from "wouter";
import { Shield, Star, MapPin, Map, Navigation } from "lucide-react";
import { Place } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlaceCardProps {
  place: Place;
}

export function PlaceCard({ place }: PlaceCardProps) {
  const getPriceLevel = (level: number) => {
    return Array(level).fill('$').join('');
  };

  return (
    <Link href={`/places/${place.id}`}>
      <Card className="overflow-hidden hover-elevate transition-all border border-card-border cursor-pointer h-full flex flex-col group">
        <div className="relative h-48 w-full bg-muted overflow-hidden">
          {place.photo_url ? (
            <img 
              src={place.photo_url} 
              alt={place.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
              <Map className="w-12 h-12 opacity-20" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant="secondary" className="font-semibold bg-background/90 backdrop-blur">
              {place.type.charAt(0).toUpperCase() + place.type.slice(1)}
            </Badge>
            {place.is_main_road_accessible && (
              <Badge variant="default" className="bg-primary/90 hover:bg-primary font-semibold backdrop-blur text-primary-foreground flex items-center gap-1">
                <Navigation className="w-3 h-3" /> Road Accessible
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg leading-tight line-clamp-2">{place.name}</h3>
            <div className="flex items-center bg-accent/10 px-2 py-1 rounded-md text-accent font-bold text-sm ml-3 shrink-0">
              <Star className="w-3.5 h-3.5 mr-1 fill-accent text-accent" />
              {place.rating.toFixed(1)}
            </div>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground mt-auto pt-4 gap-3">
            <span className="font-medium text-foreground">{getPriceLevel(place.price_level)}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center truncate">
              <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
              <span className="truncate">{place.address}</span>
            </span>
            {place.distance_km != null && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="shrink-0">{place.distance_km.toFixed(1)} km</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
