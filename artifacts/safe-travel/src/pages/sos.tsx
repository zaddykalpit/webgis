import { useState } from "react";
import { ShieldAlert, Plus, Trash2, Phone, User, Info, MapPin, Navigation } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation, DEFAULT_LOCATION } from "@/lib/location";
import { 
  useListSosContacts, 
  useCreateSosContact, 
  useDeleteSosContact,
  useGetSafeSpots,
  getListSosContactsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function SosCenter() {
  const { location } = useGeolocation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const currentLoc = location || DEFAULT_LOCATION;

  const { data: contacts, isLoading: contactsLoading } = useListSosContacts();
  const { data: safeSpots, isLoading: spotsLoading } = useGetSafeSpots({
    lat: currentLoc.lat,
    lng: currentLoc.lng
  }, {
    query: { enabled: !!currentLoc }
  });

  const createContact = useCreateSosContact();
  const deleteContact = useDeleteSosContact();

  const [newContact, setNewContact] = useState({ name: "", phone: "" });

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim() || !newContact.phone.trim()) return;

    createContact.mutate({ data: newContact }, {
      onSuccess: () => {
        setNewContact({ name: "", phone: "" });
        toast({ title: "Contact added", description: "Emergency contact saved." });
        queryClient.invalidateQueries({ queryKey: getListSosContactsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add contact.", variant: "destructive" });
      }
    });
  };

  const handleDeleteContact = (id: number) => {
    deleteContact.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Contact removed" });
        queryClient.invalidateQueries({ queryKey: getListSosContactsQueryKey() });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Emergency Center</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Manage your emergency contacts and find nearby safe havens. In an emergency, use the SOS button at the top right of any page.
        </p>
        <button
          onClick={() => navigate("/map?safety=1")}
          className="mt-5 inline-flex items-center gap-2 bg-destructive text-destructive-foreground font-bold px-6 py-3 rounded-full shadow-lg hover:bg-destructive/90 transition-colors animate-pulse"
        >
          <Navigation className="w-5 h-5" />
          Find Nearest Hospital &amp; Police on Map
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contacts Section */}
        <div className="space-y-6">
          <Card className="border-destructive/20 shadow-sm">
            <CardHeader className="bg-destructive/5 rounded-t-xl pb-4">
              <CardTitle className="flex items-center text-destructive">
                <Info className="w-5 h-5 mr-2" /> How SOS Works
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm space-y-2">
              <p>When you trigger an SOS alert:</p>
              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>Your exact GPS location is captured</li>
                <li>An alert is logged in our secure system</li>
                <li>WhatsApp links are generated to notify your contacts immediately</li>
                <li>You get instant routing to the nearest hospital or police station</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts</CardTitle>
              <CardDescription>People who will be notified when you trigger an SOS.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddContact} className="flex gap-2 mb-6">
                <div className="flex-1 space-y-2">
                  <Input 
                    placeholder="Name" 
                    value={newContact.name}
                    onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input 
                    placeholder="Phone with country code (e.g. +1234567890)" 
                    value={newContact.phone}
                    onChange={e => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <Button type="submit" className="shrink-0 h-auto" disabled={createContact.isPending}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </form>

              <div className="space-y-3">
                {contactsLoading ? (
                  <div className="space-y-2">
                    <div className="h-14 bg-muted rounded animate-pulse" />
                    <div className="h-14 bg-muted rounded animate-pulse" />
                  </div>
                ) : contacts && contacts.length > 0 ? (
                  contacts.map(contact => (
                    <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-medium flex items-center">
                          <User className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                          {contact.name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center mt-0.5">
                          <Phone className="w-3.5 h-3.5 mr-1.5" />
                          {contact.phone}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteContact(contact.id)}
                        disabled={deleteContact.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                    No contacts added yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Safe Spots Section */}
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary" /> Nearby Safe Spots
              </CardTitle>
              <CardDescription>
                Hospitals and police stations near your current location.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {spotsLoading ? (
                <div className="space-y-4">
                  <div className="h-24 bg-muted rounded-lg animate-pulse" />
                  <div className="h-24 bg-muted rounded-lg animate-pulse" />
                  <div className="h-24 bg-muted rounded-lg animate-pulse" />
                </div>
              ) : safeSpots && safeSpots.length > 0 ? (
                <div className="space-y-4">
                  {safeSpots.map(spot => (
                    <div key={spot.id} className="p-4 border rounded-lg flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {spot.type === 'hospital' ? (
                          <div className="text-primary font-bold text-lg">+</div>
                        ) : (
                          <ShieldAlert className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold">{spot.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">{spot.address}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-medium bg-muted px-2 py-1 rounded">
                            {spot.distance_km?.toFixed(1)} km away
                          </span>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate("/map?safety=1")}>
                            <Navigation className="w-3 h-3 mr-1" /> Navigate
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>Could not locate nearby safe spots.</p>
                  <p className="text-sm">Ensure location services are enabled.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
