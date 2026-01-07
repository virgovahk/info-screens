import { io } from "socket.io-client";

const raceFlagsSocket = io("/race-flags", {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  transports: ["websocket"],
});

export { raceFlagsSocket };