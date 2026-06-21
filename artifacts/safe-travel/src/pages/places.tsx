import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { PlaceCard } from "@/components/place-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useListPlaces, ListPlacesType, ListPlacesParams } from "@workspace/api-client-react";

export default function Places() {
  const [filters, setFilters] = useState<ListPlacesParams>({
    type: ListPlacesType.all,
    main_road_only: false,
  });

  const { data: places, isLoading } = useListPlaces(filters);

  const handleTypeChange = (val: string) => {
    setFilters(prev => ({ ...prev, type: val as ListPlacesType }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Places Explorer</h1>
          <p className="text-muted-foreground">Discover safe, highly-rated spots around the city.</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-muted p-2 rounded-lg border">
          <Switch 
            id="main-road" 
            checked={filters.main_road_only}
            onCheckedChange={(c) => setFilters(prev => ({ ...prev, main_road_only: c }))}
          />
          <Label htmlFor="main-road" className="flex items-center gap-1 cursor-pointer">
            <Navigation className="w-4 h-4" /> Main Road Only
          </Label>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-8 w-full overflow-x-auto" onValueChange={handleTypeChange}>
        <TabsList className="inline-flex h-12 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="all" className="rounded-sm px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">All</TabsTrigger>
          <TabsTrigger value="restaurant" className="rounded-sm px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Restaurants</TabsTrigger>
          <TabsTrigger value="hotel" className="rounded-sm px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Hotels</TabsTrigger>
          <TabsTrigger value="attraction" className="rounded-sm px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Attractions</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-80 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : places && places.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.map(place => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-muted/30 rounded-xl border border-dashed">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-1">No places found</h3>
          <p className="text-muted-foreground">Try adjusting your filters to find more results.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setFilters({ type: ListPlacesType.all, main_road_only: false })}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
