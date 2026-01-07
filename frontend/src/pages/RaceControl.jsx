import { useEffect, useState } from "react";
import Login from "../../Login";
import { raceControlSocket } from "../sockets/raceControlSocket";

export default function RaceControl() {
  const [session, setSession] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [mode, setMode] = useState("safe");

  useEffect(() => {
    raceControlSocket.on("state:update", (data) => {
      setSession(data.currentSession);
      setNextSession(data.nextSession);
      if (data.currentSession) setMode(data.currentSession.mode);
    });

    raceControlSocket.emit("subscribe");

    return () => {
      raceControlSocket.off("state:update");
    };
  }, []);

  const startSession = () => raceControlSocket.emit("session:start");
  const finishSession = () => raceControlSocket.emit("session:finish");
  const endSession = () => raceControlSocket.emit("session:end");

  const changeMode = (newMode) => {
    setMode(newMode);
    raceControlSocket.emit("mode:change", { mode: newMode });
  };

  return (
    <Login role="safety" roleName="Race Control" socket={raceControlSocket}>
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>Race Control</h1>

        {!session && nextSession && (
          <div>
            <h2>Next Race: Session {nextSession.id}</h2>
            <p>Drivers: {nextSession.drivers.length}</p>
            <button onClick={startSession} style={{ padding: "15px 30px", fontSize: "18px" }}>
              Start Race
            </button>
          </div>
        )}

        {!session && !nextSession && <p>No upcoming races</p>}

        {session && session.mode === "finished" && (
          <div>
            <h2>Race Finished!</h2>
            <button onClick={endSession} style={{ padding: "15px 30px", fontSize: "18px" }}>
              End Race Session
            </button>
          </div>
        )}

        {session && session.mode !== "finish" && session.mode !== "danger" && (
  <div style={{ marginTop: "30px" }}>
    <h3>Current Mode: {mode.toUpperCase()}</h3>
    <div style={{ display: "flex", justifyContent: "center", gap: "15px", flexWrap: "wrap" }}>
      {["Safe", "Hazard", "Danger"].map((m) => (
        <button
          key={m}
          onClick={() => changeMode(m.toLowerCase())}
          disabled={mode === m.toLowerCase()}
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            background: mode === m.toLowerCase() ? "#007bff" : "#f0f0f0",
            color: mode === m.toLowerCase() ? "#fff" : "#000",
          }}>
          {m}
        </button>
      ))}

      <button
        onClick={finishSession}
        style={{
          padding: "15px 30px",
          fontSize: "18px",
          background: "#000",
          color: "#fff",
        }}>
        Finish
      </button>
    </div>
  </div>
)}
      </div>
    </Login>
  );
}