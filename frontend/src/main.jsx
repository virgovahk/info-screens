import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import FrontDesk from './pages/frontdesk.jsx';
import RaceControl from './pages/raceControl.jsx';
import LapLineTracker from './pages/laplinetracker.jsx';
import LeaderBoard from './pages/leaderboard.jsx';
import NextRace from './pages/nextRace.jsx';
import RaceCountdown from './pages/raceCountdown.jsx';
import RaceFlags from './pages/raceFlags.jsx';

const NotFound = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <h1>Page Not Found</h1>
    <a href="/">← Back to Dashboard</a>
  </div>
);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/front-desk" element={<FrontDesk />} />
        <Route path="/race-control" element={<RaceControl />} />
        <Route path="/lap-line-tracker" element={<LapLineTracker />} />
        <Route path="/leader-board" element={<LeaderBoard />} />
        <Route path="/next-race" element={<NextRace />} />
        <Route path="/race-countdown" element={<RaceCountdown />} />
        <Route path="/race-flags" element={<RaceFlags />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);