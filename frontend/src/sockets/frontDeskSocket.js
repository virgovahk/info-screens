import { io } from "socket.io-client";

const frontDeskSocket = io("/front-desk", {
  autoConnect: false,           
  reconnection: true,          
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  transports: ["websocket"],   
});

export { frontDeskSocket };