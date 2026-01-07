import { useEffect, useState } from "react";
import { leaderBoardSocket } from "../sockets/leaderBoardSocket";

export default function LeaderBoard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState("safe");
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    leaderBoardSocket.on("leaderboardUpdated", (data) => {
      setLeaderboard(data.leaderboard);
      setSession(data.session);
    });

    leaderBoardSocket.on("raceModeChanged", (newMode) => {
      setMode(newMode);
    });

    leaderBoardSocket.on("timerUpdate", (remainingSeconds) => {
      setRemaining(remainingSeconds);
    });

    leaderBoardSocket.connect();

    return () => {
      leaderBoardSocket.disconnect();
      leaderBoardSocket.off("leaderboardUpdated");
      leaderBoardSocket.off("raceModeChanged");
      leaderBoardSocket.off("timerUpdate");
    };
  }, []);

  const colors = {
    safe: "green",
    hazard: "yellow",
    danger: "red",
    finished: "black",
    finish: "black",
  };

  const getBackground = (mode) => {
    if (mode === "finished" || mode === "finish") {
      return "repeating-conic-gradient(black 0deg 90deg, white 90deg 180deg) 0 0 / 20px 20px";
    }
    return colors[mode] || "green";
  };

  const formatTime = (sec) => {
    const min = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${min}:${s.toString().padStart(2, '0')}`;
  };

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen();
  };

  return (
    <div>
      <h1>Leader Board</h1>
      <button onClick={enterFullscreen}>Fullscreen</button>
      <div style={{ 
        background: getBackground(mode), 
        padding: '10px', 
        margin: '10px 0',
        textTransform: 'capitalize'
      }}>
        Race Mode: {mode}
      </div>
      <div>
        Time Remaining: {formatTime(remaining)}
      </div>
      {leaderboard.length === 0 && <p>No active race</p>}
      <ul>
        {leaderboard.map((l) => (
          <li key={l.driverId}>
            {l.name} – Car #{l.carNumber} – Lap {l.currentLap} – Fastest: {l.fastestLap?.toFixed(2) || "-"} sec
          </li>
        ))}
      </ul>
    </div>
  );
}