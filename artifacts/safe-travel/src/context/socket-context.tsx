import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { getSocket, registerUser } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export interface SosAlertPayload {
  lat: number;
  lng: number;
  message?: string;
  triggeredAt: string;
}

export interface LiveLocationPayload {
  lat: number;
  lng: number;
  username: string;
  timestamp: string;
}

interface SocketContextValue {
  username: string;
  setUsername: (name: string) => void;
  connected: boolean;
  latestSos: SosAlertPayload | null;
  clearSos: () => void;
  liveLocation: LiveLocationPayload | null;
}

const SocketContext = createContext<SocketContextValue>({
  username: "",
  setUsername: () => {},
  connected: false,
  latestSos: null,
  clearSos: () => {},
  liveLocation: null,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState<string>(
    () => localStorage.getItem("st_username") ?? ""
  );
  const [connected, setConnected]       = useState(false);
  const [latestSos, setLatestSos]       = useState<SosAlertPayload | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocationPayload | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      const saved = localStorage.getItem("st_username");
      if (saved) registerUser(saved);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("sos-alert", (data: SosAlertPayload) => {
      setLatestSos(data);
    });

    socket.on("live-location", (data: LiveLocationPayload) => {
      setLiveLocation(data);
    });

    socket.on("live-location-stop", () => {
      setLiveLocation(null);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("sos-alert");
      socket.off("live-location");
      socket.off("live-location-stop");
    };
  }, []);

  function setUsername(name: string) {
    localStorage.setItem("st_username", name);
    setUsernameState(name);
    registerUser(name);
  }

  return (
    <SocketContext.Provider value={{
      username, setUsername, connected,
      latestSos, clearSos: () => setLatestSos(null),
      liveLocation,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
