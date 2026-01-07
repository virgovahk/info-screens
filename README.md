<h1 align="center">✨🏎️ <strong>Racetrack Info-Screens</strong> 🏎️✨</h1>

<p align="center">
<strong>Info-Screens is a MVP system that makes sure that everyone has the information they need, exactly when they need it.</strong> 
</p>

## 🔑 Key features
- **WebSocket communication**: Real-time messaging using Socket.IO  
- **Race managing**: Create, edit, remove races  
- **Race Controlling**: Start, end, change race modes  
- **Lap tracking**: Lap time and count tracking for each racer  
- **Info Screens**: Public info screens for displaying races, leaderboards, flags  
- **Security**: Password protected interfaces
- **System state and data persistence**: Server continues at the same state when restarted

 ## ⚙️ Setup & Installation

 1. clone the repository.

 `git clone https://gitea.kood.tech/virgovahk/info-screens.git`
 
 `cd info-screens/backend`

 2. install dependencies

 `npm install`

 3. Set environment variables

 4. Start server
 `npm start` or `npm run dev`

 5. Open the dashboard interface in a browser:
 - http://localhost:3000

 ## 🔐 Environment Variables
The employee interfaces require passwords to function. Set them before starting the server:

**Windows:**
- $env:RECEPTIONIST_KEY="your_receptionist_key"
- $env:OBSERVER_KEY="your_observer_key"
- $env:SAFETY_KEY="your_safety_key"
- npm start <br>

**Linux & macOS:**
- export RECEPTIONIST_KEY="your_receptionist_key"
- export OBSERVER_KEY="your_observer_key"
- export SAFETY_KEY="your_safety_key"
- npm start

 The server will not start if the passwords are missing. An incorrect password triggers a 500ms delay before the interface lets you try again.

 ## 🌐 Reaching the interfaces from other networks
Make an account on [ngrok](https://ngrok.com/) and follow the setup instructions.

Start hosting the backend by running:

`ngrok http 3000`

## 📃 Available Scripts

- `npm start` - Countdown timer runs for 10 minutes.

- `npm run dev` - Countdown timer runs for 1 minute.

## 🧭 Interface & Persona & Route

| Interface         | Persona | Route|
| --------------- | :-------: |-------------------------------- |
| Dashboard |  | `/`|
| Front Desk |  Receptionist | `/front-desk` |
|Race Control | Safety Official | `/race-control` |
|Lap-line Tracker | Lap-line Observer | `/lap-line-tracker` |
|Leader Board | Guest | `leader-board` |
|Next Race | Race Driver | `next-race` |
|Race Countdown | Race Driver | `race-countdown` |
|Race Flag | Race Driver | `race-flags` |

## 🖥️ Interface Functionality

**Front Desk**
- Configure upcoming race sessions.
- Add, edit, or remove drivers (unique names only).
- Assign drivers to specific cars.
- Upcoming races disappear once marked safe to start.

**Race Control**
- Start and end race sessions.
- Change race modes: Safe, Hazard, Danger, Finish.
- Monitor race progress in real time.
- Mobile-friendly for Safety Officials on the move.

**Lap-line Tracker**
- Record lap times for each car with large tappable buttons.
- Operates in portrait or landscape on a tablet.
- Buttons disabled once the race ends.

**Leader Board**
- Displays drivers ranked by fastest lap time.
- Shows current lap, car number, driver name, remaining race time, and race flag status.
- Updates in real time for spectators.

**Next Race**
- Displays upcoming race and assigned cars for drivers.
- Updates to subsequent race once the current session is safe to start.

**Race Countdown**
- Shows remaining time for the current race session.

**Race Flag**
- Visual representation of current race mode (replaces physical flag bearers):
- Safe: Green
- Hazard: Yellow
- Danger: Red
- Finish: Chequered

## ⏰ Real-Time Functionality
All interfaces update in real time using Socket.IO.
When race state changes (such as race mode updates, lap recordings, or session transitions), all connected interfaces update instantly without page reloads or polling.


 ## 📜 User Guide

 Interface navigation page.  
[http://localhost:300/](http://localhost:3000/)

Configure upcoming races and assign drivers to cars.  
[/front-desk](http://localhost:3000/front-desk)

Control races.  
[/race-control](http://localhost:3000/race-control)

Track lap times in real time.  
[/lap-line-tracker](http://localhost:3000/lap-line-tracker)

Displays fastest laps and lap counts for each racer during a race.  
[/leader-board](http://localhost:3000/leader-board)

Displays the next race.  
[/next-race](http://localhost:3000/next-race)

Displays time until race end.  
[/race-countdown](http://localhost:3000/race-countdown)

Displays race status.  
[/race-flags](http://localhost:3000/race-flags)

## 📸 Screenshots of Interfaces
[View all interface screenshots](/screenshots)
