// // src/pages/AccountPage/AccountPage.jsx

// import { useState, useEffect } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { Card, Typography, CircularProgress, Modal, Box, Button } from "@mui/material";
// import ContactlessIcon from '@mui/icons-material/Contactless';
// import Header from "../../components/UI/Header/Header";
// import "./AccountPage.css";
// import rfidregisterApi from "../../services/rfidregisterApi";

// export default function AccountPage() {
//     const navigate = useNavigate();
//     const location = useLocation();

//     const [orderData, setOrderData] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [popup, setPopup] = useState({ open: false, message: "" });
//     const [statusText, setStatusText] = useState("Awaiting Scan...");
    
//     useEffect(() => {
//         let currentOrder = location.state || JSON.parse(localStorage.getItem('currentOrder'));
//         if (currentOrder) {
//             setOrderData(currentOrder);
//         } else {
//             navigate('/order');
//         }
//     }, [location.state, navigate]);

//     useEffect(() => {
//         let rfidInput = '';
//         const handleKeyPress = (event) => {
//             if (isLoading) return;

//             if (event.key === 'Enter') {
//                 if (rfidInput.length > 0) {
//                     processCardScan(rfidInput);
//                 }
//                 rfidInput = '';
//             } else {
//                 // Ignore special keys but allow numbers and letters
//                 if (event.key.length === 1) {
//                    rfidInput += event.key;
//                 }
//             }
//         };

//         window.addEventListener('keydown', handleKeyPress);
//         return () => {
//             window.removeEventListener('keydown', handleKeyPress);
//         };
//     }, [isLoading, orderData]); // Add orderData dependency

//     const resetUI = () => {
//         setIsLoading(false);
//         setStatusText("Awaiting Scan...");
//     };

//     // --- REWRITTEN FUNCTION WITH REAL API CALLS ---
//     const processCardScan = async (rfid) => {
//         if (!orderData) return; // Guard clause

//         setIsLoading(true);
//         setStatusText("Verifying Account...");

//         try {
//             // 1. GET ACCOUNT DETAILS
//             const accountDetails = await rfidregisterApi.getregister(rfid);

//             // API must return an object with a 'balance' property.
//             if (typeof accountDetails?.balance === 'undefined') {
//                  throw new Error("Invalid account data from server.");
//             }

//             const currentBalance = accountDetails.balance;
//             const totalCost = orderData.totalPrice;

//             // 2. CHECK FOR SUFFICIENT BALANCE
//             if (currentBalance < totalCost) {
//                 setPopup({ open: true, message: "Insufficient balance, kindly recharge your card." });
//                 resetUI();
//                 return; // Stop the process
//             }

//             // 3. PROCEED TO UPDATE BALANCE (PAYMENT)
//             setStatusText("Processing Payment...");
//             const newBalance = currentBalance - totalCost;
//             const payload = {
//                 // The payload structure depends on your backend API.
//                 // Assuming it expects the new balance.
//                 balance: newBalance 
//             };
            
//             await rfidregisterApi.updateaccount(rfid, payload);

//             // 4. HANDLE SUCCESS
//             setStatusText("Payment Successful!");
//             setTimeout(() => {
//                 navigate("/bill", { state: { ...orderData, paymentMethod: 'Account' } });
//             }, 1500);

//         } catch (error) {
//             // This single catch block handles errors from both getregister and updateaccount
//             console.error("Payment processing failed:", error);
//             // Check for 404 error specifically, which indicates account not found
//             if (error.response && error.response.status === 404) {
//                 setPopup({ open: true, message: "Your account is not found." });
//             } else {
//                 // For all other errors (network, server error, insufficient balance from API etc.)
//                 setPopup({ open: true, message: error.message || "An unexpected error occurred." });
//             }
//             resetUI();
//         }
//     };

//     const handleClosePopup = () => {
//         setPopup({ open: false, message: "" });
//     };

//     const handleCancel = () => {
//         navigate('/payment', { state: orderData }); // Pass order data back
//     };

//     return (
//         <div className="account-page-container">
//             <Header/>

//             <main className="account-page-content">
//                 <Card className="rfid-card-account" elevation={10}>
//                     {isLoading && (
//                         <div className="loading-overlay-account">
//                             <CircularProgress color="inherit" size={60} />
//                         </div>
//                     )}
//                     <div className="rfid-card-content-account">
//                         <div className="scan-circle-account">
//                             <ContactlessIcon className="contactless-icon-account" />
//                             <div className="orbit-animation-account">
//                                 <div className="orbit-ring-account ring-1-account"></div>
//                                 <div className="orbit-ring-account ring-2-account"></div>
//                                 <div className="orbit-ring-account ring-3-account"></div>
//                             </div>
//                         </div>
//                         <Typography variant="h5" component="h2" className="rfid-text-account">
//                             SCAN
//                         </Typography>
//                         <div className="status-text-account">{statusText}</div>
//                     </div>
//                 </Card>

//                 <div className="total-amount-display-account">
//                     Total: ₹{orderData?.totalPrice?.toFixed(2) || '0.00'}
//                 </div>
//             </main>
            
//             <footer className="account-page-footer">
//                 <Button 
//                     variant="contained" 
//                     color="error"
//                     className="account-page-cancel-btn"
//                     onClick={handleCancel}
//                 >
//                     Cancel
//                 </Button>
//             </footer>

//             <Modal open={popup.open} onClose={handleClosePopup}>
//                 <Box className="popup-box-account">
//                     <Typography className="popup-text-account">
//                         {popup.message}
//                     </Typography>
//                     <Button variant="contained" onClick={handleClosePopup}>
//                         OK
//                     </Button>
//                 </Box>
//             </Modal>
//         </div>
//     );
// }

// src/pages/AccountPage/AccountPage.jsx

// src/pages/AccountPage/AccountPage.jsx

// import { useState, useEffect, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { Card, Typography, CircularProgress, Modal, Box, Button } from "@mui/material";
// import ContactlessIcon from '@mui/icons-material/Contactless';
// import Header from "../../components/UI/Header/Header";
// import "./AccountPage.css";
// import rfidregisterApi from "../../services/rfidregisterApi";

// export default function AccountPage() {
//     const navigate = useNavigate();
//     const location = useLocation();

//     const [orderData, setOrderData] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [popup, setPopup] = useState({ open: false, message: "" });
//     const [statusText, setStatusText] = useState("Awaiting Scan...");
//     const [userName, setUserName] = useState(null);
//     const inactivityTimer = useRef(null);

//     // ... (all useEffects remain the same)
//     useEffect(() => {
//         let currentOrder = location.state || JSON.parse(localStorage.getItem('currentOrder'));
//         if (currentOrder) { setOrderData(currentOrder); } 
//         else { navigate('/order'); }
//     }, [location.state, navigate]);
    
//     useEffect(() => {
//         const resetTimer = () => {
//             clearTimeout(inactivityTimer.current);
//             inactivityTimer.current = setTimeout(() => { navigate('/payment', { state: orderData }); }, 30000);
//         };
//         if (!isLoading) { resetTimer(); } 
//         else { clearTimeout(inactivityTimer.current); }
//         return () => clearTimeout(inactivityTimer.current);
//     }, [isLoading, navigate, orderData]);

//     useEffect(() => {
//         let rfidInput = '';
//         const handleKeyPress = (event) => {
//             if (isLoading) return;
//             if (event.key === 'Enter') {
//                 if (rfidInput.length > 0) processCardScan(rfidInput);
//                 rfidInput = '';
//             } else {
//                 if (event.key.length === 1) rfidInput += event.key;
//             }
//         };
//         window.addEventListener('keydown', handleKeyPress);
//         return () => window.removeEventListener('keydown', handleKeyPress);
//     }, [isLoading, orderData]);

//     const resetUI = () => {
//         setIsLoading(false);
//         setStatusText("Awaiting Scan...");
//         setUserName(null);
//     };

//     const processCardScan = async (rfid) => {
//         if (!orderData) return;
//         setIsLoading(true);
//         setStatusText("Verifying Account...");

//         try {
//             const accountDetails = await rfidregisterApi.getregister(rfid);

//             if (typeof accountDetails?.balance === 'undefined') {
//                  throw new Error("Invalid account data from server.");
//             }
//             if (accountDetails.name) {
//                 setUserName(accountDetails.name);
//                 setStatusText(`Welcome, ${accountDetails.name}!`);
//             }
            
//             const currentBalance = parseFloat(accountDetails.balance);
//             const totalCost = parseFloat(orderData.totalPrice);

//             if (currentBalance < totalCost) {
//                 setTimeout(() => {
//                     setPopup({ open: true, message: "Insufficient balance, kindly recharge your card." });
//                     resetUI();
//                 }, 1500);
//                 return;
//             }
            
//             setStatusText("Processing Payment...");
//             await new Promise(resolve => setTimeout(resolve, 1500));
            
//             // --- FIX IS HERE ---
//             // Your backend does `balance += received_value`.
//             // To subtract, we must send a NEGATIVE value.
//             const payload = { 
//                 balance: -totalCost 
//             };

//             await rfidregisterApi.updateaccount(rfid, payload);

//             setStatusText("Payment Successful!");
//             setTimeout(() => {
//                 // To show the correct new balance on the bill page, we calculate it here
//                 const newBalance = currentBalance - totalCost;
//                 navigate("/bill", { 
//                     state: { 
//                         ...orderData, 
//                         paymentMethod: 'Account',
//                         finalBalance: newBalance // Optionally pass the final balance
//                     } 
//                 });
//             }, 1500);

//         } catch (error) {
//             console.error("Full payment processing error:", error); 
//             if (error.response && error.response.status === 404) {
//                 setPopup({ open: true, message: "Your account is not found." });
//             } else {
//                 setPopup({ open: true, message: error.message || "An unexpected error occurred." });
//             }
//             resetUI();
//         }
//     };

//     const handleClosePopup = () => {
//         setPopup({ open: false, message: "" });
//     };

//     const handleCancel = () => {
//         navigate('/payment', { state: orderData });
//     };

//     return (
//         <div className="account-page-container">
//             <Header/>
//             <main className="account-page-content">
//                 <Card className="rfid-card-account" elevation={10}>
//                     {isLoading && (
//                         <div className="loading-overlay-account">
//                             <CircularProgress color="inherit" size={60} />
//                         </div>
//                     )}
//                     <div className="rfid-card-content-account">
//                         <div className="scan-circle-account">
//                             <ContactlessIcon className="contactless-icon-account" />
//                             <div className="orbit-animation-account">
//                                 <div className="orbit-ring-account ring-1-account"></div>
//                                 <div className="orbit-ring-account ring-2-account"></div>
//                                 <div className="orbit-ring-account ring-3-account"></div>
//                             </div>
//                         </div>
//                         <Typography variant="h5" component="h2" className="rfid-text-account">
//                             {userName ? userName : 'Scan Your RFID Card'}
//                         </Typography>
//                         <div className="status-text-account">{statusText}</div>
//                     </div>
//                 </Card>
//                 <div className="total-amount-display-account">
//                     Total: ₹{orderData?.totalPrice?.toFixed(2) || '0.00'}
//                 </div>
//             </main>
//             <footer className="account-page-footer">
//                 <Button 
//                     variant="contained" 
//                     color="error"
//                     className="account-page-cancel-btn"
//                     onClick={handleCancel}
//                 >
//                     Cancel
//                 </Button>
//             </footer>
//             <Modal open={popup.open} onClose={handleClosePopup}>
//                 <Box className="popup-box-account">
//                     <Typography className="popup-text-account">{popup.message}</Typography>
//                     <Button variant="contained" onClick={handleClosePopup}>OK</Button>
//                 </Box>
//             </Modal>
//         </div>
//     );
// }

// import { useState, useEffect, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { Card, Typography, CircularProgress, Modal, Box, Button } from "@mui/material";
// import ContactlessIcon from '@mui/icons-material/Contactless';
// import Header from "../../components/UI/Header/Header";
// import "./AccountPage.css";
// import rfidregisterApi from "../../services/rfidregisterApi";
// import accounttransactionApi from "../../services/accounttransactionApi";

// export default function AccountPage() {
//     const navigate = useNavigate();
//     const location = useLocation();

//     const [orderData, setOrderData] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [popup, setPopup] = useState({ open: false, message: "" });
//     const [statusText, setStatusText] = useState("Awaiting Scan...");
//     const [userName, setUserName] = useState(null);
//     const inactivityTimer = useRef(null);

//     // This useEffect correctly receives the full order data. No changes needed.
//     useEffect(() => {
//         let currentOrder = location.state; 
//         if (currentOrder?.orderId && currentOrder?.selectedProducts) { 
//             setOrderData(currentOrder); 
//         } else { 
//             console.error("Critical Error: Navigated to AccountPage without complete order data. Returning.");
//             navigate('/order'); 
//         }
//     }, [location.state, navigate]);
    
//     // Inactivity timer - no changes needed.
//     useEffect(() => {
//         const resetTimer = () => {
//             clearTimeout(inactivityTimer.current);
//             inactivityTimer.current = setTimeout(() => { navigate('/payment', { state: orderData }); }, 30000);
//         };
//         if (!isLoading) { resetTimer(); } 
//         else { clearTimeout(inactivityTimer.current); }
//         return () => clearTimeout(inactivityTimer.current);
//     }, [isLoading, navigate, orderData]);

//     // --- FIX #1: RFID INPUT SANITIZATION ---
//     useEffect(() => {
//         let rfidInput = '';
//         const handleKeyPress = (event) => {
//             if (isLoading) return;
//             if (event.key === 'Enter') {
//                 if (rfidInput.length > 0) {
//                     // Clean the input to remove any non-digit characters before processing.
//                     const sanitizedRfid = rfidInput.replace(/\D/g, '');
//                     console.log(`Original Input: "${rfidInput}", Sanitized Output: "${sanitizedRfid}"`);
//                     processCardScan(sanitizedRfid);
//                 }
//                 rfidInput = ''; // Reset for the next scan
//             } else {
//                 if (event.key.length === 1) rfidInput += event.key;
//             }
//         };
//         window.addEventListener('keydown', handleKeyPress);
//         return () => window.removeEventListener('keydown', handleKeyPress);
//     }, [isLoading, orderData]);

//     const resetUI = () => {
//         setIsLoading(false);
//         setStatusText("Awaiting Scan...");
//         setUserName(null);
//     };
// // AccountPage.jsx

// const processCardScan = async (rfid) => {
//     if (!orderData) return;

//     setIsLoading(true);
//     setStatusText("Verifying Account...");

//     try {
//         const accountDetails = await rfidregisterApi.getregister(rfid);

//         if (typeof accountDetails?.balance === 'undefined') {
//              throw new Error("Invalid account data received from the server.");
//         }
        
//         if (accountDetails.name) {
//             setUserName(accountDetails.name);
//             setStatusText(`Welcome, ${accountDetails.name}!`);
//         } else {
//             setUserName(null); 
//             setStatusText("Account Found");
//         }
//         await new Promise(resolve => setTimeout(resolve, 1500));

//         const currentBalance = parseFloat(accountDetails.balance);
//         const totalCost = parseFloat(orderData.totalPrice);

//         if (currentBalance < totalCost) {
//             setPopup({ open: true, message: "Insufficient balance. Please recharge your card." });
//             resetUI();
//             return;
//         }
        
//         setStatusText("Processing Payment...");
        
//         const paymentPayload = { balance: -totalCost };
//         await rfidregisterApi.updateaccount(rfid, paymentPayload);

//         try {
//             const newBalance = currentBalance - totalCost;
//             const productNames = orderData.selectedProducts.map(p => p.name).filter(Boolean).join(', ');
//             const transactionPayload = {
//                 rfid: rfid,
//                 user_name: userName || "N/A", 
//                 amount: -totalCost,
//                 balance_after: newBalance,
//                 order_id: orderData.orderId,
//                 product_name: productNames,
//                 quantity: orderData.selectedProducts.reduce((sum, p) => sum + p.quantity, 0)
//             };
            
//             await accounttransactionApi.createtransaction(transactionPayload);
//         } catch (loggingError) {
//             console.error("CRITICAL: Payment was processed, but transaction logging failed!", loggingError);
//         }

//         setStatusText("Payment Successful!");
        
//         setTimeout(() => {
//             const newBalance = currentBalance - totalCost;

//             // --- THIS IS THE CORRECTED LOGIC ---
//             const successfulVendingLog = orderData.selectedProducts.map(item => ({
//                 productId: item.id,
//                 price: item.price,
//                 image: item.image_path,
//                 productName: item.name, // The key BillPage is looking for
//                 quantity: item.quantity,
//                 quantityVended: item.quantity,
//                 quantityFailed: 0
//             }));

//             navigate("/bill", {
//         state: { 
//             // Keep existing data
//             totalPrice: orderData.totalPrice,
//             orderNumber: orderData.orderNumber,
//             vendingLog: successfulVendingLog, 
//             refundAmount: 0,
//             // transactionId: `ACC-${rfid}-${orderData.orderId}`, // More specific ID
//             transactionId:orderData.orderId,
//             AppType: 'VM', // Or determine dynamically if needed

//             // Add a new structured object for payment details
//             paymentDetails: {
//                 method: 'Account',
//                 rfid: rfid,
//                 userName: accountDetails.name || 'N/A',
//                 initialBalance: currentBalance,
//                 finalBalance: newBalance
//             },
            
//             // Example of how you could add tax details
//             taxDetails: {
//                 rate: 0, // In percentage, e.g., 18
//                 cgst: 0, // Calculated CGST amount
//                 sgst: 0  // Calculated SGST amount
//             }
//         } 
//     });
// }, 1500);

//     } catch (error) {
//         console.error("Full payment processing error:", error); 
//         const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred.";
//         setPopup({ open: true, message: errorMessage });
//         resetUI();
//     }
// };

//     const handleClosePopup = () => {
//         setPopup({ open: false, message: "" });
//     };

//     const handleCancel = () => {
//         navigate('/payment', { state: orderData });
//     };

//     // --- FIX #2: RESTORED ORIGINAL JSX FOR THE CARD ---
//     return (
//         <div className="account-page-container">
//             <Header/>
//             <main className="account-page-content">
//                 <Card className="rfid-card-account" elevation={10}>
//                     {isLoading && (
//                         <div className="loading-overlay-account">
//                             <CircularProgress color="inherit" size={60} />
//                         </div>
//                     )}
//                     <div className="rfid-card-content-account">
//                         <div className="scan-circle-account">
//                             <ContactlessIcon className="contactless-icon-account" />
//                             <div className="orbit-animation-account">
//                                 <div className="orbit-ring-account ring-1-account"></div>
//                                 <div className="orbit-ring-account ring-2-account"></div>
//                                 <div className="orbit-ring-account ring-3-account"></div>
//                             </div>
//                         </div>
//                         <Typography variant="h5" component="h2" className="rfid-text-account">
//                             {userName ? userName : 'Scan Your RFID Card'}
//                         </Typography>
//                         <div className="status-text-account">{statusText}</div>
//                     </div>
//                 </Card>
//                 <div className="total-amount-display-account">
//                     Total: ₹{orderData?.totalPrice?.toFixed(2) || '0.00'}
//                 </div>
//             </main>
//             <footer className="account-page-footer">
//                 <Button 
//                     variant="contained" 
//                     color="error"
//                     className="account-page-cancel-btn"
//                     onClick={handleCancel}
//                 >
//                     Cancel
//                 </Button>
//             </footer>
//             <Modal open={popup.open} onClose={handleClosePopup}>
//                 <Box className="popup-box-account">
//                     <Typography className="popup-text-account">{popup.message}</Typography>
//                     <Button variant="contained" onClick={handleClosePopup}>OK</Button>
//                 </Box>
//             </Modal>
//         </div>
//     );
// }

// import { useState, useEffect, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { Card, Typography, CircularProgress, Modal, Box, Button } from "@mui/material";
// import ContactlessIcon from '@mui/icons-material/Contactless';
// import Header from "../../components/UI/Header/Header";
// import refillApi from "../../services/refillApi";
// import "./AccountPage.css";
// import rfidregisterApi from "../../services/rfidregisterApi";
// import accounttransactionApi from "../../services/accounttransactionApi";

// export default function AccountPage() {
//     const navigate = useNavigate();
//     const location = useLocation();

//     const [orderData, setOrderData] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [popup, setPopup] = useState({ open: false, message: "" });
//     const [statusText, setStatusText] = useState("Awaiting Scan...");
//     const [userName, setUserName] = useState(null);
//     const inactivityTimer = useRef(null);

//     useEffect(() => {
//         let currentOrder = location.state;
//         if (currentOrder?.orderId && currentOrder?.selectedProducts) {
//             // Ensure machineId is present for stock operations
//             setOrderData({
//                 ...currentOrder,
//                 machineId: localStorage.getItem("machine_id")
//             });
//         } else {
//             console.error("Critical Error: Navigated to AccountPage without complete order data. Returning.");
//             navigate('/order');
//         }
//     }, [location.state, navigate]);

//     useEffect(() => {
//         const resetTimer = () => {
//             clearTimeout(inactivityTimer.current);
//             inactivityTimer.current = setTimeout(() => { navigate('/payment', { state: orderData }); }, 30000);
//         };
//         if (!isLoading) {
//             resetTimer();
//         } else {
//             clearTimeout(inactivityTimer.current);
//         }
//         return () => clearTimeout(inactivityTimer.current);
//     }, [isLoading, navigate, orderData]);

//     useEffect(() => {
//         let rfidInput = '';
//         const handleKeyPress = (event) => {
//             if (isLoading) return;
//             if (event.key === 'Enter') {
//                 if (rfidInput.length > 0) {
//                     const sanitizedRfid = rfidInput.replace(/\D/g, '');
//                     console.log(`Original Input: "${rfidInput}", Sanitized Output: "${sanitizedRfid}"`);
//                     if (sanitizedRfid) {
//                         processCardScan(sanitizedRfid);
//                     }
//                 }
//                 rfidInput = '';
//             } else {
//                 if (event.key.length === 1) rfidInput += event.key;
//             }
//         };
//         window.addEventListener('keydown', handleKeyPress);
//         return () => window.removeEventListener('keydown', handleKeyPress);
//     }, [isLoading, orderData]);

//     const resetUI = () => {
//         setIsLoading(false);
//         setStatusText("Awaiting Scan...");
//         setUserName(null);
//     };

//     const processCardScan = async (rfid) => {
//         if (!orderData) return;

//         setIsLoading(true);
//         setStatusText("Verifying Account...");

//         try {
//             const accountDetails = await rfidregisterApi.getregister(rfid);

//             if (typeof accountDetails?.balance === 'undefined') {
//                 throw new Error("Invalid account data received from the server.");
//             }
            
//             setUserName(accountDetails.name || null);
//             setStatusText(accountDetails.name ? `Welcome, ${accountDetails.name}!` : "Account Found");
//             await new Promise(resolve => setTimeout(resolve, 1500));

//             const currentBalance = parseFloat(accountDetails.balance);
//             const totalCost = parseFloat(orderData.totalPrice);

//             if (currentBalance < totalCost) {
//                 setPopup({ open: true, message: "Insufficient balance. Please recharge your card." });
//                 resetUI();
//                 return;
//             }
            
//             setStatusText("Processing Payment...");
            
//             const paymentPayload = { balance: -totalCost };
//             await rfidregisterApi.updateaccount(rfid, paymentPayload);
//             const newBalance = currentBalance - totalCost;

//             try {
//                 const productNames = orderData.selectedProducts.map(p => p.name).filter(Boolean).join(', ');
//                 const transactionPayload = {
//                     rfid: rfid,
//                     user_name: accountDetails.name || "N/A",
//                     amount: -totalCost,
//                     balance_after: newBalance,
//                     order_id: orderData.orderId,
//                     product_name: productNames,
//                     quantity: orderData.selectedProducts.reduce((sum, p) => sum + p.quantity, 0)
//                 };
//                 await accounttransactionApi.createtransaction(transactionPayload);
//             } catch (loggingError) {
//                 console.error("CRITICAL: Payment was processed, but transaction logging failed!", loggingError);
//             }

//             setStatusText("Payment Successful!");

//             // =============================================================
//             // --- START OF CORRECTED STOCK DECREMENT LOGIC ---
//             // =============================================================
//             if (orderData.AppType === "KIOSK") {
//                 console.log("ENTERING KIOSK POST-PAYMENT LOGIC (Account Payment)");
//                 try {
//                     if (orderData.machineId) {
//                         // The `orderData.selectedProducts` now contains the specific list
//                         // of motors and the quantities to vend from each.
//                         const vendedItemsPayload = orderData.selectedProducts.map(item => ({
//                             motor_id: item.motor_id,
//                             quantity_vended: item.quantity
//                         }));
    
//                         console.log(`Preparing to decrement KIOSK stock for machine: ${orderData.machineId}`);
//                         console.log("Items to decrement:", vendedItemsPayload);
                        
//                         await refillApi.decrementStockAfterKioskVend(orderData.machineId, vendedItemsPayload);
                        
//                         console.log("SUCCESS: KIOSK stock decrement API call completed.");
    
//                     } else {
//                         console.error("CRITICAL STOCK ERROR: Cannot decrement stock because 'machineId' is missing from orderData.");
//                     }
//                 } catch (stockError) {
//                     console.error("CRITICAL FAILURE: Payment processed, but KIOSK stock decrement API call failed.", stockError.response?.data || stockError.message);
//                 }
//             } else {
//                 console.log("AppType is not KIOSK. Skipping KIOSK stock decrement.");
//             }
//             // =============================================================
//             // --- END OF STOCK DECREMENT LOGIC ---
//             // =============================================================
            
//             setTimeout(() => {
//                 const successfulVendingLog = orderData.selectedProducts.map(item => ({
//                     id: item.id,
//                     productName: item.name,
//                     price: item.price,
//                     quantity: item.quantity,
//                     quantityVended: item.quantity,
//                     quantityFailed: 0
//                 }));

//                 const finalStateForBill = {
//                     totalPrice: orderData.totalPrice,
//                     orderNumber: orderData.orderNumber,
//                     vendingLog: successfulVendingLog,
//                     refundAmount: 0,
//                     transactionId: `ACC-${rfid}-${orderData.orderId}`,
//                     AppType: orderData.AppType || 'VM',
//                     paymentDetails: {
//                         method: 'Account',
//                         rfid: rfid,
//                         userName: accountDetails.name || 'N/A',
//                         initialBalance: currentBalance,
//                         finalBalance: newBalance
//                     },
//                     taxDetails: {
//                         rate: 0,
//                         cgst: 0,
//                         sgst: 0
//                     }
//                 };
                
//                 navigate("/bill", { state: finalStateForBill });

//             }, 1500);

//         } catch (error) {
//             console.error("Full payment processing error:", error);
//             const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred.";
//             setPopup({ open: true, message: errorMessage });
//             resetUI();
//         }
//     };

//     const handleClosePopup = () => setPopup({ open: false, message: "" });
//     const handleCancel = () => navigate('/payment', { state: orderData });

//     return (
//         <div className="account-page-container">
//             <Header/>
//             <main className="account-page-content">
//                 <Card className="rfid-card-account" elevation={10}>
//                     {isLoading && (
//                         <div className="loading-overlay-account">
//                             <CircularProgress color="inherit" size={60} />
//                         </div>
//                     )}
//                     <div className="rfid-card-content-account">
//                         <div className="scan-circle-account">
//                             <ContactlessIcon className="contactless-icon-account" />
//                             <div className="orbit-animation-account">
//                                 <div className="orbit-ring-account ring-1-account"></div>
//                                 <div className="orbit-ring-account ring-2-account"></div>
//                                 <div className="orbit-ring-account ring-3-account"></div>
//                             </div>
//                         </div>
//                         <Typography variant="h5" component="h2" className="rfid-text-account">
//                             {userName ? userName : 'Scan Your RFID Card'}
//                         </Typography>
//                         <div className="status-text-account">{statusText}</div>
//                     </div>
//                 </Card>
//                 <div className="total-amount-display-account">
//                     Total: ₹{orderData?.totalPrice?.toFixed(2) || '0.00'}
//                 </div>
//             </main>
//             <footer className="account-page-footer">
//                 <button 
//                     variant="contained" 
//                     color="error"
//                     className="account-page-cancel-btn"
//                     onClick={handleCancel}
//                 >
//                     Cancel
//                 </button>
//             </footer>
//             <Modal open={popup.open} onClose={handleClosePopup}>
//                 <Box className="popup-box-account">
//                     <Typography className="popup-text-account">{popup.message}</Typography>
//                     <Button variant="contained" onClick={handleClosePopup}>OK</Button>
//                 </Box>
//             </Modal>
//         </div>
//     );
// }today change OG
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Typography, CircularProgress, Modal, Box, Button } from "@mui/material";
import ContactlessIcon from '@mui/icons-material/Contactless';
import Header from "../../components/UI/Header/Header";
import refillApi from "../../services/refillApi";
import "./AccountPage.css";
import rfidregisterApi from "../../services/rfidregisterApi";
import accounttransactionApi from "../../services/accounttransactionApi";

export default function AccountPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [orderData, setOrderData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [popup, setPopup] = useState({ open: false, message: "" });
    const [statusText, setStatusText] = useState("Awaiting Scan...");
    const [userName, setUserName] = useState(null);
    const inactivityTimer = useRef(null);

    // This useEffect correctly receives the state. No changes needed.
    useEffect(() => {
        const currentOrder = location.state;
        if (currentOrder?.orderId && currentOrder?.selectedProducts) {
            console.log("AccountPage received state:", currentOrder);
            setOrderData({
                ...currentOrder,
                machineId: localStorage.getItem("machine_id"),
                AppType: currentOrder.AppType || localStorage.getItem("AppType")
            });
        } else {
            console.error("Critical Error: AccountPage loaded without complete order data. Returning.");
            navigate('/order', { replace: true });
        }
    }, [location.state, navigate]);

    // Inactivity timer logic is fine. No changes needed.
    useEffect(() => {
        const resetTimer = () => {
            clearTimeout(inactivityTimer.current);
            inactivityTimer.current = setTimeout(() => { 
                console.log("Inactivity timeout on AccountPage. Returning to payment selection.");
                navigate('/payment', { state: orderData, replace: true }); 
            }, 30000);
        };
        if (!isLoading) {
            resetTimer();
        } else {
            clearTimeout(inactivityTimer.current);
        }
        return () => clearTimeout(inactivityTimer.current);
    }, [isLoading, navigate, orderData]);

    // Keypress listener for RFID is fine. No changes needed.
    useEffect(() => {
        let rfidInput = '';
        const handleKeyPress = (event) => {
            if (isLoading) return;
            if (event.key === 'Enter') {
                if (rfidInput.length > 0) {
                    const sanitizedRfid = rfidInput.replace(/\D/g, '');
                    if (sanitizedRfid) {
                        processCardScan(sanitizedRfid);
                    }
                }
                rfidInput = '';
            } else {
                if (event.key.length === 1) rfidInput += event.key;
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isLoading, orderData]);

    const resetUI = () => {
        setIsLoading(false);
        setStatusText("Awaiting Scan...");
        setUserName(null);
    };

    // =====================================================================
    // --- THIS ENTIRE FUNCTION IS REPLACED WITH THE BULLETPROOF VERSION ---
    // =====================================================================
    const processCardScan = async (rfid) => {
        if (!orderData) {
            console.error("processCardScan aborted: orderData is not set.");
            return;
        }

        setIsLoading(true);
        setStatusText("Verifying Account...");

        try {
            const accountDetails = await rfidregisterApi.getregister(rfid);

            if (typeof accountDetails?.balance === 'undefined') {
                throw new Error("Invalid account data from server.");
            }
            
            setUserName(accountDetails.name || null);
            setStatusText(accountDetails.name ? `Welcome, ${accountDetails.Name}!` : "Account Found");
            await new Promise(resolve => setTimeout(resolve, 1500));

            const currentBalance = parseFloat(accountDetails.balance);
            const totalCost = parseFloat(orderData.totalPrice);

            if (currentBalance < totalCost) {
                setPopup({ open: true, message: "Insufficient balance. Please recharge." });
                resetUI();
                return;
            }
            
            setStatusText("Processing Payment...");
            
            const paymentPayload = { balance: -totalCost };
            await rfidregisterApi.updateaccount(rfid, paymentPayload);
            const newBalance = currentBalance - totalCost;

            try {
                const productNames = orderData.selectedProducts.map(p => p.name).filter(Boolean).join(', ');
                const transactionPayload = {
                    rfid,
                    user_name: accountDetails.Name || "N/A",
                    amount: -totalCost,
                    balance_after: newBalance,
                    order_id: orderData.orderNumber,
                    product_name: productNames,
                    quantity: orderData.selectedProducts.reduce((sum, p) => sum + p.quantity, 0)
                };
                await accounttransactionApi.createtransaction(transactionPayload);
            } catch (loggingError) {
                console.error("CRITICAL: Payment processed, but transaction logging failed!", loggingError);
            }

            setStatusText("Payment Successful!");

            // --- FORK LOGIC BASED ON AppType ---
            
            if (orderData.AppType === "VM") {
                console.log("VM FLOW: Preparing to navigate to /vending.");
                
                if (!orderData.motorCommands || orderData.motorCommands.length === 0) {
                    console.error("FATAL ERROR: Motor commands missing for VM. Cannot vend.");
                    setPopup({ open: true, message: "Critical Error (VM-MC01): Vending instructions missing." });
                    resetUI();
                    return;
                }

                // ** THE DEFINITIVE FIX: MANUALLY REBUILD THE STATE OBJECT **
                // This prevents passing non-serializable data that causes the state to be dropped.
                const stateForVendingPage = {
                    orderId: orderData.orderId,
                    orderNumber: orderData.orderNumber,
                    totalPrice: orderData.totalPrice,
                    selectedProducts: orderData.selectedProducts,
                    machineGuid: orderData.machineId,
                    motorCommands: orderData.motorCommands,
                    AppType: orderData.AppType,
                    paymentMethod: 'Account',
                    transactionId: `ACC-${rfid}-${orderData.orderId}`
                };

                console.log("Final state being passed to /vending:", JSON.stringify(stateForVendingPage, null, 2));

                setTimeout(() => {
                    navigate("/vending", { state: stateForVendingPage, replace: true });
                }, 1500);

            } else if (orderData.AppType === "KIOSK") {
                console.log("KIOSK FLOW: Decrementing stock and preparing bill.");
                
                try {
                    // KIOSK stock logic remains the same.
                    if (orderData.machineId) {
                        const vendedItemsPayload = orderData.selectedProducts.map(item => ({
                            motor_id: item.motor_id,
                            quantity_vended: item.quantity
                        }));
                        await refillApi.decrementStockAfterKioskVend(orderData.machineId, vendedItemsPayload);
                        console.log("SUCCESS: KIOSK stock decrement complete.");
                    }
                } catch (stockError) {
                    console.error("CRITICAL FAILURE: KIOSK stock decrement failed.", stockError);
                }
                
                const successfulVendingLog = orderData.selectedProducts.map(item => ({
                    ...item,
                    quantityVended: item.quantity,
                    quantityFailed: 0
                }));

                // Apply the same safe-build pattern for consistency.
                const finalStateForBill = {
                    totalPrice: orderData.totalPrice,
                    orderNumber: orderData.orderNumber,
                    vendingLog: successfulVendingLog,
                    refundAmount: 0,
                    transactionId: `ACC-${rfid}-${orderData.orderId}`,
                    AppType: orderData.AppType,
                    paymentDetails: {
                        method: 'Account', rfid,
                        userName: accountDetails.Name || 'N/A',
                        initialBalance: currentBalance, finalBalance: newBalance
                    },
                    taxDetails: { rate: 0, cgst: 0, sgst: 0 }
                };
                
                console.log("Final state being passed to /bill:", JSON.stringify(finalStateForBill, null, 2));

                setTimeout(() => {
                    navigate("/bill", { state: finalStateForBill, replace: true });
                }, 1500);

            } else {
                console.error(`Unknown AppType: ${orderData.AppType}. Cannot proceed.`);
                setPopup({ open: true, message: "Configuration error. Unknown application type." });
                resetUI();
            }

        } catch (error) {
            console.error("Full payment processing error:", error);
            const errorMessage = error.response?.data?.message || "Card not registered or an error occurred.";
            setPopup({ open: true, message: errorMessage });
            resetUI();
        }
    };

        

    const handleClosePopup = () => setPopup({ open: false, message: "" });
    
    // Corrected Cancel logic
    const handleCancel = () => {
        console.log("Payment cancelled. Returning to payment selection.");
        navigate('/payment', { state: orderData, replace: true });
    };

    // The JSX part remains unchanged.
    return (
        <div className="account-page-container">
            <Header/>
            <main className="account-page-content">
                <Card className="rfid-card-account" elevation={10}>
                    {isLoading && (
                        <div className="loading-overlay-account">
                            <CircularProgress color="inherit" size={60} />
                        </div>
                    )}
                    <div className="rfid-card-content-account">
                        <div className="scan-circle-account">
                            <ContactlessIcon className="contactless-icon-account" />
                            <div className="orbit-animation-account">
                                <div className="orbit-ring-account ring-1-account"></div>
                                <div className="orbit-ring-account ring-2-account"></div>
                                <div className="orbit-ring-account ring-3-account"></div>
                            </div>
                        </div>
                        <Typography variant="h5" component="h2" className="rfid-text-account">
                            {userName ? userName : 'Scan Your RFID Card'}
                        </Typography>
                        <div className="status-text-account">{statusText}</div>
                    </div>
                </Card>
                <div className="total-amount-display-account">
                    Total: ₹{orderData?.totalPrice?.toFixed(2) || '0.00'}
                </div>
            </main>
            <footer className="account-page-footer">
                <button 
                    className="account-page-cancel-btn"
                    onClick={handleCancel}
                >
                    Cancel
                </button>
            </footer>
            <Modal open={popup.open} onClose={handleClosePopup}>
                <Box className="popup-box-account">
                    <Typography className="popup-text-account">{popup.message}</Typography>
                    <Button variant="contained" onClick={handleClosePopup}>OK</Button>
                </Box>
            </Modal>
        </div>
    );
}