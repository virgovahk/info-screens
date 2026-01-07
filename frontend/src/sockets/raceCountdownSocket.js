import { io } from "socket.io-client";

const raceCountdownSocket = io("/race-countdown", {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  transports: ["websocket"],
});

export { raceCountdownSocket };