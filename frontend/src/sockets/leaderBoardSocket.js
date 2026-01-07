import { io } from "socket.io-client";

const leaderBoardSocket = io("/leader-board", {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  transports: ["websocket"],
});

export { leaderBoardSocket };