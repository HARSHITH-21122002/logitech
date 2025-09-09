// import React, { useEffect, useState, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import modbuscontrollerApi from "../../services/modbuscontrollerApi";
// import refillApi from "../../services/refillApi";
// import qrgeneratorApi from "../../services/qrgeneratorApi";
// import refundApi from "../../services/refundApi";
// import VendingLoadingAnimation from "../VendingLoadingAnimation";
// import RefundModal from "../RefundModal/RefundModal";
// import "./VendingPage.css";
// import logo from "../../assets/images/logo.webp";

// // Helper function to vend a single item
// const vendSingleItem = async (motorId) => {
//   if (!motorId) {
//     console.error("Vending attempt with undefined motorId.");
//     return { success: false, error: "Missing motor ID" };
//   }
//   try {
//     const res = await modbuscontrollerApi.startmotor(motorId);
//     return res || { success: false, error: "Unknown hardware response" };
//   } catch (error) {
//     console.error(`Vending failed for motor ${motorId}:`, error);
//     return { success: false, error: error.message };
//   }
// };

// // Helper function to update the stock count in localStorage
// const updateLocalStorageStock = (vendingLog) => {
//   try {
//     const cachedMotorsJSON = localStorage.getItem("refillMotors");
//     if (!cachedMotorsJSON) {
//       console.warn("Could not find 'refillMotors' in localStorage to update stock.");
//       return; // Exit gracefully if there's no cache to update
//     }

//     let motors = JSON.parse(cachedMotorsJSON);

//     // Loop through each vending result
//     vendingLog.forEach(vendedItem => {
//       // Only process items where one or more were successfully vended
//       if (vendedItem.quantityVended > 0) {
//         // Find the corresponding motor in the cached data
//         const motorToUpdate = motors.find(m => m.id === vendedItem.motorId);

//         if (motorToUpdate) {
//           // Subtract the vended quantity from the cached stock
//           const newQuantity = motorToUpdate.quantity - vendedItem.quantityVended;
//           // Ensure stock doesn't go below zero
//           motorToUpdate.quantity = Math.max(0, newQuantity);
//         }
//       }
//     });

//     // Save the updated motor array back to localStorage
//     localStorage.setItem("refillMotors", JSON.stringify(motors));
//     console.log("LocalStorage stock cache updated successfully based on vending results.");

//   } catch (error) {
//     console.error("Critical Error: Failed to update localStorage stock cache.", error);
//     // This function does not throw an error to avoid interrupting the user's flow.
//     // The cache will self-correct on the next full API load in the RefillPage.
//   }
// };

// export default function VendingPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { selectedProducts, totalPrice, motorCommands, paymentMethod, machineGuid } = location.state || {};

//   const companyId = localStorage.getItem("company_id");
//   const orderNumber = localStorage.getItem("order_number");

//   const [message, setMessage] = useState("Preparing your order...");
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalDetails, setModalDetails] = useState({ title: "", message: "", amount: 0, isError: false });
//   const [currentItem, setCurrentItem] = useState(null);
//   const finalBillData = useRef(null);
//   const navigationTimeoutId = useRef(null);

//   useEffect(() => {
//     const processVending = async () => {
//       // --- STAGE 1: Pre-flight Checks (Unchanged) ---
//       if (!motorCommands || !motorCommands.length || !companyId || !orderNumber) {
//         setMessage("Critical Error: Missing required data. Redirecting...");
//         setTimeout(() => navigate("/"), 4000);
//         return;
//       }

//       // --- STAGE 2: Payment Registration & Vending Loop (Unchanged) ---
//       setMessage("Registering payment...");
//       let transactionId;
//       try {
//         const paymentPayload = {
//           company_id: companyId, Amount: totalPrice,
//           PaymentMethod: paymentMethod, OrderNumber: orderNumber,
//         };
//         const paymentResponse = await refundApi.registerpaymentstaus(paymentPayload);
//         if (!paymentResponse || !paymentResponse.TransactionId) {
//           throw new Error("Failed to receive a valid TransactionId.");
//         }
//         transactionId = paymentResponse.TransactionId;
//       } catch (error) {
//         const errorMessage = error.response ? error.response.data.error : error.message;
//         setMessage(`Error: Could not record payment (${errorMessage}). Redirecting...`);
//         setTimeout(() => navigate("/", { replace: true }), 5000);
//         return;
//       }

//       setMessage("Starting vending process...");
//       const vendingResults = motorCommands.map(cmd => ({ ...cmd, vendedSuccessfully: 0 }));
//       for (const result of vendingResults) {
//         if (!result.motorId) continue;
//         for (let i = 0; i < result.quantity; i++) {
//           setCurrentItem(result.productName);
//           const vendAttempt = await vendSingleItem(result.motorId);
//           if (vendAttempt.success) {
//             result.vendedSuccessfully += 1;
//           } else {
//             console.error(`Vending failed for ${result.productName}.`);
//             break;
//           }
//           await new Promise(res => setTimeout(res, 500));
//         }
//       }

//       // --- STAGE 3: CALCULATE FINAL RESULTS & UPDATE CACHE ---
//       setMessage("Finalizing your order...");
//       const vendingLog = vendingResults.map(r => ({ ...r, quantityVended: r.vendedSuccessfully, quantityFailed: r.quantity - r.vendedSuccessfully }));

//       // --- LOGIC IMPLEMENTED HERE ---
//       // This is the new step. It updates the localStorage cache based on the vending log.
//       updateLocalStorageStock(vendingLog);
//       // --- END OF IMPLEMENTATION ---

//       const totalRefundAmount = vendingLog.reduce((total, item) => total + (item.quantityFailed * (item.price || 0)), 0);
//       finalBillData.current = {
//         originalOrder: selectedProducts, totalPrice, vendingLog,
//         refundAmount: totalRefundAmount, transactionId, orderNumber,
//       };
//       const totalItemsVendedSuccessfully = vendingLog.reduce((sum, item) => sum + item.quantityVended, 0);

//       // --- STAGE 4: NAVIGATION AND FINALIZATION LOGIC (Unchanged) ---
//       let finalPaymentStatusPayload;

//       // SCENARIO 1: AT LEAST ONE ITEM WAS VENDED SUCCESSFULLY
//       if (totalItemsVendedSuccessfully > 0) {
//         if (totalRefundAmount > 0) {
//           setMessage("One or more items failed. Processing refund...");
//           try {
//             await qrgeneratorApi.getrefund({ amount: totalRefundAmount });
//             finalPaymentStatusPayload = { IsSucceed: false, IsRefunded: true, RefundStatus: 'Processed', RefundReason: 'Vending failure.' };
//             const successMessage = `A hardware error occurred. A refund of ₹${totalRefundAmount.toFixed(2)} has been processed.`;
//             setModalDetails({ title: "Partial Refund Processed", message: successMessage, amount: totalRefundAmount, isError: false });
//             navigationTimeoutId.current = setTimeout(() => navigate("/bill", { state: finalBillData.current, replace: true }), 8000);
//           } catch (error) {
//             finalPaymentStatusPayload = { IsSucceed: false, IsRefunded: true, RefundStatus: 'Failed', RefundReason: 'Automated refund API failed.' };
//             setModalDetails({ title: "Refund Error", message: "A refund is due, but processing failed. Please contact support.", amount: totalRefundAmount, isError: true });
//             navigationTimeoutId.current = setTimeout(() => navigate("/bill", { state: finalBillData.current, replace: true }), 8000);
//           }
//           setIsModalOpen(true);
//         } else {
//           setMessage("Vending complete! Please collect your items.");
//           finalPaymentStatusPayload = { IsSucceed: true, IsRefunded: false };
//           setTimeout(() => {
//             navigate("/bill", { state: finalBillData.current, replace: true });
//           }, 3000);
//         }
//       } 
//       // SCENARIO 2: ZERO ITEMS WERE VENDED SUCCESSFULLY (TOTAL FAILURE)
//       else {
//         setMessage("Vending failed for all items. Processing a full refund...");
//         try {
//           await qrgeneratorApi.getrefund({ amount: totalRefundAmount });
//           finalPaymentStatusPayload = { IsSucceed: false, IsRefunded: true, RefundStatus: 'Processed', RefundReason: 'Total vending failure.' };
//           const failureMessage = `We're sorry, the machine was unable to dispense any items. A full refund of ₹${totalPrice.toFixed(2)} has been processed.`;
//           setModalDetails({ title: "Vending Failed", message: failureMessage, amount: totalRefundAmount, isError: false });
//         } catch(error) {
//            finalPaymentStatusPayload = { IsSucceed: false, IsRefunded: true, RefundStatus: 'Failed', RefundReason: 'Total vending failure, automated refund failed.' };
//            setModalDetails({ title: "Critical Error", message: "Vending failed and the automatic refund could not be processed. Please contact support for a full refund.", amount: totalRefundAmount, isError: true });
//         }
//         navigationTimeoutId.current = setTimeout(() => navigate("/", { replace: true }), 8000);
//         setIsModalOpen(true);
//       }

//       // These API calls run at the end, regardless of the outcome.
//       try {
//         if(finalPaymentStatusPayload) await refundApi.updatePaymentStatus(transactionId, finalPaymentStatusPayload);
//       } catch (updateError) {
//         console.warn("Could not update transaction status:", updateError);
//       }
//       try {
//         await refillApi.logEvent({ type: "vending_result", machineId: machineGuid, vendingLog, refundAmount: totalRefundAmount, transactionId });
//       } catch (err) {
//         console.warn("Logging failed:", err);
//       }
//     };

//     const timer = setTimeout(processVending, 500);

//     return () => {
//       clearTimeout(timer);
//       if (navigationTimeoutId.current) clearTimeout(navigationTimeoutId.current);
//     };
//   }, [motorCommands, navigate, selectedProducts, totalPrice, paymentMethod, machineGuid, companyId, orderNumber]);

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     if(navigationTimeoutId.current) clearTimeout(navigationTimeoutId.current);
    
//     const totalItemsVended = finalBillData.current?.vendingLog.reduce((sum, item) => sum + item.quantityVended, 0) ?? 0;
//     if (totalItemsVended > 0) {
//       navigate("/bill", { state: finalBillData.current, replace: true });
//     } else {
//       navigate("/", { replace: true });
//     }
//   };

//   const handleGoHome = () => navigate("/");

//   return (
//     <div className="vending-page-wrapper">
//       <header className="add-selectpayment-header">
//         <div style={{ minWidth: '68px' }}></div>
//         <h1 className="add-selectpayment-header-title">BVC</h1>
//         <button className="add-selectpayment-home-logo-btn" onClick={handleGoHome} aria-label="Go to Home">
//           <img src={logo} alt="Logo" className="header-logo-image" />
//         </button>
//       </header>
//       <div className="vending-container">
//         <VendingLoadingAnimation message={message} />
//         {currentItem && <p className="current-item-text">Dispensing: {currentItem}</p>}
//         <RefundModal isOpen={isModalOpen} onClose={handleCloseModal} details={modalDetails} />
//       </div>
//     </div>
//   );
// }

// VendingPage.jsx for PRODUCTION - Final Version

// import React, { useEffect, useState, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import refillApi from "../../services/refillApi";
// import refundApi from "../../services/paymentdetailsApi"; // Using your corrected file name
// import VendingLoadingAnimation from "../VendingLoadingAnimation";
// import RefundModal from "../RefundModal/RefundModal";
// import "./VendingPage.css";
// import logo from "../../assets/images/logo.webp";

// // --- SIMULATION FUNCTION (CORRECTED) ---
// const fakeVendSingleItem = async (motorId) => {
//   console.log(`[SIMULATION] Vending motor ${motorId}...`);
//   await new Promise(resolve => setTimeout(resolve, 1500));
//   if (motorId === 13) {
//     console.error(`[SIMULATION] Motor ${motorId} has FAILED (Simulated motor jam).`);
//     return { success: false, error: "Simulated motor jam" };
//   } else {
//     console.log(`[SIMULATION] Motor ${motorId} has SUCCEEDED.`);
//     // --- FIX: This now correctly returns 'true' for a successful vend ---
//     return { success: true};
//   }
// };

// // --- HELPER FUNCTION TO UPDATE LOCAL STORAGE CACHE (No changes needed) ---
// const updateLocalStorageStock = (vendingLog) => {
//   try {
//     const cachedMotorsJSON = localStorage.getItem("refillMotors");
//     if (!cachedMotorsJSON) {
//       console.warn("No 'refillMotors' cache found. Skipping update.");
//       return;
//     }
//     let motors = JSON.parse(cachedMotorsJSON);
//     vendingLog.forEach(vendedItem => {
//       if (vendedItem.quantityVended > 0) {
//         const motorToUpdate = motors.find(m => m.id === vendedItem.motorId);
//         if (motorToUpdate) {
//           motorToUpdate.quantity -= vendedItem.quantityVended;
//           motorToUpdate.quantity = Math.max(0, motorToUpdate.quantity);
//         }
//       }
//     });
//     localStorage.setItem("refillMotors", JSON.stringify(motors));
//     console.log("LocalStorage cache for RefillPage was updated.");
//   } catch (error) {
//     console.error("Critical Error: Failed to update localStorage stock cache.", error);
//   }
// };


// export default function VendingPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { selectedProducts, totalPrice, motorCommands, paymentMethod, machineGuid } = location.state || {};
//   const companyId = localStorage.getItem("company_id");
//   const orderNumber = localStorage.getItem("order_number");

//   const [message, setMessage] = useState("Preparing your order...");
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalDetails, setModalDetails] = useState({ title: "", message: "", amount: 0, isError: false });
//   const [currentItem, setCurrentItem] = useState(null);
//   const finalBillData = useRef(null);
//   const navigationTimeoutId = useRef(null);

//   useEffect(() => {
//     const processVending = async () => {
//       if (!motorCommands || !motorCommands.length || !companyId || !orderNumber) {
//           setMessage("Critical Error: Missing data. Redirecting...");
//           setTimeout(() => navigate("/"), 4000);
//           return;
//       }
      
//       // STAGE 1: TRANSACTION ID (SIMULATED)
//       // In a real flow, you'd get this from your initial payment registration API.
//       setMessage("Registering payment... (Simulated)");
//       const transactionId = `313130fc-eb02-4f79-9981-9c1e149fee8e`; // Using a real UUID format for testing
      
//       // STAGE 2: VENDING (Now uses corrected simulation)
//       setMessage("Starting vending process...");
//       const vendingResults = motorCommands.map(cmd => ({ ...cmd, vendedSuccessfully: 0 }));
//       for (const result of vendingResults) {
//         if (!result.motorId) continue;
//         for (let i = 0; i < result.quantity; i++) {
//           setCurrentItem(result.productName);
//           const vendAttempt = await fakeVendSingleItem(result.motorId);
//           if (vendAttempt.success) {
//             result.vendedSuccessfully += 1;
//           } else {
//             break;
//           }
//         }
//       }

//       // STAGE 3: UPDATE INVENTORY
//       setMessage("Finalizing your order & updating inventory...");
//       const vendingLog = vendingResults.map(r => ({ ...r, quantityVended: r.vendedSuccessfully, quantityFailed: r.quantity - r.vendedSuccessfully }));
//       try {
//         await refillApi.decrementStockAfterVend(vendingLog, machineGuid);
//         updateLocalStorageStock(vendingLog);
//       } catch (error) {
//         console.error("BACKGROUND STOCK UPDATE FAILED.", error);
//       }

//       // STAGE 4: CALCULATE FINAL RESULTS
//       const totalRefundAmount = vendingLog.reduce((total, item) => total + (item.quantityFailed * (item.price || 0)), 0);
//       const totalItemsVendedSuccessfully = vendingLog.reduce((sum, item) => sum + item.quantityVended, 0);
      
//       finalBillData.current = {
//           originalOrder: selectedProducts, totalPrice, vendingLog,
//           refundAmount: totalRefundAmount, transactionId, orderNumber,
//       };

//       // --- STAGE 5: UPDATE REFUND STATUS (ONLY IF A REFUND OCCURRED) ---
//       if (totalRefundAmount > 0) {
//         // Construct the payload exactly as the backend expects from your sample
//         const refundPayload = {
//           RefundedAmount: totalRefundAmount,
//           RefundReason: "Product jammed or vending failure",
//           RefundReference: `REF_${orderNumber}`, // Example reference
//           RefundStatus: "success"
//         };
        
//         try {
//           console.log(`A refund is required. Updating status for transaction ${transactionId}...`, refundPayload);
//           // Calling the corrected API service, which now sends the payload
//           const response = await refundApi.updatepaymentstatus(transactionId, refundPayload);
//           console.log("Refund status API response:", response);
//         } catch (error) {
//           console.error("CRITICAL BACKGROUND ERROR: Failed to update refund status in the database.", error);
//         }
//       }

//       // --- STAGE 6: NAVIGATION LOGIC (This will now work correctly for all scenarios) ---
//       if (totalItemsVendedSuccessfully > 0) {
//         if (totalRefundAmount > 0) {
//           setMessage("One or more items failed. Processing refund...");
//           const successMessage = `A hardware error occurred. A refund of ₹${totalRefundAmount.toFixed(2)} has been processed.`;
//           setModalDetails({ title: "Partial Refund Processed", message: successMessage, amount: totalRefundAmount, isError: false });
//           navigationTimeoutId.current = setTimeout(() => navigate("/bill", { state: finalBillData.current, replace: true }), 8000);
//           setIsModalOpen(true);
//         } else {
//           setMessage("Vending complete! Please collect your items.");
//           setTimeout(() => navigate("/bill", { state: finalBillData.current, replace: true }), 3000);
//         }
//       } else {
//         setMessage("Vending failed for all items. Processing a full refund...");
//         const failureMessage = `The machine was unable to dispense any items. A full refund of ₹${totalPrice.toFixed(2)} has been processed.`;
//         setModalDetails({ title: "Vending Failed", message: failureMessage, amount: totalRefundAmount, isError: false });
//         navigationTimeoutId.current = setTimeout(() => navigate("/", { replace: true }), 8000);
//         setIsModalOpen(true);
//       }
//     };

//     const timer = setTimeout(processVending, 500);
//     return () => clearTimeout(timer);
//   }, [motorCommands, navigate, selectedProducts, totalPrice, paymentMethod, machineGuid, companyId, orderNumber]);

//   // --- (The rest of the component is unchanged) ---
//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     if(navigationTimeoutId.current) clearTimeout(navigationTimeoutId.current);
//     const totalItemsVended = finalBillData.current?.vendingLog.reduce((sum, item) => sum + item.quantityVended, 0) ?? 0;
//     if (totalItemsVended > 0) {
//       navigate("/bill", { state: finalBillData.current, replace: true });
//     } else {
//       navigate("/", { replace: true });
//     }
//   };
//   const handleGoHome = () => navigate("/");

//   return (
//     <div className="vending-page-wrapper">
//        <header className="add-selectpayment-header">
//          <div style={{ minWidth: '68px' }}></div>
//          <h1 className="add-selectpayment-header-title">BVC</h1>
//          <button className="add-selectpayment-home-logo-btn" onClick={handleGoHome} aria-label="Go to Home">
//            <img src={logo} alt="Logo" className="header-logo-image" />
//          </button>
//        </header>
//        <div className="vending-container">
//          <VendingLoadingAnimation message={message} />
//          {currentItem && <p className="current-item-text">Dispensing: {currentItem}</p>}
//          <RefundModal isOpen={isModalOpen} onClose={handleCloseModal} details={modalDetails} />
//        </div>
//      </div>
//   );
// }

// import React, { useEffect, useState, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import modbuscontrollerApi from "../../services/modbuscontrollerApi";
// import refillApi from "../../services/refillApi";
// import qrgeneratorApi from "../../services/qrgeneratorApi";
// import refundApi from "../../services/refundApi"; // Ensure this service has 'updatePaymentStatus'
// import VendingLoadingAnimation from "../VendingLoadingAnimation";
// import RefundModal from "../RefundModal/RefundModal";
// import "./VendingPage.css";
// import logo from "../../assets/images/logo.webp";

// // Helper functions (vendSingleItem, updateLocalStorageStock) remain unchanged...
// const vendSingleItem = async (motorId) => {
//   if (!motorId) {
//     console.error("Vending attempt with undefined motorId.");
//     return { success: false, error: "Missing motor ID" };
//   }
//   try {
//     const res = await modbuscontrollerApi.startmotor(motorId);
//     return res || { success: false, error: "Unknown hardware response" };
//   } catch (error) {
//     console.error(`Vending failed for motor ${motorId}:`, error);
//     return { success: false, error: error.message || "Hardware communication error" };
//   }
// };

// const updateLocalStorageStock = (vendingLog) => {
//   try {
//     const cachedMotorsJSON = localStorage.getItem("refillMotors");
//     if (!cachedMotorsJSON) { return; }
//     let motors = JSON.parse(cachedMotorsJSON);
//     vendingLog.forEach(vendedItem => {
//       if (vendedItem.quantityVended > 0) {
//         const motorToUpdate = motors.find(m => m.id === vendedItem.motorId);
//         if (motorToUpdate) {
//           motorToUpdate.quantity = Math.max(0, motorToUpdate.quantity - vendedItem.quantityVended);
//         }
//       }
//     });
//     localStorage.setItem("refillMotors", JSON.stringify(motors));
//   } catch (error) {
//     console.error("Failed to update localStorage stock cache.", error);
//   }
// };


// export default function VendingPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
  
//   // --- CORRECTED: Receive all necessary data from the previous page ---
//   const { selectedProducts, totalPrice, motorCommands, transactionId, machineGuid } = location.state || {};

//   const [message, setMessage] = useState("Preparing your order...");
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalDetails, setModalDetails] = useState({ title: "", message: "", amount: 0, isError: false });
//   const [currentItem, setCurrentItem] = useState(null);
//   const finalBillData = useRef(null);
//   const navigationTimeoutId = useRef(null);

//   useEffect(() => {
//     const processVending = async () => {
//       // --- STAGE 1: PRE-FLIGHT CHECKS ---
//       if (!motorCommands || !motorCommands.length || !transactionId || !machineGuid) {
//         console.error("Critical Error: Missing data.", { motorCommands, transactionId, machineGuid });
//         setMessage("Critical Error: Order data is missing. Redirecting...");
//         setTimeout(() => navigate("/", { replace: true }), 4000);
//         return;
//       }
      
//       // --- STAGE 2: VENDING LOOP (Unchanged) ---
//       setMessage("Vending your items...");
//       const vendingResults = motorCommands.map(cmd => ({ ...cmd, vendedSuccessfully: 0 }));
//       for (const result of vendingResults) {
//         if (!result.motorId) continue;
//         for (let i = 0; i < result.quantity; i++) {
//           setCurrentItem(result.productName);
//           const vendAttempt = await vendSingleItem(result.motorId);
//           if (vendAttempt.success) {
//             result.vendedSuccessfully += 1;
//           } else {
//             console.error(`Vending failed for ${result.productName} on motor ${result.motorId}.`);
//             break;
//           }
//           await new Promise(res => setTimeout(res, 500));
//         }
//       }

//       // --- STAGE 3: CALCULATE RESULTS & UPDATE STOCK ---
//       setMessage("Finalizing your order & updating inventory...");
//       const vendingLog = vendingResults.map(r => ({ ...r, quantityVended: r.vendedSuccessfully, quantityFailed: r.quantity - r.vendedSuccessfully }));
      
//       // --- FIX: Added backend stock decrement ---
//       try {
//         updateLocalStorageStock(vendingLog); // Update local cache first for UI speed
//         await refillApi.decrementStockAfterVend(vendingLog, machineGuid);
//         console.log("Backend stock updated successfully.");
//       } catch (error) {
//         console.error("BACKGROUND STOCK UPDATE FAILED. This will not affect the user flow.", error);
//       }
      
//       const totalRefundAmount = vendingLog.reduce((total, item) => total + (item.quantityFailed * (item.price || 0)), 0);
//       const totalItemsVendedSuccessfully = vendingLog.reduce((sum, item) => sum + item.quantityVended, 0);

//       const orderNumber = localStorage.getItem("order_number");
//       finalBillData.current = {
//         originalOrder: selectedProducts, totalPrice, vendingLog,
//         refundAmount: totalRefundAmount, transactionId, orderNumber,
//       };

//       // --- STAGE 4: DETERMINE FINAL STATUS AND PREPARE UPDATE PAYLOAD ---
//       let updatePayload;

//       // SCENARIO B: FULL SUCCESS
//       if (totalItemsVendedSuccessfully > 0 && totalRefundAmount === 0) {
//         setMessage("Vending complete! Please collect your items.");
//         updatePayload = { IsPaid: 1, IsSucceed: 1 };
//         setTimeout(() => navigate("/bill", { state: finalBillData.current, replace: true }), 3000);
//       }
//       // SCENARIO A: PARTIAL SUCCESS
//       else if (totalItemsVendedSuccessfully > 0 && totalRefundAmount > 0) {
//         setMessage("One or more items failed. Processing refund...");
//         updatePayload = {
//             IsRefunded: 1,
//             RefundedAmount: totalRefundAmount,
//             RefundReason: 'Vending failure.',
//             RefundStatus: 'Processed',
//         };
//         try {
//             await qrgeneratorApi.getrefund({ amount: totalRefundAmount });
//             const successMessage = `A hardware error occurred. A refund of ₹${totalRefundAmount.toFixed(2)} has been processed.`;
//             setModalDetails({ title: "Partial Refund Processed", message: successMessage, amount: totalRefundAmount, isError: false });
//         } catch (refundError) {
//             updatePayload.RefundStatus = 'Failed';
//             setModalDetails({ title: "Refund Error", message: "A refund is due, but processing failed. Please contact support.", amount: totalRefundAmount, isError: true });
//         }
//         setIsModalOpen(true);
//         navigationTimeoutId.current = setTimeout(() => navigate("/bill", { state: finalBillData.current, replace: true }), 8000);
//       }
//       // SCENARIO C: TOTAL FAILURE
//       else {
//         setMessage("Vending failed for all items. Processing a full refund...");
//         updatePayload = {
//             IsRefunded: 1,
//             RefundedAmount: totalRefundAmount,
//             RefundReason: 'Total vending failure.',
//             RefundStatus: 'Processed',
//         };
//         try {
//             await qrgeneratorApi.getrefund({ amount: totalRefundAmount });
//             const failureMessage = `We're sorry, a full refund of ₹${totalPrice.toFixed(2)} has been processed.`;
//             setModalDetails({ title: "Vending Failed", message: failureMessage, amount: totalRefundAmount, isError: false });
//         } catch (refundError) {
//             updatePayload.RefundStatus = 'Failed';
//             setModalDetails({ title: "Refund", message: "Vending failed and the automatic refund could not be processed. Please contact support.", amount: totalRefundAmount, isError: true });
//         }
//         setIsModalOpen(true);
//         navigationTimeoutId.current = setTimeout(() => navigate("/", { replace: true }), 8000);
//       }

//       // --- STAGE 5: SEND FINAL STATUS UPDATE ---
//       if (updatePayload) {
//         try {
//           console.log(`Updating payment status for Transaction ID ${transactionId} with payload:`, updatePayload);
//           // --- FIX: Using the correct function name 'updatePaymentStatus' ---
//           await refundApi.updatePaymentStatus(transactionId, updatePayload);
//           console.log("Final payment status updated successfully.");
//         } catch (finalizationError) {
//           console.error("CRITICAL: Failed to update the final payment status on the server.", finalizationError);
//         }
//       }
//     };

//     const timer = setTimeout(processVending, 500);
//     return () => {
//       clearTimeout(timer);
//       if (navigationTimeoutId.current) clearTimeout(navigationTimeoutId.current);
//     };
//   }, [location.state]); // Depend on location.state to re-run if any of its properties change

//   // JSX and helper functions remain unchanged
//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     if (navigationTimeoutId.current) clearTimeout(navigationTimeoutId.current);
    
//     const totalItemsVended = finalBillData.current?.vendingLog.reduce((sum, item) => sum + item.quantityVended, 0) ?? 0;
//     if (totalItemsVended > 0) {
//       navigate("/bill", { state: finalBillData.current, replace: true });
//     } else {
//       navigate("/", { replace: true });
//     }
//   };

//   const handleGoHome = () => navigate("/");

//   return (
//     <div className="vending-page-wrapper">
//       <header className="add-selectpayment-header">
//         <div style={{ minWidth: '68px' }}></div>
//         <h1 className="add-selectpayment-header-title">BVC</h1>
//         <button className="add-selectpayment-home-logo-btn" onClick={handleGoHome} aria-label="Go to Home">
//           <img src={logo} alt="Logo" className="header-logo-image" />
//         </button>
//       </header>
//       <div className="vending-container">
//         <VendingLoadingAnimation message={message} />
//         {currentItem && <p className="current-item-text">Dispensing: {currentItem}</p>}
//         <RefundModal isOpen={isModalOpen} onClose={handleCloseModal} details={modalDetails} />
//       </div>
//     </div>
//   );
// }

// import React, { useEffect, useState, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import modbuscontrollerApi from "../../services/modbuscontrollerApi";
// import refillApi from "../../services/refillApi";
// import qrgeneratorApi from "../../services/qrgeneratorApi";
// import refundApi from "../../services/refundApi"; 
// import RefundModal from "../RefundModal/RefundModal"; // Re-import the modal
// import VendingProductCard from "./VendingProductCard"; // Ensure this path is correct
// import "./VendingPage.css";
// import logo from "../../assets/images/logo.webp";
// import Header from "../../components/UI/Header/Header";

// // --- HELPER FUNCTIONS (UNCHANGED) ---
// const vendSingleItem = async (motorId) => {
//   if (!motorId) {
//     console.error("Vending attempt with undefined motorId.");
//     return { success: false, error: "Missing motor ID" };
//   }
//   try {
//     const res = await modbuscontrollerApi.startmotor(motorId);
//     return res || { success: false, error: "Unknown hardware response" };
//   } catch (error) {
//     console.error(`Vending failed for motor ${motorId}:`, error);
//     return { success: false, error: error.message || "Hardware communication error" };
//   }
// };

// const updateLocalStorageStock = (vendingLog) => {
//   try {
//     const cachedMotorsJSON = localStorage.getItem("refillMotors");
//     if (!cachedMotorsJSON) { return; }
//     let motors = JSON.parse(cachedMotorsJSON);
//     vendingLog.forEach(vendedItem => {
//       if (vendedItem.quantityVended > 0) {
//         const motorToUpdate = motors.find(m => m.id === vendedItem.motorId || m.Motor_number === vendedItem.motorId);
//         if (motorToUpdate) {
//           motorToUpdate.quantity = Math.max(0, motorToUpdate.quantity - vendedItem.quantityVended);
//         }
//       }
//     });
//     localStorage.setItem("refillMotors", JSON.stringify(motors));
//   } catch (error)
//   {
//     console.error("Failed to update localStorage stock cache.", error);
//   }
// };


// export default function VendingPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
  
//   const { selectedProducts, totalPrice, motorCommands, transactionId, machineGuid } = location.state || {};
//   const orderDataFromState = location.state || {};

//   // --- STATE (Modal state is re-introduced) ---
//   const [productStatuses, setProductStatuses] = useState({});
//   const [pageError, setPageError] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalDetails, setModalDetails] = useState({ title: "", message: "", amount: 0, isError: false });
//   const finalBillData = useRef(null);
//   const navigationTimeoutId = useRef(null);

//   // Image lookup map
//   const imageMap = new Map();
//   if (Array.isArray(selectedProducts)) {
//     selectedProducts.forEach(p => {
//       const productIdKey = p.id || p.productId; 
//       imageMap.set(productIdKey, p.image);
//     });
//   }

//   useEffect(() => {
//     const processVending = async () => {
//       // --- STAGE 1 & 2 (Unchanged) ---
//       if (!motorCommands || !motorCommands.length || !transactionId || !machineGuid) {
//         setPageError("Critical Error: Order data is missing. Redirecting...");
//         setTimeout(() => navigate("/", { replace: true }), 4000);
//         return;
//       }
//       const initialStatuses = motorCommands.reduce((acc, cmd) => { acc[cmd.motorId] = 'pending'; return acc; }, {});
//       setProductStatuses(initialStatuses);
//       const vendingResults = motorCommands.map(cmd => ({ ...cmd, vendedSuccessfully: 0 }));
//       for (const result of vendingResults) {
//         if (!result.motorId) continue;
//         setProductStatuses(prev => ({ ...prev, [result.motorId]: 'vending' }));
//         for (let i = 0; i < result.quantity; i++) {
//           const vendAttempt = await vendSingleItem(result.motorId);
//           if (vendAttempt.success) { result.vendedSuccessfully += 1; } 
//           else { break; }
//           await new Promise(res => setTimeout(res, 400)); 
//         }
//         const finalStatusForThisCard = result.vendedSuccessfully < result.quantity ? 'failed' : 'success';
//         setProductStatuses(prev => ({ ...prev, [result.motorId]: finalStatusForThisCard }));
//         await new Promise(res => setTimeout(res, 800)); 
//       }

//       // --- STAGE 3 (Unchanged) ---
//       const vendingLog = vendingResults.map(r => ({ ...r, quantityVended: r.vendedSuccessfully, quantityFailed: r.quantity - r.vendedSuccessfully }));
//       try {
//         updateLocalStorageStock(vendingLog);
//         await refillApi.decrementStockAfterVend(vendingLog, machineGuid);
//       } catch (error) { console.error("BACKGROUND STOCK UPDATE FAILED.", error); }
//       const totalRefundAmount = vendingLog.reduce((total, item) => total + (item.quantityFailed * (item.price || 0)), 0);
//       const totalItemsVendedSuccessfully = vendingLog.reduce((sum, item) => sum + item.quantityVended, 0);

//       finalBillData.current = {
//         totalPrice, vendingLog, refundAmount: totalRefundAmount, transactionId, orderNumber: localStorage.getItem("order_number"),
//       };

//       // --- STAGE 4 & 5: NAVIGATION LOGIC (MODIFIED AS REQUESTED) ---
//       let updatePayload;
//       if (totalItemsVendedSuccessfully > 0 && totalRefundAmount === 0) {
//         // Full Success
//         updatePayload = { IsPaid: 1, IsSucceed: 1 };
//         setTimeout(() => navigate("/bill", { state: finalBillData.current, replace: true }), 1500);
        
//       } else if (totalItemsVendedSuccessfully > 0 || totalRefundAmount > 0) {
//   // --- Partial or Total Failure with Refund ---
//   updatePayload = { IsRefunded: 1, RefundedAmount: totalRefundAmount, RefundReason: 'Vending failure.', RefundStatus: 'Processed' };
  
//   try {
//       // =====================================================================
//       // === THE FIX IS HERE: CREATE THE CORRECT PAYLOAD FOR THE BACKEND ===
//       // =====================================================================
//       // The backend needs the original transaction ID to know which payment to refund.
//       const refundPayload = {
//         originalTransactionId: transactionId, // This is the ID from the payment page
//         amount: totalRefundAmount
//       };

//       // Now, call the API with the correct payload.
//       console.log("Attempting refund with payload:", refundPayload);
//       await qrgeneratorApi.getrefund(refundPayload);
      
//       setModalDetails({ 
//         title: "Refund Processed", 
//         message: `Soryy for the inconvienence A refund of ₹${totalRefundAmount.toFixed(2)} has been processed for the failed items with in 24hrs to 48hrs.`, 
//         amount: totalRefundAmount, 
//         isError: false 
//       });

//   } catch (refundError) {
//       updatePayload.RefundStatus = 'Failed';
//       console.error("--- REFUND API FAILED ---");
//       console.error("Full error object:", refundError);
//       if (refundError.response) {
//         console.error("Backend responded with:", refundError.response.data);
//       }
      
//       setModalDetails({ 
//         title: "Refund Error", 
//         message: "Sorry for the inconvenience. You will be refunded for the failed items.", 
//         amount: totalRefundAmount, 
//         isError: true 
//       });
//   }

//   // Show the message to the user
//   setIsModalOpen(true);
  
//   // And start the timer to navigate to the bill page automatically
//   navigationTimeoutId.current = setTimeout(() => navigate("/bill", { state: finalBillData.current, replace: true }), 5000);
// } else {
//         // Fallback for rare case of zero total price and no items
//         navigationTimeoutId.current = setTimeout(() => navigate("/", { replace: true }), 8000);
//       }

//       if (updatePayload) {
//         await refundApi.updatePaymentStatus(transactionId, updatePayload);
//       }
//     };

//     const timer = setTimeout(processVending, 500);
//     return () => { clearTimeout(timer); if (navigationTimeoutId.current) clearTimeout(navigationTimeoutId.current); };
//   }, [location.state]); 

//   // Handler to close the modal (e.g., when its internal timer finishes)
//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//   };

//   const handleGoHome = () => navigate("/");

//   // --- JSX with Modal Component included ---
//   return (
//     <div className="vending-page-wrapper">
//       <Header/>
//       <div className="vending-container">
//         <div className="vending-status-header">
//           {pageError ? ( <h2 className="vending-title error">{pageError}</h2> ) : ( <h2 className="vending-title">Dispensing Your Items</h2> )}
//           {!pageError && ( <p className="vending-subtitle">Please watch the product cards below for status updates.</p> )}
//         </div>
        
//         {!pageError && (
//             <div className="vending-product-grid">
//                 {motorCommands && motorCommands.map((command) => {
//                   const productForCard = {
//                     ...command,
//                     image: imageMap.get(command.productId)
//                   };
//                   return (
//                     <VendingProductCard 
//                       key={`${command.motorId}-${command.productId}`}
//                       product={productForCard}
//                       status={productStatuses[command.motorId] || 'pending'} 
//                     />
//                   );
//                 })}
//             </div>
//         )}
        
//         {/* The RefundModal is now back and will show as a temporary notification */}
//         <RefundModal 
//           isOpen={isModalOpen} 
//           onClose={handleCloseModal} 
//           details={modalDetails} 
//         />
//       </div>
//     </div>
//   );
// }Today OG


// OG original code:
//Top Og
// import React, { useEffect, useState, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import modbuscontrollerApi from "../../services/modbuscontrollerApi";
// import refillApi from "../../services/refillApi";
// import qrgeneratorApi from "../../services/qrgeneratorApi";
// import refundApi from "../../services/refundApi"; 
// // --- NEW --- Import the account transaction API service
// import accounttransactionApi from "../../services/accounttransactionApi";
// import rfidregisterApi from "../../services/rfidregisterApi"; 
// import RefundModal from "../RefundModal/RefundModal";
// import VendingProductCard from "./VendingProductCard";
// import "./VendingPage.css";
// import Header from "../../components/UI/Header/Header";

// // --- HELPER FUNCTIONS (UNCHANGED) ---
// const vendSingleItem = async (motorId) => {
//   if (!motorId) {
//     console.error("Vending attempt with undefined motorId.");
//     return { success: false, error: "Missing motor ID" };
//   }
//   try {
//     const res = await modbuscontrollerApi.startmotor(motorId);
//     return res || { success: false, error: "Unknown hardware response" };
//   } catch (error) {
//     console.error(`Vending failed for motor ${motorId}:`, error);
//     return { success: false, error: error.message || "Hardware communication error" };
//   }
// };

// const updateLocalStorageStock = (vendingLog) => {
//   try {
//     const cachedMotorsJSON = localStorage.getItem("refillMotors");
//     if (!cachedMotorsJSON) { return; }
//     let motors = JSON.parse(cachedMotorsJSON);
//     vendingLog.forEach(vendedItem => {
//       if (vendedItem.quantityVended > 0) {
//         const motorToUpdate = motors.find(m => m.id === vendedItem.motorId || m.Motor_number === vendedItem.motorId);
//         if (motorToUpdate) {
//           motorToUpdate.quantity = Math.max(0, motorToUpdate.quantity - vendedItem.quantityVended);
//         }
//       }
//     });
//     localStorage.setItem("refillMotors", JSON.stringify(motors));
//   } catch (error)
//   {
//     console.error("Failed to update localStorage stock cache.", error);
//   }
// };


// export default function VendingPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
  
//   const orderDataFromState = location.state || {};
//   const { 
//     selectedProducts, 
//     totalPrice, 
//     motorCommands, 
//     transactionId,
//     paymentMethod 
//   } = orderDataFromState;
  
//   const machineGuid = orderDataFromState.machineGuid || localStorage.getItem("machine_id");

//   const [productStatuses, setProductStatuses] = useState({});
//   const [pageError, setPageError] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalDetails, setModalDetails] = useState({ title: "", message: "", amount: 0, isError: false });
//   const finalBillData = useRef(null);
//   const navigationTimeoutId = useRef(null);

//   const imageMap = new Map();
//   if (Array.isArray(selectedProducts)) {
//     selectedProducts.forEach(p => {
//       const productIdKey = p.id || p.productId; 
//       imageMap.set(productIdKey, p.image);
//     });
//   }

//   useEffect(() => {
//     const processVending = async () => {
//       // --- STAGE 1: VALIDATION (UNCHANGED) ---
//       if (!motorCommands || motorCommands.length === 0 || !transactionId || !machineGuid) {
//         console.error("VendingPage validation failed:", { motorCommands, transactionId, machineGuid });
//         setPageError("Critical Error: Order data is missing. Redirecting...");
//         setTimeout(() => navigate("/", { replace: true }), 4000);
//         return;
//       }
      
//       // --- STAGE 2: VENDING PROCESS (UNCHANGED) ---
//       const initialStatuses = motorCommands.reduce((acc, cmd) => { acc[cmd.motorId] = 'pending'; return acc; }, {});
//       setProductStatuses(initialStatuses);
//       const vendingResults = motorCommands.map(cmd => ({ ...cmd, vendedSuccessfully: 0 }));
//       for (const result of vendingResults) {
//         if (!result.motorId) continue;
//         setProductStatuses(prev => ({ ...prev, [result.motorId]: 'vending' }));
//         for (let i = 0; i < result.quantity; i++) {
//           const vendAttempt = await vendSingleItem(result.motorId);
//           if (vendAttempt.success) { result.vendedSuccessfully += 1; } 
//           else { break; }
//           await new Promise(res => setTimeout(res, 400)); 
//         }
//         const finalStatusForThisCard = result.vendedSuccessfully < result.quantity ? 'failed' : 'success';
//         setProductStatuses(prev => ({ ...prev, [result.motorId]: finalStatusForThisCard }));
//         await new Promise(res => setTimeout(res, 800)); 
//       }

//       // --- STAGE 3: CALCULATE RESULTS (UNCHANGED) ---
//       const vendingLog = vendingResults.map(r => ({ ...r, quantityVended: r.vendedSuccessfully, quantityFailed: r.quantity - r.vendedSuccessfully }));
//       try {
//         updateLocalStorageStock(vendingLog);
//         await refillApi.decrementStockAfterVend(vendingLog, machineGuid);
//       } catch (error) { console.error("BACKGROUND STOCK UPDATE FAILED.", error); }
//       const totalRefundAmount = vendingLog.reduce((total, item) => total + (item.quantityFailed * (item.price || 0)), 0);
//       const totalItemsVendedSuccessfully = vendingLog.reduce((sum, item) => sum + item.quantityVended, 0);

//       finalBillData.current = {
//         totalPrice, vendingLog, refundAmount: totalRefundAmount, transactionId, orderNumber: localStorage.getItem("orderNumber"),
//       };

//       // --- STAGE 4 & 5: NAVIGATION & REFUND LOGIC ---
//      let updatePayload;
//       if (totalItemsVendedSuccessfully > 0 && totalRefundAmount === 0) {
//         // --- Full Success Case ---
//         updatePayload = { IsPaid: 1, IsSucceed: 1 }; // For the other API call

//         // --- Logic to update your AccountData table on SUCCESS ---
//         if (paymentMethod === 'Account') {
//           // Get the order_id from the data we prepared earlier
//           const orderIdToUpdate = finalBillData.current.orderNumber;
          
//           // CRITICAL CHECK: Ensure we have an order_id before proceeding.
//           if (!orderIdToUpdate) {
//             console.error("FATAL: Cannot update transaction because order_id is missing. Check localStorage.");
//           } else {
//             // Construct the exact payload your backend needs for success
//             const successPayload = {
//               is_paid: true,
//               is_refunded: false,
//               refunded_amount: 0
//             };

//             console.log(`Attempting to update transaction by order ID [${orderIdToUpdate}] with SUCCESS payload:`, successPayload);
            
//             try {
//               // Call the API function with the order_id and the payload
//               await accounttransactionApi.updateaccounttransaction(orderIdToUpdate, successPayload);
//               console.log("SUCCESS: AccountData transaction updated successfully.");
//             } catch (error) {
//               console.error(`API ERROR on SUCCESS update for order_id [${orderIdToUpdate}]. Details:`, error);
//             }
//           }
//         }
        
//         setTimeout(() => navigate("/bill", { state: finalBillData.current, replace: true }), 1500);
        
//       } else if (totalRefundAmount > 0) {
//         // --- Partial or Total Failure with a Refund ---
//         updatePayload = { IsRefunded: 1, RefundedAmount: totalRefundAmount, RefundReason: 'Vending failure.', RefundStatus: 'Processed' };
  
//         if (paymentMethod === 'Account') {
//             console.log("ACCOUNT PAYMENT: Processing refund and updating AccountData transaction.");

//             // --- Logic to update your AccountData table on REFUND ---
//             const orderIdToUpdate = finalBillData.current.orderNumber;

//             if (!orderIdToUpdate) {
//                 console.error("FATAL: Cannot update transaction because order_id is missing. Check localStorage.");
//             } else {
//                 // Construct the exact payload your backend needs for a refund
//                 const refundPayload = {
//                   is_paid: false,
//                   is_refunded: true,
//                   refunded_amount: totalRefundAmount
//                 };

//                 console.log(`Attempting to update transaction by order ID [${orderIdToUpdate}] with REFUND payload:`, refundPayload);
                
//                 try {
//                   // Call the API function with the order_id and the payload
//                   await accounttransactionApi.updateaccounttransaction(orderIdToUpdate, refundPayload);
//                   console.log("SUCCESS: AccountData transaction updated for refund successfully.");
//                 } catch (error) {
//                   console.error(`API ERROR on REFUND update for order_id [${orderIdToUpdate}]. Details:`, error);
//                 }
//             }

//             // This is your existing account refund logic, it is UNCHANGED.
//             const rfid = transactionId?.split('-')[1];
//             if (rfid) {
//                 try {
//                     const refundPayload = { balance: totalRefundAmount };
//                     await rfidregisterApi.updateaccount(rfid, refundPayload);
//                     setModalDetails({ title: "Amount Credited", message: `A refund of ₹${totalRefundAmount.toFixed(2)} has been instantly credited back to your account.`, amount: totalRefundAmount, isError: false });
//                 } catch (accountRefundError) {
//                     updatePayload.RefundStatus = 'Failed';
//                     setModalDetails({ title: "Refund Error", message: "We're sorry. There was an error processing your account refund. Please contact support.", amount: totalRefundAmount, isError: true });
//                 }
//             } else {
//                  updatePayload.RefundStatus = 'Failed';
//                  setModalDetails({ title: "System Error", message: "A refund could not be automatically processed. Please contact support.", amount: totalRefundAmount, isError: true });
//             }

//         } else {
//             // --- This is the EXISTING UPI/Card Refund Logic (UNCHANGED) ---
//             console.log("UPI/CARD PAYMENT DETECTED. Processing standard refund.");
//             try {
//                 const refundPayload = { originalTransactionId: transactionId, amount: totalRefundAmount };
//                 await qrgeneratorApi.getrefund(refundPayload);
//                 setModalDetails({ title: "Refund Processed", message: `A refund of ₹${totalRefundAmount.toFixed(2)} has been processed...`, amount: totalRefundAmount, isError: false });
//             } catch (refundError) {
//                 updatePayload.RefundStatus = 'Failed';
//                 setModalDetails({ title: "Refund Error", message: "We're sorry, but the automated refund failed...", amount: totalRefundAmount, isError: true });
//             }
//         }
        
//         setIsModalOpen(true);
//         navigationTimeoutId.current = setTimeout(() => navigate("/bill", { state: finalBillData.current, replace: true }), 5000);

//       } else {
//         // Fallback case (UNCHANGED)
//         navigationTimeoutId.current = setTimeout(() => navigate("/", { replace: true }), 8000);
//       }

//       if (updatePayload) {
//         // This part is common for all outcomes (UNCHANGED)
//         await refundApi.updatePaymentStatus(transactionId, updatePayload);
//       }
//     };

//     const timer = setTimeout(processVending, 500);
//     return () => { clearTimeout(timer); if (navigationTimeoutId.current) clearTimeout(navigationTimeoutId.current); };
//   }, []); 


//   // --- MODAL HANDLERS (UNCHANGED) ---
//   const handleCloseModal = () => setIsModalOpen(false);
//   const handleGoHome = () => navigate("/");

//   // --- JSX RENDER (UNCHANGED) ---
//   return (
//     <div className="vending-page-wrapper">
//       <Header/>
//       <div className="vending-container">
//         <div className="vending-status-header">
//           {pageError ? ( <h2 className="vending-title error">{pageError}</h2> ) : ( <h2 className="vending-title">Dispensing Your Items</h2> )}
//           {!pageError && ( <p className="vending-subtitle">Please watch the product cards below for status updates.</p> )}
//         </div>
        
//         {!pageError && (
//             <div className="vending-product-grid">
//                 {motorCommands && motorCommands.map((command) => {
//                   const productForCard = { ...command, image: imageMap.get(command.productId) };
//                   return (
//                     <VendingProductCard 
//                       key={`${command.motorId}-${command.productId}`}
//                       product={productForCard}
//                       status={productStatuses[command.motorId] || 'pending'} 
//                     />
//                   );
//                 })}
//             </div>
//         )}
        
//         <RefundModal 
//           isOpen={isModalOpen} 
//           onClose={handleCloseModal} 
//           details={modalDetails} 
//         />
//       </div>
//     </div>
//   );
// }
//top og
// OG ORIGINAL CODE

// import React, { useEffect, useState, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import modbuscontrollerApi from "../../services/modbuscontrollerApi";
// import refillApi from "../../services/refillApi";
// import qrgeneratorApi from "../../services/qrgeneratorApi";
// import refundApi from "../../services/refundApi"; 
// import accounttransactionApi from "../../services/accounttransactionApi";
// import rfidregisterApi from "../../services/rfidregisterApi";
// // --- NEW --- Import the new modbus trigger service
// import modbustriggerApi from "../../services/modbustriggerApi"; 
// import RefundModal from "../RefundModal/RefundModal";
// import VendingProductCard from "./VendingProductCard";
// import "./VendingPage.css";
// import Header from "../../components/UI/Header/Header";

// // --- HELPER FUNCTIONS (UNCHANGED) ---
// const vendSingleItem = async (motorId) => {
//   if (!motorId) {
//     console.error("Vending attempt with undefined motorId.");
//     return { success: false, error: "Missing motor ID" };
//   }
//   try {
//     const res = await modbuscontrollerApi.startmotor(motorId);
//     return res || { success: false, error: "Unknown hardware response" };
//   } catch (error) {
//     console.error(`Vending failed for motor ${motorId}:`, error);
//     return { success: false, error: error.message || "Hardware communication error" };
//   }
// };

// const updateLocalStorageStock = (vendingLog) => {
//   try {
//     const cachedMotorsJSON = localStorage.getItem("refillMotors");
//     if (!cachedMotorsJSON) { return; }
//     let motors = JSON.parse(cachedMotorsJSON);
//     vendingLog.forEach(vendedItem => {
//       if (vendedItem.quantityVended > 0) {
//         const motorToUpdate = motors.find(m => m.id === vendedItem.motorId || m.Motor_number === vendedItem.motorId);
//         if (motorToUpdate) {
//           motorToUpdate.quantity = Math.max(0, motorToUpdate.quantity - vendedItem.quantityVended);
//         }
//       }
//     });
//     localStorage.setItem("refillMotors", JSON.stringify(motors));
//   } catch (error)
//   {
//     console.error("Failed to update localStorage stock cache.", error);
//   }
// };


// export default function VendingPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
  
//   const orderDataFromState = location.state || {};
//   const { 
//     selectedProducts, 
//     totalPrice, 
//     motorCommands, 
//     transactionId,
//     paymentMethod 
//   } = orderDataFromState;
  
//   const machineGuid = orderDataFromState.machineGuid || localStorage.getItem("machine_id");

//   const [productStatuses, setProductStatuses] = useState({});
//   const [pageError, setPageError] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalDetails, setModalDetails] = useState({ title: "", message: "", amount: 0, isError: false });
//   const finalBillData = useRef(null);
//   const navigationTimeoutId = useRef(null);

//   const imageMap = new Map();
//   if (Array.isArray(selectedProducts)) {
//     selectedProducts.forEach(p => {
//       const productIdKey = p.id || p.productId; 
//       imageMap.set(productIdKey, p.image);
//     });
//   }

//   useEffect(() => {
//     const processVending = async () => {
//       // --- STAGE 1: VALIDATION (UNCHANGED) ---
//       if (!motorCommands || motorCommands.length === 0 || !transactionId || !machineGuid) {
//         console.error("VendingPage validation failed:", { motorCommands, transactionId, machineGuid });
//         setPageError("Critical Error: Order data is missing. Redirecting...");
//         setTimeout(() => navigate("/", { replace: true }), 4000);
//         return;
//       }
      
//       // --- STAGE 2: VENDING PROCESS (MODIFIED) ---
//       const initialStatuses = motorCommands.reduce((acc, cmd) => { acc[cmd.motorId] = 'pending'; return acc; }, {});
//       setProductStatuses(initialStatuses);
//       const vendingResults = motorCommands.map(cmd => ({ ...cmd, vendedSuccessfully: 0 }));

//       // --- MODIFIED --- Use .entries() to get the index of the current motor command.
//       for (const [index, result] of vendingResults.entries()) {
//         if (!result.motorId) continue;
        
//         setProductStatuses(prev => ({ ...prev, [result.motorId]: 'vending' }));
//         for (let i = 0; i < result.quantity; i++) {
//           const statusCheck = await modbuscontrollerApi.getmodbusstatus()
//           if(statusCheck.status == 0){
//             const vendAttempt = await vendSingleItem(result.motorId);
//           }
//           if (vendAttempt.success) { result.vendedSuccessfully += 1; } 
//           else { break; }
//           await new Promise(res => setTimeout(res, 400)); 
//         }

//         const finalStatusForThisCard = result.vendedSuccessfully < result.quantity ? 'failed' : 'success';
//         setProductStatuses(prev => ({ ...prev, [result.motorId]: finalStatusForThisCard }));
        
//         // --- NEW --- LOGIC TO TRIGGER CONTINUE OR FINISH ---
//         try {
//             // Check if this is the LAST motor command in the array.
//             if (index < vendingResults.length - 1) {
//                 console.log(`Vending for motor ${result.motorId} complete. Triggering CONTINUE.`);
//                 await modbustriggerApi.coilregistercontinue({ value: true });
//             } else {
//                 console.log(`Final vending for motor ${result.motorId} complete. Triggering FINISH.`);
//                 await modbustriggerApi.coilregisterfinsih({ value: true });
//             }
//         } catch (triggerError) {
//             console.error("Failed to send a modbus trigger signal (continue/finish).", triggerError);
  
//         }

//         await new Promise(res => setTimeout(res, 800)); 
//       }

//       // --- STAGE 3, 4, 5 (UNCHANGED) ---
//       // The rest of your logic remains the same as it correctly handles refunds and navigation
//       // based on the final results calculated from the vending loop above.
      
//       const vendingLog = vendingResults.map(r => ({ ...r, quantityVended: r.vendedSuccessfully, quantityFailed: r.quantity - r.vendedSuccessfully }));
//       try {
//         updateLocalStorageStock(vendingLog);
//         await refillApi.decrementStockAfterVend(vendingLog, machineGuid);
//       } catch (error) { console.error("BACKGROUND STOCK UPDATE FAILED.", error); }
//       const totalRefundAmount = vendingLog.reduce((total, item) => total + (item.quantityFailed * (item.price || 0)), 0);
//       const totalItemsVendedSuccessfully = vendingLog.reduce((sum, item) => sum + item.quantityVended, 0);

//       finalBillData.current = {
//         totalPrice, vendingLog, refundAmount: totalRefundAmount, transactionId, orderNumber: localStorage.getItem("orderNumber"),
//       };

//       let updatePayload;
//       if (totalItemsVendedSuccessfully > 0 && totalRefundAmount === 0) {
//         updatePayload = { IsPaid: 1, IsSucceed: 1 };
//         if (paymentMethod === 'Account') {
//           const orderIdToUpdate = finalBillData.current.orderNumber;
//           if (!orderIdToUpdate) {
//             console.error("FATAL: Cannot update transaction because order_id is missing. Check localStorage.");
//           } else {
//             const successPayload = { is_paid: true, is_refunded: false, refunded_amount: 0 };
//             console.log(`Attempting to update transaction by order ID [${orderIdToUpdate}] with SUCCESS payload:`, successPayload);
//             try {
//               await accounttransactionApi.updateaccounttransaction(orderIdToUpdate, successPayload);
//               console.log("SUCCESS: AccountData transaction updated successfully.");
//             } catch (error) {
//               console.error(`API ERROR on SUCCESS update for order_id [${orderIdToUpdate}]. Details:`, error);
//             }
//           }
//         }
//         setTimeout(() => navigate("/bill", { state: finalBillData.current, replace: true }), 1500);
//       } else if (totalRefundAmount > 0) {
//         updatePayload = { IsRefunded: 1, RefundedAmount: totalRefundAmount, RefundReason: 'Vending failure.', RefundStatus: 'Processed' };
//         if (paymentMethod === 'Account') {
//             console.log("ACCOUNT PAYMENT: Processing refund and updating AccountData transaction.");
//             const orderIdToUpdate = finalBillData.current.orderNumber;
//             if (!orderIdToUpdate) {
//                 console.error("FATAL: Cannot update transaction because order_id is missing. Check localStorage.");
//             } else {
//                 const refundPayload = { is_paid: false, is_refunded: true, refunded_amount: totalRefundAmount };
//                 console.log(`Attempting to update transaction by order ID [${orderIdToUpdate}] with REFUND payload:`, refundPayload);
//                 try {
//                   await accounttransactionApi.updateaccounttransaction(orderIdToUpdate, refundPayload);
//                   console.log("SUCCESS: AccountData transaction updated for refund successfully.");
//                 } catch (error) {
//                   console.error(`API ERROR on REFUND update for order_id [${orderIdToUpdate}]. Details:`, error);
//                 }
//             }
//             const rfid = transactionId?.split('-')[1];
//             if (rfid) {
//                 try {
//                     const refundPayload = { balance: totalRefundAmount };
//                     await rfidregisterApi.updateaccount(rfid, refundPayload);
//                     setModalDetails({ title: "Amount Credited", message: `A refund of ₹${totalRefundAmount.toFixed(2)} has been instantly credited back to your account.`, amount: totalRefundAmount, isError: false });
//                 } catch (accountRefundError) {
//                     updatePayload.RefundStatus = 'Failed';
//                     setModalDetails({ title: "Refund Error", message: "We're sorry. There was an error processing your account refund. Please contact support.", amount: totalRefundAmount, isError: true });
//                 }
//             } else {
//                  updatePayload.RefundStatus = 'Failed';
//                  setModalDetails({ title: "System Error", message: "A refund could not be automatically processed. Please contact support.", amount: totalRefundAmount, isError: true });
//             }
//         } else {
//             console.log("UPI/CARD PAYMENT DETECTED. Processing standard refund.");
//             try {
//                 const refundPayload = { originalTransactionId: transactionId, amount: totalRefundAmount };
//                 await qrgeneratorApi.getrefund(refundPayload);
//                 setModalDetails({ title: "Refund Processed", message: `A refund of ₹${totalRefundAmount.toFixed(2)} has been processed...`, amount: totalRefundAmount, isError: false });
//             } catch (refundError) {
//                 updatePayload.RefundStatus = 'Failed';
//                 setModalDetails({ title: "Refund Error", message: "We're sorry, but the automated refund failed...", amount: totalRefundAmount, isError: true });
//             }
//         }
//         setIsModalOpen(true);
//         navigationTimeoutId.current = setTimeout(() => navigate("/bill", { state: finalBillData.current, replace: true }), 5000);
//       } else {
//         navigationTimeoutId.current = setTimeout(() => navigate("/", { replace: true }), 8000);
//       }

//       if (updatePayload) {
//         await refundApi.updatePaymentStatus(transactionId, updatePayload);
//       }
//     };

//     const timer = setTimeout(processVending, 500);
//     return () => { clearTimeout(timer); if (navigationTimeoutId.current) clearTimeout(navigationTimeoutId.current); };
//   }, []); 

//   // --- MODAL HANDLERS & JSX RENDER (UNCHANGED) ---
//   const handleCloseModal = () => setIsModalOpen(false);
//   const handleGoHome = () => navigate("/");

//   return (
//     <div className="vending-page-wrapper">
//       <Header/>
//       <div className="vending-container">
//         <div className="vending-status-header">
//           {pageError ? ( <h2 className="vending-title error">{pageError}</h2> ) : ( <h2 className="vending-title">Dispensing Your Items</h2> )}
//           {!pageError && ( <p className="vending-subtitle">Please watch the product cards below for status updates.</p> )}
//         </div>
        
//         {!pageError && (
//             <div className="vending-product-grid">
//                 {motorCommands && motorCommands.map((command) => {
//                   const productForCard = { ...command, image: imageMap.get(command.productId) };
//                   return (
//                     <VendingProductCard 
//                       key={`${command.motorId}-${command.productId}`}
//                       product={productForCard}
//                       status={productStatuses[command.motorId] || 'pending'} 
//                     />
//                   );
//                 })}
//             </div>
//         )}
        
//         <RefundModal 
//           isOpen={isModalOpen} 
//           onClose={handleCloseModal} 
//           details={modalDetails} 
//         />
//       </div>
//     </div>
//   );
// }

// import React, { useEffect, useState, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import modbuscontrollerApi from "../../services/modbuscontrollerApi";
// import refillApi from "../../services/refillApi";
// import qrgeneratorApi from "../../services/qrgeneratorApi";
// import refundApi from "../../services/refundApi"; 
// import accounttransactionApi from "../../services/accounttransactionApi";
// import rfidregisterApi from "../../services/rfidregisterApi";
// // --- NEW --- Import the new modbus trigger service
// import modbustriggerApi from "../../services/modbustriggerApi"; 
// import RefundModal from "../RefundModal/RefundModal";
// import VendingProductCard from "./VendingProductCard";
// import "./VendingPage.css";
// import Header from "../../components/UI/Header/Header";

// // --- HELPER FUNCTIONS (UNCHANGED) ---
// const vendSingleItem = async (motorId) => {
//   if (!motorId) {
//     console.error("Vending attempt with undefined motorId.");
//     return { success: false, error: "Missing motor ID" };
//   }
//   try {
//     const res = await modbuscontrollerApi.startmotor(motorId);
//     return res || { success: false, error: "Unknown hardware response" };
//   } catch (error) {
//     console.error(`Vending failed for motor ${motorId}:`, error);
//     return { success: false, error: error.message || "Hardware communication error" };
//   }
// };

// let callF1F4 = []

// const waitForModbusReady = async (maxWaitTime = 30000) => {
//   const startTime = Date.now();
//   callF1F4 = []; // Reset the array at the start
//   let trackingStarted = false;

//   while (Date.now() - startTime < maxWaitTime) {
//     try {
//       const statusResponse = await modbuscontrollerApi.getmodbusstatus();
//       console.log("Modbus status response:", statusResponse);

//       if (statusResponse.success) {
//         const status = statusResponse.status;

//         if (status === 1 && !trackingStarted) {
//           trackingStarted = true;
//           if (!callF1F4.includes(1)) {
//             callF1F4.push(1);
//             console.log("Status 1 received. Started tracking.");
//           }
//         }

//         if (trackingStarted) {
//           if (status === 2 && !callF1F4.includes(2)) {
//             callF1F4.push(2);
//             console.log("Status 2 received after 1.");
//           }

//           if (callF1F4.includes(1) && callF1F4.includes(2)) {
//             console.log("Received both status 1 and 2. Modbus ready.");
//             callF1F4 = []; // Clear after success
//             return true;
//           }
//         }
//       } else {
//         console.warn("Invalid modbus response:", statusResponse);
//       }

//       // Wait 500ms before retrying
//       await new Promise(res => setTimeout(res, 500));

//     } catch (error) {
//       console.error("Error checking modbus status:", error);
//       await new Promise(res => setTimeout(res, 500));
//     }
//   }

//   console.error("Modbus status check timed out after", maxWaitTime, "ms");
//   callF1F4 = []; // Clear on timeout as well
//   return false;
// };

// // const waitForRunMotor = async (maxWaitTime = 30000) => {
// //   const startTime = Date.now();
// //   callF1F4 = []; // Reset the array at the start
// //   let trackingStarted = false;

// //   while (Date.now() - startTime < maxWaitTime) {
// //     try {
// //       const statusResponse = await modbustriggerApi.triggerhome();
// //       console.log("Modbus coil status response:", statusResponse);

// //       if (statusResponse.success && statusResponse.status === 1) {
// //             return true;
// //           }
// //       else {
// //         console.warn("Invalid coil response:", statusResponse);
// //       }
// //       await new Promise(res => setTimeout(res, 500));

// //     } catch (error) {
// //       console.error("Error checking coil status:", error);
// //       await new Promise(res => setTimeout(res, 500));
// //     }
// //   }

// //   console.error("Modbus status check timed out after", maxWaitTime, "ms");
// //   callF1F4 = []; // Clear on timeout as well
// //   return false;
// // };

// const waitForRunMotor = async (maxWaitTime = 40000) => {
//   callF1F4 = []; // Reset the array at the start

//   return new Promise((resolve, reject) => {
//     const startTime = Date.now();

//     const interval = setInterval(async () => {
//       const elapsed = Date.now() - startTime;
//       if (elapsed >= maxWaitTime) {
//         clearInterval(interval);
//         console.error("Modbus status check timed out after", maxWaitTime, "ms");
//         callF1F4 = [];
//         return resolve(false);
//       }

//       try {
//         const statusResponse = await modbustriggerApi.triggerhome();
//         console.log("Modbus coil status response:", statusResponse);

//         if (statusResponse.success && statusResponse.status === 1) {
//           clearInterval(interval);
//           return resolve(true);
//         } else {
//           console.warn("Invalid coil response:", statusResponse);
//         }
//       } catch (error) {
//         console.error("Error checking coil status:", error);
//       }
//     }, 500); // Run every 500ms
//   });
// };


// const updateLocalStorageStock = (vendingLog) => {
//   try {
//     const cachedMotorsJSON = localStorage.getItem("refillMotors");
//     if (!cachedMotorsJSON) { return; }
//     let motors = JSON.parse(cachedMotorsJSON);
//     vendingLog.forEach(vendedItem => {
//       if (vendedItem.quantityVended > 0) {
//         const motorToUpdate = motors.find(m => m.id === vendedItem.motorId || m.Motor_number === vendedItem.motorId);
//         if (motorToUpdate) {
//           motorToUpdate.quantity = Math.max(0, motorToUpdate.quantity - vendedItem.quantityVended);
//         }
//       }
//     });
//     localStorage.setItem("refillMotors", JSON.stringify(motors));
//   } catch (error) {
//     console.error("Failed to update localStorage stock cache.", error);
//   }
// };

// export default function VendingPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
  
//   const orderDataFromState = location.state || {};
//   const { 
//     selectedProducts, 
//     totalPrice, 
//     motorCommands, 
//     transactionId,
//     paymentMethod 
//   } = orderDataFromState;
  
//   const machineGuid = orderDataFromState.machineGuid || localStorage.getItem("machine_id");

//   const [productStatuses, setProductStatuses] = useState({});
//   const [pageError, setPageError] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalDetails, setModalDetails] = useState({ title: "", message: "", amount: 0, isError: false });
//   const finalBillData = useRef(null);
//   const navigationTimeoutId = useRef(null);

//   const imageMap = new Map();
//   if (Array.isArray(selectedProducts)) {
//     selectedProducts.forEach(p => {
//       const productIdKey = p.id || p.productId; 
//       imageMap.set(productIdKey, p.image);
//     });
//   }

//   useEffect(() => {
//     const processVending = async () => {
//       // --- STAGE 1: VALIDATION (UNCHANGED) ---
//       if (!motorCommands || motorCommands.length === 0 || !transactionId || !machineGuid) {
//         console.error("VendingPage validation failed:", { motorCommands, transactionId, machineGuid });
//         setPageError("Critical Error: Order data is missing. Redirecting...");
//         setTimeout(() => navigate("/", { replace: true }), 4000);
//         return;
//       }
      
//       // --- STAGE 2: VENDING PROCESS (FIXED) ---
//       const initialStatuses = motorCommands.reduce((acc, cmd) => { 
//         acc[cmd.motorId] = 'pending'; 
//         return acc; 
//       }, {});
//       setProductStatuses(initialStatuses);
//       const vendingResults = motorCommands.map(cmd => ({ ...cmd, vendedSuccessfully: 0 }));

//       // Calculate total items across all motors to determine when we reach the last item
//       const totalItemsToVend = vendingResults.reduce((sum, result) => sum + result.quantity, 0);    
//       let currentItemIndex = 0;

//       // Process each motor command
//       for (const [motorIndex, result] of vendingResults.entries()) {
//         if (!result.motorId) continue;
        
//         console.log(`Starting vending process for motor ${result.motorId}, quantity: ${result.quantity}`);
//         setProductStatuses(prev => ({ ...prev, [result.motorId]: 'vending' }));
        
//         // Vend each item for this motor
//         for (let i = 0; i < result.quantity; i++) {
//           currentItemIndex++;
//           console.log(`Vending item ${i + 1}/${result.quantity} for motor ${result.motorId} (Overall: ${currentItemIndex}/${totalItemsToVend})`);
          
//           // Wait for modbus coil to be ready before attempting to vend
//           const isReady = await waitForRunMotor();
//           if (!isReady) {
//             console.error(`Coil not ready for motor ${result.motorId}, item ${i + 1}`);
//             break;
//           }
          
//           // Attempt to vend the item
//           const vendAttempt = await vendSingleItem(result.motorId);
//           if (vendAttempt.success) { 
//             result.vendedSuccessfully += 1;
//             console.log(`Successfully vended item ${i + 1} for motor ${result.motorId}`);
//           } else { 
//             console.error(`Failed to vend item ${i + 1} for motor ${result.motorId}:`, vendAttempt.error);
//             break; 
//           }
          
//           // --- MODBUS TRIGGER LOGIC AFTER EACH ITEM ---
//           try {
//             // Check if this is the very last item of the very last motor
//             const isLastItem = currentItemIndex === totalItemsToVend;
            
//             if (isLastItem) {
//               // This is the final item - trigger FINISH
//               // Wait for modbus to be ready before attempting to vend
//               const isReady = await waitForModbusReady();
//               if (!isReady) {
//                 console.error(`Modbus not ready for motor ${result.motorId}, item ${i + 1}`);
//                 break;
//               }
//               console.log(`Final item vended (Motor ${result.motorId}, Item ${i + 1}). Triggering FINISH.`);
//               await modbustriggerApi.coilregisterfinsih({ value: true });
//             } else {
//               // Not the last item - trigger CONTINUE
//                 // Wait for modbus to be ready before attempting to vend
//               const isReady = await waitForModbusReady();
//               if (!isReady) {
//                 console.error(`Modbus not ready for motor ${result.motorId}, item ${i + 1}`);
//                 break;
//               }
//               console.log(`Item vended (Motor ${result.motorId}, Item ${i + 1}). Triggering CONTINUE.`);
//               await modbustriggerApi.coilregistercontinue({ value: true });
//             }
//           } catch (triggerError) {
//             console.error("Failed to send modbus trigger signal (continue/finish):", triggerError);
//           }
          
//           // Wait between individual item vends
//           await new Promise(res => setTimeout(res, 400)); 
//         }

//         // Update status for this motor
//         const finalStatusForThisCard = result.vendedSuccessfully < result.quantity ? 'failed' : 'success';
//         setProductStatuses(prev => ({ ...prev, [result.motorId]: finalStatusForThisCard }));
        
//         console.log(`Motor ${result.motorId} vending complete. Success: ${result.vendedSuccessfully}/${result.quantity}`);

//         // Wait between different motors
//         await new Promise(res => setTimeout(res, 800)); 
//       }

//       console.log("All vending operations completed. Final results:", vendingResults);

//       // --- STAGE 3, 4, 5: POST-VENDING PROCESSING (UNCHANGED) ---
//       const vendingLog = vendingResults.map(r => ({ 
//         ...r, 
//         quantityVended: r.vendedSuccessfully, 
//         quantityFailed: r.quantity - r.vendedSuccessfully 
//       }));
      
//       try {
//         updateLocalStorageStock(vendingLog);
//         await refillApi.decrementStockAfterVend(vendingLog, machineGuid);
//       } catch (error) { 
//         console.error("BACKGROUND STOCK UPDATE FAILED:", error); 
//       }
      
//       const totalRefundAmount = vendingLog.reduce((total, item) => 
//         total + (item.quantityFailed * (item.price || 0)), 0);
//       const totalItemsVendedSuccessfully = vendingLog.reduce((sum, item) => 
//         sum + item.quantityVended, 0);

//       finalBillData.current = {
//         totalPrice, 
//         vendingLog, 
//         refundAmount: totalRefundAmount, 
//         transactionId, 
//         orderNumber: localStorage.getItem("orderNumber"),
//       };

//       let updatePayload;
//       if (totalItemsVendedSuccessfully > 0 && totalRefundAmount === 0) {
//         // All items vended successfully
//         updatePayload = { IsPaid: 1, IsSucceed: 1 };
//         if (paymentMethod === 'Account') {
//           const orderIdToUpdate = finalBillData.current.orderNumber;
//           if (!orderIdToUpdate) {
//             console.error("FATAL: Cannot update transaction because order_id is missing. Check localStorage.");
//           } else {
//             const successPayload = { is_paid: true, is_refunded: false, refunded_amount: 0 };
//             console.log(`Attempting to update transaction by order ID [${orderIdToUpdate}] with SUCCESS payload:`, successPayload);
//             try {
//               await accounttransactionApi.updateaccounttransaction(orderIdToUpdate, successPayload);
//               console.log("SUCCESS: AccountData transaction updated successfully.");
//             } catch (error) {
//               console.error(`API ERROR on SUCCESS update for order_id [${orderIdToUpdate}]. Details:`, error);
//             }
//           }
//         }
//         setTimeout(() => navigate("/bill", { state: finalBillData.current, replace: true }), 1500);
//       } else if (totalRefundAmount > 0) {
//         // Some items failed - process refund
//         updatePayload = { 
//           IsRefunded: 1, 
//           RefundedAmount: totalRefundAmount, 
//           RefundReason: 'Vending failure.', 
//           RefundStatus: 'Processed' 
//         };
        
//         if (paymentMethod === 'Account') {
//           console.log("ACCOUNT PAYMENT: Processing refund and updating AccountData transaction.");
//           const orderIdToUpdate = finalBillData.current.orderNumber;
//           if (!orderIdToUpdate) {
//             console.error("FATAL: Cannot update transaction because order_id is missing. Check localStorage.");
//           } else {
//             const refundPayload = { is_paid: false, is_refunded: true, refunded_amount: totalRefundAmount };
//             console.log(`Attempting to update transaction by order ID [${orderIdToUpdate}] with REFUND payload:`, refundPayload);
//             try {
//               await accounttransactionApi.updateaccounttransaction(orderIdToUpdate, refundPayload);
//               console.log("SUCCESS: AccountData transaction updated for refund successfully.");
//             } catch (error) {
//               console.error(`API ERROR on REFUND update for order_id [${orderIdToUpdate}]. Details:`, error);
//             }
//           }
          
//           const rfid = transactionId?.split('-')[1];
//           if (rfid) {
//             try {
//               const refundPayload = { balance: totalRefundAmount };
//               await rfidregisterApi.updateaccount(rfid, refundPayload);
//               setModalDetails({ 
//                 title: "Amount Credited", 
//                 message: `A refund of ₹${totalRefundAmount.toFixed(2)} has been instantly credited back to your account.`, 
//                 amount: totalRefundAmount, 
//                 isError: false 
//               });
//             } catch (accountRefundError) {
//               updatePayload.RefundStatus = 'Failed';
//               setModalDetails({ 
//                 title: "Refund Error", 
//                 message: "We're sorry. There was an error processing your account refund. Please contact support.", 
//                 amount: totalRefundAmount, 
//                 isError: true 
//               });
//             }
//           } else {
//             updatePayload.RefundStatus = 'Failed';
//             setModalDetails({ 
//               title: "System Error", 
//               message: "A refund could not be automatically processed. Please contact support.", 
//               amount: totalRefundAmount, 
//               isError: true 
//             });
//           }
//         } else {
//           console.log("UPI/CARD PAYMENT DETECTED. Processing standard refund.");
//           try {
//             const refundPayload = { originalTransactionId: transactionId, amount: totalRefundAmount };
//             await qrgeneratorApi.getrefund(refundPayload);
//             setModalDetails({ 
//               title: "Refund Processed", 
//               message: `A refund of ₹${totalRefundAmount.toFixed(2)} has been processed...`, 
//               amount: totalRefundAmount, 
//               isError: false 
//             });
//           } catch (refundError) {
//             updatePayload.RefundStatus = 'Failed';
//             setModalDetails({ 
//               title: "Refund Error", 
//               message: "We're sorry, but the automated refund failed...", 
//               amount: totalRefundAmount, 
//               isError: true 
//             });
//           }
//         }
        
//         setIsModalOpen(true);
//         navigationTimeoutId.current = setTimeout(() => 
//           navigate("/bill", { state: finalBillData.current, replace: true }), 5000);
//       } else {
//         // No items vended successfully and no refund needed
//         navigationTimeoutId.current = setTimeout(() => navigate("/", { replace: true }), 8000);
//       }

//       if (updatePayload) {
//         try {
//           await refundApi.updatePaymentStatus(transactionId, updatePayload);
//         } catch (error) {
//           console.error("Failed to update payment status:", error);
//         }
//       }
//     };

//     const timer = setTimeout(processVending, 500);
//     return () => { 
//       clearTimeout(timer); 
//       if (navigationTimeoutId.current) clearTimeout(navigationTimeoutId.current); 
//     };
//   }, []); 

//   // --- MODAL HANDLERS & JSX RENDER (UNCHANGED) ---
//   const handleCloseModal = () => setIsModalOpen(false);
//   const handleGoHome = () => navigate("/");

//   return (
//     <div className="vending-page-wrapper">
//       <Header/>
//       <div className="vending-container">
//         <div className="vending-status-header">
//           {pageError ? ( 
//             <h2 className="vending-title error">{pageError}</h2> 
//           ) : ( 
//             <h2 className="vending-title">Dispensing Your Items</h2> 
//           )}
//           {!pageError && ( 
//             <p className="vending-subtitle">Please watch the product cards below for status updates.</p> 
//           )}
//         </div>
        
//         {!pageError && (
//           <div className="vending-product-grid">
//             {motorCommands && motorCommands.map((command) => {
//               const productForCard = { ...command, image: imageMap.get(command.productId) };
//               return (
//                 <VendingProductCard 
//                   key={`${command.motorId}-${command.productId}`}
//                   product={productForCard}
//                   status={productStatuses[command.motorId] || 'pending'} 
//                 />
//               );
//             })}
//           </div>
//         )}
        
//         <RefundModal 
//           isOpen={isModalOpen} 
//           onClose={handleCloseModal} 
//           details={modalDetails} 
//         />
//       </div>
//     </div>
//   );
// }

// import React, { useEffect, useState, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import modbuscontrollerApi from "../../services/modbuscontrollerApi";
// import refillApi from "../../services/refillApi";
// import qrgeneratorApi from "../../services/qrgeneratorApi";
// import refundApi from "../../services/refundApi"; 
// import accounttransactionApi from "../../services/accounttransactionApi";
// import rfidregisterApi from "../../services/rfidregisterApi";
// import modbustriggerApi from "../../services/modbustriggerApi"; 
// import RefundModal from "../RefundModal/RefundModal";
// import VendingProductCard from "./VendingProductCard";
// import "./VendingPage.css";
// import Header from "../../components/UI/Header/Header";

// // --- HELPER FUNCTIONS (REBUILT FOR RELIABILITY & CLARITY) ---

// // Action: Sends the command to the machine to start a motor.
// const vendSingleItem = async (motorId) => {
//   if (!motorId) {
//     console.error("Vending attempt with undefined motorId.");
//     return { success: false, error: "Missing motor ID" };
//   }
//   try {
//     const res = await modbuscontrollerApi.startmotor(motorId);
//     return res || { success: false, error: "Unknown hardware response" };
//   } catch (error) {
//     // Corrected the syntax error in the console log
//     console.error(`Vending failed for motor ${motorId}:`, error);
//     return { success: false, error: error.message || "Hardware communication error" };
//   }
// };

// // Action: Waits for the physical vend cycle (spiral turning) to complete.
// // It confirms this by waiting for the machine status to go from 1 (vending) to 2 (vend complete).
// const waitForVendCycleToComplete = async (maxWaitTime = 30000) => {
//   const startTime = Date.now();
//   console.log("...Waiting for vend cycle to complete (Status 1 -> 2)...");
  
//   let sawStatusOne = false; // We must see status 1 before accepting status 2

//   while (Date.now() - startTime < maxWaitTime) {
//     try {
//       const statusResponse = await modbuscontrollerApi.getmodbusstatus();
//       const status = statusResponse?.status;

//       if (status === 1) {
//         sawStatusOne = true;
//         // console.log("...Vending in progress (status 1 detected)");
//       }
      
//       // The cycle is complete ONLY if we've seen status 1 first, then status 2
//       if (sawStatusOne && status === 2) {
//         console.log("✅ Vend Cycle Complete (Status 2 received after 1).");
//         return true;
//       }

//       await new Promise(res => setTimeout(res, 500));
//     } catch (error) {
//       console.error("Error checking vend completion status:", error);
//       await new Promise(res => setTimeout(res, 500));
//     }
//   }

//   console.error("Timeout: Vend cycle did not complete in time.");
//   return false;
// };

// // Action: Waits for the elevator/system to be ready for the NEXT item.
// // This is used after a "CONTINUE" trigger, polling the 'triggerhome' coil status.
// const waitForMachineReadyForNextItem = async (maxWaitTime = 4 b    0000) => {
//   const startTime = Date.now();
//   console.log("...Waiting for machine to be ready for the next item (polling triggerhome coil)...");

//   while (Date.now() - startTime < maxWaitTime) {
//     try {
//       const statusResponse = await modbustriggerApi.triggerhome();
//       if (statusResponse && statusResponse.status === 1) {
//         console.log("✅ Machine is ready for the next item (Coil Status 1).");
//         return true;
//       }
//       await new Promise(res => setTimeout(res, 500));
//     } catch (error) {
//       console.error("Error checking 'ready for next item' coil status:", error);
//       await new Promise(res => setTimeout(res, 500));
//     }
//   }

//   console.error("Timeout: Machine did not become ready for the next item.");
//   return false;
// };

// const updateLocalStorageStock = (vendingLog) => {
//   try {
//     const cachedMotorsJSON = localStorage.getItem("refillMotors");
//     if (!cachedMotorsJSON) { return; }
//     let motors = JSON.parse(cachedMotorsJSON);
//     vendingLog.forEach(vendedItem => {
//       if (vendedItem.quantityVended > 0) {
//         const motorToUpdate = motors.find(m => m.id === vendedItem.motorId || m.Motor_number === vendedItem.motorId);
//         if (motorToUpdate) {
//           motorToUpdate.quantity = Math.max(0, motorToUpdate.quantity - vendedItem.quantityVended);
//         }
//       }
//     });
//     localStorage.setItem("refillMotors", JSON.stringify(motors));
//   } catch (error) {
//     console.error("Failed to update localStorage stock cache.", error);
//   }
// };


// export default function VendingPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
  
//   const orderDataFromState = location.state || {};
//   const { 
//     selectedProducts, 
//     totalPrice, 
//     motorCommands, 
//     transactionId,
//     paymentMethod 
//   } = orderDataFromState;
  
//   const machineGuid = orderDataFromState.machineGuid || localStorage.getItem("machine_id");

//   const [productStatuses, setProductStatuses] = useState({});
//   const [pageError, setPageError] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalDetails, setModalDetails] = useState({ title: "", message: "", amount: 0, isError: false });
//   const finalBillData = useRef(null);
//   const navigationTimeoutId = useRef(null);

//   const imageMap = new Map();
//   if (Array.isArray(selectedProducts)) {
//     selectedProducts.forEach(p => {
//       const productIdKey = p.id || p.productId; 
//       imageMap.set(productIdKey, p.image);
//     });
//   }

//   useEffect(() => {
//     const processVending = async () => {
//       // --- STAGE 1: VALIDATION ---
//       if (!motorCommands || motorCommands.length === 0 || !transactionId || !machineGuid) {
//         setPageError("Critical Error: Order data is missing. Redirecting...");
//         setTimeout(() => navigate("/", { replace: true }), 4000);
//         return;
//       }
      
//       // --- STAGE 2: VENDING PROCESS (REBUILT WITH CORRECT LOGIC) ---
//       const initialStatuses = motorCommands.reduce((acc, cmd) => ({ ...acc, [cmd.motorId]: 'pending' }), {});
//       setProductStatuses(initialStatuses);
      
//       const vendingResults = motorCommands.map(cmd => ({ ...cmd, vendedSuccessfully: 0 }));
//       const totalItemsToVend = vendingResults.reduce((sum, result) => sum + result.quantity, 0);    
//       let itemsVendedSoFar = 0;

//       // Loop through each product type in the order
//       for (const result of vendingResults) {
//         if (!result.motorId) continue;
        
//         console.log(`Starting process for Motor ${result.motorId}, Quantity: ${result.quantity}`);
//         setProductStatuses(prev => ({ ...prev, [result.motorId]: 'vending' }));
        
//         // Loop for the quantity of each specific product
//         for (let i = 0; i < result.quantity; i++) {
//           const currentItemNumber = itemsVendedSoFar + 1;
//           console.log(`--- Vending Item ${currentItemNumber}/${totalItemsToVend} (Motor ${result.motorId}) ---`);
          
//           // Step 1: For multi-vends, wait for the machine to be ready after the previous item.
//           // This is skipped for the very first item of the order.
//           if (itemsVendedSoFar > 0) {
//             const isMachineReady = await waitForMachineReadyForNextItem();
//             if (!isMachineReady) {
//               console.error(`Machine not ready for motor ${result.motorId}. Halting transaction.`);
//               break; // Stop vending from this motor
//             }
//           }
          
//           // Step 2: Send the command to vend the item.
//           const vendAttempt = await vendSingleItem(result.motorId);
//           if (!vendAttempt.success) { 
//             console.error(`Failed to send vend command for item ${i + 1} of motor ${result.motorId}:`, vendAttempt.error);
//             break; // Stop vending from this motor
//           }
          
//           // Step 3: Wait for the physical vend to complete (Status 1 -> 2).
//           const vendCompleted = await waitForVendCycleToComplete();
//           if (!vendCompleted) {
//             console.error(`Machine did not confirm vend completion for motor ${result.motorId}.`);
//             // Even if it times out, we continue to the refund stage.
//             break; 
//           }
          
//           // If we reach here, the vend for this single item was successful.
//           result.vendedSuccessfully += 1;
//           itemsVendedSoFar += 1;
          
//           // Step 4: Trigger CONTINUE or FINISH based on whether it's the last item.
//           const isThisTheVeryLastItem = itemsVendedSoFar === totalItemsToVend;
          
//           try {
//             if (isThisTheVeryLastItem) {
//               console.log(`✅ FINAL ITEM. Triggering FINISH.`);
//               await modbustriggerApi.coilregisterfinsih({ value: true });
//             } else {
//               console.log(`▶️ MORE ITEMS TO GO. Triggering CONTINUE.`);
//               await modbustriggerApi.coilregistercontinue({ value: true });
//             }
//           } catch (triggerError) {
//             console.error("CRITICAL: Failed to send modbus trigger signal (CONTINUE/FINISH):", triggerError);
//             break; // Stop if we can't communicate with the machine
//           }
//         } // End of quantity loop

//         // If a failure occurred in the quantity loop, we must stop processing other products.
//         if (result.vendedSuccessfully < result.quantity) {
//           console.warn("A failure occurred. Halting all further vending operations.");
//           break; 
//         }
//       } // End of product type loop

//       console.log("All vending operations completed. Final results:", vendingResults);

//       // --- STAGE 3, 4, 5: POST-VENDING PROCESSING (FULL LOGIC) ---
//       const vendingLog = vendingResults.map(r => ({ 
//         ...r, 
//         quantityVended: r.vendedSuccessfully, 
//         quantityFailed: r.quantity - r.vendedSuccessfully 
//       }));
      
//       try {
//         updateLocalStorageStock(vendingLog);
//         await refillApi.decrementStockAfterVend(vendingLog, machineGuid);
//       } catch (error) { 
//         console.error("BACKGROUND STOCK UPDATE FAILED:", error); 
//       }
      
//       const totalRefundAmount = vendingLog.reduce((total, item) => 
//         total + (item.quantityFailed * (item.price || 0)), 0);
//       const totalItemsVendedSuccessfully = vendingLog.reduce((sum, item) => 
//         sum + item.quantityVended, 0);

//       finalBillData.current = {
//         totalPrice, 
//         vendingLog, 
//         refundAmount: totalRefundAmount, 
//         transactionId, 
//         orderNumber: localStorage.getItem("orderNumber"),
//       };

//       let updatePayload;
//       if (totalItemsVendedSuccessfully > 0 && totalRefundAmount === 0) {
//         // All items vended successfully
//         updatePayload = { IsPaid: 1, IsSucceed: 1 };
//         if (paymentMethod === 'Account') {
//           const orderIdToUpdate = finalBillData.current.orderNumber;
//           if (!orderIdToUpdate) {
//             console.error("FATAL: Cannot update transaction because order_id is missing.");
//           } else {
//             const successPayload = { is_paid: true, is_refunded: false, refunded_amount: 0 };
//             try {
//               await accounttransactionApi.updateaccounttransaction(orderIdToUpdate, successPayload);
//               console.log("SUCCESS: AccountData transaction updated successfully.");
//             } catch (error) {
//               console.error(`API ERROR on SUCCESS update for order_id [${orderIdToUpdate}]. Details:`, error);
//             }
//           }
//         }
//         setTimeout(() => navigate("/bill", { state: finalBillData.current, replace: true }), 1500);
//       } else if (totalRefundAmount > 0) {
//         // Some items failed - process refund
//         updatePayload = { 
//           IsRefunded: 1, 
//           RefundedAmount: totalRefundAmount, 
//           RefundReason: 'Vending failure.', 
//           RefundStatus: 'Processed' 
//         };
        
//         if (paymentMethod === 'Account') {
//           console.log("ACCOUNT PAYMENT: Processing refund and updating AccountData transaction.");
//           const orderIdToUpdate = finalBillData.current.orderNumber;
//           if (!orderIdToUpdate) {
//             console.error("FATAL: Cannot update transaction because order_id is missing.");
//           } else {
//             const refundPayload = { is_paid: false, is_refunded: true, refunded_amount: totalRefundAmount };
//             try {
//               await accounttransactionApi.updateaccounttransaction(orderIdToUpdate, refundPayload);
//               console.log("SUCCESS: AccountData transaction updated for refund successfully.");
//             } catch (error) {
//               console.error(`API ERROR on REFUND update for order_id [${orderIdToUpdate}]. Details:`, error);
//             }
//           }
          
//           const rfid = transactionId?.split('-')[1];
//           if (rfid) {
//             try {
//               const refundPayload = { balance: totalRefundAmount };
//               await rfidregisterApi.updateaccount(rfid, refundPayload);
//               setModalDetails({ 
//                 title: "Amount Credited", 
//                 message: `A refund of ₹${totalRefundAmount.toFixed(2)} has been instantly credited back to your account.`, 
//                 amount: totalRefundAmount, 
//                 isError: false 
//               });
//             } catch (accountRefundError) {
//               updatePayload.RefundStatus = 'Failed';
//               setModalDetails({ 
//                 title: "Refund Error", 
//                 message: "We're sorry. There was an error processing your account refund. Please contact support.", 
//                 amount: totalRefundAmount, 
//                 isError: true 
//               });
//             }
//           } else {
//             updatePayload.RefundStatus = 'Failed';
//             setModalDetails({ 
//               title: "System Error", 
//               message: "A refund could not be automatically processed. Please contact support.", 
//               amount: totalRefundAmount, 
//               isError: true 
//             });
//           }
//         } else {
//           console.log("UPI/CARD PAYMENT DETECTED. Processing standard refund.");
//           try {
//             const refundPayload = { originalTransactionId: transactionId, amount: totalRefundAmount };
//             await qrgeneratorApi.getrefund(refundPayload);
//             setModalDetails({ 
//               title: "Refund Processed", 
//               message: `A refund of ₹${totalRefundAmount.toFixed(2)} has been processed...`, 
//               amount: totalRefundAmount, 
//               isError: false 
//             });
//           } catch (refundError) {
//             updatePayload.RefundStatus = 'Failed';
//             setModalDetails({ 
//               title: "Refund Error", 
//               message: "We're sorry, but the automated refund failed...", 
//               amount: totalRefundAmount, 
//               isError: true 
//             });
//           }
//         }
        
//         setIsModalOpen(true);
//         navigationTimeoutId.current = setTimeout(() => 
//           navigate("/bill", { state: finalBillData.current, replace: true }), 5000);
//       } else {
//         // All items failed or no items were vended.
//         navigationTimeoutId.current = setTimeout(() => navigate("/", { replace: true }), 8000);
//       }

//       if (updatePayload) {
//         try {
//           await refundApi.updatePaymentStatus(transactionId, updatePayload);
//         } catch (error) {
//           console.error("Failed to update payment status:", error);
//         }
//       }
//     };

//     const timer = setTimeout(processVending, 500);
//     return () => { 
//       clearTimeout(timer); 
//       if (navigationTimeoutId.current) clearTimeout(navigationTimeoutId.current); 
//     };
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps

//   const handleCloseModal = () => setIsModalOpen(false);

//   return (
//     <div className="vending-page-wrapper">
//       <Header/>
//       <div className="vending-container">
//         <div className="vending-status-header">
//           {pageError ? ( 
//             <h2 className="vending-title error">{pageError}</h2> 
//           ) : ( 
//             <h2 className="vending-title">Dispensing Your Items</h2> 
//           )}
//           {!pageError && ( 
//             <p className="vending-subtitle">Please watch the product cards below for status updates.</p> 
//           )}
//         </div>
        
//         {!pageError && (
//           <div className="vending-product-grid">
//             {motorCommands && motorCommands.map((command) => (
//               <VendingProductCard 
//                 key={`${command.motorId}-${command.productId}`}
//                 product={{ ...command, image: imageMap.get(command.productId) }}
//                 status={productStatuses[command.motorId] || 'pending'} 
//               />
//             ))}
//           </div>
//         )}
        
//         <RefundModal 
//           isOpen={isModalOpen} 
//           onClose={handleCloseModal} 
//           details={modalDetails} 
//         />
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import modbuscontrollerApi from "../../services/modbuscontrollerApi";
import refillApi from "../../services/refillApi";
import qrgeneratorApi from "../../services/qrgeneratorApi";
import refundApi from "../../services/refundApi";
import reportApi from "../../services/reportApi"; 
import accounttransactionApi from "../../services/accounttransactionApi";
import rfidregisterApi from "../../services/rfidregisterApi"; 
import RefundModal from "../RefundModal/RefundModal";
import VendingProductCard from "./VendingProductCard";
import "./VendingPage.css";
import Header from "../../components/UI/Header/Header";

// HELPER FUNCTIONS (No Changes)
const vendSingleItem = async (motorId) => {
  if (!motorId) {
    console.error("Vending attempt with undefined motorId.");
    return { success: false, error: "Missing motor ID" };
  }
  try {
    const res = await modbuscontrollerApi.startmotor(motorId);
    return res || { success: false, error: "Unknown hardware response" };
  } catch (error) {
    console.error(`Vending failed for motor ${motorId}:`, error);
    return { success: false, error: error.message || "Hardware communication error" };
  }
};

const updateLocalStorageStock = (vendingLog) => {
  try {
    const cachedMotorsJSON = localStorage.getItem("refillMotors");
    if (!cachedMotorsJSON) { return; }
    let motors = JSON.parse(cachedMotorsJSON);
    vendingLog.forEach(vendedItem => {
      if (vendedItem.quantityVended > 0) {
        const motorToUpdate = motors.find(m => m.id === vendedItem.motorId || m.Motor_number === vendedItem.motorId);
        if (motorToUpdate) {
          motorToUpdate.quantity = Math.max(0, motorToUpdate.quantity - vendedItem.quantityVended);
        }
      }
    });
    localStorage.setItem("refillMotors", JSON.stringify(motors));
  } catch (error)
  {
    console.error("Failed to update localStorage stock cache.", error);
  }
};


export default function VendingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const orderDataFromState = location.state || {};
  const { 
    selectedProducts, 
    totalPrice, 
    motorCommands, 
    transactionId,
    paymentMethod 
  } = orderDataFromState;
  
  const machineGuid = orderDataFromState.machineGuid || localStorage.getItem("machine_id");

  const [productStatuses, setProductStatuses] = useState({});
  const [pageError, setPageError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDetails, setModalDetails] = useState({ title: "", message: "", amount: 0, isError: false });
  const finalBillData = useRef(null);
  const navigationTimeoutId = useRef(null);

  const imageMap = new Map();
  if (Array.isArray(selectedProducts)) {
    selectedProducts.forEach(p => {
      const productIdKey = p.id || p.productId; 
      imageMap.set(productIdKey, p.image);
    });
  }

  useEffect(() => {
    const processVending = async () => {
      if (!motorCommands || motorCommands.length === 0 || !transactionId || !machineGuid) {
        console.error("VendingPage validation failed:", { motorCommands, transactionId, machineGuid });
        setPageError("Critical Error: Order data is missing. Redirecting...");
        setTimeout(() => navigate("/", { replace: true }), 4000);
        return;
      }
      
      const initialStatuses = motorCommands.reduce((acc, cmd) => { acc[cmd.motorId] = 'pending'; return acc; }, {});
      setProductStatuses(initialStatuses);
      const vendingResults = motorCommands.map(cmd => ({ ...cmd, vendedSuccessfully: 0 }));
      for (const result of vendingResults) {
        if (!result.motorId) continue;
        setProductStatuses(prev => ({ ...prev, [result.motorId]: 'vending' }));
        for (let i = 0; i < result.quantity; i++) {
          const vendAttempt = await vendSingleItem(result.motorId);
          if (vendAttempt.success) { result.vendedSuccessfully += 1; } 
          else { break; }
          await new Promise(res => setTimeout(res, 400)); 
        }
        const finalStatusForThisCard = result.vendedSuccessfully < result.quantity ? 'failed' : 'success';
        setProductStatuses(prev => ({ ...prev, [result.motorId]: finalStatusForThisCard }));
        await new Promise(res => setTimeout(res, 800)); 
      }

      const vendingLog = vendingResults.map(r => ({ ...r, quantityVended: r.vendedSuccessfully, quantityFailed: r.quantity - r.vendedSuccessfully }));
      try {
        updateLocalStorageStock(vendingLog);
        await refillApi.decrementStockAfterVend(vendingLog, machineGuid);
      } catch (error) { console.error("BACKGROUND STOCK UPDATE FAILED.", error); }
      
      const totalRefundAmount = vendingLog.reduce((total, item) => total + (item.quantityFailed * (item.price || 0)), 0);
      const totalItemsVendedSuccessfully = vendingLog.reduce((sum, item) => sum + item.quantityVended, 0);
      
      const currentOrderNumber = localStorage.getItem("orderNumber"); // Get orderNumber here

      finalBillData.current = {
        totalPrice, vendingLog, refundAmount: totalRefundAmount, transactionId, orderNumber: currentOrderNumber,
      };

      // === Start: Consolidated Report Update ===
      const isOverallRefunded = totalRefundAmount > 0;
      if (currentOrderNumber) {
        const payload = {
          is_refunded: isOverallRefunded ? 1 : 0, // Backend expects an integer (0 or 1)
          refunded_amount: totalRefundAmount,
          product_details: vendingLog.map(item => ({
          product_name: item.productName,        // must match ReportData.product_name
          refunded_amount: item.success ? 0 : item.price,
          status: item.success ? "Vended" : "Refunded",
          // is_paid: item.success ? 1 : 0  
    }))
          // If you need to send per-product details, you can structure it like this:
          // product_details: vendingLog.map(...)
        };

        reportApi.updatereport(currentOrderNumber, payload) // Use currentOrderNumber as orderNumber
          .then(() => console.log(`Overall refund status updated for order ${currentOrderNumber}. Refunded: ${isOverallRefunded}, Amount: ${totalRefundAmount}`))
          .catch(err => console.error(`CRITICAL: Failed to update overall refund status for order ${currentOrderNumber}.`, err));
      } else {
        console.error("Cannot update overall refund status: orderNumber is missing from localStorage.");
      }
      // === End: Consolidated Report Update ===
      
      let updatePayload; // This is for refundApi.updatePaymentStatus
      if (totalItemsVendedSuccessfully > 0 && totalRefundAmount === 0) {
        // Full success, no refund needed
        updatePayload = { IsPaid: 1, IsSucceed: 1 };
        
        if (paymentMethod === 'Account') {
          const orderIdToUpdate = finalBillData.current.orderNumber;
          const accountOriginalBalance = orderDataFromState.accountDetails?.balance || 0;
          const newBalance = accountOriginalBalance - totalPrice;

          if (!orderIdToUpdate) {
            console.error("FATAL: Cannot update transaction because order_id is missing. Check localStorage.");
          } else {
            const successPayload = {
              is_paid: true,
              is_refunded: false,
              refunded_amount: 0,
              balance_after: newBalance
            };
            console.log(`Attempting to update transaction by order ID [${orderIdToUpdate}] with SUCCESS payload:`, successPayload);
            try {
              await accounttransactionApi.updateaccounttransaction(orderIdToUpdate, successPayload);
              console.log("SUCCESS: AccountData transaction updated successfully.");
            } catch (error) {
              console.error(`API ERROR on SUCCESS update for order_id [${orderIdToUpdate}]. Details:`, error);
            }
          }
        }
        
        setTimeout(() => navigate("/bill", { state: finalBillData.current, replace: true }), 1500);
        
      } else if (totalRefundAmount > 0) {
        // Partial or full failure, refund is needed
        updatePayload = { IsRefunded: 1, RefundedAmount: totalRefundAmount, RefundReason: 'Vending failure.', RefundStatus: 'Processed' };

        const accountOriginalBalance = orderDataFromState.accountDetails?.balance || 0;
        const successfulVendedAmount = totalPrice - totalRefundAmount;
        const newBalance = accountOriginalBalance - successfulVendedAmount;
        if (paymentMethod === 'Account') {
            console.log("ACCOUNT PAYMENT: Processing refund and updating AccountData transaction.");
            const orderIdToUpdate = finalBillData.current.orderNumber;
            if (!orderIdToUpdate) {
                console.error("FATAL: Cannot update transaction because order_id is missing. Check localStorage.");
            } else {
                const refundPayload = {
                  is_paid: false,
                  is_refunded: true,
                  refunded_amount: totalRefundAmount,
                  balance_after: newBalance
                };
                console.log(`Attempting to update transaction by order ID [${orderIdToUpdate}] with REFUND payload:`, refundPayload);
                try {
                  await accounttransactionApi.updateaccounttransaction(orderIdToUpdate, refundPayload);
                  console.log("SUCCESS: AccountData transaction updated for refund successfully.");
                } catch (error) {
                  console.error(`API ERROR on REFUND update for order_id [${orderIdToUpdate}]. Details:`, error);
                }
            }

            const rfid = transactionId?.split('-')[1];
            if (rfid) {
                try {
                    const refundPayload = { balance: totalRefundAmount };
                    await rfidregisterApi.updateaccount(rfid, refundPayload);
                    setModalDetails({ title: "Amount Credited", message: `A refund of ₹${totalRefundAmount.toFixed(2)} has been instantly credited back to your account.`, amount: totalRefundAmount, isError: false });
                } catch (accountRefundError) {
                    updatePayload.RefundStatus = 'Failed';
                    setModalDetails({ title: "Refund Error", message: "We're sorry. There was an error processing your account refund. Please contact support.", amount: totalRefundAmount, isError: true });
                }
            } else {
                 updatePayload.RefundStatus = 'Failed';
                 setModalDetails({ title: "System Error", message: "A refund could not be automatically processed. Please contact support.", amount: totalRefundAmount, isError: true });
            }

        } else {
            console.log("UPI/CARD PAYMENT DETECTED. Processing standard refund.");
           try {
          const refundPayload = {
            PgSettingId: localStorage.getItem("PgSettingId"),
            originalTransactionId: transactionId,
            amount: totalRefundAmount,
          };

        const refundResponse = await qrgeneratorApi.getrefund(refundPayload);

        if (refundResponse.success) {
  
          setModalDetails({
            title: "Refund Processed",
            message: `A refund of ₹${totalRefundAmount.toFixed(2)} has been processed successfully.`,
            amount: totalRefundAmount,
            isError: false,
          });
        } else {
          updatePayload.RefundStatus = "Failed";
          setModalDetails({
            title: "Refund Error",
            message: refundResponse.message || "We're sorry, but the automated refund failed.",
            amount: totalRefundAmount,
            isError: true,
          });
        }
      } catch (refundError) {
        updatePayload.RefundStatus = "Failed";
        setModalDetails({
          title: "Refund Error",
          message: "Unexpected error occurred while processing refund.",
          amount: totalRefundAmount,
          isError: true,
        });
      }
        }
        
        setIsModalOpen(true);
        navigationTimeoutId.current = setTimeout(() => navigate("/bill", { state: finalBillData.current, replace: true }), 5000);

      } else {
        // No items vended successfully, no refund. Probably an initial error.
        navigationTimeoutId.current = setTimeout(() => navigate("/", { replace: true }), 8000);
      }
      
      if (updatePayload) {
        await refundApi.updatePaymentStatus(transactionId, updatePayload);
      }
    };

    const timer = setTimeout(processVending, 500);
    return () => { clearTimeout(timer); if (navigationTimeoutId.current) clearTimeout(navigationTimeoutId.current); };
  }, [machineGuid, motorCommands, navigate, paymentMethod, transactionId, totalPrice]); 
  // Added dependencies to useEffect as recommended by ESLint

  const handleCloseModal = () => setIsModalOpen(false);
  const handleGoHome = () => navigate("/");

  return (
    <div className="vending-page-wrapper">
      <Header/>
      <div className="vending-container">
        <div className="vending-status-header">
          {pageError ? ( <h2 className="vending-title error">{pageError}</h2> ) : ( <h2 className="vending-title">Dispensing Your Items</h2> )}
          {!pageError && ( <p className="vending-subtitle">Please watch the product cards below for status updates.</p> )}
        </div>
        
        {!pageError && (
            <div className="vending-product-grid">
                {motorCommands && motorCommands.map((command) => {
                  const productForCard = { ...command, image: imageMap.get(command.productId) };
                  return (
                    <VendingProductCard 
                      key={`${command.motorId}-${command.productId}`}
                      product={productForCard}
                      status={productStatuses[command.motorId] || 'pending'} 
                    />
                  );
                })}
            </div>
        )}
        
        <RefundModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          details={modalDetails} 
        />
      </div>
    </div>
  );
}