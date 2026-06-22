import { useState, useEffect, useRef } from "react";
import { ShieldAlert, AlertTriangle, MapPin, X, Navigation } from "lucide-react";
import { useLocation } from "wouter";
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
import { getSocket } from "@/lib/socket";

export function SosButton() {
  const [open, setOpen]         = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [status, setStatus]     = useState<"idle" | "counting" | "triggering" | "success" | "error">("idle");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);

  const timerRef     = useRef<NodeJS.Timeout | null>(null);
  const broadcastRef = useRef<NodeJS.Timeout | null>(null);
  const { toast }    = useToast();
  const [, navigate] = useLocation();

  const { data: contacts }   = useListSosContacts();
  const triggerSos           = useTriggerSosAlert();

  // ── countdown tick ────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== "counting") return;
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else {
      executeSos();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [status, countdown]);

  // ── cleanup broadcast on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => stopBroadcast();
  }, []);

  // ── live location broadcast ───────────────────────────────────────────────
  function startBroadcast(coords: { lat: number; lng: number }) {
    setBroadcasting(true);
    const emit = () => {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoordinates(loc);
          getSocket().emit("live-location", loc);
        },
        () => getSocket().emit("live-location", coords),
        { enableHighAccuracy: true }
      );
    };
    emit();
    broadcastRef.current = setInterval(emit, 5000);
  }

  function stopBroadcast() {
    if (broadcastRef.current) {
      clearInterval(broadcastRef.current);
      broadcastRef.current = null;
    }
    setBroadcasting(false);
    getSocket().emit("live-location-stop");
  }

  // ── start countdown ───────────────────────────────────────────────────────
  const startCountdown = async () => {
    setOpen(true);
    setStatus("counting");
    setCountdown(3);
    try {
      const loc = await requestGeolocation();
      setCoordinates(loc);
    } catch {
      // will try again during executeSos
    }
  };

  const cancelSos = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("idle");
    setOpen(false);
    toast({ title: "SOS Cancelled", description: "Emergency alert was not sent." });
  };

  // ── fire SOS ─────────────────────────────────────────────────────────────
  const executeSos = async () => {
    setStatus("triggering");

    let finalCoords = coordinates;
    if (!finalCoords) {
      try { finalCoords = await requestGeolocation(); }
      catch { finalCoords = { lat: 27.7103, lng: 85.3222 }; }
    }
    setCoordinates(finalCoords);

    try {
      await triggerSos.mutateAsync({
        data: {
          lat: finalCoords.lat,
          lng: finalCoords.lng,
          message: "Emergency! I need help.",
        },
      });

      // Start broadcasting live location every 5 seconds
      startBroadcast(finalCoords);
      setStatus("success");

      // Open WhatsApp link for EVERY contact
      if (contacts && contacts.length > 0) {
        const yatraMapUrl = `${window.location.origin}/map?safety=1`;
        const message = encodeURIComponent(
          `🚨 EMERGENCY — I need help!\n\nMy GPS: https://maps.google.com/maps?q=${finalCoords.lat},${finalCoords.lng}\n\nTrack me live on Yatra: ${yatraMapUrl}`
        );
        // Open all WhatsApp links (browsers will open them as new tabs)
        contacts.forEach((c, i) => {
          setTimeout(() => {
            window.open(`https://wa.me/${c.phone.replace(/\D/g, "")}?text=${message}`, "_blank");
          }, i * 600); // stagger to avoid popup blockers
        });
      }

    } catch {
      setStatus("error");
    }
  };

  // ── navigate to safety map ────────────────────────────────────────────────
  const goToSafetyMap = () => {
    setOpen(false);
    setStatus("idle");
    navigate("/map?safety=1");
  };

  const closeDialog = () => {
    setOpen(false);
    setStatus("idle");
  };

  return (
    <>
      {/* Pulsing SOS button */}
      <Button
        onClick={startCountdown}
        variant="destructive"
        className="rounded-full shadow-lg font-bold px-6 h-10 gap-2 border-2 border-destructive-foreground/20 z-[100] relative"
      >
        <ShieldAlert className="w-5 h-5" />
        <span>SOS</span>
        {broadcasting && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
        )}
      </Button>

      {broadcasting && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-destructive text-destructive-foreground rounded-full px-5 py-2.5 shadow-2xl flex items-center gap-3 text-sm font-semibold">
          <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping shrink-0" />
          Broadcasting live location
          <button
            onClick={stopBroadcast}
            className="ml-1 underline opacity-80 hover:opacity-100"
          >
            Stop
          </button>
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={val => {
          if (!val && status === "counting") cancelSos();
          else if (!val) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-md text-center border-destructive border-2">

          {/* Counting down */}
          {status === "counting" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-destructive text-2xl font-bold flex items-center justify-center gap-2">
                  <AlertTriangle className="w-8 h-8" />
                  TRIGGERING SOS
                </DialogTitle>
                <DialogDescription className="text-lg mt-4">
                  Emergency alert sending in…
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

          {/* Triggering */}
          {status === "triggering" && (
            <div className="py-12 flex flex-col items-center gap-4">
              <ShieldAlert className="w-16 h-16 text-destructive animate-pulse" />
              <h2 className="text-xl font-bold">Sending Alert…</h2>
              <p className="text-muted-foreground">
                Notifying {contacts?.length ?? 0} contact{contacts?.length !== 1 ? "s" : ""} and logging location.
              </p>
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div className="py-8 flex flex-col items-center gap-5">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-destructive mb-2">Alert Sent</h2>
                <p className="text-muted-foreground px-4">
                  WhatsApp messages opened for all {contacts?.length ?? 0} contact{contacts?.length !== 1 ? "s" : ""}. Your live location is now broadcasting.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                Live location broadcasting every 5 seconds
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={goToSafetyMap}
              >
                <Navigation className="mr-2 w-5 h-5" />
                Open Safety Map
              </Button>

              <Button variant="ghost" onClick={closeDialog} className="w-full">
                Close (keep broadcasting)
              </Button>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="py-8 flex flex-col items-center gap-4">
              <X className="w-16 h-16 text-destructive" />
              <h2 className="text-xl font-bold">Failed to send alert</h2>
              <p className="text-muted-foreground">Please try again or call emergency services directly.</p>
              <div className="flex gap-3 w-full">
                <Button variant="destructive" onClick={executeSos} className="flex-1">Retry</Button>
                <Button variant="outline" onClick={closeDialog} className="flex-1">Close</Button>
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </>
  );
}
