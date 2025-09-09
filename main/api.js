const path = require("path")
const express = require("express")
const fs = require("fs")
const archiver = require("archiver")
const cors = require("cors")
const { getSavedMachineId } = require("./machine")

async function startExpressApp() {
  const isDev = (await import("electron-is-dev")).default
  const app = express()

  const logDir = isDev
    ? path.join(__dirname, "../logs")
    : path.join(process.resourcesPath, "logs")

  app.use(cors()) 
  app.use(express.urlencoded({ extended: true }))
  app.use(express.json())

  // Get Machine Log
  app.post("/get/machine/logs", async (req, res) => {
  try {
    const { MACHINE_ID, FROM_DATE, TO_DATE } = req.body

    if (!MACHINE_ID || !FROM_DATE || !TO_DATE) {
      return res.status(400).json({ success: false, message: "Missing required fields." })
    }

    const actualMachineId = getSavedMachineId()
    if (MACHINE_ID !== actualMachineId) {
      return res.status(403).json({ success: false, message: "Machine ID mismatch." })
    }

    const from = new Date(FROM_DATE)
    const to = new Date(TO_DATE)
    to.setDate(to.getDate() + 1)

    const logFiles = []
    fs.readdirSync(logDir).forEach((file) => {
      const match = file.match(/^log-(\d{4}-\d{2}-\d{2})\.txt$/)
      if (match) {
        const fileDate = new Date(match[1])
        if (fileDate >= from && fileDate < to) {
          const filePath = path.join(logDir, file)
          const stats = fs.statSync(filePath)
          logFiles.push({
            name: file,
            path: filePath,
            size: stats.size,
            modified: stats.mtime,
          })
        }
      }
    })

    res.status(200).json({ success: true, logs: logFiles })
  } catch (err) {
    console.error("Error listing logs:", err)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
})

  // Download Log File
  app.post("/download/log", async (req, res) => {
    try {
      const { MACHINE_ID, LOG_NAME } = req.body

      if (!MACHINE_ID || !LOG_NAME) {
        return res.status(400).json({ success: false, message: "Missing required fields." })
      }

      const actualMachineId = getSavedMachineId()
      if (MACHINE_ID !== actualMachineId) {
        return res.status(403).json({ success: false, message: "Machine ID mismatch." })
      }

      const logPath = path.join(logDir, LOG_NAME)

      if (!fs.existsSync(logPath)) {
        return res.status(404).json({ success: false, message: "Log file not found." })
      }

      res.setHeader("Content-Type", "application/zip")
      res.setHeader("Content-Disposition", `attachment; filename=${LOG_NAME.replace('.txt', '')}.zip`)

      const archive = archiver("zip", { zlib: { level: 9 } })
      archive.pipe(res)
      archive.file(logPath, { name: LOG_NAME })
      archive.finalize()
    } catch (err) {
      console.error("Error downloading single log:", err)
      res.status(500).json({ success: false, message: "Internal server error" })
    }
  })

// Download Multiple Log File
 app.post("/download/mulitple/logs", async (req, res) => {
  try {
    const { MACHINE_ID, ALL_LOG_NAMES } = req.body

    if (!MACHINE_ID || !Array.isArray(ALL_LOG_NAMES) || ALL_LOG_NAMES.length === 0) {
      return res.status(400).json({ success: false, message: "Missing or invalid fields." })
    }

    const actualMachineId = getSavedMachineId()
    if (MACHINE_ID !== actualMachineId) {
      return res.status(403).json({ success: false, message: "Machine ID mismatch." })
    }

    // Resolve full file paths from file names
    const filesToZip = ALL_LOG_NAMES.map((fileName) => path.join(logDir, fileName))
                                     .filter((filePath) => fs.existsSync(filePath))

    if (filesToZip.length === 0) {
      return res.status(404).json({ success: false, message: "No valid log files found." })
    }

    res.setHeader("Content-Type", "application/zip")
    res.setHeader("Content-Disposition", `attachment; filename=selected-logs.zip`)

    const archive = archiver("zip", { zlib: { level: 9 } })
    archive.pipe(res)

    for (const file of filesToZip) {
      archive.file(file, { name: path.basename(file) }) // use just filename in zip
    }

    archive.finalize()
  } catch (err) {
    console.error("Error downloading multiple logs:", err)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
 })

  const PORT = 3050
  app.listen(PORT, () => {
    console.log(`Log app running on http://localhost:${PORT}`)
  })
}

startExpressApp()

module.exports = startExpressApp
