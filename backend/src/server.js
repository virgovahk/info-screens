const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const RaceSessionService = require("./services/RaceSessionService");
const { authMiddleware } = require("./middleware/authMiddleware");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const requiredKeys = ["RECEPTIONIST_KEY", "OBSERVER_KEY", "SAFETY_KEY"];
requiredKeys.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Error: Missing environment variable ${key}`);
    process.exit(1);
  }
});

const frontDesk = io.of("/front-desk");
const raceControl = io.of("/race-control");
const lapLine = io.of("/lap-line-tracker");
const nextRace = io.of("/next-race");
const leaderBoard = io.of("/leader-board");
const raceFlags = io.of("/race-flags");
const raceCountdown = io.of("/race-countdown");

frontDesk.use(authMiddleware);

frontDesk.on("connection", (socket) => {
  console.log(`Front Desk connected: ${socket.id}`);

  socket.on("subscribe", () => {
    const allSessions = RaceSessionService.getAllSessions();
    const pendingSessions = allSessions.filter((s) => s.mode === "pending");
    const current = RaceSessionService.getCurrentSession();
    const currentSession =
      current && current.mode === "pending" ? current : null;
    socket.emit("state:update", {
      currentSession,
      allSessions: pendingSessions,
      nextSession: RaceSessionService.getNextSession(),
    });
  });

  socket.on("session:create", () => {
    try {
      const session = RaceSessionService.createSession();
      const pendingSessions = RaceSessionService.getAllSessions().filter(
        (s) => s.mode === "pending"
      );
      frontDesk.emit("state:update", {
        lastEvent: "sessionCreated",
        currentSession: session,
        allSessions: pendingSessions,
      });
    } catch (err) {
      socket.emit("error", err.message);
    }
  });

  socket.on("session:switch", ({ sessionId }) => {
    try {
      RaceSessionService.setCurrentSession(sessionId);
      const pendingSessions = RaceSessionService.getAllSessions().filter(
        (s) => s.mode === "pending"
      );
      const current = RaceSessionService.getCurrentSession();
      const currentSession =
        current && current.mode === "pending" ? current : null;
      frontDesk.emit("state:update", {
        lastEvent: "sessionSwitched",
        currentSession,
        allSessions: pendingSessions,
      });
    } catch (err) {
      socket.emit("error", err.message);
    }
  });

  socket.on("session:delete", ({ sessionId }) => {
    try {
      const removed = RaceSessionService.deleteSession(sessionId);
      const pendingSessions = RaceSessionService.getAllSessions().filter(
        (s) => s.mode === "pending"
      );
      const current = RaceSessionService.getCurrentSession();
      const currentSession =
        current && current.mode === "pending" ? current : null;
      frontDesk.emit("state:update", {
        lastEvent: "sessionDeleted",
        currentSession,
        allSessions: pendingSessions,
      });
    } catch (err) {
      socket.emit("error", err.message);
    }
  });

  socket.on("driver:add", ({ name }) => {
    try {
      const driver = RaceSessionService.addDriver(name);

      const pendingSessions = RaceSessionService.getAllSessions().filter(
        (s) => s.mode === "pending"
      );
      const current = RaceSessionService.getCurrentSession();
      const currentSession =
        current && current.mode === "pending" ? current : null;
      frontDesk.emit("state:update", {
        lastEvent: "driverAdded",
        currentSession,
        allSessions: pendingSessions,
      });

      nextRace.on("connection", (socket) => {
        socket.emit("nextRace:update", {
          session: RaceSessionService.getNextSession(),
          hasSessions: RaceSessionService.getAllSessions().length > 0,
        });
      });
    } catch (err) {
      socket.emit("action:error", { message: err.message });
    }
  });

  socket.on("driver:remove", ({ name }) => {
    try {
      const removed = RaceSessionService.removeDriver(name);
      if (!removed) return socket.emit("error", "Driver not found");
      const pendingSessions = RaceSessionService.getAllSessions().filter(
        (s) => s.mode === "pending"
      );
      const current = RaceSessionService.getCurrentSession();
      const currentSession =
        current && current.mode === "pending" ? current : null;
      frontDesk.emit("state:update", {
        lastEvent: "driverRemoved",
        currentSession,
        allSessions: pendingSessions,
      });
    } catch (err) {
      socket.emit("error", err.message);
    }
  });

  socket.on("driver:edit", ({ driverId, newName }) => {
    try {
      const driver = RaceSessionService.editDriver(driverId, newName);
      const pendingSessions = RaceSessionService.getAllSessions().filter(
        (s) => s.mode === "pending"
      );
      const current = RaceSessionService.getCurrentSession();
      const currentSession =
        current && current.mode === "pending" ? current : null;
      frontDesk.emit("state:update", {
        lastEvent: "driverEdited",
        currentSession,
        allSessions: pendingSessions,
      });
    } catch (err) {
      socket.emit("error", err.message);
    }
  });

  socket.on("car:assign", ({ driverId, carNumber }) => {
    try {
      RaceSessionService.assignCar(driverId, carNumber);

      const pendingSessions = RaceSessionService.getAllSessions().filter(
        (s) => s.mode === "pending"
      );
      const current = RaceSessionService.getCurrentSession();
      const currentSession =
        current && current.mode === "pending" ? current : null;

      frontDesk.emit("state:update", {
        currentSession,
        allSessions: pendingSessions,
      });
    nextRace.emit("nextRace:update", RaceSessionService.getNextSession());
  } catch (err) {
    socket.emit("error", err.message);
    }
  });
});

lapLine.use(authMiddleware);

lapLine.on("connection", (socket) => {
  socket.on("subscribe", () => {
    const current = RaceSessionService.getCurrentSession();
    socket.emit("state:update", {
      currentSession: current && current.mode === "safe" ? current : null,
    });
  });

  socket.on("lap:record", ({ driverId, lapTime }, cb) => {
    try {
      const lap = RaceSessionService.recordLap(driverId, lapTime);
      cb({ success: true, lap });
    } catch (err) {
      cb({ success: false, error: err.message });
    }
  });
});

raceControl.use(authMiddleware);

raceControl.on("connection", (socket) => {
  console.log(`Race Control connected: ${socket.id}`);

  socket.on("subscribe", () => {
    const current = RaceSessionService.getCurrentSession();
    const next = RaceSessionService.getNextSession();
    socket.emit("state:update", {
      currentSession: current && current.mode === "safe" ? current : null,
      nextSession: next,
    });
  });

  socket.on("session:start", () => RaceSessionService.startSession());
  socket.on("mode:change", ({ mode }) => {
  try {
    RaceSessionService.setRaceMode(mode);
  } catch (err) {
    console.error("Mode change error:", err.message);
    socket.emit("error", err.message);
  }
});
  socket.on("session:finish", () => RaceSessionService.finishSession());
  socket.on("session:end", () => RaceSessionService.endSession());
});

nextRace.on("connection", (socket) => {
  socket.emit("nextRace:update", RaceSessionService.getNextSession());
});

leaderBoard.on("connection", (socket) => {
  socket.emit("leaderboardUpdated", {
    leaderboard: RaceSessionService.getLeaderboard(),
    session: RaceSessionService.getCurrentSession(),
  });
});

raceFlags.on("connection", (socket) => {
  const currentMode = RaceSessionService.getCurrentSession()?.mode || "safe";
  socket.emit("raceModeChanged", currentMode.toLowerCase());
});

RaceSessionService.on("sessionStarted", (session) => {
  const pendingSessions = RaceSessionService.getAllSessions().filter(
    (s) => s.mode === "pending"
  );
  frontDesk.emit("state:update", {
    lastEvent: "sessionStarted",
    currentSession: null,
    allSessions: pendingSessions,
  });
  raceControl.emit("state:update", {
    lastEvent: "sessionStarted",
    currentSession: session,
  });
  lapLine.emit("state:update", { currentSession: session });
  leaderBoard.emit("leaderboardUpdated", {
    leaderboard: RaceSessionService.getLeaderboard(),
    session,
  });
});

RaceSessionService.on("lapRecorded", () => {
  leaderBoard.emit("leaderboardUpdated", {
    leaderboard: RaceSessionService.getLeaderboard(),
    session: RaceSessionService.getCurrentSession(),
  });
});

RaceSessionService.on("raceModeChanged", (mode) => {
  raceFlags.emit("raceModeChanged", mode);
  leaderBoard.emit("raceModeChanged", mode);
  leaderBoard.emit("leaderboardUpdated", {
    leaderboard: RaceSessionService.getLeaderboard(),
    session: RaceSessionService.getCurrentSession(),
  });
});

RaceSessionService.on("sessionFinished", (session) => {
  const pendingSessions = RaceSessionService.getAllSessions().filter(
    (s) => s.mode === "pending"
  );
  frontDesk.emit("state:update", {
    lastEvent: "sessionFinished",
    currentSession: null,
    allSessions: pendingSessions,
  });
  raceControl.emit("state:update", {
    lastEvent: "sessionFinished",
    currentSession: session,
  });
  lapLine.emit("state:update", { currentSession: session });
  leaderBoard.emit("leaderboardUpdated", {
    leaderboard: RaceSessionService.getLeaderboard(),
    session,
  });
});

RaceSessionService.on("sessionEnded", (session) => {
  const pendingSessions = RaceSessionService.getAllSessions().filter(
    (s) => s.mode === "pending"
  );
  const current = RaceSessionService.getCurrentSession();
  const currentSession = current && current.mode === "pending" ? current : null;
  frontDesk.emit("state:update", {
    lastEvent: "sessionEnded",
    currentSession,
    allSessions: pendingSessions,
  });
  raceControl.emit("state:update", {
    lastEvent: "sessionEnded",
    currentSession: RaceSessionService.getCurrentSession(),
    nextSession: RaceSessionService.getNextSession(),
  });
  lapLine.emit("state:update", { currentSession: null });
  leaderBoard.emit("leaderboardUpdated", {
    leaderboard: RaceSessionService.getLeaderboard(),
    session: RaceSessionService.getCurrentSession(),
  });
});

RaceSessionService.on("nextSessionUpdated", (session) => {
  nextRace.emit("nextRace:update", {
    session: session,
    hasSessions: RaceSessionService.getAllSessions().length > 0
  });
});

RaceSessionService.on("timerUpdate", (remaining) => {
  leaderBoard.emit("timerUpdate", remaining);
  raceCountdown.emit("timerTick", remaining);
});

const publicPath = path.join(__dirname, "..", "public");

app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "dashboard.html"));
});

app.get(
  [
    "/front-desk",
    "/race-control",
    "/lap-line-tracker",
    "/leader-board",
    "/next-race",
    "/race-flags",
    "/race-countdown",
  ],
  (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  }
);

app.use(express.static(publicPath));

app.use((req, res) => {
  res.sendFile(path.join(publicPath, "dashboard.html"));
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port: ${PORT}`));