// "use client";

// import { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { motion } from "framer-motion";
// import "./SelectPaymentPage.css";
// import orderdetailsApi from "../../services/orderdetailsApi";
// import gpay from "../../assets/images/gpay.webp";
// import phonepe from "../../assets/images/phonepe.webp";
// import paytm from "../../assets/images/paytm.webp";
// import pinelabs from "../../assets/images/pinelabs.webp";
// import logo from "../../assets/images/logo.webp";
// import upi from "../../assets/images/upi.webp";
// import card from "../../assets/images/card.webp";
// import Header from "../../components/UI/Header/Header";

// export default function SelectPaymentPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
  
//   const [selectedMethod, setSelectedMethod] = useState(null);
  
//   const appType = localStorage.getItem("AppType") || 'VM';

//   const [orderData, setOrderData] = useState(null);

//   useEffect(() => {
//     let currentOrder = null;
//     if (location.state?.motorCommands) {
//       currentOrder = location.state;
//       localStorage.setItem('currentOrder', JSON.stringify(currentOrder));
//     } else {
//       const dataFromStorage = localStorage.getItem('currentOrder');
//       if (dataFromStorage) {
//         currentOrder = JSON.parse(dataFromStorage);
//       }
//     }
//     setOrderData(currentOrder);
//   }, [location.state]);

//   const { selectedProducts, totalPrice, motorCommands } = orderData || {
//     selectedProducts: [],
//     totalPrice: 0,
//     motorCommands: [],
//   };

//   const handlePaymentMethod = async (method) => {
//     setSelectedMethod(method);

//     // --- THE BULLETPROOF FIX: Add a pre-flight check for ALL session data ---
//     const machineId = localStorage.getItem("machine_id");
//     const companyId = localStorage.getItem("company_id");

//     if (!machineId || !companyId) {
//       // If any of these are missing, the session is invalid. Stop immediately.
//       const errorMessage = "Critical session error: Machine or Company ID is missing. Please restart the application.";
//       console.error(errorMessage, { machineId, companyId });
//       alert(errorMessage);
//       return; // Stop execution
//     }

//     if (appType === "VM" && (!motorCommands || motorCommands.length === 0)) {
//       alert("Error: Motor command data is missing. Please re-select your products.");
//       return;
//     }

//     if (!totalPrice || totalPrice <= 0) {
//       alert("Error: Invalid total price. Cannot proceed.");
//       return;
//     }

//     try {
//       const payload = {
//         Total: totalPrice,
//         DeliveryType: "Direct",
//         PaymentType: method,
//         IsPaid: false,
//         IsRefunded: false,
//         RefundedAmount: 0.0,
//         PaymentId: null,
//         company_id: companyId, // Use the verified companyId
//       };

//       const response = await orderdetailsApi.registerorder(payload);

//       if (response?.Order_id && response?.OrderNumber) {
//         localStorage.setItem('currentAppType', appType);
//         localStorage.setItem("orderNumber", response.OrderNumber);
//         localStorage.setItem("order_id", response.Order_id);

//         const stateForNextPage = {
//             ...orderData,
//             paymentMethod: method,
//             orderId: response.Order_id,
//             orderNumber: response.OrderNumber,
//             AppType: appType 
//         };

//         if (method === "Account") {
//             navigate("/account", { state: stateForNextPage });
//         } else {
//             navigate("/paying", { state: stateForNextPage });
//         }
//       } else {
//         alert("Failed to create order. Please try again.");
//       }
//     } catch (error) {
//       console.error("Order creation failed:", error);
//       alert("Error creating order");
//     }
//   };

//   const handleBack = () => {
//     navigate("/Order");
//   };

//   const handleHome = () => {
//     localStorage.removeItem('currentOrder');
//     localStorage.removeItem('currentAppType'); 
//     navigate("/home");
//   };

//   return (
//     <div className="add-selectpayment-select-payment-page">
//       <Header/>
//       <main className="add-selectpayment-payment-content">
//         <motion.div
//           className="add-selectpayment-cards-container"
//           initial={{ scale: 0.8, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           transition={{ duration: 0.6, ease: "easeOut" }}
//         >
//           <div
//             className={`add-selectpayment-payment-card add-selectpayment-upi-card ${selectedMethod === "upi" ? "add-selectpayment-selected" : ""}`}
//             onClick={() => handlePaymentMethod("upi")}
//           > 
//             <h3 className="add-selectpayment-card-title">UPI Payment</h3>
//             <div className="add-selectpayment-card-illustration">
//               <img src={upi} alt="QR Code with Hand" className="add-selectpayment-illustration-image" />
//             </div>
//             <p className="add-selectpayment-card-caption">Pay using UPI apps like PhonePe, Google Pay, Paytm</p>
//             <div className="add-selectpayment-app-logos">
//               <img src={gpay} alt="Google Pay" className="add-selectpayment-app-logo" />
//               <img src={phonepe} alt="PhonePe" className="add-selectpayment-app-logo" />
//               <img src={paytm} alt="Paytm" className="add-selectpayment-app-logo" />
//               <img src={pinelabs} alt="Pine Labs" className="add-selectpayment-app-logo" />
//             </div>
//           </div>

//           <div
//             className={`add-selectpayment-payment-card add-selectpayment-card-payment-card ${selectedMethod === "card" ? "add-selectpayment-selected" : ""}`}
//             onClick={() => handlePaymentMethod("card")}
//           >
//             <h3 className="add-selectpayment-card-title">Card Payment</h3>
//             <div className="add-selectpayment-card-illustration">
//               <img src={card} alt="Hand tapping card on reader" className="add-selectpayment-illustration-image" />
//             </div>
//             <p className="add-selectpayment-card-caption">Pay using Debit Card, Credit Card</p>
//             <div className="add-selectpayment-app-logos">
//                <img src={gpay} alt="Google Pay" className="add-selectpayment-app-logo" />
//               <img src={phonepe} alt="PhonePe" className="add-selectpayment-app-logo" />
//               <img src={paytm} alt="Paytm" className="add-selectpayment-app-logo" />
//               <img src={pinelabs} alt="Pine Labs" className="add-selectpayment-app-logo" />
//             </div>
//           </div>

//           {appType === "KIOSK" && (
//             <div
//               className={`add-selectpayment-payment-card add-selectpayment-account-card ${selectedMethod === "Account" ? "add-selectpayment-selected" : ""}`}
//               onClick={() => handlePaymentMethod("Account")}
//             >
//               <h3 className="add-selectpayment-card-title">Pay on Account</h3>
//               <div className="add-selectpayment-card-illustration">
//                 <img src={card} alt="User Account Icon" className="add-selectpayment-illustration-image" />
//               </div>
//               <p className="add-selectpayment-card-caption">Charge to your registered company account</p>
//               <div className="add-selectpayment-app-logos">
//                 <img src={gpay} alt="Google Pay" className="add-selectpayment-app-logo" />
//                 <img src={phonepe} alt="PhonePe" className="add-selectpayment-app-logo" />
//                 <img src={paytm} alt="Paytm" className="add-selectpayment-app-logo" />
//                 <img src={pinelabs} alt="Pine Labs" className="add-selectpayment-app-logo" />
//               </div>
//             </div>
//           )}
//         </motion.div>

//         <div className="add-selectpayment-total-amount-container">
//           <div className="add-selectpayment-total-amount-pill">
//             <span className="add-selectpayment-total-text">Total amount: ₹{totalPrice?.toFixed(2) || '0.00'}</span>
//           </div>
//         </div>
//       </main>

//       <footer className="add-selectpayment-bottom-buttons">
//         <button className="add-selectpayment-bottom-btn add-selectpayment-back-btn" onClick={handleBack}>
//           Back
//         </button>
//         <button className="add-selectpayment-bottom-btn add-selectpayment-home-btn" onClick={handleHome}>
//           Home
//         </button>
//       </footer>
//     </div>
//   );
// }
// "use client";

// import { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { motion } from "framer-motion";
// import "./SelectPaymentPage.css";
// import orderdetailsApi from "../../services/orderdetailsApi";
// import paymentsettingApi from "../../services/paymentsettingApi";
// import gpay from "../../assets/images/gpay.webp";
// import phonepe from "../../assets/images/phonepe.webp";
// import paytm from "../../assets/images/paytm.webp";
// import pinelabs from "../../assets/images/pinelabs.webp";
// import upi from "../../assets/images/upi.webp";
// import card from "../../assets/images/card.webp";
// import Header from "../../components/UI/Header/Header";
// import { toast } from "react-toastify";

// export default function SelectPaymentPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
  
//   const [selectedMethod, setSelectedMethod] = useState(null);
//   const appType = localStorage.getItem("AppType") || 'VM';
//   const [orderData, setOrderData] = useState(null);

//   const [availableMethods, setAvailableMethods] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let currentOrder = null;
    
//     // --- THE NEW, SIMPLIFIED LOGIC ---
//     // If we have fresh state from the previous page...
//     if (location.state?.selectedProducts) {
//       currentOrder = location.state;
//       // Simply save it. No enrichment needed.
//       console.log("Saving new order data to localStorage:", currentOrder);
//       localStorage.setItem('currentOrder', JSON.stringify(currentOrder));
//     } else {
//       // Fallback for when we return to this page
//       const dataFromStorage = localStorage.getItem('currentOrder');
//       if (dataFromStorage) {
//         currentOrder = JSON.parse(dataFromStorage);
//       }
//     }
//     setOrderData(currentOrder);
//   }, [location.state]);

//   useEffect(()=>{
//         const fetchPaymentOptions=async()=>{
//           const machineId=localStorage.getItem("machine_id")
//           if(!machineId)
//           {
//             console.error("Machine ID not found in Localstorage")
//             toast.error("Configuration error: Machine ID Is Missing")
//           }

//           try{
//             const response = await paymentsettingApi.getpaymenttype(machineId)
//             if(response && response.availableMethods)
//             {
//               setAvailableMethods(response.availableMethods) 
//           }
//           else{
//             setAvailableMethods([])
//           }
//         }
//           catch(error)
//           {
//             console.error("Failed to fetch Payment Type")
//             alert("could not load payment Options")
//             setAvailableMethods([])
//           }
//           finally{
//             setLoading(false)
//           }
//         };
//         fetchPaymentOptions();
//   },[]);
  

//   const { selectedProducts, totalPrice, motorCommands } = orderData || {
//     selectedProducts: [], totalPrice: 0, motorCommands: [],
//   };

//   const handlePaymentMethod = async (method) => {
//     setSelectedMethod(method);
//     const machineId = localStorage.getItem("machine_id");
//     const companyId = localStorage.getItem("company_id");

//     if (!machineId || !companyId) {
//       alert("Critical session error: Machine or Company ID is missing.");
//       return;
//     }
//     // For VM, motorCommands are essential. For KIOSK, they are not.
//     if (appType === "VM" && (!motorCommands || motorCommands.length === 0)) {
//       alert("Error: VM requires motor commands, which are missing.");
//       return;
//     }
//     if (!totalPrice || totalPrice <= 0) {
//       alert("Error: Invalid total price.");
//       return;
//     }
//     try {
//       const payload = {
//         Total: totalPrice, DeliveryType: "Direct", PaymentType: method, 
//         IsPaid: false, IsRefunded: false, RefundedAmount: 0.0,
//         PaymentId: null, company_id: companyId,
//       };
//       const response = await orderdetailsApi.registerorder(payload);
//       if (response?.Order_id && response?.OrderNumber) {
//         localStorage.setItem('currentAppType', appType);
//         localStorage.setItem("orderNumber", response.OrderNumber);
//         localStorage.setItem("order_id", response.Order_id);
//         const stateForNextPage = {
//             ...orderData, paymentMethod: method, orderId: response.Order_id,
//             orderNumber: response.OrderNumber, AppType: appType 
//         };
//         if (method === "Account") {
//             navigate("/account", { state: stateForNextPage });
//         } else {
//             navigate("/paying", { state: stateForNextPage });
//         }
//       } else {
//         alert("Failed to create order.");
//       }
//     } catch (error) {
//       console.error("Order creation failed:", error);
//       alert("Error creating order");
//     }
//   };

//   const handleBack = () => navigate("/Order");
//   const handleHome = () => {
//     localStorage.removeItem('currentOrder');
//     localStorage.removeItem('currentAppType'); 
//     navigate("/home");
//   };

//   return (
//     <div className="add-selectpayment-select-payment-page">
//       <Header/>
//       <main className="add-selectpayment-payment-content">
//         <motion.div
//           className="add-selectpayment-cards-container"
//           initial={{ scale: 0.8, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           transition={{ duration: 0.6, ease: "easeOut" }}
//         >
//           {loading && <p className="add-selectpayment-loading-text">Loading Payment Options...</p>}
          
//           {!loading && availableMethods.length === 0 && (
//             <p className="add-selectpayment-error-text">No payment methods are currently available.</p>
//           )}
//           <div className={`add-selectpayment-payment-card add-selectpayment-upi-card ${selectedMethod === "upi" ? "add-selectpayment-selected" : ""}`} onClick={() => handlePaymentMethod("upi")}>
//             <h3 className="add-selectpayment-card-title">UPI Payment</h3>
//             <div className="add-selectpayment-card-illustration"><img src={upi} alt="QR Code" className="add-selectpayment-illustration-image" /></div>
//             <p className="add-selectpayment-card-caption">Pay using UPI apps</p>
//             <div className="add-selectpayment-app-logos">
//               <img src={gpay} alt="Google Pay" className="add-selectpayment-app-logo" /><img src={phonepe} alt="PhonePe" className="add-selectpayment-app-logo" /><img src={paytm} alt="Paytm" className="add-selectpayment-app-logo" /><img src={pinelabs} alt="Pine Labs" className="add-selectpayment-app-logo" />
//             </div>
//           </div>
//           <div className={`add-selectpayment-payment-card add-selectpayment-card-payment-card ${selectedMethod === "card" ? "add-selectpayment-selected" : ""}`} onClick={() => handlePaymentMethod("card")}>
//             <h3 className="add-selectpayment-card-title">Card Payment</h3>
//             <div className="add-selectpayment-card-illustration"><img src={card} alt="Card reader" className="add-selectpayment-illustration-image" /></div>
//             <p className="add-selectpayment-card-caption">Debit & Credit Card</p>
//             <div className="add-selectpayment-app-logos">
//                <img src={gpay} alt="Google Pay" className="add-selectpayment-app-logo" /><img src={phonepe} alt="PhonePe" className="add-selectpayment-app-logo" /><img src={paytm} alt="Paytm" className="add-selectpayment-app-logo" /><img src={pinelabs} alt="Pine Labs" className="add-selectpayment-app-logo" />
//             </div>
//           </div>
//           {!loading && appType === "KIOSK" && availableMethods.includes("Account") && (
//             <div className={`add-selectpayment-payment-card add-selectpayment-account-card ${selectedMethod === "Account" ? "add-selectpayment-selected" : ""}`} onClick={() => handlePaymentMethod("Account")}>
//               <h3 className="add-selectpayment-card-title">Pay on Account</h3>
//               <div className="add-selectpayment-card-illustration"><img src={card} alt="Account Icon" className="add-selectpayment-illustration-image" /></div>
//               <p className="add-selectpayment-card-caption">Charge to your account</p>
//               <div className="add-selectpayment-app-logos">
//                 <img src={gpay} alt="Google Pay" className="add-selectpayment-app-logo" /><img src={phonepe} alt="PhonePe" className="add-selectpayment-app-logo" /><img src={paytm} alt="Paytm" className="add-selectpayment-app-logo" /><img src={pinelabs} alt="Pine Labs" className="add-selectpayment-app-logo" />
//               </div>
//             </div>
//           )}
//         </motion.div>
//         <div className="add-selectpayment-total-amount-container">
//           <div className="add-selectpayment-total-amount-pill"><span className="add-selectpayment-total-text">Total: ₹{totalPrice?.toFixed(2) || '0.00'}</span></div>
//         </div>
//       </main>
//       <footer className="add-selectpayment-bottom-buttons">
//         <button className="add-selectpayment-bottom-btn add-selectpayment-back-btn" onClick={handleBack}>Back</button>
//         <button className="add-selectpayment-bottom-btn add-selectpayment-home-btn" onClick={handleHome}>Home</button>
//       </footer>
//     </div>
//   );
// }
//Today:comment og
"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import "./SelectPaymentPage.css";
import orderdetailsApi from "../../services/orderdetailsApi";
import paymentsettingApi from "../../services/paymentsettingApi";
import gpay from "../../assets/images/gpay.webp";
import phonepe from "../../assets/images/phonepe.webp";
import paytm from "../../assets/images/paytm.webp";
import pinelabs from "../../assets/images/pinelabs.webp";
import upi from "../../assets/images/upi.webp";
import card from "../../assets/images/card.webp";
import Header from "../../components/UI/Header/Header";

export default function SelectPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedMethod, setSelectedMethod] = useState(null);
  const appType = localStorage.getItem("AppType") || "VM";
  const [orderData, setOrderData] = useState(null);
  const [availableMethods, setAvailableMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let currentOrder = null;
    if (location.state?.selectedProducts) {
      currentOrder = location.state;
      localStorage.setItem("currentOrder", JSON.stringify(currentOrder));
    } else {
      const dataFromStorage = localStorage.getItem("currentOrder");
      if (dataFromStorage) {
        currentOrder = JSON.parse(dataFromStorage);
      }
    }
    setOrderData(currentOrder);
  }, [location.state]);

  useEffect(() => {
    const fetchPaymentOptions = async () => {
      const machineId = localStorage.getItem("machine_id");
      if (!machineId) {
        console.error("Machine ID not found in localStorage.");
        setLoading(false);
        return;
      }
      try {
        const response = await paymentsettingApi.getpaymenttype(machineId);
        if (response && response.available_methods) {
          setAvailableMethods(response.available_methods);
        } else {
          setAvailableMethods([]);
        }
      } catch (error) {
        console.error("Failed to fetch payment methods:", error);
        setAvailableMethods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentOptions();
  }, []);

  const { totalPrice, motorCommands } = orderData || {
    selectedProducts: [],
    totalPrice: 0,
    motorCommands: [],
  };

  const handlePaymentMethod = async (method) => {
    setSelectedMethod(method);
    const machineId = localStorage.getItem("machine_id");
    const companyId = localStorage.getItem("company_id");

    if (!machineId || !companyId) {
      alert("Critical session error: Machine or Company ID is missing.");
      return;
    }
    if (appType === "VM" && (!motorCommands || motorCommands.length === 0)) {
      alert("Error: VM requires motor commands, which are missing.");
      return;
    }
    if (!totalPrice || totalPrice <= 0) {
      alert("Error: Invalid total price.");
      return;
    }
    try {
      const payload = {
        Total: totalPrice,
        DeliveryType: "Direct",
        PaymentType: method,
        IsPaid: false,
        IsRefunded: false,
        RefundedAmount: 0.0,
        PaymentId: null,
        company_id: companyId,
      };
      const response = await orderdetailsApi.registerorder(payload);
      if (response?.Order_id && response?.OrderNumber) {
        localStorage.setItem("currentAppType", appType);
        localStorage.setItem("orderNumber", response.OrderNumber);
        localStorage.setItem("order_id", response.Order_id);

        const stateForNextPage = {
          ...orderData,
          paymentMethod: method,
          orderId: response.Order_id,
          orderNumber: response.OrderNumber,
          AppType: appType,
        };

        if (method === "card") {
          navigate("/pinelabs", { state: stateForNextPage });
        } else if (method === "Account") {
          navigate("/account", { state: stateForNextPage });
        } else {
          navigate("/paying", { state: stateForNextPage });
        }
      } else {
        alert("Failed to create order.");
      }
    } catch (error) {
      console.error("Order creation failed:", error);
      alert("Error creating order");
    }
  };

  const handleBack = () => navigate("/Order");
  const handleHome = () => {
    localStorage.removeItem("currentOrder");
    localStorage.removeItem("currentAppType");
    navigate("/home");
  };

  return (
    <div className="add-selectpayment-select-payment-page">
      <Header />
      <main className="add-selectpayment-payment-content">
        <motion.div
          className="add-selectpayment-cards-container"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {loading && (
            <p className="add-selectpayment-loading-text">
              Loading Payment Options...
            </p>
          )}

          {!loading && availableMethods.length === 0 && (
            <p className="add-selectpayment-error-text">
              No payment methods are currently available.
            </p>
          )}

          {!loading && availableMethods.includes("UPI") && (
            <div
              className={`add-selectpayment-payment-card add-selectpayment-upi-card ${
                selectedMethod === "upi" ? "add-selectpayment-selected" : ""
              }`}
              onClick={() => handlePaymentMethod("upi")}
            >
              <h3 className="add-selectpayment-card-title">UPI Payment</h3>
              <div className="add-selectpayment-card-illustration">
                <img
                  src={upi}
                  alt="QR Code"
                  className="add-selectpayment-illustration-image"
                />
              </div>
              <p className="add-selectpayment-card-caption">
                Pay using UPI apps
              </p>
              <div className="add-selectpayment-app-logos">
                <img
                  src={gpay}
                  alt="Google Pay"
                  className="add-selectpayment-app-logo"
                />
                <img
                  src={phonepe}
                  alt="PhonePe"
                  className="add-selectpayment-app-logo"
                />
                <img
                  src={paytm}
                  alt="Paytm"
                  className="add-selectpayment-app-logo"
                />
                <img
                  src={pinelabs}
                  alt="Pine Labs"
                  className="add-selectpayment-app-logo"
                />
              </div>
            </div>
          )}

          {!loading && availableMethods.includes("Card") && (
            <div
              className={`add-selectpayment-payment-card add-selectpayment-card-payment-card 
            ${selectedMethod === "card" ? "add-selectpayment-selected" : ""}`}
              onClick={() => handlePaymentMethod("card")}
            >
              <h3 className="add-selectpayment-card-title">Card Payment</h3>
              <div className="add-selectpayment-card-illustration">
                <img
                  src={card}
                  alt="Card reader"
                  className="add-selectpayment-illustration-image"
                />
              </div>
              <p className="add-selectpayment-card-caption">
                Debit & Credit Card
              </p>
              <div className="add-selectpayment-app-logos">
                <img
                  src={gpay}
                  alt="Google Pay"
                  className="add-selectpayment-app-logo"
                />
                <img
                  src={phonepe}
                  alt="PhonePe"
                  className="add-selectpayment-app-logo"
                />
                <img
                  src={paytm}
                  alt="Paytm"
                  className="add-selectpayment-app-logo"
                />
                <img
                  src={pinelabs}
                  alt="Pine Labs"
                  className="add-selectpayment-app-logo"
                />
              </div>
            </div>
          )}

          {!loading && availableMethods.includes("Account") && (
            <div
              className={`add-selectpayment-payment-card add-selectpayment-account-card ${
                selectedMethod === "Account" ? "add-selectpayment-selected" : ""
              }`}
              onClick={() => handlePaymentMethod("Account")}
            >
              <h3 className="add-selectpayment-card-title">Pay on Account</h3>
              <div className="add-selectpayment-card-illustration">
                <img
                  src={card}
                  alt="Account Icon"
                  className="add-selectpayment-illustration-image"
                />
              </div>
              <p className="add-selectpayment-card-caption">
                Charge to your account
              </p>
              <div className="add-selectpayment-app-logos">
                <img
                  src={gpay}
                  alt="Google Pay"
                  className="add-selectpayment-app-logo"
                />
                <img
                  src={phonepe}
                  alt="PhonePe"
                  className="add-selectpayment-app-logo"
                />
                <img
                  src={paytm}
                  alt="Paytm"
                  className="add-selectpayment-app-logo"
                />
                <img
                  src={pinelabs}
                  alt="Pine Labs"
                  className="add-selectpayment-app-logo"
                />
              </div>
            </div>
          )}
        </motion.div>
        <div className="add-selectpayment-total-amount-container">
          <div className="add-selectpayment-total-amount-pill">
            <span className="add-selectpayment-total-text">
              Total: ₹{totalPrice?.toFixed(2) || "0.00"}
            </span>
          </div>
        </div>
      </main>
      <footer className="add-selectpayment-bottom-buttons">
        <button
          className="add-selectpayment-bottom-btn add-selectpayment-back-btn"
          onClick={handleBack}
        >
          Back
        </button>
        <button
          className="add-selectpayment-bottom-btn add-selectpayment-home-btn"
          onClick={handleHome}
        >
          Home
        </button>
      </footer>
    </div>
  );
}