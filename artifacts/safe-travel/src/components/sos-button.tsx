import { useState, useEffect, useRef } from "react";
import { ShieldAlert, AlertTriangle, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { requestGeolocation } from "@/lib/location";
import { useTriggerSosAlert, useListSosContacts } from "@workspace/api-client-react";

export function SosButton() {
  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [status, setStatus] = useState<"idle" | "counting" | "triggering" | "success" | "error">("idle");
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  const { data: contacts } = useListSosContacts();
  const triggerSos = useTriggerSosAlert();

  const startCountdown = async () => {
    setOpen(true);
    setStatus("counting");
    setCountdown(3);
    
    // Request location immediately while counting down
    try {
      const loc = await requestGeolocation();
      setCoordinates(loc);
    } catch (e) {
      console.error("Failed to get location", e);
    }
  };

  useEffect(() => {
    if (status === "counting") {
      if (countdown > 0) {
        timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
      } else {
        executeSos();
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, countdown]);

  const cancelSos = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("idle");
    setOpen(false);
    toast({
      title: "SOS Cancelled",
      description: "Emergency alert was not sent.",
    });
  };

  const executeSos = async () => {
    setStatus("triggering");
    
    const finalCoords = coordinates || await requestGeolocation();
    
    try {
      await triggerSos.mutateAsync({
        data: {
          lat: finalCoords.lat,
          lng: finalCoords.lng,
          message: "Emergency! I need help.",
        }
      });
      
      setStatus("success");
      
      // Open WhatsApp links for contacts
      if (contacts && contacts.length > 0) {
        const mapsLink = `https://maps.google.com/maps?q=${finalCoords.lat},${finalCoords.lng}`;
        const message = encodeURIComponent(`EMERGENCY: I need help! My location: ${mapsLink}`);
        
        // In a real app we might only be able to open one deeply automatically,
        // but we'll try to open the first one.
        window.open(`https://wa.me/${contacts[0].phone}?text=${message}`, '_blank');
      }
      
    } catch (err) {
      setStatus("error");
    }
  };

  const openMapsDirections = () => {
    if (coordinates) {
      window.open(`https://www.google.com/maps/search/hospital+OR+police/@${coordinates.lat},${coordinates.lng},14z`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/hospital+OR+police`, '_blank');
    }
    setOpen(false);
    setStatus("idle");
  };

  return (
    <>
      <Button
        onClick={startCountdown}
        variant="destructive"
        className="rounded-full shadow-lg pulse-red font-bold px-6 h-10 gap-2 border-2 border-destructive-foreground/20 z-[100]"
      >
        <ShieldAlert className="w-5 h-5" />
        <span>SOS</span>
      </Button>

      <Dialog open={open} onOpenChange={(val) => {
        if (!val && status === "counting") cancelSos();
        if (!val && status !== "counting") setOpen(false);
      }}>
        <DialogContent className="sm:max-w-md text-center border-destructive border-2">
          {status === "counting" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-destructive text-2xl font-bold flex items-center justify-center gap-2">
                  <AlertTriangle className="w-8 h-8" />
                  TRIGGERING SOS
                </DialogTitle>
                <DialogDescription className="text-lg mt-4">
                  Emergency alert sending in...
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-8 flex justify-center">
                <div className="w-32 h-32 rounded-full border-4 border-destructive flex items-center justify-center text-6xl font-black text-destructive animate-pulse">
                  {countdown}
                </div>
              </div>

              <DialogFooter className="sm:justify-center">
                <Button variant="outline" size="lg" className="w-full text-lg h-14" onClick={cancelSos}>
                  CANCEL
                </Button>
              </DialogFooter>
            </>
          )}

          {status === "triggering" && (
            <div className="py-12 flex flex-col items-center gap-4">
              <ShieldAlert className="w-16 h-16 text-destructive animate-pulse" />
              <h2 className="text-xl font-bold">Sending Alert...</h2>
              <p className="text-muted-foreground">Notifying contacts and logging location.</p>
            </div>
          )}

          {status === "success" && (
            <div className="py-8 flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-destructive mb-2">Alert Sent</h2>
                <p className="text-muted-foreground px-4">
                  Your emergency contacts have been notified with your coordinates.
                </p>
              </div>
              <Button size="lg" className="w-full h-14 text-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={openMapsDirections}>
                <MapPin className="mr-2 w-5 h-5" />
                Route to nearest Safe Place
              </Button>
              <Button variant="ghost" onClick={() => { setOpen(false); setStatus("idle"); }}>
                Close
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="py-8 flex flex-col items-center gap-4">
              <X className="w-16 h-16 text-destructive" />
              <h2 className="text-xl font-bold">Failed to send alert</h2>
              <p className="text-muted-foreground">Please try again or call emergency services directly.</p>
              <Button variant="destructive" onClick={executeSos}>Retry</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
