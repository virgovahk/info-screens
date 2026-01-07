import { useEffect, useState } from "react";
import { raceFlagsSocket } from "../sockets/raceFlagsSocket";

export default function RaceFlags() {
  const [mode, setMode] = useState("safe");

  useEffect(() => {
    raceFlagsSocket.connect();

    raceFlagsSocket.on("raceModeChanged", (newMode) => {
      setMode((newMode || "safe").toLowerCase());
    });

    return () => {
      raceFlagsSocket.off("raceModeChanged");
    };
  }, []);

  const getBackground = (m) => {
    switch (m) {
      case "safe":
        return "#28a745"; 
      case "hazard":
        return "#ffc107"; 
      case "danger":
        return "#dc3545"; 
      case "finish":
      case "finished":
        return "repeating-conic-gradient(#000 0% 25%, #fff 25% 50%)"; 
      default:
        return "#28a745";
    }
  };

  return (
    <div style={{
      background: getBackground(mode),
      backgroundSize: mode === "finish" || mode === "finished" ? "60px 60px" : "cover",
      height: "100vh",
      width: "100vw",
      margin: 0,
      padding: 0,
    }} />
  );
}