import { useEffect, useState } from "react";
import Login from "../../Login";
import { frontDeskSocket } from "../sockets/frontDeskSocket";

function FrontDesk() {
  const [currentSession, setCurrentSession] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [driverName, setDriverName] = useState("");

  useEffect(() => {
    frontDeskSocket.on("error", (message) => {
      alert(message);
      console.error("Server error:", message);
    });

    frontDeskSocket.emit("subscribe");

    frontDeskSocket.on("state:update", (state) => {
      if (state.currentSession !== undefined) {
        setCurrentSession(state.currentSession);
      }
      if (state.allSessions !== undefined) {
        setAllSessions(state.allSessions);
      }
    });

    return () => {
      frontDeskSocket.off("state:update");
      frontDeskSocket.off("error");
    };
  }, []);

  const createSession = () => {
    frontDeskSocket.emit("session:create");
  };

  const deleteSession = (sessionId) => {
    frontDeskSocket.emit("session:delete", { sessionId });
  };

  const addDriver = () => {
    if (!driverName.trim()) return;
    frontDeskSocket.emit("driver:add", { name: driverName.trim() });
    setDriverName("");
  };

  const removeDriver = (name) => {
    frontDeskSocket.emit("driver:remove", { name });
  };

  const editDriver = (driverId, oldName) => {
    const newName = prompt("Enter new name:", oldName);
    if (!newName || newName === oldName) return;

    frontDeskSocket.emit("driver:edit", { driverId, newName });
  };

  const switchSession = (sessionId) => {
    frontDeskSocket.emit("session:switch", { sessionId });
  };

  return (
    <Login role="receptionist" roleName="Front Desk" socket={frontDeskSocket}>
      <div style={{ padding: 20 }}>
        <h1>Front Desk</h1>

        <button onClick={createSession}>➕ Create Session</button>

        <div style={{ marginTop: 20 }}>
          <h2>📍 Current Session</h2>

          {allSessions.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <label>Select Session: </label>
              <select
                value={currentSession?.id || ""}
                onChange={(e) => switchSession(parseInt(e.target.value))}>
                {allSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    Session {s.id} ({s.drivers.length} drivers)
                  </option>
                ))}
              </select>
            </div>
          )}

          {!currentSession && <p>No active session</p>}

          {currentSession && (
            <div style={{ border: "2px solid #1976d2", padding: 15 }}>
              <p>
                <strong>ID:</strong> {currentSession.id}
              </p>
              <p>
                <strong>Mode:</strong> {currentSession.mode}
              </p>

              <h3>Drivers</h3>

              {currentSession.drivers.length === 0 && <p>No drivers yet</p>}

              {currentSession.drivers.map((driver) => {
                const car = currentSession.cars.find(
                  (c) => c.driverId === driver.id
                );
                const carNumber = car?.carNumber || "?";

                const assignCar = () => {
                  const input = prompt(
                    `Assign car number for ${driver.name} (current: ${carNumber}):`,
                    carNumber === "?" ? "" : carNumber
                  );
                  if (input === null) return;
                  const num = parseInt(input.trim());
                  if (isNaN(num) || num < 1) {
                    alert("Please enter a valid positive number");
                    return;
                  }

                  frontDeskSocket.emit("car:assign", {
                    driverId: driver.id,
                    carNumber: num,
                  });
                };

                return (
                  <div
                    key={driver.id}
                    style={{
                      marginBottom: 12,
                      padding: "8px",
                      background: "#f8f9fa",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}>
                    <span style={{ fontWeight: "bold", minWidth: "180px" }}>
                      🏎️ {driver.name}{" "}
                      <span style={{ color: "#007bff" }}>
                        (Car #{carNumber})
                      </span>
                    </span>

                    <button
                      onClick={() => removeDriver(driver.name)}
                      style={{ background: "#dc3545" }}>
                      ❌ Remove
                    </button>

                    <button
                      onClick={() => editDriver(driver.id, driver.name)}
                      style={{ background: "#ffc107" }}>
                      ✏️ Edit Name
                    </button>

                    <button
                      onClick={assignCar}
                      style={{ background: "#28a745" }}>
                      🚗 Assign Car #
                    </button>
                  </div>
                );
              })}

              <div style={{ marginTop: 10 }}>
                <input
                  value={driverName}
                  placeholder="Driver name"
                  onChange={(e) => setDriverName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addDriver()}/>
                <button onClick={addDriver} style={{ marginLeft: 5 }}>
                  ➕ Add Driver
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 30 }}>
          <h2>📋 All Sessions (State Panel)</h2>

          {allSessions.length === 0 && <p>No sessions</p>}

          {allSessions.map((s) => (
            <div
              key={s.id}
              style={{
                border: "1px solid #ccc",
                marginBottom: 10,
                padding: 10,
              }}>
              <p>
                <strong>ID:</strong> {s.id}
              </p>
              <p>
                <strong>Mode:</strong> {s.mode}
              </p>
              <p>
                <strong>Drivers:</strong> {s.drivers.length}
              </p>
              <button onClick={() => deleteSession(s.id)}>
                🗑️ Delete Session
              </button>
            </div>
          ))}
        </div>
      </div>
    </Login>
  );
}

export default FrontDesk;
