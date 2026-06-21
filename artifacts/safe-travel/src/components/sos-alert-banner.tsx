import { useSocket } from "@/context/socket-context";
import { AlertTriangle, X, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

export function SosAlertBanner() {
  const { latestSos, clearSos, username } = useSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (latestSos) {
      // Play alert beep via Web Audio API
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      } catch {}
    }
  }, [latestSos]);

  if (!latestSos) return null;

  const mapsUrl = `https://www.google.com/maps?q=${latestSos.lat},${latestSos.lng}`;
  const timeStr = new Date(latestSos.triggeredAt).toLocaleTimeString();

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-start gap-4 px-4 py-4 md:py-5 shadow-2xl"
      style={{ background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)" }}
    >
      <div className="flex-shrink-0 mt-0.5">
        <AlertTriangle className="w-6 h-6 text-white animate-bounce" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-base md:text-lg leading-tight">
          SOS Alert — Someone needs help!
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-red-100 text-sm">
            <MapPin className="w-3.5 h-3.5" />
            {latestSos.lat.toFixed(5)}, {latestSos.lng.toFixed(5)}
          </span>
          <span className="text-red-200 text-xs">at {timeStr}</span>
          {latestSos.message && (
            <span className="text-white/90 text-sm italic">"{latestSos.message}"</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-white text-red-700 font-semibold text-sm px-4 py-2 rounded-full hover:bg-red-50 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open Map
        </a>
        <button
          onClick={clearSos}
          className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
