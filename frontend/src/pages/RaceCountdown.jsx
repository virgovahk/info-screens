import { useEffect, useState } from "react";
import { raceCountdownSocket } from "../sockets/raceCountdownSocket";

export default function RaceCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    raceCountdownSocket.connect();

    raceCountdownSocket.on("timerTick", setSecondsLeft);

    return () => {
      raceCountdownSocket.off("timerTick");
      raceCountdownSocket.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Race Countdown</h1>
      <p>{secondsLeft !== null ? `${secondsLeft} seconds left` : "Waiting for race..."}</p>
    </div>
  );
}
