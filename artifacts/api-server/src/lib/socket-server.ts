import { Server, type Socket } from "socket.io";
import { type Server as HttpServer } from "http";
import { logger } from "./logger";

let io: Server | null = null;

export function createSocketServer(httpServer: HttpServer) {
  io = new Server(httpServer, {
    path: "/api/socket.io",
    cors: { origin: "*" },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    socket.on("register", (username: string) => {
      socket.data.username = username;
      logger.info({ username }, "User registered on socket");
    });

    // Relay live location from SOS sender to all other viewers
    socket.on("live-location", (coords: { lat: number; lng: number }) => {
      socket.broadcast.emit("live-location", {
        lat: coords.lat,
        lng: coords.lng,
        username: socket.data.username ?? "Unknown",
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("live-location-stop", () => {
      socket.broadcast.emit("live-location-stop", {
        username: socket.data.username ?? "Unknown",
      });
    });

    socket.on("disconnect", () => {
      logger.info({ username: socket.data.username }, "User disconnected");
      // Stop live location if this user was broadcasting
      socket.broadcast.emit("live-location-stop", {
        username: socket.data.username ?? "Unknown",
      });
    });
  });

  return io;
}

export function getSocketServer() {
  return io;
}
