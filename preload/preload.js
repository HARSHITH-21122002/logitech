const { contextBridge, ipcRenderer } = require("electron")

console.log("🔌 Preload script loading...")

// Preload script for Electron
window.addEventListener("DOMContentLoaded", () => {
  console.log("🌐 DOM fully loaded and parsed in Electron")

  // Expose Electron-specific info to renderer process
  window.isElectronApp = true

  // Helper to convert relative paths to absolute for Electron
  window.getElectronPath = (relativePath) => {
    // Remove leading slash if present
    if (relativePath.startsWith("/")) {
      return relativePath.substring(1)
    }
    return relativePath
  }

  // Inject a global function to help with video playback in Electron
  window.forcePlayVideo = (videoElement) => {
    if (videoElement) {
      videoElement.muted = true
      videoElement.play().catch((err) => {
        console.error("🎥 Failed to play video in Electron:", err)
      })
    }
  }
   let localStorageMachineId = localStorage.getItem("machineId");
  if (localStorageMachineId) {
    // If you want the main process to consider localStorage as an initial source
    ipcRenderer.send("set-machine-id-from-renderer", localStorageMachineId);
  }

  console.log("✅ Preload script initialized")
})


// Expose secure API to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Basic quit function
  quit: () => {
    console.log("📤 Sending app-quit to main process")
    ipcRenderer.send("app-quit")
  },

  getMachineId: () => ipcRenderer.invoke('get-machine-id'),

  // Force quit function for emergency cases
  forceQuit: () => {
    console.log("📤 Sending app-force-quit to main process")
    ipcRenderer.send("app-force-quit")
  },

   getMacAddress: () => ipcRenderer.invoke("get-mac-address"),

   getMachineLog: (payload) => ipcRenderer.invoke("get-machine-log", payload),
   
  
  // Get app status
  getStatus: () => {
    console.log("📤 Requesting app status")
    return ipcRenderer.invoke("app-get-status")
  },

  // Listen for quit acknowledgment
  onQuitAcknowledged: (callback) => {
    ipcRenderer.on("app-quit-acknowledged", callback)
  },

  

  // Remove quit acknowledgment listener
  removeQuitAcknowledgedListener: (callback) => {
    ipcRenderer.removeListener("app-quit-acknowledged", callback)
  },

  getLogFiles: (fromDate, toDate) => ipcRenderer.invoke("get-log-files", fromDate, toDate),
  downloadLogFile: (filePath, fileName) => ipcRenderer.invoke("download-log-file", filePath, fileName),
  downloadMultipleLogs: (filePaths) => ipcRenderer.invoke("download-multiple-logs", filePaths),
  getLogFileBase64: (filePath, fileName) => ipcRenderer.invoke("get-log-file-base64", filePath, fileName),
  getVersionJsonDetails: () => ipcRenderer.invoke("getVersionJsonDetails"),
  // New methods for shutdown and restart
  shutdown: () => {
    console.log("📤 Sending app-shutdown to main process")
    return ipcRenderer.invoke("app-shutdown")
  },

  restart: () => {
    console.log("📤 Sending app-restart to main process")
    return ipcRenderer.invoke("app-restart")
  },

  // Other existing properties
  isElectron: true,
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
})

// Handle renderer process errors
window.addEventListener("error", (event) => {
  console.error("🚨 Renderer Error:", event.error)
})

window.addEventListener("unhandledrejection", (event) => {
  console.error("🚨 Unhandled Promise Rejection:", event.reason)
})

console.log("✅ Preload script loaded successfully")

