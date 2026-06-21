import { ShieldCheck, Star, MessageSquare, CheckCircle2, DollarSign, Globe } from "lucide-react";
import { Guide } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GuideCardProps {
  guide: Guide;
}

export function GuideCard({ guide }: GuideCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate transition-all border border-card-border h-full flex flex-col">
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-muted border-2 border-primary/10 overflow-hidden shrink-0">
            {guide.photo_url ? (
              <img src={guide.photo_url} alt={guide.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary text-xl font-bold">
                {guide.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-lg truncate flex items-center gap-2">
                  {guide.name}
                  {guide.verified && (
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  )}
                </h3>
                <p className="text-sm text-muted-foreground truncate">{guide.company_name}</p>
              </div>
              <div className="flex items-center bg-accent/10 px-2 py-1 rounded-md text-accent font-bold text-sm shrink-0">
                <Star className="w-3.5 h-3.5 mr-1 fill-accent text-accent" />
                {guide.rating.toFixed(1)}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs font-normal">
                {guide.experience_years}y exp
              </Badge>
              <Badge variant="outline" className="text-xs font-normal capitalize">
                {guide.gender}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground flex-1">
          {guide.specialty && (
            <div className="line-clamp-2">
              <strong className="text-foreground">Specialty:</strong> {guide.specialty}
            </div>
          )}
          
          <div className="flex items-start gap-2">
            <Globe className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{guide.languages.join(", ")}</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t flex items-center justify-between">
          <div className="flex items-baseline text-primary font-bold">
            <DollarSign className="w-4 h-4 mt-1" />
            <span className="text-xl">{guide.price_per_day}</span>
            <span className="text-xs text-muted-foreground ml-1 font-normal">/ day</span>
          </div>
          {guide.price_negotiable ? (
            <span className="text-xs flex items-center text-muted-foreground">
              <MessageSquare className="w-3 h-3 mr-1" /> Negotiable
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Fixed price</span>
          )}
        </div>
      </div>
    </Card>
  );
}
