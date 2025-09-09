// src/pages/TopupPayingPage/TopupPayingPage.jsx

"use client";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { CircularProgress } from '@mui/material';

// API services
import qrgeneratorApi from "../../services/qrgeneratorApi";
// IMPORTANT: You need an API service for your account updates.
// Let's assume you have a file like this based on your snippet.
import rfidregisterApi from "../../services/rfidregisterApi";

// CSS and Assets
import "./TopupPayingPage.css";
import logo from "../../assets/images/logo.webp";
import gpay from "../../assets/images/gpay.webp";
import phonepe from "../../assets/images/phonepe.webp";
import paytm from "../../assets/images/paytm.webp";
import pinelabs from "../../assets/images/pinelabs.webp";
import Header from "../../components/UI/Header/Header";

// Helper functions (unchanged)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};
const formatAppName = (app) => {
  const appNames = { gpay: "Google Pay", phonepe: "PhonePe", paytm: "Paytm", pinelabs: "Pine Labs" };
  return appNames[app] || app.charAt(0).toUpperCase() + app.slice(1);
};
const appLogos = { gpay, phonepe, paytm, pinelabs };


export default function TopupPayingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // --- CHANGE 1: Receiving state for Top-up ---
  // We now expect 'topupAmount' and 'rfid' instead of product details.
  const { topupAmount, rfid } = location.state || {};
  
  const [paymentStatus, setPaymentStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(178);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [displayTransactionId, setDisplayTransactionId] = useState("");
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Main useEffect to handle the entire payment lifecycle
  useEffect(() => {
    let pollingInterval;
    let pollingTimeout;

    // --- CHANGE 2: The Core Logic After Successful Payment ---
    // This function is now responsible for updating the account balance.
    const handlePostPayment = async (finalProviderTransactionId) => {
      if (!finalProviderTransactionId) {
        setError("A problem occurred while finalizing the payment. Please contact support.");
        setPaymentStatus("failed");
        return;
      }
      
      // Safety check: ensure we have the necessary info for top-up
      if (!rfid || !topupAmount) {
         console.error("CRITICAL: Missing RFID or topupAmount after successful payment.");
         setError("Could not update balance due to missing account info. Please contact support.");
         setPaymentStatus("failed");
         return;
      }

      try {
        // Prepare payload for your updateaccount API
        // This assumes your API expects the amount to be added.
        const payload = {
            balance: topupAmount 
            // or { amount: topupAmount } depending on your backend API design
        };

        console.log(`Updating account for RFID: ${rfid} with payload:`, payload);
        
        // Call your new API endpoint to update the balance
        await rfidregisterApi.updateaccount(rfid, payload);
        
        console.log("SUCCESS: Account balance updated successfully.");

        // After updating the balance, navigate the user away.
        // For example, navigate to the home page or an account summary page.
        setTimeout(() => {
          navigate("/scanning-page", { replace: true }); 
        }, 2000); // Wait 2 seconds for the user to see the success message

      } catch (err) {
          console.error("CRITICAL: Payment was successful, but FAILED TO UPDATE BALANCE:", err);
          setError(`Payment successful, but failed to update balance. Please contact support. Ref ID: ${finalProviderTransactionId}`);
          setPaymentStatus("failed");
      }
    };

    const initiateAndPollPayment = async () => {
      // --- CHANGE 3: Guard clause for Top-up data ---
      if (!topupAmount || !rfid) {
        console.error("Missing topupAmount or rfid. Navigating back.");
        navigate(-1, { replace: true }); // Go back to the previous page
        return;
      }
      setPaymentStatus("loading");
      setError(null);
      setCountdown(178);

      try {
        const order_number = localStorage.getItem("order_number") || `ORD-${Date.now()}`;
        const machine_id = localStorage.getItem("machine_id");
        if (!machine_id) throw new Error("Session data (machine ID) is missing.");

        const paymentAttemptId = `TOPUP-${rfid}-${Date.now()}`;
        
        const payload = {
          order_number: paymentAttemptId,
          // --- CHANGE 4: Use topupAmount for QR generation ---
          amount: topupAmount,
          machine_id: machine_id,
        };

        const qrResponse = await qrgeneratorApi.generateQr(payload);
        if (!qrResponse.success || !qrResponse.upi_string) {
          throw new Error(qrResponse.message || "Failed to generate QR.");
        }
        
        setDisplayTransactionId(qrResponse.transaction_id);
        
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrResponse.upi_string)}`;
        setQrCodeUrl(qrUrl);
        setPaymentStatus("pending");

        // Polling logic remains the same, as it's independent of the post-payment action.
        const checkStatus = async () => {
          try {
            const statusResponse = await qrgeneratorApi.checkPaymentStatus(paymentAttemptId);

            if (statusResponse.success && statusResponse.status === "SUCCESS") {
              setPaymentStatus("success");
              // This now calls our new top-up focused handler
              handlePostPayment(statusResponse.provider_transaction_id); 
              return true; // Stop polling
            }

            if (statusResponse.status === "FAILED") {
              setError("Payment was declined or failed. Please try again.");
              setPaymentStatus("failed");
              return true; // Stop polling
            }
            return false;
          } catch (err) {
            console.error("Status check network error, will retry:", err);
            return false;
          }
        };

        pollingInterval = setInterval(async () => {
          const shouldStop = await checkStatus();
          if (shouldStop) {
            clearInterval(pollingInterval);
            if (pollingTimeout) clearTimeout(pollingTimeout);
          }
        }, 4000);

        pollingTimeout = setTimeout(() => {
          if (document.hidden) return;
          clearInterval(pollingInterval);
          setError("Payment confirmation timed out. Please try again.");
          setPaymentStatus("failed");
        }, 170000);

      } catch (err) {
        setError(err.message);
        setPaymentStatus("failed");
      }
    };

    initiateAndPollPayment();

    return () => {
      clearInterval(pollingInterval);
      clearTimeout(pollingTimeout);
    };
  }, [retryTrigger, navigate, topupAmount, rfid]); // Dependencies updated
  
  // Countdown timer useEffect remains the same
  useEffect(() => {
    if (paymentStatus !== "pending") return;
    const timer = setInterval(() => setCountdown((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [paymentStatus]);

  // --- CHANGE 5: Updated Cancel Handler ---
  const handleCancel = () => navigate(-1); // Simply go back to the previous page
  const handleRetry = () => setRetryTrigger(c => c + 1);

  // The JSX for loading and failed states is generic and can remain unchanged.
  if (paymentStatus === "failed") {
    return (
        <div className="paying-page-new-upi payment-failed-container-upi">
          <main className="content-section-upi">
            <motion.div 
              className="payment-failed-card-upi"
              initial={{ y: -30, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <div className="failed-animation-container-upi">
                <DotLottieReact 
                  src="https://lottie.host/7623910b-b892-4919-9c3c-39a04a5a542b/lU9y52BYsB.json" 
                  loop={false} 
                  autoplay 
                />
              </div>
              <h2 className="failed-title-upi">Payment Failed</h2>
              <p className="failed-message-upi">{error || "An unknown error occurred."}</p>
            </motion.div>
          </main>
          <footer className="failed-footer-upi">
            <button className="failed-action-btn-upi" onClick={handleCancel}>Go Back</button>
            <button className="failed-action-btn-upi primary-upi" onClick={handleRetry}>Retry Payment</button>
          </footer>
        </div>
      );
  }

  // The main JSX rendering
  return (
    <div className="paying-page-new-upi">
      <div className={`success-overlay-upi ${paymentStatus === "success" ? "visible-upi" : ""}`}>
        {paymentStatus === "success" && (
          <div className="success-animation-upi">
            <DotLottieReact src="https://lottie.host/e86f1ca1-0286-47ed-8913-8c31b6f9f104/Y7zENLsP3x.lottie" loop={false} autoplay />
          </div>
        )}
        {/* --- CHANGE 6: Updated Success Text --- */}
        <p className="success-text-upi">Top-up Successful! Check your balance</p>
      </div>

      <Header isHidden={paymentStatus === "success"} />
      <main className="content-section-upi">
        <motion.div className="payment-card-upi" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="amount-area-upi">
            <div className="amount-label-upi">Amount to Top-up</div>
            {/* --- CHANGE 7: Display topupAmount --- */}
            <div className="amount-value-upi">₹{topupAmount?.toFixed(2)}</div>
          </div>
          <div className="timer-area-upi">
            <div className="timer-label-upi">TIME REMAINING</div>
            <div className={`timer-value-upi ${countdown <= 30 ? "timer-warning" : ""}`}>{formatTime(countdown)}</div>
          </div>
          <div className="qr-area-upi">
            <div className="qr-container-upi">
              {qrCodeUrl ? <img src={qrCodeUrl} alt="Scan to pay" className="qr-code-image-upi" /> : <div className="qr-loading">{paymentStatus && <span className="d-flex flex-column align-items-center justify-content-center"><CircularProgress style={{color:"#75d857"}} className="mb-2"/>Generating QR...</span>}</div>}
            </div>
            <div className="qr-text-upi">Scan to Pay with any UPI App</div>
            {displayTransactionId && <div className="transaction-id-upi">Ref ID: {displayTransactionId}</div>}
          </div>
          <div className="apps-area-upi">
            {["gpay", "phonepe", "paytm", "pinelabs"].map((app) => (
              <div key={app} className="app-item-upi">
                <img src={appLogos[app]} alt={formatAppName(app)} className="app-icon-upi" />
                <span className="app-name-upi">{formatAppName(app)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
      <footer className="button-section-upi">
        <button className="action-btn-upi" onClick={handleCancel}>Cancel</button>
      </footer>
    </div>
  );
}