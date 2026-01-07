const EventEmitter = require("events");
const { saveState, loadState } = require("./persistence");

class RaceSessionService extends EventEmitter {
  constructor() {
  super();

  this.finishTimeout = null;
  this.countdownInterval = null;

  const saved = loadState();
  if (saved) {
    this.sessions = saved.sessions;
    this.currentSessionId = saved.currentSessionId;
    this.nextSessionId = saved.nextSessionId;
    let changed = false;
    this.sessions.forEach((session) => {
      if (session.mode === "safe" && session.startTime) {
        const elapsed = (Date.now() - session.startTime) / 1000;
        if (elapsed >= 600) {
          session.mode = "finished";
          session.endTime = session.endTime || Date.now();
          changed = true;
        }
      }
    });
    if (changed) this.persist();

    const current = this.getCurrentSession();
    if (current && current.mode === "safe" && current.startTime) {
      const isDev = process.env.NODE_ENV === 'development';
      const totalSeconds = isDev ? 60 : 600;
      const elapsed = Math.floor((Date.now() - current.startTime) / 1000);
      let remaining = totalSeconds - elapsed;

      if (remaining > 0) {
        this.emit("timerUpdate", remaining); 
        this.countdownInterval = setInterval(() => {
          remaining -= 1;
          if (remaining >= 0) {
            this.emit("timerUpdate", remaining);
          } else {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
            this.finishSession();
          }
        }, 1000);

        this.finishTimeout = setTimeout(() => {
          if (this.getCurrentSession()?.id === current.id) {
            this.finishSession();
          }
        }, remaining * 1000);
      } else {
        this.finishSession();
      }
    }
  } else {
    this.sessions = [];
    this.currentSessionId = null;
    this.nextSessionId = 1;
  }
}

  persist() {
    saveState({
      sessions: this.sessions,
      currentSessionId: this.currentSessionId,
      nextSessionId: this.nextSessionId,
    });
  }

  createSession({ mode = "safe" } = {}) {
    const pendingCount = this.sessions.filter(
      (s) => s.mode === "pending"
    ).length;
    if (pendingCount >= 4)
      throw new Error("Maximum of 4 upcoming sessions allowed");

    const session = {
      id: this.nextSessionId++,
      mode: "pending",
      drivers: [],
      cars: [],
      laps: [],
      startTime: null,
      endTime: null,
    };

    this.sessions.push(session);
    this.currentSessionId = session.id;

    this.persist();
    this.emit("nextSessionUpdated", this.getNextSession());
    return session;
  }

  deleteSession(sessionId) {
    const index = this.sessions.findIndex((s) => s.id === sessionId);
    if (index === -1) throw new Error("Session not found");

    const [removed] = this.sessions.splice(index, 1);

    if (this.currentSessionId === removed.id) {
      this.currentSessionId = this.sessions[0]?.id || null;
    }

    this.persist();
    this.emit("sessionDeleted", removed);
    this.emit("nextSessionUpdated", this.getNextSession());

    return removed;
  }

  getCurrentSession() {
    return this.sessions.find((s) => s.id === this.currentSessionId) || null;
  }

  getAllSessions() {
    return this.sessions;
  }

  getNextSession() {
    return this.sessions.find((s) => s.mode === "pending") || null;
  }

  startCountdown(duration = 5) {
    const session = this.getCurrentSession();
    if (!session || session.mode !== "pending")
      throw new Error("No pending session");

    let remaining = duration;
    this.emit("countdownTick", remaining);
    const interval = setInterval(() => {
      remaining--;
      if (remaining > 0) {
        this.emit("countdownTick", remaining);
      } else {
        clearInterval(interval);
        this.startSession();
      }
    }, 1000);
  }

  startSession() {
    const session = this.sessions.find((s) => s.mode === "pending");
    if (!session) throw new Error("No pending session");
    session.startTime = Date.now();
    session.mode = "safe";
    this.currentSessionId = session.id;
    this.persist();
    this.emit("sessionStarted", session);
    this.emit("nextSessionUpdated", this.getNextSession());

    const isDev = process.env.NODE_ENV === "development";
    const durationMs = isDev ? 60 * 1000 : 600 * 1000;
    if (this.finishTimeout) clearTimeout(this.finishTimeout);
    this.finishTimeout = setTimeout(() => {
      const current = this.getCurrentSession();
      if (
        current &&
        current.id === session.id &&
        current.mode !== "finished" &&
        current.mode !== "danger"
      ) {
        this.finishSession();
      }
    }, durationMs);

    if (this.countdownInterval) clearInterval(this.countdownInterval);
    const totalSeconds = isDev ? 60 : 600;
    let remaining = totalSeconds;
    this.emit("timerUpdate", remaining);
    this.countdownInterval = setInterval(() => {
      remaining -= 1;
      if (remaining >= 0) {
        this.emit("timerUpdate", remaining);
      } else {
        clearInterval(this.countdownInterval);
      }
    }, 1000);

    return session;
  }

  finishSession() {
    const session = this.getCurrentSession();
    if (!session) {
      console.log("No session to finish — ignoring");
      return;
    }

    if (this.finishTimeout) {
      clearTimeout(this.finishTimeout);
      this.finishTimeout = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    this.emit("timerUpdate", 0);

    session.mode = "finished";
    session.endTime = Date.now();
    this.persist();

    this.emit("raceModeChanged", "finished");

    this.emit("sessionFinished", session);

    return session;
  }

  endSession() {
    const session = this.getCurrentSession();
    if (!session) throw new Error("No active session");

    if (this.finishTimeout) clearTimeout(this.finishTimeout);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.emit("timerUpdate", 0);

    session.mode = "danger";
    this.currentSessionId = this.getNextSession()?.id || null;
    this.persist();
    this.emit("raceModeChanged", "danger");
    this.emit("sessionEnded", session);
    return session;
  }

  setCurrentSession(sessionId) {
    if (!this.sessions.find((s) => s.id === sessionId))
      throw new Error("Session not found");

    this.currentSessionId = sessionId;
    this.persist();
    this.emit("nextSessionUpdated", this.getNextSession());
  }

  setRaceMode(mode) {
    const session = this.getCurrentSession();
    if (!session) throw new Error("No active session");

    const lowerMode = mode.toLowerCase();

    if (
      session.mode === "finish" ||
      session.mode === "finished" ||
      session.mode === "danger"
    ) {
      throw new Error("Race mode cannot be changed after finish");
    }

    if (lowerMode === "finish") {
      this.finishSession();
      return;
    }

    session.mode = lowerMode;
    this.persist();
    this.emit("raceModeChanged", lowerMode);
  }

  addDriver(name) {
    const session = this.getCurrentSession();
    if (!session) throw new Error("No active session");
    if (session.mode !== "pending")
      throw new Error("Cannot modify drivers during race");
    if (session.drivers.length >= 8)
      throw new Error("Max 8 drivers in a session");
    if (session.drivers.find((d) => d.name === name))
      throw new Error("Driver already exists");

    const driver = { id: Date.now(), name, lastLapTime: 0 };
    session.drivers.push(driver);

    session.cars.push({
      driverId: driver.id,
      carNumber: session.cars.length + 1,
    });
    this.persist();

    return driver;
  }

  assignCar(driverId, carNumber) {
    const session = this.getCurrentSession();
    if (!session) throw new Error("No active session");
    if (session.mode !== "pending")
      throw new Error("Cannot assign cars during race");

    if (
      session.cars.some(
        (c) => c.carNumber === carNumber && c.driverId !== driverId
      )
    ) {
      throw new Error("Car number already assigned to another driver");
    }

    const car = session.cars.find((c) => c.driverId === driverId);
    if (!car) throw new Error("Driver not found");

    car.carNumber = carNumber;

    this.persist();

    this.emit("carAssigned", { driverId, carNumber });

    return car;
  }

  removeDriver(name) {
    const session = this.getCurrentSession();
    if (!session) throw new Error("No active session");
    if (session.mode !== "pending")
      throw new Error("Cannot modify drivers during race");

    const index = session.drivers.findIndex((d) => d.name === name);
    if (index === -1) return null;

    const [removed] = session.drivers.splice(index, 1);
    session.cars = session.cars.filter((c) => c.driverId !== removed.id);

    this.persist();
    return removed;
  }

  editDriver(driverId, newName) {
    const session = this.getCurrentSession();
    if (!session) throw new Error("No active session");
    if (session.mode !== "pending")
      throw new Error("Cannot modify drivers during race");
    if (!newName || newName.trim() === "")
      throw new Error("Driver name cannot be empty");
    if (session.drivers.some((d) => d.name === newName))
      throw new Error("Driver name already exists");

    const driver = session.drivers.find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");

    driver.name = newName;
    this.persist();
    return driver;
  }

  getLeaderboard() {
    const session = this.getCurrentSession();
    if (!session) return [];

    const bestLaps = {};
    for (const lap of session.laps) {
      if (!bestLaps[lap.driverId] || lap.lapTime < bestLaps[lap.driverId]) {
        bestLaps[lap.driverId] = lap.lapTime;
      }
    }

    const leaderboard = session.drivers.map((driver) => {
      const car = session.cars.find((c) => c.driverId === driver.id);
      const currentLap = session.laps.filter(
        (l) => l.driverId === driver.id
      ).length;
      return {
        driverId: driver.id,
        name: driver.name,
        carNumber: car ? car.carNumber : 0,
        fastestLap: bestLaps[driver.id] ?? null,
        currentLap,
      };
    });

    leaderboard.sort((a, b) => {
      if (a.fastestLap === null) return 1;
      if (b.fastestLap === null) return -1;
      return a.fastestLap - b.fastestLap;
    });

    return leaderboard;
  }

  recordLap(driverId, lapTime) {
    const session = this.getCurrentSession();
    if (!session) throw new Error("No active session");
    if (session.mode !== "safe") throw new Error("Race not started");

    const driver = session.drivers.find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");

    const currentTime = Date.now();
    const elapsed = (currentTime - session.startTime) / 1000;
    const actualLapTime = elapsed - driver.lastLapTime;
    driver.lastLapTime = elapsed;

    const lap = {
      id: Date.now(),
      driverId,
      lapTime: actualLapTime,
      timestamp: new Date(),
    };
    session.laps.push(lap);

    this.persist();
    this.emit("lapRecorded", lap);

    return lap;
  }
}

module.exports = new RaceSessionService();
