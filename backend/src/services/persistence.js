const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(__dirname, "../../race-state.json");

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("Failed to save state:", err);
  }
}

function loadState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return null;
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  } catch (err) {
    console.error("Failed to load state:", err);
    return null;
  }
}

module.exports = { saveState, loadState };
