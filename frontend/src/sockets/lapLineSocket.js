import { io } from "socket.io-client";

const lapLineSocket = io("/lap-line-tracker", {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  transports: ["websocket"],
});

export { lapLineSocket };