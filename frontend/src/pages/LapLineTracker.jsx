import { useEffect, useState } from "react";
import Login from "../../Login";
import { lapLineSocket } from "../sockets/lapLineSocket";

export default function LapLineTracker() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    lapLineSocket.emit("subscribe");
    lapLineSocket.on("state:update", (s) => setSession(s.currentSession));
    return () => lapLineSocket.off("state:update");
  }, []);

  const recordLap = (driverId) => {
    lapLineSocket.emit("lap:record", {
      driverId,
      lapTime: 0
    }, (response) => {
      if (response.success) {
        console.log("Lap recorded", response.lap);
      } else {
        alert("Error: " + response.error);
      }
    });
  };

  return (
    <Login role="observer" roleName="Lap Line Tracker" socket={lapLineSocket}>
      <h1>Lap Line Tracker</h1>

      {!session?.drivers?.length && <p>No drivers yet.</p>}

      {session?.drivers?.map(d => (
        <div key={d.id}>
          {d.name}
          <button 
            style={{ fontSize: '20px', padding: '20px', margin: '10px' }} 
            onClick={() => recordLap(d.id)}>
            Record Lap
          </button>
        </div>
      ))}
    </Login>
  );
}
