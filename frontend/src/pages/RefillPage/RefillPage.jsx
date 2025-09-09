"use client";

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Info, Search, Keyboard } from "@mui/icons-material"
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import "./RefillPage.css"
import { toast } from "react-toastify"
import productApi from "../../services/productApi"
import clearstockApi from "../../services/clearstockApi";
import refilldataAPi from "../../services/refilldataAPi";
import refillApi from "../../services/refillApi";
// --- CORRECTED: The new API service is imported here ---
import stockrefillApi from "../../services/stockrefillApi"; 
import Header from "../../components/UI/Header/Header";


const getLocalMachineGuid = () => {
  return localStorage.getItem("machine_id") || "default-machine-guid";
};

// --- Reusable on-screen keypad component (UNCHANGED) ---
const SearchKeypad = ({ value, onChange, onClose }) => {
    const keys = [
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
        'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
        'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
        'Z', 'X', 'C', 'V', 'B', 'N', 'M'
    ];
    const handleKeyPress = (key) => { onChange(value + key); };
    const handleBackspace = () => { onChange(value.slice(0, -1)); };
    const handleSpace = () => { onChange(value + ' '); };
    return (
        <motion.div 
            className="keypad-overlay"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", ease: "circOut", duration: 0.4 }}
        >
            <div className="keypad-header">
                <button className="keypad-done-btn" onClick={onClose}>Done</button>
            </div>
            <div className="keypad-grid">
                {keys.map(key => ( <button key={key} className="keypad-key" onClick={() => handleKeyPress(key)}>{key}</button> ))}
            </div>
            <div className="keypad-bottom-row">
                <button className="keypad-key wide" onClick={handleSpace}>Space</button>
                <button className="keypad-key wide" onClick={handleBackspace}>Backspace</button>
            </div>
        </motion.div>
    );
};

export default function RefillPage() {
  const navigate = useNavigate();

  const [currentScreen, setCurrentScreen] = useState("grid");
  const [selectedMotor, setSelectedMotor] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [refillQuantity, setRefillQuantity] = useState("");
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [infoProduct, setInfoProduct] = useState(null);
  const [activeMotorIds, setActiveMotorIds] = useState([]);
  const [motors, setMotors] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);

  // All your existing functions are preserved exactly as they were. (UNCHANGED)
  const buildMotorState = (activeIds, stockData, productList) => {
    return activeIds.map((id) => {
      const stockItem = stockData.find(stock => stock.Motor_number === id);
      if (!stockItem || !stockItem.Product_id) {
        const hasZeroStock = stockItem && stockItem.stock === 0;
        if (hasZeroStock) {
          const productDetails = productList.find(p => p.id === stockItem.Product_id);
          return { id, product: productDetails || null, quantity: 0, maxCapacity: stockItem.Quantity || 10, stockId: stockItem.id };
        }
        return { id, product: null, quantity: 0, maxCapacity: 10, stockId: null };
      }
      const productDetails = productList.find(p => p.id === stockItem.Product_id);
      return {
        id, product: productDetails || null, quantity: stockItem.stock || 0,
        maxCapacity: stockItem.Quantity || 10, stockId: stockItem.id,
      };
    });
  };
const loadInitialData = useCallback(async () => {
  try {
    const savedMotorConfig = localStorage.getItem("lastKnownMotorConfig");
    if (!savedMotorConfig) {
      console.warn("No motor configuration found. Please set up spirals first.");
      setMotors([]);
      setActiveMotorIds([]);
      return;
    }
    const motorStates = JSON.parse(savedMotorConfig);
    const activeIds = motorStates.map((isActive, index) => (isActive ? index + 1 : null)).filter(Boolean);
    setActiveMotorIds(activeIds);

    if (activeIds.length === 0) {
      setMotors([]);
      return;
    }

    const vendorId = localStorage.getItem("vendor_id"); // Get vendor_id from localStorage
    if (!vendorId) {
      console.error("Vendor ID not found in localStorage. Cannot fetch filtered products.");
      toast.error("Vendor ID is missing. Cannot load products.");
      setMotors([]);
      return;
    }

    // Changed API call here
    const rawProductsResponse = await productApi.getFilteredProductDetails(vendorId); 
    
    const productListSource = Array.isArray(rawProductsResponse) ? rawProductsResponse : (rawProductsResponse?.data || []);
    const productList = productListSource.map(item => ({
      id: item.product_id,
      name: item.product_name,
      price: item.price,
      image: item.image_path ? `data:image/png;base64,${item.image_path}` : "/placeholder.svg",
      code: item.product_code || ""
    }));
    setAllProducts(productList);

    let finalMotors = [];
    try {
      const machineGuid = getLocalMachineGuid();
      const rawStockData = await refillApi.getStockByMachine(machineGuid);
      const machineStocks = Array.isArray(rawStockData) ? rawStockData : [];
      finalMotors = buildMotorState(activeIds, machineStocks, productList);
      saveMotorsToStorage(finalMotors);
    } catch (apiError) {
      console.error("Could not fetch stock from backend. Loading from local cache.", apiError);
      toast.warn("Could not get latest stock. Displaying last known data.");
      const cachedMotors = localStorage.getItem("refillMotors");
      if (cachedMotors) {
        const parsedMotors = JSON.parse(cachedMotors);
        finalMotors = parsedMotors.filter(m => activeIds.includes(m.id));
      } else {
        console.warn("Backend failed and no cache available. Building empty motor state.");
        finalMotors = buildMotorState(activeIds, [], productList);
      }
    }
    setMotors(finalMotors);
  } catch (error) {
    console.error("A critical error occurred while initializing Refill Page:", error);
    toast.error(`Failed to load page configuration.`);
  }
}, []);
  useEffect(() => { loadInitialData(); }, [loadInitialData]);
  const saveMotorsToStorage = (updatedMotors) => {
    try { localStorage.setItem("refillMotors", JSON.stringify(updatedMotors)); } catch (error) { console.error("Failed to save to localStorage:", error); }
  };
  const updateStockAPI = async (motor, newQuantity = null, newProduct = null, clearStock = false) => {
    try {
      const machineGuid = getLocalMachineGuid();
      const productForUpdate = newProduct || motor.product;
      if (!productForUpdate || !productForUpdate.id) { toast.error(`Cannot update motor ${motor.id}: no product assigned.`); return false; }
      const payload = {
        Machine_Guid: machineGuid, Motor_number: motor.id, Product_id: productForUpdate.id, product_name:selectedProduct.name,
        product_price:selectedProduct.price, stock: clearStock ? 0 : newQuantity, Quantity: motor.maxCapacity,
        company_id: parseInt(localStorage.getItem("company_id") || "1"),
      };
      const stockData = await refillApi.getStockByMachine(machineGuid);
      const machineStocks = Array.isArray(stockData) ? stockData : [];
      const existingStock = machineStocks.find(s => s.Machine_Guid === machineGuid && s.Motor_number === motor.id);
      if (existingStock) {
        return await refillApi.updatestocks(machineGuid, payload);
      } else {
        if (clearStock) { toast.info("Motor is already empty."); return true; }
        return await refillApi.stockupdate(payload);
      }
    } catch (error) {
      console.error("Error updating stock via API:", error);
      toast.error(`Failed to update stock: ${error.response?.data?.error || error.message}`);
      return false;
    }
  };

  const handleRefill = async () => {
    if (!refillQuantity || !selectedProduct || !selectedMotor) return toast.error("Please enter quantity.");
    const quantity = parseInt(refillQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) return toast.error("Please enter a valid quantity.");
    if (quantity > selectedMotor.maxCapacity) return toast.error(`Quantity cannot exceed capacity of ${selectedMotor.maxCapacity}.`);
    const stockBefore = selectedMotor.quantity || 0;
    const quantityAdded = quantity - stockBefore;
    if (quantityAdded <= 0) {
      toast.info("New quantity is not greater than the current stock. No refill action taken.");
      setCurrentScreen("grid");
      return;
    }

    const apiResponse = await updateStockAPI({ ...selectedMotor, product: selectedProduct }, quantity, selectedProduct, false);
    if (apiResponse !== false) {
      
      // =========================================================================
      // --- CORRECTED CODE STARTS HERE ---
      // This is the implementation of the API call you requested.
      // =========================================================================
      
      // 1. Construct the payload matching your backend's required fields.
      const refillPayload = {
        Machine_Guid: getLocalMachineGuid(),
        Motor_number: selectedMotor.id,
        Product_id: selectedProduct.id,
        ProductName: selectedProduct.name,
        Quantity: quantityAdded, // We send the quantity that was ADDED
        AppType: "", // This field is required by your backend
        company_id: parseInt(localStorage.getItem("company_id"), 10)
      };

      // 2. Call the API service as a background task.
      // We use .then().catch() so it doesn't block the UI from updating.
      stockrefillApi.onRefilling(refillPayload)
        .then(response => {
          console.log("Refill event logged successfully via /refillregister:", response.message);
        })
        .catch(error => {
          // Log the error but don't show an error toast to the user,
          // as this is a secondary logging action.
          console.error("Failed to log refill event via /refillregister in the background:", error);
        });

      // --- END OF CORRECTED CODE ---
      // =========================================================================

      const logpayload={
       machine_guid:getLocalMachineGuid(),
       motor_number:selectedMotor.id,
       product_id:selectedProduct.id,
       product_name:selectedProduct.name,
       quantity_added:quantityAdded,
       stock_before_refill:stockBefore,
       stock_after_refill:quantity
    }
    refilldataAPi.initializestock(logpayload)
      .then(response=>{ console.log("Stock required log saved successfully:", response.message); })
      .catch(error => { console.error("Failed to save stock required log in the background."); });

      const updatedMotors = motors.map(m => m.id === selectedMotor.id ? { ...m, product: selectedProduct, quantity } : m);
      setMotors(updatedMotors);
      saveMotorsToStorage(updatedMotors);
      rotateMotor(selectedMotor.id);
      setCurrentScreen("grid");
      toast.success("Stock refilled successfully.");
    }
  };

  // All other functions (handleClearStock, etc.) remain exactly the same (UNCHANGED)
  const handleClearStock = async () => {
    if (!selectedMotor || !selectedMotor.product) { setCurrentScreen("grid"); return toast.info("This motor is already empty."); }
    const stockToClear = { ...selectedMotor };
    try {
      const machine_id = getLocalMachineGuid();
      const payload = { machine_id, motor_id: selectedMotor.id };
      const response = await refillApi.clearstock(payload);
      if (response && response.cleared_motors?.includes(selectedMotor.id)) {
        try{
         const clearlogpayload={
            machine_guid:getLocalMachineGuid(), motor_number:stockToClear.id, product_id:stockToClear.product.id,
            product_name:stockToClear.product.name, quantity_cleared:stockToClear.quantity, clear_type:"SINGLE"
         }
        await clearstockApi.initializeclearstocks(clearlogpayload)
        console.log("Stock clear event logged successfully.");
        } catch(loggingError) { console.error("Failed to log stock clear event in the background:", loggingError); }
        const updatedMotors = motors.map(m => m.id === selectedMotor.id ? { ...m, quantity: 0 } : m);
        setMotors(updatedMotors);
        saveMotorsToStorage(updatedMotors);
        toast.success(`Stock cleared for motor ${selectedMotor.id}.`);
      } else { toast.error(response?.message || "Stock clear failed for selected motor."); }
    } catch (err) { toast.error("Something went wrong while clearing the stock."); } finally { setCurrentScreen("grid"); }
  };
  const handleAllClearStock = () => {
    const motorsWithStock = motors.filter(m => m.product && m.quantity > 0);
    if (motorsWithStock.length === 0) { return toast.info("All active motors are already empty."); }
    setIsConfirmOpen(true);
  };
  const executeClearAllStock = async () => {
    setIsConfirmOpen(false);
    try {
      const machine_id = getLocalMachineGuid();
      const payload = { machine_id };
      const response = await refillApi.clearstock(payload);
      if (response && Array.isArray(response.cleared_motors)) {
        const motorsToClear = motors.filter(motor => response.cleared_motors.includes(motor.id));
        const logPromises = motorsToClear.map(motor => {
          const logPayload = {
            machine_guid: machine_id, motor_number: motor.id, product_id: motor.product.id,
            product_name: motor.product.name, quantity_cleared: motor.quantity, clear_type: 'ALL_CLEAR'
          };
          return clearstockApi.initializeclearstocks(logPayload);
        });
        await Promise.all(logPromises);
        const clearedMotors = motors.map(m => ({ ...m, quantity: 0 }));
        setMotors(clearedMotors);
        saveMotorsToStorage(clearedMotors);
        toast.success("All stock has been cleared successfully!");
      } else { toast.error(response?.message || "Stock clear failed. Please try again."); }
    } catch (err) { toast.error("Something went wrong while clearing all stock."); }
  };
  const rotateMotor = (motorId) => { console.log(`Motor ${motorId} is rotating...`); toast.success(`Motor ${motorId} rotated successfully!`); }
  const handleMotorClick = (motor) => { setSelectedMotor(motor); setCurrentScreen("popup"); }
  const handleInfoClick = (e, motor) => { e.stopPropagation(); setInfoProduct(motor.product); setShowInfoPopup(true); }
  const handleChangeItem = () => { setSearchQuery(""); setSelectedProduct(null); setIsKeypadOpen(false); setCurrentScreen("changeItem"); }
  const handleSubmitProduct = () => { if (selectedProduct) { setRefillQuantity(""); setIsKeypadOpen(false); setCurrentScreen("refillProduct"); } }
  const handleProductSelect = (product) => { setSelectedProduct(product); }
  const handleRefillKeypadInput = (value) => { if (value === "C") setRefillQuantity(""); else if (value === "X") setRefillQuantity(p => p.slice(0, -1)); else if (refillQuantity.length < 2) setRefillQuantity(p => p + value); }
  const handleBack = () => currentScreen === "grid" ? navigate("/operator") : setCurrentScreen("grid");
  const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code?.includes(searchQuery));
  const groupedMotors = motors.reduce((acc, motor) => {
    const rowIndex = Math.floor((motor.id - 1) / 10);
    if (!acc[rowIndex]) { acc[rowIndex] = []; }
    acc[rowIndex].push(motor);
    return acc;
  }, {});
  Object.values(groupedMotors).forEach(row => row.sort((a, b) => a.id - b.id));

  // JSX Rendering (UNCHANGED)
  return (
    <div className="refill-page">
       <Header/>
      <div className="sub-header">
        <span className="click-to-refill">Click to refill ({activeMotorIds.length} active motors)</span>
      </div>
      <main className="main-content">
        {currentScreen === "grid" && (
          <>
            {motors.length === 0 && activeMotorIds.length > 0 ? (
              <div className="no-motors-message"><p>Loading motor data...</p></div>
            ) : motors.length === 0 && activeMotorIds.length === 0 ? (
              <div className="no-motors-message">
                <p>No active motors found. Please configure motors in Spiral Settings first.</p>
                <button className="configure-button" onClick={() => navigate("/spiral-setting")}>Go to Spiral Settings</button>
              </div>
            ) : (
              <div className="motor-grid-container">
                {Object.keys(groupedMotors).sort((a, b) => a - b).map(rowIndex => (
                  <div key={rowIndex} className="motor-row">
                    {groupedMotors[rowIndex].map((motor) => (
                      <div key={motor.id} className="motor-card" onClick={() => handleMotorClick(motor)}>
                        {motor.product ? (
                          <>
                            <div className="motor-card-top">
                              <button className="info-icon" onClick={(e) => handleInfoClick(e, motor)}><Info fontSize="small" /></button>
                              <span className="motor-number">{motor.id}</span>
                            </div>
                            <div className="product-image"><img src={motor.product.image} alt={motor.product.name} /></div>
                            <div className="motor-card-bottom">
                              <span className="product-price">₹{motor.product.price}</span>
                              <span className="product-quantity">{motor.quantity}/{motor.maxCapacity}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="motor-card-top"><span className="motor-number">{motor.id}</span></div>
                            <div className="refill-label">Refill</div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <div className="bottom-actions">
        <button className="back-button" onClick={handleBack}>Back</button>
        <button className="all-clear-stock" onClick={handleAllClearStock}>All clear stock</button>
        <Dialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} aria-labelledby="confirm-dialog-title">
          <DialogTitle id="confirm-dialog-title">Confirm Action</DialogTitle>
          <DialogContent><DialogContentText>Are you sure you want to clear all stock from this machine? This action cannot be undone.</DialogContentText></DialogContent>
          <DialogActions>
            <Button onClick={() => setIsConfirmOpen(false)} variant="outlined">No</Button>
            <Button onClick={executeClearAllStock} color="error" variant="contained" autoFocus>Yes, Clear All</Button>
          </DialogActions>
        </Dialog>
      </div>
      <AnimatePresence>
        {currentScreen === "popup" && (
          <motion.div className="popup-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="popup-container" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <h2 className="refill-popup-title">Motor {selectedMotor?.id}</h2>
              <div className="action-buttons">
                <button className="action-button" onClick={handleChangeItem}>Change item</button>
                <button className="action-button" onClick={() => { setSelectedProduct(selectedMotor.product); setCurrentScreen("refillProduct"); }} disabled={!selectedMotor?.product}>Refill</button>
                <button className="action-button" onClick={handleClearStock}>Clear stock</button>
                </div>
              <button className="cancel-button" onClick={() => setCurrentScreen("grid")}>Cancel</button>
            </motion.div>
          </motion.div>
        )}
        {currentScreen === "changeItem" && (
            <motion.div className="fullscreen-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="fullscreen-container" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
                    <h2 className="fullscreen-title">Select Product for Motor {selectedMotor?.id}</h2>
                    <div className="search-section">
                        <div className="search-input-container">
                            <input type="text" className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..." readOnly={isKeypadOpen} />
                            <Search className="search-icon" />
                            <button className="keypad-toggle-btn" onClick={() => setIsKeypadOpen(!isKeypadOpen)}><Keyboard /></button>
                        </div>
                    </div>
                    <div className="table-container">
                        <div className="table-header">
                            <div className="table-cell sno-cell">S.No</div>
                            <div className="table-cell product-cell">Product</div>
                            <div className="table-cell price-cell">Price</div>
                        </div>
                        <div className="table-body">
                            {filteredProducts.map((product, index) => (
                                <div key={product.id} className={`table-row ${selectedProduct?.id === product.id ? "selected" : ""}`} onClick={() => handleProductSelect(product)}>
                                    <div className="table-cell sno-cell">{index + 1}</div>
                                    <div className="table-cell product-cell">
                                        <img src={product.image} alt={product.name} className="product-thumbnail" />
                                        <span>{product.name}</span>
                                    </div>
                                    <div className="table-cell price-cell">₹{product.price}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="footer-actions">
                        <button className="footer-button" onClick={() => { setIsKeypadOpen(false); setCurrentScreen("popup"); }}>Cancel</button>
                        <button className="footer-button submit-button" onClick={handleSubmitProduct} disabled={!selectedProduct}>Submit</button>
                    </div>
                    <AnimatePresence>
                        {isKeypadOpen && ( <SearchKeypad value={searchQuery} onChange={setSearchQuery} onClose={() => setIsKeypadOpen(false)} /> )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        )}
        {currentScreen === "refillProduct" && selectedProduct && (
            <motion.div className="fullscreen-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="fullscreen-container refill-container" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
                    <h2 className="fullscreen-title">Refill Motor {selectedMotor?.id}</h2>
                    <div className="product-image-box"><img src={selectedProduct.image} alt={selectedProduct.name} className="selected-product-image" /></div>
                    <div className="quantity-input-container"><input type="text" className="quantity-input" value={refillQuantity} readOnly placeholder="Enter quantity" /></div>
                    <div className="refill-keypad">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "X"].map((key) => (<button key={key} className="refill-keypad-button" onClick={() => handleRefillKeypadInput(key)}>{key}</button>))}
                    </div>
                    <div className="refill-actions"><button className="refill-button" onClick={handleRefill} disabled={!refillQuantity}>Refill</button></div>
                    <button className="cancel-button" onClick={() => setCurrentScreen("grid")}>Cancel</button>
                </motion.div>
            </motion.div>
        )}
        {showInfoPopup && infoProduct && (
          <motion.div className="popup-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="popup-container info-popup" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <h2 className="popup-title">{infoProduct.name}</h2>
              <div className="info-product-image"><img src={infoProduct.image} alt={infoProduct.name} /></div>
              <div className="info-details"><div className="info-detail"><span>Price:</span><span>₹{infoProduct.price}</span></div></div>
              <button className="close-button" onClick={() => setShowInfoPopup(false)}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}