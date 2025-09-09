import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@mui/material";
import { Home, CheckCircle, Cancel, LocalOffer, Receipt, AccountBalanceWallet, CreditCard, PointOfSale } from "@mui/icons-material";
import "./OrderBillPage.css";
import companyApi from '../../services/companyApi';
import printingService from "../../services/printingService";
import machineidApi from "../../services/machineidApi";
import Header from "../../components/UI/Header/Header";

export default function OrderBillPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const printHasBeenTriggered = useRef(false);

  const {
    totalPrice = 0,
    vendingLog = [],
    refundAmount = 0,
    orderNumber = null,
    transactionId = null,
    AppType = 'VM',
    paymentDetails = { method: 'Unknown' },
    taxDetails = { rate: 0, cgst: 0, sgst: 0 }
  } = location.state || {};

  // One state to hold all asynchronously fetched data
  const [externalDetails, setExternalDetails] = useState({
    company: null,
    machine: null,
    isLoading: true, // Start in a loading state
  });

  const vendedSubtotal = vendingLog.reduce((total, item) => total + (item.price * item.quantityVended), 0);
  const finalAmountPaidVM = vendedSubtotal;
  const totalItemsVended = vendingLog.reduce((sum, item) => sum + item.quantityVended, 0);
  const finalAmountPaidKiosk = totalPrice;
  const currentDate = new Date();

  // --- EFFECT #1: Fetches ALL external data when the component loads ---
  useEffect(() => {
    const fetchAllDetails = async () => {
      const machineGuid = localStorage.getItem("machine_id");

      try {
        // Fetch company and machine details in parallel for speed
        const [companyData, machineData] = await Promise.all([
          companyApi.getCompanyName(),
          // Correctly call the API with the required machineGuid
          machineidApi.getspecificname(machineGuid)
        ]);
        
        // Update state with all fetched data and set loading to false
        setExternalDetails({
          company: companyData,
          machine: machineData,
          isLoading: false
        });
      } catch (error) {
        console.error("Failed to fetch external details for printing:", error);
        setExternalDetails({ company: null, machine: null, isLoading: false }); // Stop loading on error
      }
    };
    
    fetchAllDetails();
  }, []); // Empty array ensures this runs only once.

  // --- EFFECT #2: Triggers the print job ONLY when all data is ready ---
  useEffect(() => {
    const { company, machine, isLoading } = externalDetails;

    // Exit if still loading, if data is missing, or if we've already printed
    if (isLoading || !company || !machine || !orderNumber || printHasBeenTriggered.current) {
      return;
    }

    // If we're here, all data is ready. Set the flag to prevent re-printing.
    printHasBeenTriggered.current = true;

    // Call the print function with all the guaranteed data
    triggerAutoPrint({
      ...location.state,
      companyDetails: company,
      machineName: machine.Name, // Pass the fetched name
      finalAmountPaid: AppType === 'KIOSK' ? finalAmountPaidKiosk : finalAmountPaidVM,
      vendedSubtotal,
      totalItemsVended
    });

  }, [externalDetails, location.state, orderNumber, AppType]); // This effect re-runs when externalDetails changes.

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/home");
    }, 30000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const handleDone = () => navigate("/home");

  const renderPaymentDetails = () => {
    // ... (this function is correct and unchanged)
  };

  const triggerAutoPrint = async (orderData) => {
    // Only print for KIOSK
    if (orderData.AppType !== 'KIOSK') {
      console.log(`AppType is '${orderData.AppType}'. Skipping print job.`);
      return;
    }
    
    console.log("AppType is KIOSK. Proceeding with print job...");
    try {
      const baseBillData = {
        // --- FIX: Use the key 'machine_name' that the Python backend expects ---
        machine_name: orderData.machineName,

        // The rest of the payload is correct
        order_id: orderData.orderNumber || "N/A",
        transaction_id: orderData.transactionId || "N/A", // Correctly send transaction_id
        machine_id: localStorage.getItem("machine_id") || "N/A",
        datetime: currentDate.toLocaleString("en-IN"),
        company_name: orderData.companyDetails?.company_name || "SMART VENDING MACHINE",
        company_address: orderData.companyDetails?.company_Address || "Main Building Lobby",
        company_phone: orderData.companyDetails?.company_phone || "+91 98765 43210",
        gst_number: orderData.companyDetails?.GSTNumber || "",
        total: orderData.finalAmountPaid,
        items: orderData.vendingLog.map(item => ({
          product_id: item.id,
          name: item.productName,
          qty: item.quantityVended + item.quantityFailed,
          price: item.price,
          quantityFailed: item.quantityFailed || 0
        })),
        app_type: orderData.AppType,
        refund_amount: orderData.refundAmount || 0,
        totalItemsVended: orderData.totalItemsVended
      };

      const acknowledgementBillData = { ...baseBillData, bill_type: "acknowledgement", payment_details: orderData.paymentDetails, tax_details: orderData.taxDetails };
      const normalBillData = { ...baseBillData, bill_type: "normal" };

      await Promise.all([
        printingService.generateBill(acknowledgementBillData),
        printingService.generateBill(normalBillData)
      ]);
    } catch (error) {
      console.error("An error occurred during the KIOSK printing process:", error);
    }
  };

  return (
    <div className="bill-page">
      <Header />
      <div className="bill-container">
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="receipt-container">
          <div className="store-header">
            <h1 className="store-name">{externalDetails.company?.company_name || "SMART VENDING MACHINE"}</h1>
            <p className="store-address">{externalDetails.company?.company_Address || "..."}</p>
            <p className="store-contact">{externalDetails.company?.company_phone || "..."}</p>
          </div>
          <div className="receipt-divider">{"=".repeat(40)}</div>
          <div className="transaction-details">
            <div className="detail-line"><span>Date:</span><span>{currentDate.toLocaleDateString("en-IN")}</span></div>
            <div className="detail-line"><span>Time:</span><span>{currentDate.toLocaleTimeString("en-IN")}</span></div>
            <div className="detail-line"><span>BILL NO:</span><span>{orderNumber || "N/A"}</span></div>
            <div className="detail-line"><span>Transaction ID:</span><span>{transactionId || "N/A"}</span></div>
          </div>
          <div className="receipt-divider">{"-".repeat(40)}</div>
          {AppType === 'VM' ? (
            <>
              {totalItemsVended > 0 && ( <div className="items-section"> <div className="items-header success"><CheckCircle fontSize="small" /> Vended Items</div> <div className="items-table-header"><span>ITEM</span><span>QTY</span><span>RATE</span><span>AMOUNT</span></div> {vendingLog.filter(p => p.quantityVended > 0).map((p, i) => ( <div key={`vended-${i}`} className="item-line"> <div className="item-name">{p.productName}</div> <div className="item-details"><span>{p.quantityVended}</span><span>₹{p.price.toFixed(2)}</span><span>₹{(p.price * p.quantityVended).toFixed(2)}</span></div> </div> ))} </div> )}
              {refundAmount > 0 && ( <div className="items-section"> <div className="items-header failed"><Cancel fontSize="small" /> Failed / Refunded Items</div> <div className="items-table-header minimal"><span>ITEM</span><span>QTY FAILED</span></div> {vendingLog.filter(p => p.quantityFailed > 0).map((p, i) => ( <div key={`failed-${i}`} className="item-line minimal"> <div className="item-name">{p.productName}</div> <div className="item-details"><span>{p.quantityFailed}</span></div> </div> ))} </div> )}
            </>
          ) : (
            <div className="items-section"> <div className="items-header"><Receipt fontSize="small" /> Your Order</div> <div className="items-table-header"><span>ITEM</span><span>QTY</span><span>RATE</span><span>AMOUNT</span></div> {vendingLog.map((product, index) => { const originalQty = product.quantityVended + product.quantityFailed; return ( <div key={`kiosk-${index}`} className="item-line"> <div className="item-name">{product.productName}</div> <div className="item-details"><span>{originalQty}</span><span>₹{product.price.toFixed(2)}</span><span>₹{(product.price * originalQty).toFixed(2)}</span></div> </div> ); })} </div>
          )}
          {renderPaymentDetails()}
          <div className="receipt-divider">{"-".repeat(40)}</div>
          <div className="totals">
            {AppType === 'VM' ? (
              <>
                <div className="total-line"><span>Original Cart Total:</span><span>₹{totalPrice.toFixed(2)}</span></div>
                {refundAmount > 0 && ( <div className="total-line refund"> <span><LocalOffer fontSize="small" /> Refund Processed:</span> <span>- ₹{refundAmount.toFixed(2)}</span> </div> )}
                <div className="receipt-divider soft"></div>
                <div className="total-line"><span>Subtotal (Paid):</span><span>₹{vendedSubtotal.toFixed(2)}</span></div>
              </>
            ) : (
              <div className="total-line"><span>Subtotal:</span><span>₹{totalPrice.toFixed(2)}</span></div>
            )}
            <div className="total-line"><span>CGST ({taxDetails.rate / 2}%):</span><span>₹{taxDetails.cgst.toFixed(2)}</span></div>
            <div className="total-line"><span>SGST ({taxDetails.rate / 2}%):</span><span>₹{taxDetails.sgst.toFixed(2)}</span></div>
            <div className="receipt-divider">{"-".repeat(40)}</div>
            <div className="total-line final-total">
              <span>FINAL AMOUNT PAID:</span>
              <span>₹{(AppType === 'VM' ? finalAmountPaidVM : finalAmountPaidKiosk).toFixed(2)}</span>
            </div>
          </div>
          <div className="receipt-divider">{"=".repeat(40)}</div>
          <div className="thank-you">
            {AppType === 'VM' && totalItemsVended > 0 && <p>Please collect your items below.</p>}
            <p className="visit-again">Thank you! Visit us again!</p>
          </div>
          <div className="receipt-footer"><p>GST No: {externalDetails.company?.GSTNumber || ""}</p></div>
          <div className="done-section">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="contained" onClick={handleDone} className="done-button" startIcon={<Home />}>DONE</Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}