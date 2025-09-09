"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import qrgeneratorApi from "../../services/qrgeneratorApi";
import paymentdetailsApi from "../../services/paymentdetailsApi";
import refillApi from "../../services/refillApi";
import reportApi from "../../services/reportApi";
import "./PayingPage.css";
import { CircularProgress } from '@mui/material';
import Header from "../../components/UI/Header/Header";
import gpay from "../../assets/images/gpay.webp";
import phonepe from "../../assets/images/phonepe.webp";
import paytm from "../../assets/images/paytm.webp";
import pinelabs from "../../assets/images/pinelabs.webp";

const formatTime = (seconds) => {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
};
const formatAppName = (app) => {
  const names = { gpay: "Google Pay", phonepe: "PhonePe", paytm: "Paytm", pinelabs: "Pine Labs" };
  return names[app] || app.charAt(0).toUpperCase() + app.slice(1);
};
const appLogos = { gpay, phonepe, paytm, pinelabs };

export default function PayingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalPrice, paymentMethod } = location.state || {};

  const [paymentStatus, setPaymentStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(180);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [retryTrigger, setRetryTrigger] = useState(0);

  // --- CHANGE 1: New state to track temporary polling errors ---
  const [pollingError, setPollingError] = useState(null);

  const pollingIntervalRef = useRef(null);
  const pollingTimeoutRef = useRef(null);
  const isHandlingPostPayment = useRef(false);

  const stopPolling = useCallback(() => {
    clearInterval(pollingIntervalRef.current);
    clearTimeout(pollingTimeoutRef.current);
    pollingIntervalRef.current = null;
    pollingTimeoutRef.current = null;
  }, []);

  const handlePaymentFailure = useCallback((errorMessage, isCritical = true) => {
    stopPolling();
    setError(errorMessage);
    if (isCritical) {
      setPaymentStatus("failed");
    }
  }, [stopPolling]);

  const logTransactionReport = async (orderData, transactionId) => {
    const reportPromises = orderData.selectedProducts.map(item => {
      const reportPayload = {
        Vendor_id: parseInt(localStorage.getItem("company_id"), 10),
        Machine_Guid: localStorage.getItem("machine_id"),
        Name: localStorage.getItem("machine_name"),
        product_name: item.name,
        quantity: item.quantity,
        amount: item.price * item.quantity,
        order_number: localStorage.getItem("orderNumber"),
        transaction_id: transactionId,
        is_paid: true,
        is_refunded: false,
        refunded_amount: 0.0,
        payment_type: paymentMethod,
      };
      return reportApi.storereport(reportPayload);
    });

    try {
      await Promise.all(reportPromises);
      console.log("All transaction reports stored successfully.");
    } catch (err) {
      console.error("Background task failed: Could not store one or more transaction reports.", err);
      // This is a background task, so we still consider the main flow successful,
      // but you might want to log this failure to a monitoring service.
    }
  };

  const navigateToCompletion = useCallback((finalProviderTransactionId, orderNumber) => {
    const AppType = localStorage.getItem('currentAppType') || 'VM';

    if (AppType === "KIOSK") {
        const orderForBill = JSON.parse(localStorage.getItem('finalOrderForBill'));
        if (!orderForBill) {
            console.error("Critical Error: Could not retrieve order details for bill page.");
            navigate("/home", { replace: true });
            return;
        }
        const finalState = {
            totalPrice: orderForBill.totalPrice,
            vendingLog: orderForBill.selectedProducts.map(p => ({
                id: p.id, productName: p.productName, price: p.price,
                quantityVended: p.quantity, quantityFailed: 0,
            })),
            refundAmount: 0, orderNumber, transactionId: finalProviderTransactionId,
            AppType, paymentDetails: { method: paymentMethod, upiId: finalProviderTransactionId },
            taxDetails: { rate: 0, cgst: 0, sgst: 0 }
        };
        navigate("/bill", { state: finalState, replace: true });
    } else {
        const currentOrderData = JSON.parse(localStorage.getItem('currentOrder'));
        const finalState = {
            ...currentOrderData, transactionId: finalProviderTransactionId,
            paymentMethod, orderNumber, machineGuid: localStorage.getItem("machine_id"), AppType
        };
        navigate("/vending", { state: finalState, replace: true });
    }

    localStorage.removeItem('currentOrder');
    localStorage.removeItem('finalOrderForBill');
    // localStorage.removeItem('orderNumber');
  }, [navigate, paymentMethod]);

  const handlePostPayment = useCallback(async (finalProviderTransactionId) => {
    if (isHandlingPostPayment.current) return;
    isHandlingPostPayment.current = true;

    stopPolling();
    setPaymentStatus("success");

    const currentOrderData = JSON.parse(localStorage.getItem('currentOrder'));
    const orderNumber = localStorage.getItem("orderNumber");

    if (!currentOrderData || !currentOrderData.selectedProducts || !orderNumber) {
        handlePaymentFailure("Critical Error: Session data lost after payment. Please contact support.", true);
        return;
    }

    const paymentPayload = {
        OrderNumber: orderNumber, Amount: currentOrderData.totalPrice, PaymentMethod: paymentMethod,
        PaymentProvider: "PhonePe", TransactionId: finalProviderTransactionId,
        company_id: localStorage.getItem("company_id")
    };

    try {
        // --- CHANGE 2: Make post-payment API calls critical ---
        await paymentdetailsApi.paymentdetails(paymentPayload);
        await logTransactionReport(currentOrderData, finalProviderTransactionId);

        if ((localStorage.getItem('currentAppType') || 'VM') === "KIOSK") {
            const machineId = localStorage.getItem("machine_id");
            const vendedItemsForApi = currentOrderData.selectedProducts
                .map(p => ({ motor_id: p.motor_id, quantity_vended: p.quantity }))
                .filter(p => p.motor_id !== null && typeof p.motor_id !== 'undefined');

            if (machineId && vendedItemsForApi.length > 0) {
                await refillApi.decrementStockAfterKioskVend(machineId, vendedItemsForApi);
            }
        }
        // If all successful, navigate after a delay
        setTimeout(() => navigateToCompletion(finalProviderTransactionId, orderNumber), 2000);

    } catch (err) {
        console.error("A critical post-payment API call failed:", err);
        // If any critical API fails, show a failure screen instead of navigating
        handlePaymentFailure(`Payment was successful, but saving the details failed. Please contact support with Order Number: ${orderNumber}`, true);
    }
  }, [stopPolling, paymentMethod, navigateToCompletion, handlePaymentFailure]);

  useEffect(() => {
    if (!totalPrice || !paymentMethod) {
      navigate("/payment", { replace: true });
      return;
    }

    const initiateAndPollPayment = async () => {
      setPaymentStatus("loading");
      setError(null);
      setPollingError(null); // Reset polling error on new attempt
      setCountdown(180);
      isHandlingPostPayment.current = false;

      try {
        const orderNumber = localStorage.getItem("orderNumber");
        const machineId = localStorage.getItem("machine_id");
        const merchantId = localStorage.getItem("PgSettingId");
        if (!orderNumber || !machineId || !merchantId) throw new Error("Session data is missing.");

        const paymentAttemptId = `PAY-${orderNumber}-${Date.now()}`;
        const qrPayload = { order_number: paymentAttemptId, amount: totalPrice, machine_id: machineId ,Merchants_id: merchantId};
        const qrResponse = await qrgeneratorApi.generateQr(qrPayload);

        if (!qrResponse.success || !qrResponse.upi_string) {
            throw new Error(qrResponse.message || "Failed to generate QR code.");
        }

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrResponse.upi_string)}`;
        setQrCodeUrl(qrUrl);
        setPaymentStatus("pending");

        const checkStatus = async () => {
    try {
        const statusResponse = await qrgeneratorApi.checkPaymentStatus(paymentAttemptId); // ✅ already includes machine_id inside
        if (statusResponse.success && statusResponse.status === "SUCCESS") {
            handlePostPayment(statusResponse.provider_transaction_id);
        } else if (statusResponse.status === "FAILED") {
            handlePaymentFailure("Payment was declined or failed by the provider.");
        }
    } catch (err) {
        console.warn("Polling check failed, will retry.", err);
        setPollingError("Connection unstable. Retrying...");
    }
};


        pollingIntervalRef.current = setInterval(checkStatus, 4000);
        pollingTimeoutRef.current = setTimeout(() => {
          if (pollingIntervalRef.current) {
            handlePaymentFailure("Payment confirmation timed out. Please try again.");
          }
        }, 178000);

      } catch (err) {
        handlePaymentFailure(err.message);
      }
    };

    initiateAndPollPayment();
    return stopPolling;
  }, [totalPrice, paymentMethod, navigate, retryTrigger, handlePostPayment, handlePaymentFailure, stopPolling]);

  useEffect(() => {
    let timer;
    if (paymentStatus === "pending" && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0 && paymentStatus === "pending") {
      handlePaymentFailure("Timer expired. Please try again.");
    }
    return () => clearInterval(timer);
  }, [paymentStatus, countdown, handlePaymentFailure]);

  const handleCancel = () => {
    stopPolling();
    navigate("/payment", { state: { ...location.state }, replace: true });
  };

  const handleRetry = () => {
    stopPolling();
    setRetryTrigger(c => c + 1);
  };

  if (paymentStatus === "failed") {
    return (
      <div className="paying-page-new-upi payment-failed-container-upi">
        <main className="content-section-upi">
          <motion.div className="payment-failed-card-upi" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 100 }}>
            <div className="failed-animation-container-upi">
              <DotLottieReact src="https://lottie.host/7623910b-b892-4919-9c3c-39a04a5a542b/lU9y52BYsB.json" loop={false} autoplay />
            </div>
            <h2 className="failed-title-upi">Payment Failed</h2>
            <p className="failed-message-upi">{error || "An unknown error occurred."}</p>
          </motion.div>
        </main>
        <footer className="failed-footer-upi">
          <button className="failed-action-btn-upi" onClick={handleCancel}>Change Method</button>
          <button className="failed-action-btn-upi primary-upi" onClick={handleRetry}>Retry Payment</button>
        </footer>
      </div>
    );
  }

  return (
    <div className="paying-page-new-upi">
      <div className={`success-overlay-upi ${paymentStatus === "success" ? "visible-upi" : ""}`}>
        {paymentStatus === "success" && (
          <div className="success-animation-upi">
            <DotLottieReact src="https://lottie.host/e86f1ca1-0286-47ed-8913-8c31b6f9f104/Y7zENLsP3x.lottie" loop={false} autoplay />
          </div>
        )}
        <p className="success-text-upi">Payment Successful</p>
      </div>
      <Header isHidden={paymentStatus === "success"} />
      <main className="content-section-upi">
        <motion.div className="payment-card-upi" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="amount-area-upi">
            <div className="amount-label-upi">Amount to Pay</div>
            <div className="amount-value-upi">₹{totalPrice?.toFixed(2)}</div>
          </div>
          <div className="timer-area-upi">
            <div className="timer-label-upi">TIME REMAINING</div>
            <div className={`timer-value-upi ${countdown <= 30 ? "timer-warning" : ""}`}>{formatTime(countdown)}</div>
          </div>
          <div className="qr-area-upi">
            <div className="qr-container-upi">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Scan to pay" className="qr-code-image-upi" />
              ) : (
                <div className="qr-loading">
                  {paymentStatus === 'loading' && (
                    <span className="d-flex flex-column align-items-center justify-content-center">
                      <CircularProgress style={{color:"#75d857"}} className="mb-2"/>Generating QR...
                    </span>
                  )}
                </div>
              )}
            </div>
            {/* --- CHANGE 4: Display the polling error message to the user --- */}
            <div className={`qr-text-upi ${pollingError ? "polling-error-upi" : ""}`}>
                {pollingError || "Scan to Pay with any UPI App"}
            </div>
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
// "use client";
// import { useState, useEffect, useCallback, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { motion } from "framer-motion";
// import { DotLottieReact } from "@lottiefiles/dotlottie-react";
// import qrgeneratorApi from "../../services/qrgeneratorApi"; // Still imported but not used in dummy mode
// import paymentdetailsApi from "../../services/paymentdetailsApi";
// import refillApi from "../../services/refillApi";
// import reportApi from "../../services/reportApi";
// import "./PayingPage.css";
// import { CircularProgress } from "@mui/material";
// import Header from "../../components/UI/Header/Header";
// // Imported but not used in dummy mode:
// // import gpay from "../../assets/images/gpay.webp";
// // import phonepe from "../../assets/images/phonepe.webp";
// // import paytm from "../../assets/images/paytm.webp";
// // import pinelabs from "../../assets/images/pinelabs.webp";

// // Removed formatTime and formatAppName as they are not used with dummy mode
// // Removed appLogos as they are not used with dummy mode

// export default function PayingPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { totalPrice, paymentMethod } = location.state || {};

//   const [paymentStatus, setPaymentStatus] = useState("loading");
//   const [error, setError] = useState(null);
//   // Removed countdown
//   // Removed qrCodeUrl
//   const [retryTrigger, setRetryTrigger] = useState(0); // Kept for potential future retry logic in a more complex dummy scenario

//   // Removed pollingError

//   // --- NEW: State for dummy payment simulation ---
//   const [simulatePayment, setSimulatePayment] = useState(false);

//   // Removed pollingIntervalRef and pollingTimeoutRef as polling is bypassed
//   const isHandlingPostPayment = useRef(false);

//   // stopPolling is not relevant when there's no polling, but kept for handlePaymentFailure if needed
//   const stopPolling = useCallback(() => {
//     // No actual polling to stop in this dummy scenario
//   }, []);

//   const handlePaymentFailure = useCallback(
//     (errorMessage, isCritical = true) => {
//       stopPolling();
//       setError(errorMessage);
//       if (isCritical) {
//         setPaymentStatus("failed");
//       }
//     },
//     [stopPolling]
//   );

//   const logTransactionReport = async (orderData, transactionId) => {
//     const reportPromises = orderData.selectedProducts.map((item) => {
//       const reportPayload = {
//         Vendor_id: parseInt(localStorage.getItem("company_id"), 10),
//         Machine_Guid: localStorage.getItem("machine_id"),
//         product_name: item.name,
//         quantity: item.quantity,
//         amount: item.price * item.quantity,
//         order_number: localStorage.getItem("orderNumber"),
//         transaction_id: transactionId,
//         is_paid: true,
//         is_refunded: false,
//         refunded_amount: 0.0,
//         payment_type: paymentMethod,
//       };
//       return reportApi.storereport(reportPayload);
//     });

//     try {
//       await Promise.all(reportPromises);
//       console.log("All transaction reports stored successfully.");
//     } catch (err) {
//       console.error(
//         "Background task failed: Could not store one or more transaction reports.",
//         err
//       );
//       // This is a background task, so we still consider the main flow successful,
//       // but you might want to log this failure to a monitoring service.
//     }
//   };

//   const navigateToCompletion = useCallback(
//     (finalProviderTransactionId, orderNumber) => {
//       const AppType = localStorage.getItem("currentAppType") || "VM";

//       if (AppType === "KIOSK") {
//         const orderForBill = JSON.parse(
//           localStorage.getItem("finalOrderForBill")
//         );
//         if (!orderForBill) {
//           console.error(
//             "Critical Error: Could not retrieve order details for bill page."
//           );
//           navigate("/home", { replace: true });
//           return;
//         }
//         const finalState = {
//           totalPrice: orderForBill.totalPrice,
//           vendingLog: orderForBill.selectedProducts.map((p) => ({
//             id: p.id,
//             productName: p.productName,
//             price: p.price,
//             quantityVended: p.quantity,
//             quantityFailed: 0,
//           })),
//           refundAmount: 0,
//           orderNumber,
//           transactionId: finalProviderTransactionId,
//           AppType,
//           paymentDetails: {
//             method: paymentMethod,
//             upiId: finalProviderTransactionId,
//           },
//           taxDetails: { rate: 0, cgst: 0, sgst: 0 },
//         };
//         navigate("/bill", { state: finalState, replace: true });
//       } else {
//         const currentOrderData = JSON.parse(
//           localStorage.getItem("currentOrder")
//         );
//         const finalState = {
//           ...currentOrderData,
//           transactionId: finalProviderTransactionId,
//           paymentMethod,
//           orderNumber,
//           machineGuid: localStorage.getItem("machine_id"),
//           AppType,
//         };
//         navigate("/vending", { state: finalState, replace: true });
//       }

//       localStorage.removeItem("currentOrder");
//       localStorage.removeItem("finalOrderForBill");
//       // localStorage.removeItem('orderNumber'); // Keeping this commented as per original
//     },
//     [navigate, paymentMethod]
//   );

//   const handlePostPayment = useCallback(
//     async (finalProviderTransactionId) => {
//       if (isHandlingPostPayment.current) return;
//       isHandlingPostPayment.current = true;

//       // In this dummy scenario, payment is always "successful" instantly
//       setPaymentStatus("success");

//       const currentOrderData = JSON.parse(localStorage.getItem("currentOrder"));
//       const orderNumber = localStorage.getItem("orderNumber");

//       if (
//         !currentOrderData ||
//         !currentOrderData.selectedProducts ||
//         !orderNumber
//       ) {
//         handlePaymentFailure(
//           "Critical Error: Session data lost after payment. Please contact support.",
//           true
//         );
//         isHandlingPostPayment.current = false; // Reset flag
//         return;
//       }

//       const paymentPayload = {
//         OrderNumber: orderNumber,
//         Amount: currentOrderData.totalPrice,
//         PaymentMethod: paymentMethod,
//         PaymentProvider: "SimulatedPayment", // Changed provider to reflect simulation
//         TransactionId: finalProviderTransactionId,
//         company_id: localStorage.getItem("company_id"),
//       };

//       try {
//         console.log(
//           "Calling paymentdetailsApi.paymentdetails with payload:",
//           paymentPayload
//         );
//         await paymentdetailsApi.paymentdetails(paymentPayload);
//         console.log("Payment details stored successfully.");

//         console.log(
//           "Calling logTransactionReport with orderData and transactionId:",
//           currentOrderData,
//           finalProviderTransactionId
//         );
//         await logTransactionReport(
//           currentOrderData,
//           finalProviderTransactionId
//         );
//         console.log("Transaction report logged successfully.");

//         if ((localStorage.getItem("currentAppType") || "VM") === "KIOSK") {
//           const machineId = localStorage.getItem("machine_id");
//           const vendedItemsForApi = currentOrderData.selectedProducts
//             .map((p) => ({ motor_id: p.motor_id, quantity_vended: p.quantity }))
//             .filter(
//               (p) => p.motor_id !== null && typeof p.motor_id !== "undefined"
//             );

//           if (machineId && vendedItemsForApi.length > 0) {
//             console.log(
//               "Calling refillApi.decrementStockAfterKioskVend:",
//               machineId,
//               vendedItemsForApi
//             );
//             await refillApi.decrementStockAfterKioskVend(
//               machineId,
//               vendedItemsForApi
//             );
//             console.log("Stock decremented successfully for KIOSK.");
//           }
//         }
//         // If all successful, navigate after a delay
//         setTimeout(
//           () => navigateToCompletion(finalProviderTransactionId, orderNumber),
//           2000
//         );
//       } catch (err) {
//         console.error("A critical post-payment API call failed:", err);
//         handlePaymentFailure(
//           `Payment was successful, but saving the details failed. Please contact support with Order Number: ${orderNumber}`,
//           true
//         );
//       } finally {
//         isHandlingPostPayment.current = false;
//       }
//     },
//     [
//       paymentMethod,
//       navigateToCompletion,
//       handlePaymentFailure,
//       logTransactionReport,
//     ]
//   );

//   useEffect(() => {
//     if (!totalPrice || !paymentMethod) {
//       navigate("/payment", { replace: true });
//       return;
//     }

//     // When the component loads and simulatePayment is true, trigger the success flow
//     if (simulatePayment) {
//       setPaymentStatus("loading"); // Indicate loading before success
//       const orderNumber = localStorage.getItem("orderNumber");
//       if (!orderNumber) {
//         handlePaymentFailure("Session data for order number is missing.", true);
//         return;
//       }

//       // Simulate a brief delay before "payment success" and API calls
//       setTimeout(() => {
//         const dummyTransactionId = `SIMULATED_TXN_${Date.now()}`;
//         handlePostPayment(dummyTransactionId);
//       }, 1000); // 1 second delay
//     } else {
//       // If simulatePayment is false, you could (re)introduce real QR generation here
//       // For now, we'll just set it to a waiting state or redirect.
//       // Or, you could remove the else block if this component is *only* for simulation.
//       // For now, setting it to a state that shows the "Simulate" button.
//       setPaymentStatus("pending");
//     }

//     // Cleanup function (less relevant now without polling, but good practice)
//     return () => {
//       // Any cleanup if needed when component unmounts or simulatePayment changes
//     };
//   }, [
//     totalPrice,
//     paymentMethod,
//     navigate,
//     simulatePayment,
//     handlePostPayment,
//     handlePaymentFailure,
//   ]);

//   // Removed countdown useEffect as there is no countdown

//   const handleCancel = () => {
//     navigate("/payment", { state: { ...location.state }, replace: true });
//   };

//   // handleRetry is not directly applicable in this immediate success simulation
//   // but could be modified to re-trigger the simulation if needed
//   const handleRetry = () => {
//     setSimulatePayment(true); // Retrigger simulation
//   };

//   // The 'failed' state rendering remains the same
//   if (paymentStatus === "failed") {
//     return (
//       <div className="paying-page-new-upi payment-failed-container-upi">
//         <main className="content-section-upi">
//           <motion.div
//             className="payment-failed-card-upi"
//             initial={{ y: -30, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             transition={{ type: "spring", stiffness: 100 }}
//           >
//             <div className="failed-animation-container-upi">
//               <DotLottieReact
//                 src="https://lottie.host/7623910b-b892-4919-9c3c-39a04a5a542b/lU9y52BYsB.json"
//                 loop={false}
//                 autoplay
//               />
//             </div>
//             <h2 className="failed-title-upi">Payment Failed</h2>
//             <p className="failed-message-upi">
//               {error || "An unknown error occurred."}
//             </p>
//           </motion.div>
//         </main>
//         <footer className="failed-footer-upi">
//           <button className="failed-action-btn-upi" onClick={handleCancel}>
//             Change Method
//           </button>
//           <button
//             className="failed-action-btn-upi primary-upi"
//             onClick={handleRetry}
//           >
//             Retry Simulation
//           </button>{" "}
//           {/* Changed text */}
//         </footer>
//       </div>
//     );
//   }

//   return (
//     <div className="paying-page-new-upi">
//       <div
//         className={`success-overlay-upi ${
//           paymentStatus === "success" ? "visible-upi" : ""
//         }`}
//       >
//         {paymentStatus === "success" && (
//           <div className="success-animation-upi">
//             <DotLottieReact
//               src="https://lottie.host/e86f1ca1-0286-47ed-8913-8c31b6f9f104/Y7zENLsP3x.lottie"
//               loop={false}
//               autoplay
//             />
//           </div>
//         )}
//         <p className="success-text-upi">Payment Successful</p>
//       </div>
//       <Header isHidden={paymentStatus === "success"} />
//       <main className="content-section-upi">
//         <motion.div
//           className="payment-card-upi"
//           initial={{ scale: 0.9, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//         >
//           <div className="amount-area-upi">
//             <div className="amount-label-upi">Amount to Pay</div>
//             <div className="amount-value-upi">₹{totalPrice?.toFixed(2)}</div>
//           </div>

//           {/* Replaced QR area with a simulation button */}
//           <div className="simulation-area-upi">
//             {paymentStatus === "loading" && simulatePayment && (
//               <span className="d-flex flex-column align-items-center justify-content-center">
//                 <CircularProgress
//                   style={{ color: "#75d857" }}
//                   className="mb-2"
//                 />
//                 Simulating Payment...
//               </span>
//             )}
//             {paymentStatus === "pending" &&
//               !simulatePayment && ( // Only show button if not already simulating
//                 <button
//                   className="action-btn-upi primary-upi simulate-button"
//                   onClick={() => setSimulatePayment(true)}
//                 >
//                   Simulate Payment Success
//                 </button>
//               )}
//             {error && <p className="error-message">{error}</p>}
//           </div>

//           {/* Removed app logos as they are not relevant without QR */}
//         </motion.div>
//       </main>
//       <footer className="button-section-upi">
//         <button className="action-btn-upi" onClick={handleCancel}>
//           Cancel
//         </button>
//       </footer>
//     </div>
//   );
// }
