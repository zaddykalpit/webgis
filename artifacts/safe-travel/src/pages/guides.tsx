import { useState } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { GuideCard } from "@/components/guide-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useListGuides, ListGuidesGender, ListGuidesParams } from "@workspace/api-client-react";

export default function Guides() {
  const [filters, setFilters] = useState<ListGuidesParams>({
    gender: ListGuidesGender.any,
    min_rating: undefined,
    negotiable: false,
    language: "",
  });

  const { data: guides, isLoading } = useListGuides(filters);

  const handleGenderChange = (val: string) => {
    setFilters(prev => ({ ...prev, gender: val as ListGuidesGender }));
  };

  const handleRatingChange = (val: string) => {
    setFilters(prev => ({ ...prev, min_rating: val === "all" ? undefined : Number(val) }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Verified Guides</h1>
          <p className="text-muted-foreground">Find trustworthy locals to show you around safely.</p>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Guides</SheetTitle>
              <SheetDescription>
                Narrow down guides based on your preferences.
              </SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-6">
              <div className="space-y-3">
                <Label>Gender Preference</Label>
                <Select value={filters.gender} onValueChange={handleGenderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Gender</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label>Minimum Rating</Label>
                <Select 
                  value={filters.min_rating?.toString() || "all"} 
                  onValueChange={handleRatingChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Rating</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    <SelectItem value="4.0">4.0+ Stars</SelectItem>
                    <SelectItem value="3.0">3.0+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Language</Label>
                <Input 
                  placeholder="e.g. English, Spanish" 
                  value={filters.language || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value || undefined }))}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="negotiable" 
                  checked={filters.negotiable}
                  onCheckedChange={(c) => setFilters(prev => ({ ...prev, negotiable: c }))}
                />
                <Label htmlFor="negotiable">Price Negotiable Only</Label>
              </div>
              
              <Button 
                className="w-full mt-4" 
                variant="outline"
                onClick={() => setFilters({ gender: ListGuidesGender.any, min_rating: undefined, negotiable: false, language: "" })}
              >
                Reset Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : guides && guides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map(guide => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-muted/30 rounded-xl border border-dashed">
          <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-1">No guides found</h3>
          <p className="text-muted-foreground">Try adjusting your filters to find more results.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setFilters({ gender: ListGuidesGender.any, min_rating: undefined, negotiable: false, language: "" })}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
