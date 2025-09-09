"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Close } from "@mui/icons-material"
import { Box, CircularProgress, Alert } from "@mui/material"
import { toast } from 'react-toastify'
// import reportApi from "../../services/reportApi" // API call is disabled for testing
import "./ReportPage.css"
import logo from "../../assets/images/logo.webp"
import Header from "../../components/UI/Header/Header"

// --- MOCK DATA FOR TESTING ---
const createMockReportData = () => {
  return {
    total_sales: 1250.50,
    total_paid: 1200.00,
    total_refunded: 50.50,
    data: [
      { id: 1, transaction_time: "2023-10-27T10:05:00Z", product_name: "Test Soda", quantity: 1, amount: 50.00, is_paid: true, is_refunded: false, refunded_amount: 0.0 },
      { id: 2, transaction_time: "2023-10-27T11:15:23Z", product_name: "Test Chips", quantity: 2, amount: 100.00, is_paid: true, is_refunded: false, refunded_amount: 0.0 },
      { id: 3, transaction_time: "2023-10-27T12:30:10Z", product_name: "Failed Vend", quantity: 1, amount: 50.50, is_paid: true, is_refunded: true, refunded_amount: 50.50 },
      { id: 4, transaction_time: "2023-10-27T14:00:00Z", product_name: "Test Water", quantity: 5, amount: 1050.00, is_paid: true, is_refunded: false, refunded_amount: 0.0 },
    ]
  };
};

export default function ReportPage() {
  const navigate = useNavigate();
  const [showLiveReportPopup, setShowLiveReportPopup] = useState(false);
  const [showDownloadReportPopup, setShowDownloadReportPopup] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const getMachineGuid = () => localStorage.getItem("machine_id") || "TEST-MACHINE-001";
  const getCurrentDate = () => new Date().toISOString().split("T")[0];

  // Fetches today's report for the "Live" view - MODIFIED FOR TESTING
  const handleLiveReport = async () => {
    setShowLiveReportPopup(true);
    setIsLoading(true);
    setError(null);
    setReportData(null);
    
    // Simulate API delay
    setTimeout(() => {
      const mockData = createMockReportData();
      setReportData(mockData);
      setIsLoading(false);
    }, 1000); // 1 second delay
  };

  // Opens the download popup and resets fields
  const handleDownloadReport = () => {
    setShowDownloadReportPopup(true);
    setError(null);
    setFromDate("");
    setToDate("");
  };

  // Helper function to generate a CSV from data
  const downloadCsv = (data, from, to) => {
    let csvContent = `Sales Report\n`;
    csvContent += `Machine ID: ${getMachineGuid()}\n`;
    csvContent += `Period: ${from} to ${to}\n\n`;
    
    csvContent += `Total Sales,₹${data.total_sales}\n`;
    csvContent += `Total Paid,₹${data.total_paid}\n`;
    csvContent += `Total Refunded,₹${data.total_refunded}\n\n`;
    
    csvContent += `Transaction Time,Product Name,Quantity,Amount,Paid,Refunded,Refunded Amount\n`;
    
    data.data.forEach(r => {
      csvContent += `"${r.transaction_time}","${r.product_name}",${r.quantity},${r.amount},${r.is_paid},${r.is_refunded},${r.refunded_amount}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${from}-to-${to}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  // Fetches data and then downloads it - MODIFIED FOR TESTING
  const handleGenerateAndDownload = async () => {
    if (!fromDate || !toDate) {
      return toast.error("Please select both 'From' and 'To' dates.");
    }
    
    setIsLoading(true);
    setError(null);
    
    // Simulate API delay
    setTimeout(() => {
      const mockData = createMockReportData();
      downloadCsv(mockData, fromDate, toDate);
      toast.success("Test report downloaded successfully!");
      closeAllPopups();
      setIsLoading(false);
    }, 1500); // 1.5 second delay
  };

  const handleEmailReport = () => {
    toast.info("Email functionality is not yet implemented.");
  };

  const closeAllPopups = () => {
    setShowLiveReportPopup(false);
    setShowDownloadReportPopup(false);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="report-page-redesign">
      <Header/>

      <main className="report-main">
        <div className="action-buttons-container">
          <motion.button className="action-btn live-report-btn" onClick={handleLiveReport}>Live Report</motion.button>
          <motion.button className="action-btn download-report-btn" onClick={handleDownloadReport}>Download Report</motion.button>
        </div>
      </main>

      <footer className="report-footer">
        <motion.button className="back-btn" onClick={() => navigate("/operator")}>Back</motion.button>
      </footer>

      {/* Live Report Popup */}
      <AnimatePresence>
        {showLiveReportPopup && (
          <motion.div className="popup-overlay" onClick={closeAllPopups} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="popup-container live-report-popup" onClick={(e) => e.stopPropagation()} initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}>
              <div className="popup-header"><h3>Today's Report</h3><button onClick={closeAllPopups} className="close-btn"><Close /></button></div>
              <div className="live-report-content">
                {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>}
                {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
                {reportData && (
                  <div className="report-data-display">
                    <div className="summary-grid">
                      <div className="summary-item"><strong>Total Sales:</strong><span>₹{reportData.total_sales}</span></div>
                      <div className="summary-item"><strong>Paid:</strong><span>₹{reportData.total_paid}</span></div>
                      <div className="summary-item"><strong>Refunded:</strong><span>₹{reportData.total_refunded}</span></div>
                    </div>
                    <h4>Transactions ({reportData.data.length})</h4>
                    <div className="transaction-list">
                      {reportData.data.length > 0 ? (
                        reportData.data.map(r => (
                          <div className="transaction-item" key={r.id}>
                            <span>{r.product_name}</span>
                            <span>₹{r.amount}</span>
                            <span>{new Date(r.transaction_time).toLocaleTimeString()}</span>
                          </div>
                        ))
                      ) : (<p>No transactions for today yet.</p>)}
                    </div>
                    <div className="popup-buttons">
                      <button className="popup-action-btn download-btn" onClick={() => downloadCsv(reportData, getCurrentDate(), getCurrentDate())}>Download</button>
                      <button className="popup-action-btn email-btn" onClick={handleEmailReport}>Email</button>
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
          <motion.div className="popup-overlay" onClick={closeAllPopups} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="popup-container download-report-popup" onClick={(e) => e.stopPropagation()} initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }}>
              <div className="popup-header"><h3 className="popup-title">Select Date Range</h3><button onClick={closeAllPopups} className="close-btn"><Close /></button></div>
              <div className="popup-content">
                <div className="date-fields">
                  <div className="date-field"><label className="date-label">From:</label><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="date-input" max={getCurrentDate()} /></div>
                  <div className="date-field"><label className="date-label">To:</label><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="date-input" max={getCurrentDate()} min={fromDate} /></div>
                </div>
                {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
                {error && <Alert severity="error" sx={{ my: 1 }}>{error}</Alert>}
                <div className="popup-buttons">
                  <button className="popup-action-btn download-full-btn" onClick={handleGenerateAndDownload} disabled={isLoading}>{isLoading ? "Generating..." : "DOWNLOAD"}</button>
                  <button className="popup-action-btn email-full-btn" onClick={handleEmailReport} disabled={isLoading}>Email Report</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}