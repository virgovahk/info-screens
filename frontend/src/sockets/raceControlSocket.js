import { io } from "socket.io-client";

const raceControlSocket = io("/race-control", {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  transports: ["websocket"],
});

export { raceControlSocket };