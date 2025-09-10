"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Close } from "@mui/icons-material"
import { Box, CircularProgress, Alert } from "@mui/material"
import { toast } from 'react-toastify'
import reportApi from "../../services/reportApi"
import "./ReportPage.css"
import Header from "../../components/UI/Header/Header"

export default function ReportPage() {
  const navigate = useNavigate()
  const [showLiveReportPopup, setShowLiveReportPopup] = useState(false)
  const [showDownloadReportPopup, setShowDownloadReportPopup] = useState(false)
  const [fromDateTime, setFromDateTime] = useState("")
  const [toDateTime, setToDateTime] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reportData, setReportData] = useState(null)

  const getMachineGuid = () => localStorage.getItem("machine_id") || "TEST-MACHINE-001"

  // Format datetime for API and display
  const formatDateTime = (date) => {
    return date ? new Date(date).toISOString().slice(0, 16) : ""
  }

  // Get last 24 hours range
  const getLast24HoursRange = () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    return {
      from: formatDateTime(yesterday),
      to: formatDateTime(now)
    }
  }

  // Fetches last 24 hours report for Live view
  const handleLiveReport = async () => {
    setShowLiveReportPopup(true)
    setIsLoading(true)
    setError(null)
    setReportData(null)

    try {
      const response = await reportApi.getreport()
      // Filter for last 24 hours
      const { from, to } = getLast24HoursRange()
      const filteredData = {
        data: response.data.filter(item => {
          const transactionTime = new Date(item.transaction_time)
          return transactionTime >= new Date(from) && transactionTime <= new Date(to)
        })
      }
      setReportData(filteredData)
      setIsLoading(false)
    } catch (error) {
      setError("Failed to fetch report data")
      setIsLoading(false)
      toast.error("Failed to fetch live report")
    }
  }

  // Opens the download popup
  const handleDownloadReport = () => {
    setShowDownloadReportPopup(true)
    setError(null)
    setFromDateTime("")
    setToDateTime("")
  }

  // Generate CSV file
  const downloadCsv = (data, from, to) => {
    let csvContent = `Sales Report\n`
    csvContent += `Machine ID: ${getMachineGuid()}\n`
    csvContent += `Period: ${new Date(from).toLocaleString()} to ${new Date(to).toLocaleString()}\n\n`
    
    csvContent += `Transaction Time,Product Name,Quantity,Amount,Paid,Refunded,Refunded Amount\n`
    
    data.data.forEach(r => {
      csvContent += `"${new Date(r.transaction_time).toLocaleString()}","${r.product_name}",${r.quantity},${r.amount.toFixed(2)},${r.is_paid},${r.is_refunded},${r.refunded_amount.toFixed(2)}\n`
    })

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `report-${from.slice(0, 10)}-to-${to.slice(0, 10)}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Fetches and downloads report for selected date range
  const handleGenerateAndDownload = async () => {
    if (!fromDateTime || !toDateTime) {
      toast.error("Please select both 'From' and 'To' dates and times")
      return
    }

    if (new Date(fromDateTime) > new Date(toDateTime)) {
      toast.error("'To' date/time must be after 'From' date/time")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await reportApi.getreport()
      // Filter by selected date range
      const filteredData = {
        data: response.data.filter(item => {
          const transactionTime = new Date(item.transaction_time)
          return transactionTime >= new Date(fromDateTime) && transactionTime <= new Date(toDateTime)
        })
      }

      if (filteredData.data.length === 0) {
        toast.error("No transactions found for the selected date range")
        setIsLoading(false)
        return
      }

      downloadCsv(filteredData, fromDateTime, toDateTime)
      toast.success("Report downloaded successfully!")
      closeAllPopups()
      setIsLoading(false)
    } catch (error) {
      setError("Failed to fetch report data")
      setIsLoading(false)
      toast.error("Failed to download report")
    }
  }

  const handleEmailReport = () => {
    toast.info("Email functionality is not yet implemented.")
  }

  const closeAllPopups = () => {
    setShowLiveReportPopup(false)
    setShowDownloadReportPopup(false)
    setError(null)
    setIsLoading(false)
  }

  return (
    <div className="report-page-redesign">
      <Header />

      <main className="report-main">
        <div className="action-buttons-container">
          <motion.button 
            className="action-btn live-report-btn" 
            onClick={handleLiveReport}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Live Report (Last 24 Hours)
          </motion.button>
          <motion.button 
            className="action-btn download-report-btn" 
            onClick={handleDownloadReport}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Download Report
          </motion.button>
        </div>
      </main>

      <footer className="report-footer">
        <motion.button 
          className="back-btn" 
          onClick={() => navigate("/operator")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back
        </motion.button>
      </footer>

      {/* Live Report Popup */}
      <AnimatePresence>
        {showLiveReportPopup && (
          <motion.div 
            className="popup-overlay" 
            onClick={closeAllPopups} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="popup-container live-report-popup" 
              onClick={(e) => e.stopPropagation()} 
              initial={{ x: 100, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: 100, opacity: 0 }}
            >
              <div className="popup-header">
                <h3>Last 24 Hours Report</h3>
                <button onClick={closeAllPopups} className="close-btn">
                  <Close />
                </button>
              </div>
              <div className="live-report-content">
                {isLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                  </Box>
                )}
                {error && (
                  <Alert severity="error" sx={{ my: 2 }}>
                    {error}
                  </Alert>
                )}
                {reportData && (
                  <div className="report-data-display">
                    <h4>Transactions ({reportData.data.length})</h4>
                    <div className="transaction-list">
                      {reportData.data.length > 0 ? (
                        reportData.data.map(r => (
                          <div className="transaction-item" key={r.id}>
                            <span>{new Date(r.transaction_time).toLocaleString()}</span>
                            <span>{r.product_name}</span>
                            <span>Qty: {r.quantity}</span>
                            <span>₹{r.amount.toFixed(2)}</span>
                            <span>{r.is_paid ? 'Paid' : 'Not Paid'}</span>
                            <span>{r.is_refunded ? `Refunded (₹${r.refunded_amount.toFixed(2)})` : 'Not Refunded'}</span>
                          </div>
                        ))
                      ) : (
                        <p>No transactions in the last 24 hours.</p>
                      )}
                    </div>
                    <div className="popup-buttons">
                      <button 
                        className="popup-action-btn download-btn" 
                        onClick={() => downloadCsv(reportData, getLast24HoursRange().from, getLast24HoursRange().to)}
                      >
                        Download
                      </button>
                      <button 
                        className="popup-action-btn email-btn" 
                        onClick={handleEmailReport}
                      >
                        Email
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download Report Popup */}
      <AnimatePresence>
        {showDownloadReportPopup && (
          <motion.div 
            className="popup-overlay" 
            onClick={closeAllPopups} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="popup-container download-report-popup" 
              onClick={(e) => e.stopPropagation()} 
              initial={{ x: -100, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -100, opacity: 0 }}
            >
              <div className="popup-header">
                <h3 className="popup-title">Select Date Range</h3>
                <button onClick={closeAllPopups} className="close-btn">
                  <Close />
                </button>
              </div>
              <div className="popup-content">
                <div className="date-fields">
                  <div className="date-field">
                    <label className="date-label">From:</label>
                    <input 
                      type="datetime-local" 
                      value={fromDateTime} 
                      onChange={(e) => setFromDateTime(e.target.value)} 
                      className="date-input" 
                      max={formatDateTime(new Date())}
                    />
                  </div>
                  <div className="date-field">
                    <label className="date-label">To:</label>
                    <input 
                      type="datetime-local" 
                      value={toDateTime} 
                      onChange={(e) => setToDateTime(e.target.value)} 
                      className="date-input" 
                      max={formatDateTime(new Date())} 
                      min={fromDateTime}
                    />
                  </div>
                </div>
                {isLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress />
                  </Box>
                )}
                {error && (
                  <Alert severity="error" sx={{ my: 1 }}>
                    {error}
                  </Alert>
                )}
                <div className="popup-buttons">
                  <button 
                    className="popup-action-btn download-full-btn" 
                    onClick={handleGenerateAndDownload} 
                    disabled={isLoading}
                  >
                    {isLoading ? "Generating..." : "DOWNLOAD"}
                  </button>
                  <button 
                    className="popup-action-btn email-full-btn" 
                    onClick={handleEmailReport} 
                    disabled={isLoading}
                  >
                    Email Report
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}