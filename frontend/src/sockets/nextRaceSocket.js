import { io } from "socket.io-client";

const nextRaceSocket = io("/next-race", {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  transports: ["websocket"],
});

export { nextRaceSocket };