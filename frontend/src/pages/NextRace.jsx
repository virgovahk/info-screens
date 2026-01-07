import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const nextRaceSocket = io("/next-race");

export default function NextRace() {
  const [session, setSession] = useState(null);
  const [hasSessions, setHasSessions] = useState(false);

useEffect(() => {
  nextRaceSocket.connect();
  
  nextRaceSocket.on("nextRace:update", (data) => {
    if (data && typeof data === 'object' && 'session' in data) {
      setSession(data.session);
      setHasSessions(data.hasSessions || false);
    } else {
      setSession(data);
      setHasSessions(!!data);
    }
  });

  return () => {
    nextRaceSocket.off("nextRace:update");
    nextRaceSocket.disconnect();
  };
}, []);

  return (
    <div>
      <h1>Next Race</h1>
      {session && (
  <ul>
    {session.drivers.map((driver) => {
      const car = session.cars?.find(c => c.driverId === driver.id);
      return (
        <li key={driver.id}>
          {driver.name} – Car #{car?.carNumber || "?"}
        </li>
      );
    })}
  </ul>
)}
{!session && !hasSessions && <p>No upcoming race</p>}
{!session && hasSessions && <p>Proceed to the paddock</p>}
    </div>
  );
}