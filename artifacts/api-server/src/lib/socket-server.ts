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

    socket.on("disconnect", () => {
      logger.info({ username: socket.data.username }, "User disconnected");
    });
  });

  return io;
}

export function getSocketServer() {
  return io;
}
