// machine.js
const fs = require("fs");
const path = require("path");
// Ensure 'app' is only imported if it's available, e.g., in the main process
// For utility functions that might be used elsewhere, it's better to pass paths
// or check for 'app' existence.
// For now, let's assume this machine.js is primarily for the main process.
const { app } = require("electron"); // Removed /main as it's not needed for app module

// Determine if running in development or production for file paths
const isDev = !app.isPackaged; // Use app.isPackaged for a more reliable check

// Define the path to the machine.json file
const getMachineFilePath = () => {
  return isDev
    ? path.join(__dirname, "machine.json")
    : path.join(app.getPath("userData"), "machine.json");
};

/**
 * Reads the machine ID from machine.json.
 * @returns {string | null} The machine ID if found, otherwise null.
 */
function getSavedMachineId() {
  const filePath = getMachineFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data).machineId;
    } catch (error) {
      console.error("Error reading or parsing machine.json:", error);
      return null;
    }
  }
  return null;
}

/**
 * Saves the machine ID to machine.json.
 * @param {string} machineId The machine ID to save.
 */
function saveMachineId(machineId) {
  const filePath = getMachineFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify({ machineId: machineId }, null, 2), "utf-8");
    console.log(`Machine ID ${machineId} saved to ${filePath}`);
  } catch (error) {
    console.error("Error saving machine.json:", error);
  }
}

/**
 * Ensures a machine ID exists, either by loading from machine.json or generating/fetching it.
 * If not found, it tries to get it from localStorage (if available in renderer, or if passed).
 * For the main process, localStorage is not directly available, so you'd typically pass it in
 * or generate it and save.
 * @param {string | null} [localStorageMachineId=null] An optional machine ID from localStorage if available (e.g., from renderer).
 * @returns {string} The machine ID.
 */
function ensureMachineId(localStorageMachineId = null) {
  let id = getSavedMachineId();

  if (!id) {
    // If not in machine.json, try to use the one from localStorage if provided
    if (localStorageMachineId) {
      id = localStorageMachineId;
      saveMachineId(id); // Save it to the file for future use
      console.log("Machine ID loaded from localStorage and saved to file.");
    } else {
      // If still no ID, generate a new one (or fetch from a backend)
      id = `machine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Simple unique ID
      saveMachineId(id);
      console.log("Generated new Machine ID and saved to file.");
    }
  }
  return id;
}


module.exports = { getSavedMachineId, saveMachineId, ensureMachineId, getMachineFilePath };