// const { app, BrowserWindow, ipcMain } = require("electron")
// const path = require("path")
// const { spawn, exec } = require("child_process")
// const os = require("os")
// const fs = require("fs")


// let mainWindow
// let pythonProcess
// console.log("Path:", path.join(__dirname))
// console.log("Resources Path (Dev):", process.resourcesPath)

// app.commandLine.appendSwitch("disable-features", "AutofillServerCommunication")

// const isDev = !app.isPackaged

// function createWindow() {
//   mainWindow = new BrowserWindow({
//     // width: 1000,
//     // height: 800,
//     frame: false,
//     fullscreen:true,
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//       devTools: isDev, // Only enable devTools in development
//       // devTools: true,
//       webSecurity: false,
//       preload: path.join(__dirname, "../preload/preload.js"),
//     },
//     icon: path.join(__dirname, "../assets/icon.ico"),
//   })

//   if (isDev) {
//     mainWindow.loadURL("http://localhost:5173")
//     mainWindow.webContents.openDevTools()
//   } else {
//     const indexPath = path.join(__dirname, "../frontend/dist/index.html")
//     // mainWindow.loadURL(`file://${indexPath}`)
//     mainWindow.loadFile(indexPath)
//     // mainWindow.webContents.openDevTools()
//   }

//   mainWindow.setMenu(null)

//   mainWindow.on("closed", () => {
//     console.log("🪟 Main window closed")
//     mainWindow = null
//     // Ensure app quits when main window is closed
//     if (process.platform !== "darwin") {
//       gracefulShutdown()
//     }
//   })

//   // Handle window close event
//   mainWindow.on("close", (event) => {
//     console.log("🪟 Main window closing...")
//     // Don't prevent close, let it happen naturally
//   })
// }

// // Enhanced logging setup
// let logStream = null
// const logDir = isDev ? path.join(__dirname, "../logs") : path.join(process.resourcesPath, "logs")

// function setupLogging() {
//   try {
//     // Create logs directory if it doesn't exist
//     if (!fs.existsSync(logDir)) {
//       fs.mkdirSync(logDir, { recursive: true })
//     }

//     // Create log file with current date
//     const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format
//     const logFileName = `log-${today}.txt`
//     const logFilePath = path.join(logDir, logFileName)

//     // Create write stream for logging
//     logStream = fs.createWriteStream(logFilePath, { flags: "a" })

//     // Override console.log to write to both console and file
//     const originalConsoleLog = console.log
//     const originalConsoleError = console.error

//     console.log = (...args) => {
//       const timestamp = new Date().toISOString()
//       const message = `[${timestamp}] LOG: ${args.join(" ")}`
//       originalConsoleLog(...args)
//       if (logStream) {
//         logStream.write(message + "\n")
//       }
//     }

//     console.error = (...args) => {
//       const timestamp = new Date().toISOString()
//       const message = `[${timestamp}] ERROR: ${args.join(" ")}`
//       originalConsoleError(...args)
//       if (logStream) {
//         logStream.write(message + "\n")
//       }
//     }

//     console.log("📝 Logging system initialized:", logFilePath)
//   } catch (error) {
//     console.error("🚨 Failed to setup logging:", error)
//   }
// }

// function startBackend() {
//   let backendPath
//   let pythonCmd

//   if (isDev) {
//     backendPath = path.join(__dirname, "../backend/api.py")
//     pythonCmd = process.platform === "win32" ? "python" : "python3"
//   } else {
//     // Production build - try multiple possible paths
//     const possiblePaths = [
//       path.join(process.resourcesPath, "backend","api.py"),
//       path.join(process.resourcesPath, "app", "backend","api.py"),
//       path.join(__dirname, "../backend/api.py"),
//       path.join(app.getAppPath(), "backend","api.py"),
//     ]

//     backendPath = possiblePaths.find((p) => fs.existsSync(p))

//     if (!backendPath) {
//       console.error("🚨 Python backend not found in any expected location:")
//       possiblePaths.forEach((p) => console.error(`  - ${p}`))
//       return
//     }

//     // Try different Python commands for production
//     const pythonCommands = ["python", "python3", "py"]
//     pythonCmd = pythonCommands[0] // Default to first, will validate below
//   }

//   console.log("🐍 Starting Python backend:", backendPath)
//   console.log("🐍 Using Python command:", pythonCmd)
//   console.log("🐍 Working directory:", process.cwd())
//   console.log("🐍 Resources path:", process.resourcesPath)

//   // Validate Python installation
//   exec(`${pythonCmd} --version`, (error, stdout, stderr) => {
//     if (error) {
//       console.error("🚨 Python validation failed:", error.message)
//       // Try alternative Python commands in production
//       if (!isDev) {
//         const altCommands = ["python3", "py", "python"]
//         for (const cmd of altCommands) {
//           if (cmd !== pythonCmd) {
//             console.log(`🐍 Trying alternative Python command: ${cmd}`)
//             startPythonProcess(cmd, backendPath)
//             return
//           }
//         }
//       }
//     } else {
//       console.log("🐍 Python version:", stdout.trim())
//       startPythonProcess(pythonCmd, backendPath)
//     }
//   })
// }

// function startPythonProcess(pythonCmd, backendPath) {
//   pythonProcess = spawn(pythonCmd, [backendPath], {
//     detached: false,
//     stdio: ["pipe", "pipe", "pipe"],
//     cwd: path.dirname(backendPath), // Set working directory to backend folder
//     env: { ...process.env, PYTHONPATH: path.dirname(backendPath) },
//   })

//   pythonProcess.stdout.on("data", (data) => {
//     console.log(`🐍 Python stdout: ${data.toString().trim()}`)
//   })

//   pythonProcess.stderr.on("data", (data) => {
//     const errorMsg = data.toString().trim()
//     console.error(`🐍 Python stderr: ${errorMsg}`)

//     if (errorMsg.includes("No such file") || errorMsg.includes("not recognized")) {
//       console.error("🚨 Python script not found or Python is not installed properly.")
//     } else if (errorMsg.includes("ModuleNotFoundError")) {
//       console.error("🚨 Python module missing. Please install required dependencies.")
//     } else if (errorMsg.includes("Permission denied")) {
//       console.error("🚨 Permission denied accessing Python script.")
//     }
//   })

//   pythonProcess.on("close", (code) => {
//     console.log(`🐍 Python backend exited with code ${code}`)
//     pythonProcess = null

//     // Attempt restart if exit was unexpected (not during shutdown)
//     if (code !== 0 && mainWindow && !mainWindow.isDestroyed()) {
//       console.log("🔄 Attempting to restart Python backend in 5 seconds...")
//       setTimeout(() => {
//         if (!pythonProcess) {
//           startBackend()
//         }
//       }, 5000)
//     }
//   })

//   pythonProcess.on("error", (error) => {
//     console.error("🚨 Failed to start Python backend:", error.message)
//     pythonProcess = null
//   })

//   // Test backend connection after startup
//   setTimeout(() => {
//     testBackendConnection()
//   }, 3000)
// }

// function testBackendConnection() {
//   const http = require("http")
//   const options = {
//     hostname: "localhost",
//     port: 5000, // Adjust if your backend uses a different port
//     path: "/health", // Add a health check endpoint to your Python API
//     method: "GET",
//     timeout: 5000,
//   }

//   const req = http.request(options, (res) => {
//     console.log(`🐍 Backend health check: ${res.statusCode}`)
//     if (res.statusCode === 200) {
//       console.log("✅ Python backend is running and accessible")
//     }
//   })

//   req.on("error", (error) => {
//     console.error("🚨 Backend connection test failed:", error.message)
//   })

//   req.on("timeout", () => {
//     console.error("🚨 Backend connection test timed out")
//     req.destroy()
//   })

//   req.end()
// }

// function gracefulShutdown() {
//   console.log("🔄 Starting graceful shutdown...")

//   // Close log stream
//   if (logStream) {
//     logStream.end()
//     logStream = null
//   }

//   // Kill Python process if it exists
//   if (pythonProcess && !pythonProcess.killed) {
//     console.log("🐍 Terminating Python backend...")
//     try {
//       if (process.platform === "win32") {
//         spawn("taskkill", ["/pid", pythonProcess.pid, "/f", "/t"])
//       } else {
//         pythonProcess.kill("SIGTERM")
//       }
//     } catch (error) {
//       console.error("🚨 Error killing Python process:", error)
//     }
//     pythonProcess = null
//   }

//   // Close main window if it exists
//   if (mainWindow && !mainWindow.isDestroyed()) {
//     console.log("🪟 Closing main window...")
//     mainWindow.close()
//     mainWindow = null
//   }

//   console.log("✅ Graceful shutdown complete")
// }

// app.whenReady().then(() => {
//   console.log("🚀 Electron app ready")
//   setupLogging()
//   console.log("▶️ Starting Python backend process...");
//   startBackend()

//   const waitonOptions = {
//     resources: [
//       "http://127.0.0.1:5000/health" // Use 127.0.0.1 for reliability
//     ],
//     timeout: 30000, // Wait for up to 30 seconds
//     headers: {
//       accept: 'application/json'
//     },
//     validateStatus: function (status) {
//       return status >= 200 && status < 300; // a 2xx status code
//     }
//   };

//   console.log(`⏳ Waiting for backend to be ready at ${waitonOptions.resources[0]}...`);

//   // Use waitOn to pause execution until the backend is available
//   waitOn(waitonOptions, (err) => {
//     if (err) {
//       // If it fails (e.g., times out), log the error and quit the app.
//       console.error("🚨 Backend did not start in time or health check failed:", err);
//       gracefulShutdown(); 
//       app.quit();
//       return;
//     }
    
//     // If waitOn succeeds, it means the backend is ready.
//     console.log("✅ Backend is ready. Creating main window...");
    
//     createWindow();
//      });

//   app.on("activate", () => {
//     if (BrowserWindow.getAllWindows().length === 0) {
//       createWindow()
//     }
//   })
// })

// app.on("window-all-closed", () => {
//   console.log("🪟 All windows closed")
//   gracefulShutdown()
//   app.quit()
// })

// app.on("before-quit", (event) => {
//   console.log("🔄 App before-quit event")
//   gracefulShutdown()
// })

// app.on("will-quit", (event) => {
//   console.log("🔄 App will-quit event")
// })

// app.on("quit", () => {
//   console.log("✅ App quit event")
// })

// // Handle IPC messages from renderer
// ipcMain.on("app-quit", (event) => {
//   console.log("📦 Received app-quit signal from renderer")

//   // Send acknowledgment back to renderer
//   if (event.sender && !event.sender.isDestroyed()) {
//     event.sender.send("app-quit-acknowledged")
//   }

//   // Force quit after a short delay to ensure cleanup
//   setTimeout(() => {
//     console.log("🔄 Force quitting application...")
//     gracefulShutdown()
//     app.quit()

//     // If app.quit() doesn't work, force exit
//     setTimeout(() => {
//       console.log("🚨 Force exiting process...")
//       process.exit(0)
//     }, 1000)
//   }, 500)
// })

// // Handle force quit request
// ipcMain.on("app-force-quit", (event) => {
//   console.log("🚨 Received app-force-quit signal from renderer")

//   gracefulShutdown()

//   // Immediate force quit
//   setTimeout(() => {
//     process.exit(0)
//   }, 100)
// })

// // Handle app status requests
// ipcMain.handle("app-get-status", () => {
//   return {
//     isElectron: true,
//     isDev: isDev,
//     platform: process.platform,
//     version: app.getVersion(),
//   }
// })

// // Handle shutdown request
// ipcMain.handle("app-shutdown", () => {
//   console.log("🔌 Shutdown requested from renderer")

//   return new Promise((resolve, reject) => {
//     try {
//       const platform = process.platform
//       let command = ""

//       switch (platform) {
//         case "win32": // Windows
//           command = "shutdown /s /t 0"
//           break
//         case "darwin": // macOS
//           command = "osascript -e 'tell app \"System Events\" to shut down'"
//           break
//         case "linux": // Linux
//           command = "shutdown now"
//           break
//         default:
//           reject(new Error(`Unsupported platform: ${platform}`))
//           return
//       }

//       console.log(`🔌 Executing shutdown command: ${command}`)
//       exec(command, (error) => {
//         if (error) {
//           console.error("🚨 Shutdown command failed:", error)
//           reject(error)
//         } else {
//           console.log("✅ Shutdown command executed successfully")
//           resolve(true)
//         }
//       })
//     } catch (error) {
//       console.error("🚨 Error executing shutdown command:", error)
//       reject(error)
//     }
//   })
// })

// // Handle restart request
// ipcMain.handle("app-restart", () => {
//   console.log("🔄 Restart requested from renderer")

//   return new Promise((resolve, reject) => {
//     try {
//       const platform = process.platform
//       let command = ""

//       switch (platform) {
//         case "win32": // Windows
//           command = "shutdown /r /t 0"
//           break
//         case "darwin": // macOS
//           command = "osascript -e 'tell app \"System Events\" to restart'"
//           break
//         case "linux": // Linux
//           command = "shutdown -r now"
//           break
//         default:
//           reject(new Error(`Unsupported platform: ${platform}`))
//           return
//       }

//       console.log(`🔄 Executing restart command: ${command}`)
//       exec(command, (error) => {
//         if (error) {
//           console.error("🚨 Restart command failed:", error)
//           reject(error)
//         } else {
//           console.log("✅ Restart command executed successfully")
//           resolve(true)
//         }
//       })
//     } catch (error) {
//       console.error("🚨 Error executing restart command:", error)
//       reject(error)
//     }
//   })
// })

// // Prevent multiple instances
// const gotTheLock = app.requestSingleInstanceLock()

// if (!gotTheLock) {
//   console.log("🚨 Another instance is already running. Quitting...")
//   app.quit()
// } else {
//   app.on("second-instance", (event, commandLine, workingDirectory) => {
//     // Someone tried to run a second instance, focus our window instead
//     if (mainWindow) {
//       if (mainWindow.isMinimized()) mainWindow.restore()
//       mainWindow.focus()
//     }
//   })
// }

// // Handle uncaught exceptions
// process.on("uncaughtException", (error) => {
//   console.error("🚨 Uncaught Exception:", error)
//   gracefulShutdown()
//   process.exit(1)
// })

// process.on("unhandledRejection", (reason, promise) => {
//   console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason)
// })

const { app, BrowserWindow, ipcMain } = require("electron")
const macaddress = require("macaddress");
const path = require("path")
const { spawn, exec } = require("child_process")
const os = require("os")
const fs = require("fs")
const startExpressApp = require("./api")
const { machineFile } = require("./machine")

let mainWindow
let pythonProcess
console.log("Path:", path.join(__dirname))
console.log("Resources Path (Dev):", process.resourcesPath)

app.commandLine.appendSwitch("disable-features", "AutofillServerCommunication")

const isDev = !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    // width: 1000,
    // height: 800,
    frame: false,
    fullscreen:true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: isDev, // Only enable devTools in development
      // devTools: true,
      webSecurity: false,
      preload: path.join(__dirname, "../preload/preload.js"),
    },
    icon: path.join(__dirname, "../assets/icon.ico"),
  })

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173")
    mainWindow.webContents.openDevTools()
  } else {
    const indexPath = path.join(__dirname, "../frontend/dist/index.html")
    // mainWindow.loadURL(`file://${indexPath}`)
    mainWindow.loadFile(indexPath)
    // mainWindow.webContents.openDevTools()
  }

  mainWindow.setMenu(null)

  mainWindow.on("closed", () => {
    console.log("🪟 Main window closed")
    mainWindow = null
    // Ensure app quits when main window is closed
    if (process.platform !== "darwin") {
      gracefulShutdown()
    }
  })

  // Handle window close event
  mainWindow.on("close", (event) => {
    console.log("🪟 Main window closing...")
    // Don't prevent close, let it happen naturally
  })
}
console.log("start express called")
startExpressApp()
console.log("start expressed completed")
ipcMain.handle("get-machine-log", async (event, payload) => {
  try {
    const response = await axios.post("http://127.0.0.1:3050/get/machine/logs", payload);
    return response.data;
  } catch (error) {
    console.error("Error fetching machine logs:", error.message);
    throw error;
  }
});
// Enhanced logging setup
let logStream = null
const logDir = isDev ? path.join(__dirname, "../logs") : path.join(process.resourcesPath, "logs")

function setupLogging() {
  try {
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    // Create log file with current date
    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format
    const logFileName = `log-${today}.txt`
    const logFilePath = path.join(logDir, logFileName)

    // Create write stream for logging
    logStream = fs.createWriteStream(logFilePath, { flags: "a" })

    // Override console.log to write to both console and file
    const originalConsoleLog = console.log
    const originalConsoleError = console.error

    console.log = (...args) => {
      const timestamp = new Date().toISOString()
      const message = `[${timestamp}] LOG: ${args.join(" ")}`
      originalConsoleLog(...args)
      if (logStream) {
        logStream.write(message + "\n")
      }
    }

    console.error = (...args) => {
      const timestamp = new Date().toISOString()
      const message = `[${timestamp}] ERROR: ${args.join(" ")}`
      originalConsoleError(...args)
      if (logStream) {
        logStream.write(message + "\n")
      }
    }

    console.log("📝 Logging system initialized:", logFilePath)
  } catch (error) {
    console.error("🚨 Failed to setup logging:", error)
  }
}

// Log from frontend
ipcMain.on("frontend-log", (event, message) => {
  const timestamp = getFormattedTimestamp()
  const logMessage = `[${timestamp}] FRONTEND LOG: ${message}`
  console.log(logMessage)
})

// const machineFile = path.join(__dirname, "machine.json")

ipcMain.on("save-machine-id", (event, machineId) => {
  if (machineId) {
    fs.writeFileSync(machineFile, JSON.stringify({ machineId }))
    console.log("Machine ID saved.")
  }
})
// --- NEW LOG FILE HANDLERS ---

ipcMain.handle("get-log-files", async (event, fromDate, toDate) => {
  try {
    const logPath = isDev ? path.join(__dirname, "../logs") : path.join(process.resourcesPath, "logs")

    console.log("Looking for logs in:", logPath)

    if (!fs.existsSync(logPath)) {
      console.log("Log directory does not exist, creating it...")
      fs.mkdirSync(logPath, { recursive: true })
      return []
    }

    const files = fs
      .readdirSync(logPath)
      .filter((file) => file.endsWith(".txt") || file.endsWith(".log"))
      .map((file) => {
        const fullPath = path.join(logPath, file)
        const stats = fs.statSync(fullPath)
        return {
          name: file,
          path: fullPath,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          formattedSize: formatFileSize(stats.size),
          formattedCreated: stats.birthtime.toLocaleDateString(),
          formattedModified: stats.mtime.toLocaleDateString(),
        }
      })

    // Filter by date range if provided
    let filteredFiles = files
    if (fromDate || toDate) {
      filteredFiles = files.filter((file) => {
        const fileDate = file.modifiedAt
        const from = fromDate ? new Date(fromDate) : null
        const to = toDate ? new Date(toDate + "T23:59:59") : null

        if (from && to) {
          return fileDate >= from && fileDate <= to
        } else if (from) {
          return fileDate >= from
        } else if (to) {
          return fileDate <= to
        }
        return true
      })
    }

    // Sort by modified date (newest first)
    filteredFiles.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))

    console.log(`Found ${filteredFiles.length} log files`)
    return filteredFiles
  } catch (error) {
    console.error("Error getting log files:", error)
    return []
  }
})

// Download single log file
ipcMain.handle("download-log-file", async (event, filePath, fileName) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: "Save Log File",
      defaultPath: fileName,
      filters: [
        { name: "Log Files", extensions: ["txt", "log"] },
        { name: "All Files", extensions: ["*"] },
      ],
    })

    if (!result.canceled && result.filePath) {
      fs.copyFileSync(filePath, result.filePath)
      return { success: true, message: "File downloaded successfully" }
    }

    return { success: false, message: "Download cancelled" }
  } catch (error) {
    console.error("Error downloading file:", error)
    return { success: false, message: error.message }
  }
})


// Download multiple log files as ZIP
ipcMain.handle("download-multiple-logs", async (event, filePaths) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: "Save Log Files",
      defaultPath: `machine-logs-${new Date().toISOString().split("T")[0]}.zip`,
      filters: [
        { name: "ZIP Files", extensions: ["zip"] },
        { name: "All Files", extensions: ["*"] },
      ],
    })

    if (!result.canceled && result.filePath) {
      const output = fs.createWriteStream(result.filePath)
      const archive = archiver("zip", { zlib: { level: 9 } })

      return new Promise((resolve, reject) => {
        output.on("close", () => {
          resolve({ success: true, message: `${archive.pointer()} bytes written to ${result.filePath}` })
        })

        archive.on("error", (err) => {
          reject({ success: false, message: err.message })
        })

        archive.pipe(output)

        // Add files to archive
        filePaths.forEach(({ path: filePath, name }) => {
          if (fs.existsSync(filePath)) {
            archive.file(filePath, { name })
          }
        })

        archive.finalize()
      })
    }

    return { success: false, message: "Download cancelled" }
  } catch (error) {
    console.error("Error creating ZIP:", error)
    return { success: false, message: error.message }
  }
})

// Get log file content as base64
ipcMain.handle("get-log-file-base64", async (event, filePath, fileName) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }

    const fileContent = fs.readFileSync(filePath)
    const base64Content = fileContent.toString("base64")

    return {
      success: true,
      data: {
        "image Type": fileName,
        "mime type": "text/plain",
        base64: base64Content,
      },
    }
  } catch (error) {
    console.error("Error reading file as base64:", error)
    return { success: false, message: error.message }
  }
})

ipcMain.handle("getVersionJsonDetails", async () => {
  try {
    console.log("Fetching mail receiver details from:", VERSION_JSON_URL)
    const response = await fetch(VERSION_JSON_URL)

    if (!response.ok) {
      throw new Error(`Failed to fetch version.json: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      success: true,
      mail_receiver_name: data.mail_receiver_name || "Operations Team",
      superAdmin_access_machine_password: data.superAdmin_access_machine_password || "",
    }
  } catch (error) {
    console.error("Error fetching mail receiver details:", error)
    return {
      success: false,
      error: error.message,
      mail_receiver_name: "Operations Team",
      superAdmin_access_machine_password: "",
    }
  }
})

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}


function startBackend() {
  let backendPath
  let pythonCmd

  if (isDev) {
    backendPath = path.join(__dirname, "../vm-backend/api.py")
    pythonCmd = process.platform === "win32" ? "python" : "python3"
  } else {
    // Production build - try multiple possible paths
    const possiblePaths = [
      path.join(process.resourcesPath, "vm-backend","api.py"),
      path.join(process.resourcesPath, "app", "vm-backend","api.py"),
      path.join(__dirname, "../vm-backend/api.py"),
      path.join(app.getAppPath(), "vm-backend","api.py"),
    ]

    backendPath = possiblePaths.find((p) => fs.existsSync(p))

    if (!backendPath) {
      console.error("🚨 Python backend not found in any expected location:")
      possiblePaths.forEach((p) => console.error(`  - ${p}`))
      return
    }

    // Try different Python commands for production
    const pythonCommands = ["python", "python3", "py"]
    pythonCmd = pythonCommands[0] // Default to first, will validate below
  }

  console.log("🐍 Starting Python backend:", backendPath)
  console.log("🐍 Using Python command:", pythonCmd)
  console.log("🐍 Working directory:", process.cwd())
  console.log("🐍 Resources path:", process.resourcesPath)

  // Validate Python installation
  exec(`${pythonCmd} --version`, (error, stdout, stderr) => {
    if (error) {
      console.error("🚨 Python validation failed:", error.message)
      // Try alternative Python commands in production
      if (!isDev) {
        const altCommands = ["python3", "py", "python"]
        for (const cmd of altCommands) {
          if (cmd !== pythonCmd) {
            console.log(`🐍 Trying alternative Python command: ${cmd}`)
            startPythonProcess(cmd, backendPath)
            return
          }
        }
      }
    } else {
      console.log("🐍 Python version:", stdout.trim())
      startPythonProcess(pythonCmd, backendPath)
    }
  })
}

function startPythonProcess(pythonCmd, backendPath) {
  pythonProcess = spawn(pythonCmd, [backendPath], {
    detached: false,
    stdio: ["pipe", "pipe", "pipe"],
    cwd: path.dirname(backendPath), // Set working directory to backend folder
    env: { ...process.env, PYTHONPATH: path.dirname(backendPath) },
  })

  pythonProcess.stdout.on("data", (data) => {
    console.log(`🐍 Python stdout: ${data.toString().trim()}`)
  })

  pythonProcess.stderr.on("data", (data) => {
    const errorMsg = data.toString().trim()
    console.error(`🐍 Python stderr: ${errorMsg}`)

    if (errorMsg.includes("No such file") || errorMsg.includes("not recognized")) {
      console.error("🚨 Python script not found or Python is not installed properly.")
    } else if (errorMsg.includes("ModuleNotFoundError")) {
      console.error("🚨 Python module missing. Please install required dependencies.")
    } else if (errorMsg.includes("Permission denied")) {
      console.error("🚨 Permission denied accessing Python script.")
    }
  })

  pythonProcess.on("close", (code) => {
    console.log(`🐍 Python backend exited with code ${code}`)
    pythonProcess = null

    // Attempt restart if exit was unexpected (not during shutdown)
    if (code !== 0 && mainWindow && !mainWindow.isDestroyed()) {
      console.log("🔄 Attempting to restart Python backend in 5 seconds...")
      setTimeout(() => {
        if (!pythonProcess) {
          startBackend()
        }
      }, 5000)
    }
  })

  pythonProcess.on("error", (error) => {
    console.error("🚨 Failed to start Python backend:", error.message)
    pythonProcess = null
  })

  // Test backend connection after startup
  setTimeout(() => {
    testBackendConnection()
  }, 3000)
}

function testBackendConnection() {
  const http = require("http")
  const options = {
    hostname: "localhost",
    port: 5000, // Adjust if your backend uses a different port
    path: "/health", // Add a health check endpoint to your Python API
    method: "GET",
    timeout: 5000,
  }

  const req = http.request(options, (res) => {
    console.log(`🐍 Backend health check: ${res.statusCode}`)
    if (res.statusCode === 200) {
      console.log("✅ Python backend is running and accessible")
    }
  })

  req.on("error", (error) => {
    console.error("🚨 Backend connection test failed:", error.message)
  })

  req.on("timeout", () => {
    console.error("🚨 Backend connection test timed out")
    req.destroy()
  })

  req.end()
}

function gracefulShutdown() {
  console.log("🔄 Starting graceful shutdown...")

  // Close log stream
  if (logStream) {
    logStream.end()
    logStream = null
  }

  // Kill Python process if it exists
  if (pythonProcess && !pythonProcess.killed) {
    console.log("🐍 Terminating Python backend...")
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", pythonProcess.pid, "/f", "/t"])
      } else {
        pythonProcess.kill("SIGTERM")
      }
    } catch (error) {
      console.error("🚨 Error killing Python process:", error)
    }
    pythonProcess = null
  }

  // Close main window if it exists
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log("🪟 Closing main window...")
    mainWindow.close()
    mainWindow = null
  }

  console.log("✅ Graceful shutdown complete")
}

app.whenReady().then(() => {
  console.log("🚀 Electron app ready")
  setupLogging()
  createWindow()
  startBackend()
  startExpressApp();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  });
    ipcMain.handle("get-mac-address", async () => {
    try {
      const mac = await macaddress.one();
      const cleanMac = mac.replace(/[^A-Fa-f0-9]/g, "").toUpperCase();
      console.log("System MAC Address:", cleanMac);
      return cleanMac;
    } catch (err) {
      console.error("Error getting MAC address:", err);
      return null; 
    }
  });
  
});

app.on("window-all-closed", () => {
  console.log("🪟 All windows closed")
  gracefulShutdown()
  app.quit()
})

app.on("before-quit", (event) => {
  console.log("🔄 App before-quit event")
  gracefulShutdown()
})

app.on("will-quit", (event) => {
  console.log("🔄 App will-quit event")
})

app.on("quit", () => {
  console.log("✅ App quit event")
})

// Handle IPC messages from renderer
ipcMain.on("app-quit", (event) => {
  console.log("📦 Received app-quit signal from renderer")

  // Send acknowledgment back to renderer
  if (event.sender && !event.sender.isDestroyed()) {
    event.sender.send("app-quit-acknowledged")
  }

  // Force quit after a short delay to ensure cleanup
  setTimeout(() => {
    console.log("🔄 Force quitting application...")
    gracefulShutdown()
    app.quit()

    // If app.quit() doesn't work, force exit
    setTimeout(() => {
      console.log("🚨 Force exiting process...")
      process.exit(0)
    }, 1000)
  }, 500)
})

// Handle force quit request
ipcMain.on("app-force-quit", (event) => {
  console.log("🚨 Received app-force-quit signal from renderer")

  gracefulShutdown()

  // Immediate force quit
  setTimeout(() => {
    process.exit(0)
  }, 100)
})

// Handle app status requests
ipcMain.handle("app-get-status", () => {
  return {
    isElectron: true,
    isDev: isDev,
    platform: process.platform,
    version: app.getVersion(),
  }
})

// Handle shutdown request
ipcMain.handle("app-shutdown", () => {
  console.log("🔌 Shutdown requested from renderer")

  return new Promise((resolve, reject) => {
    try {
      const platform = process.platform
      let command = ""

      switch (platform) {
        case "win32": // Windows
          command = "shutdown /s /t 0"
          break
        case "darwin": // macOS
          command = "osascript -e 'tell app \"System Events\" to shut down'"
          break
        case "linux": // Linux
          command = "shutdown now"
          break
        default:
          reject(new Error(`Unsupported platform: ${platform}`))
          return
      }

      console.log(`🔌 Executing shutdown command: ${command}`)
      exec(command, (error) => {
        if (error) {
          console.error("🚨 Shutdown command failed:", error)
          reject(error)
        } else {
          console.log("✅ Shutdown command executed successfully")
          resolve(true)
        }
      })
    } catch (error) {
      console.error("🚨 Error executing shutdown command:", error)
      reject(error)
    }
  })
})

// Handle restart request
ipcMain.handle("app-restart", () => {
  console.log("🔄 Restart requested from renderer")

  return new Promise((resolve, reject) => {
    try {
      const platform = process.platform
      let command = ""

      switch (platform) {
        case "win32": // Windows
          command = "shutdown /r /t 0"
          break
        case "darwin": // macOS
          command = "osascript -e 'tell app \"System Events\" to restart'"
          break
        case "linux": // Linux
          command = "shutdown -r now"
          break
        default:
          reject(new Error(`Unsupported platform: ${platform}`))
          return
      }

      console.log(`🔄 Executing restart command: ${command}`)
      exec(command, (error) => {
        if (error) {
          console.error("🚨 Restart command failed:", error)
          reject(error)
        } else {
          console.log("✅ Restart command executed successfully")
          resolve(true)
        }
      })
    } catch (error) {
      console.error("🚨 Error executing restart command:", error)
      reject(error)
    }
  })
})

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  console.log("🚨 Another instance is already running. Quitting...")
  app.quit()
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("🚨 Uncaught Exception:", error)
  gracefulShutdown()
  process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason)
})
