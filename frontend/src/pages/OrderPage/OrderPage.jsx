// import { useState, useEffect, useRef, useCallback } from "react"
// import { useNavigate } from "react-router-dom"
// import { motion, AnimatePresence } from "framer-motion"
// import { Add, Remove, KeyboardArrowDown, ShoppingCartOutlined } from "@mui/icons-material"
// import { CircularProgress, Typography, Box } from '@mui/material';
// import refillApi from "../../services/refillApi";
// import categoryApi from "../../services/categoryApi";
// import productApi from "../../services/productApi";
// import orderitemApi from "../../services/orderitemApi"
// import "./OrderPage.css"
// import logo from "../../assets/images/logo.webp"
// import modbuscontrollerApi from "../../services/modbuscontrollerApi";
// import allitems from "../../assets/images/allitems.webp"
// import Header from "../../components/UI/Header/Header";

// export default function OrderPage() {
//   const navigate = useNavigate()
//   const [products, setProducts] = useState([])
//   const [fullMotorData, setFullMotorData] = useState([])
//   const [selectedProducts, setSelectedProducts] = useState([])
//   const [showScrollIndicator, setShowScrollIndicator] = useState(false)
//   const [selectedCategory, setSelectedCategory] = useState("All")
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState(null)
//   const productsContainerRef = useRef(null)
//   const [categories, setCategories] = useState([])
//   const [modbusError, setModbusError] = useState(null);
//   const isOnline = navigator.onLine

//   const getRawProductsFromAPI = async () => {
//     try {
//       const machineId = localStorage.getItem("machine_id")
//       if (!machineId) {
//         throw new Error("Machine ID not found in localStorage")
//       }
//       const response = await refillApi.getStockByMachine(machineId)
//       return Array.isArray(response) ? response : []
//     } catch (error) {
//       console.error("Error fetching from API:", error)
//       throw error
//     }
//   }

//   const fetchProductsAndCategories = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     const appType = localStorage.getItem("AppType"); // Determine AppType

//     try {
//       if (!isOnline) {
//         throw new Error("You are offline. Please connect to the internet.");
//       }

//       let activeMotorIds = null;

//       // --- 1. GET THE ACTIVE MOTOR CONFIGURATION (VM ONLY) ---
//       const isVM = (appType || '').trim().toUpperCase() === "VM";

//       // --- 1. GET THE ACTIVE MOTOR CONFIGURATION (VM ONLY) ---
//       if (isVM) {
//         console.log("AppType is VM. Checking motor configuration."); // This should now log correctly
//         const savedMotorConfig = localStorage.getItem("lastKnownMotorConfig");
//         if (!savedMotorConfig) {
//           throw new Error("Machine spirals are not configured. Please contact an operator.");
//         }
//         const motorStates = JSON.parse(savedMotorConfig);
//         activeMotorIds = motorStates
//           .map((isActive, index) => (isActive ? index + 1 : null))
//           .filter(Boolean);

//         if (activeMotorIds.length === 0) {
//             setProducts([]);
//             setFullMotorData([]);
//             const companyId = localStorage.getItem("company_id");
//             const categoriesData = await categoryApi.getFilteredCategory(companyId);
//             if (Array.isArray(categoriesData?.data)) {
//               const formattedCategories = categoriesData.data.map((cat) => ({
//                 id: cat.categories_id,
//                 name: cat.Name,
//                 image: cat.imagepath || "/images/all.png"
//               }));
//               setCategories([{ id: "All", name: "All Items", image: allitems }, ...formattedCategories]);
//             }
//             setLoading(false);
//             return;
//           }

//       } else {
//           console.log(`AppType is '${appType}'. Operating in KIOSK mode. Skipping motor configuration check.`);
//       }
      
//       // --- 2. FETCH ALL OTHER DATA ---
//       const [rawData, categoriesData, fullProductDetailsResponse] = await Promise.all([
//         getRawProductsFromAPI(),
//         categoryApi.getcategory(),
//         productApi.fullproductdetails(),
//       ]);

//       const fullProductDetails = fullProductDetailsResponse?.data || [];
      
//       // --- 3. FILTER RAW STOCK DATA (VM ONLY) OR USE AS-IS (KIOSK) ---
//       const activeRawData = appType === "VM"
//         ? rawData.filter(stockItem => activeMotorIds.includes(stockItem.Motor_number))
//         : rawData;

//       console.log("Refreshed: Active stock data loaded from API:", activeRawData);
//       setFullMotorData(activeRawData);

//       // --- 4. THE REST OF THE LOGIC PROCESSES THE APPROPRIATE DATA ---
//       const productToCategoryMap = new Map();
//       if (Array.isArray(fullProductDetails)) {
//         fullProductDetails.forEach((productDetail) => {
//           productToCategoryMap.set(productDetail.product_id, productDetail.categories_id);
//         });
//       }

//       const productMap = new Map();
//       activeRawData.forEach((item) => {
//         if (!item.Product || item.Product.id == null || item.stock <= 0) return;

//         const productId = item.Product.id;
//         const categoryId = productToCategoryMap.get(productId);
//         if (!categoryId) return;

//         if (!productMap.has(productId)) {
//           productMap.set(productId, {
//             id: productId,
//             name: item.Product.name,
//             price: item.Product.price || 0,
//             category: categoryId,
//             image_path: item.Product.image_path
//               ? `data:image/jpeg;base64,${item.Product.image_path}`
//               : `/placeholder.svg?text=${item.Product.name}`,
//             stock: 0,
//           });
//         }
//         const productEntry = productMap.get(productId);
//         productEntry.stock += item.stock || 0;
//       });

//       const uniqueProducts = Array.from(productMap.values());
//       setProducts(uniqueProducts);

//       if (Array.isArray(categoriesData?.data)) {
//         const formattedCategories = categoriesData.data.map((cat) => ({
//           id: cat.categories_id,
//           name: cat.Name,
//           image: cat.imagepath ? cat.imagepath : "/images/all.png",
//         }));
//         setCategories([
//           { id: "All", name: "All Items", image: allitems },
//           ...formattedCategories,
//         ]);
//       }
//     } catch (err) {
//       console.error("Error loading initial data:", err);
//       setError(err.message);
//       setProducts([]);
//       setCategories([{ id: "All", name: "All Items", image: allitems }]);
//     } finally {
//       setLoading(false);
//     }
//   }, [isOnline]);

//  useEffect(() => {
//     const initialLoad = async () => {
//       setLoading(true);
//       const appType = localStorage.getItem("AppType");
//       // --- ROBUST CHECK FIX ---
//       const isVM = (appType || '').trim().toUpperCase() === "VM";

//       try {
//         // Step 1: Conditionally check Modbus connection for VM type
//         if (isVM) {
//           console.log("AppType is VM, checking Modbus connection."); // This should now log correctly
//           // await modbuscontrollerApi.checkmodbus();
//         } else {
//           console.log(`AppType is '${appType}'. Operating in KIOSK mode. Skipping Modbus check.`);
//         }
        
//         // Step 2: Proceed to fetch products and categories for all AppTypes
//         await fetchProductsAndCategories();

//       } catch (err) {
//         // This catch block will now only be triggered by Modbus errors in VM mode
//         console.error("Could not connect to Modbus (VM Mode):", err);
//         setModbusError("Modbus Connection Failed");
//         setLoading(false);
//       }
//     };
//     initialLoad();
//   }, [fetchProductsAndCategories]);



//   useEffect(() => {
//     const handleStorageChange = (event) => {
//       if (event.key === 'refillMotors' || event.key === 'lastKnownMotorConfig') {
//         console.log('Relevant data changed in localStorage. Refreshing OrderPage...');
//         fetchProductsAndCategories();
//       }
//     };
//     window.addEventListener('storage', handleStorageChange);
//     return () => window.removeEventListener('storage', handleStorageChange);
//   }, [fetchProductsAndCategories]);

//   useEffect(() => {
//     if (loading) return;
//     setSelectedProducts(currentCart => {
//       const updatedCart = currentCart.filter(cartItem => {
//         const productInStock = products.find(p => p.id === cartItem.id);
//         return productInStock && productInStock.stock > 0;
//       });
//       return updatedCart.map(cartItem => {
//         const productInStock = products.find(p => p.id === cartItem.id);
//         if (cartItem.quantity > productInStock.stock) {
//           return { ...cartItem, quantity: productInStock.stock };
//         }
//         return cartItem;
//       });
//     });
//   }, [products, loading]);

//   useEffect(() => {
//     const checkOverflow = () => {
//       const container = productsContainerRef.current;
//       if (container) {
//         setShowScrollIndicator(container.scrollHeight > container.clientHeight);
//       }
//     };
//     const timer = setTimeout(checkOverflow, 500);
//     window.addEventListener("resize", checkOverflow);
//     return () => {
//       clearTimeout(timer);
//       window.removeEventListener("resize", checkOverflow);
//     };
//   }, [products]);

//   const handleAddToCart = (product) => {
//     setSelectedProducts((prev) => {
//       const existing = prev.find((p) => p.id === product.id)
//       if (existing) {
//         const newQuantity = existing.quantity + 1
//         if (newQuantity <= product.stock) {
//           return prev.map((p) => (p.id === product.id ? { ...p, quantity: newQuantity } : p))
//         } else {
//           alert(`Only ${product.stock} items available in stock`)
//           return prev
//         }
//       } else {
//         if (product.stock > 0) {
//           return [...prev, { ...product, quantity: 1 }]
//         } else {
//           alert("This item is out of stock")
//           return prev
//         }
//       }
//     })
//   }

//   const handleQuantityChange = (productId, change) => {
//     setSelectedProducts((prev) =>
//       prev.map((p) => {
//         if (p.id === productId) {
//           const newQuantity = p.quantity + change
//           const product = products.find(prod => prod.id === productId)
          
//           if (newQuantity <= 0) return null
          
//           if (newQuantity > product.stock) {
//             alert(`Only ${product.stock} items available in stock`)
//             return p
//           }
          
//           return { ...p, quantity: newQuantity }
//         }
//         return p
//       }).filter(Boolean)
//     )
//   }

//   const handleClearCart = () => setSelectedProducts([])
//   const getProductQuantity = (productId) => selectedProducts.find((p) => p.id === productId)?.quantity || 0
//   const getTotalPrice = () => selectedProducts.reduce(( total, p) => total + (p.price * p.quantity), 0)
//   const getTotalItems = () => selectedProducts.reduce((total, p) => total + p.quantity, 0)
  
//  // OrderPage.jsx

// // The corrected handleViewCart function.

// const handleViewCart = async () => {
//     if (selectedProducts.length > 0) {
//       const appType = localStorage.getItem("AppType");
//       const isVM = (appType || '').trim().toUpperCase() === "VM";
//       const motorCommands = [];
      
//       // ===================================================================
//       // --- START OF THE FIX ---
//       // This new list will store products with their *specific* motor IDs.
//       let productsWithSpecificMotors = [];
//       // ===================================================================

//       if (isVM) {
//         console.log("AppType is VM, generating motor commands for vending.");
//         if (!Array.isArray(fullMotorData)) {
//             alert("Error: Machine configuration data is not available.");
//             return;
//         }

//         selectedProducts.forEach(cartItem => {
//           let quantityToVend = cartItem.quantity;
//           const availableMotors = fullMotorData
//             .filter(motor => motor.Product?.id === cartItem.id && motor.stock > 0)
//             .sort((a, b) => a.Motor_number - b.Motor_number);

//           for (const motor of availableMotors) {
//             if (quantityToVend <= 0) break;
//             const vendFromThisMotor = Math.min(quantityToVend, motor.stock);
            
//             // This logic is correct for VM and we will adapt it for KIOSK
//             motorCommands.push({
//               motorId: motor.Motor_number,
//               quantity: vendFromThisMotor,
//               productName: cartItem.name,
//               productId: cartItem.id,
//               price: cartItem.price,
//               image: cartItem.image_path
//             });
//             quantityToVend -= vendFromThisMotor;
//           }
//         });

//       } else {
//         // ===================================================================
//         // --- THIS IS THE FIX FOR KIOSK MODE ---
//         // ===================================================================
//         console.log(`AppType is '${appType}'. Calculating specific motors for stock decrement.`);
//         if (!Array.isArray(fullMotorData)) {
//             alert("Error: Machine configuration data is not available.");
//             return;
//         }

//         // We replicate the VM's logic to correctly assign stock from multiple motors.
//         selectedProducts.forEach(cartItem => {
//           let quantityToVend = cartItem.quantity;
//           const availableMotors = fullMotorData
//             .filter(motor => motor.Product?.id === cartItem.id && motor.stock > 0)
//             .sort((a, b) => a.Motor_number - b.Motor_number); // Important to vend from lowest motor first

//           for (const motor of availableMotors) {
//             if (quantityToVend <= 0) break; // Stop if we have assigned all quantities

//             const vendFromThisMotor = Math.min(quantityToVend, motor.stock);

//             // Create a new entry for each specific motor that will be used.
//             productsWithSpecificMotors.push({
//               ...cartItem, // a copy of the original cart item
//               motor_id: motor.Motor_number, // The SPECIFIC motor ID
//               quantity: vendFromThisMotor, // The quantity to vend from THIS motor
//             });

//             quantityToVend -= vendFromThisMotor; // Decrement the remaining quantity
//           }
//         });
//         // ===================================================================
//         // --- END OF KIOSK FIX ---
//         // ===================================================================
//       }

//       const companyId = localStorage.getItem("company_id");
//       for (const item of selectedProducts) {
//         const payload = {
//           Product_id: item.id,
//           ProductName: item.name,
//           Rate: item.price,
//           GST: 0,
//           Price: item.price * item.quantity,
//           Vend_Quantity: item.quantity,
//           company_id: companyId
//         }
//         await orderitemApi.orderupdate(payload);
//       }
      
//       // Determine which product list to use.
//       // For KIOSK, we use our newly created specific list.
//       // For VM, we can use the old logic as motorCommands are used, but we'll unify it for consistency.
//       const finalProductsForOrder = isVM ? 
//         // For VM, we still need to add the motor_id for consistency if needed elsewhere
//         selectedProducts.map(p => {
//           const firstMotor = fullMotorData.find(m => m.Product?.id === p.id);
//           return {...p, image:p.image_path, motor_id: firstMotor ? firstMotor.Motor_number : null };
//         })
//         : productsWithSpecificMotors;

//       const orderData = {
//         selectedProducts: finalProductsForOrder,
//         totalPrice: getTotalPrice(),
//         totalItems: getTotalItems(),
//         motorCommands: motorCommands
//       };
      
//       console.log("Data being saved to localStorage (currentOrder):", orderData);

//       const orderDataForBill = {
//         selectedProducts: selectedProducts.map(p => ({ 
//           id: p.id,
//           productName: p.name,
//           quantity: p.quantity,
//           price: p.price
//         })),
//         totalPrice: getTotalPrice(),
//         totalItems: getTotalItems(),
//         motorCommands: motorCommands 
//       };
//       localStorage.setItem('currentOrder', JSON.stringify(orderData));
//       localStorage.setItem('finalOrderForBill', JSON.stringify(orderDataForBill));

//       navigate("/payment", { state: orderData });
//     }
// }
//   const handleProductCardClick = (product, e) => {
//     if (e.target.closest('.quantity-controls-order') || e.target.closest('.add-to-cart-btn-order')) return
//     handleAddToCart(product)
//   }

//   const filteredProducts = selectedCategory === "All" 
//     ? products 
//     : products.filter(product => product.category === selectedCategory);

//   if (loading) {
//     return (
//      <div className="order-page-redesign-order">
//   <Box
//         className="loading-container"
//         display="flex"
//         flexDirection="column"
//         alignItems="center"
//         justifyContent="center"
//         height="100vh"
//       >
//         <CircularProgress />
//         <Typography variant="body1" sx={{ mt: 2 }}>
//           Initializing Machine...
//         </Typography>
//       </Box>
// </div>
//     )
//   }
  
//   return (
//     <div className="order-page-redesign-order">
//       <AnimatePresence>
//         {modbusError && (
//           <motion.div
//             className="modbus-error-overlay"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//           >
//             <motion.div
//               className="modbus-error-popup"
//               initial={{ scale: 0.5, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.5, opacity: 0 }}
//               transition={{ type: "spring", stiffness: 300, damping: 25 }}
//             >
//               <p>{modbusError}</p>         
//               <button
//                 className="modbus-error-close-btn"
//                 onClick={() => navigate('/Home')}
//               >
//                 Close
//               </button>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//        <Header/>

//       {!modbusError && (
//         <>
//           <div className="main-content-order">
//             <aside className="categories-panel-order">
//                 <div className="categories-panel-content-order">
//               <div className="categories-section-order">
//                 <div className="categories-header-order">
//                   <h3 className="categories-title-order">Categories</h3>
//                 </div>
//                 <div className="categories-grid-order">
//                   {categories.map((category) => (
//                     <motion.div
//                       key={category.id}
//                       className={`category-item-order ${selectedCategory === category.id ? 'active' : ''}`}
//                       onClick={() => setSelectedCategory(category.id)}
//                       whileHover={{ scale: 1.05 }}
//                       whileTap={{ scale: 0.95 }}
//                     >
//                       <div className="category-image-container-order">
//                         <img src={category.image} alt={category.name} className="category-image-order" />
//                       </div>
//                       <span className="category-name-order">{category.name}</span>
//                     </motion.div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//             </aside>

//             <main className="products-section-order">
//               <div className="products-container-order" ref={productsContainerRef}>
//                 {error && !error.includes("offline") ? (
//                   <div className="error-container" style={{gridColumn: '1 / -1'}}>
//                     <p className="error-message">Error: {error}</p>
//                     <button onClick={() => window.location.reload()}>Retry</button>
//                   </div>
//                 ) : filteredProducts.length === 0 ? (
//                   <div className="no-products-message">
//                     <p>{error ? error : "No products available in this category"}</p>
//                   </div>
//                 ) : (
//                   <div className="products-grid-order">
//                     {filteredProducts.map((product) => {
//                       const quantity = getProductQuantity(product.id)
//                       const isOutOfStock = product.stock === 0
//                       return (
//                         <motion.div 
//                           key={product.id} 
//                           className={`product-card-order ${isOutOfStock ? 'out-of-stock' : ''}`}
//                           onClick={(e) => !isOutOfStock && handleProductCardClick(product, e)}
//                           whileHover={!isOutOfStock ? { scale: 1.02 } : {}}
//                           whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
//                         >
//                           <div className="product-image-container-order">
//                             <img 
//                               src={product.image_path} 
//                               alt={product.name} 
//                               className="product-image-order"
//                               onError={(e) => { e.target.src = `/placeholder.svg?text=${product.name}` }}
//                             />
//                             {isOutOfStock && <div className="out-of-stock-overlay">Out of Stock</div>}
//                           </div>
//                           <div className="product-info-order">
//                             <h3 className="product-name-order">{product.name}</h3>
//                             <div className="product-details-order">
//                               <small className="motor-info-order">Total Stock: {product.stock}</small>
//                             </div>
//                             <div className="product-footer-order">
//                               <p className="product-price-order">₹{product.price.toFixed(2)}</p>
//                               {!isOutOfStock && (
//                                 quantity === 0 ? (
//                                   <motion.button className="add-to-cart-btn-order" onClick={(e) => { e.stopPropagation(); handleAddToCart(product) }} whileTap={{ scale: 0.95 }}>Add</motion.button>
//                                 ) : (
//                                   <div className="quantity-controls-order">
//                                     <motion.button className="quantity-btn-order decrease-btn" onClick={(e) => { e.stopPropagation(); handleQuantityChange(product.id, -1) }} whileTap={{ scale: 0.9 }}><Remove fontSize="small" /></motion.button>
//                                     <div className="quantity-display-order">{quantity}</div>
//                                     <motion.button className="quantity-btn-order increase-btn" onClick={(e) => { e.stopPropagation(); handleQuantityChange(product.id, 1) }} whileTap={{ scale: 0.9 }} disabled={quantity >= product.stock}><Add fontSize="small" /></motion.button>
//                                   </div>
//                                 )
//                               )}
//                             </div>
//                           </div>
//                         </motion.div>
//                       )
//                     })}
//                   </div>
//                 )}
//               </div>
//             </main>

//             <aside className="cart-panel-order">
//                 <div className="cart-panel-content-order">
//                   <div className="cart-header-order">
//                     <div className="selected-label-order">Your Cart</div>
//                     {selectedProducts.length > 0 && (
//                       <motion.button className="clear-cart-btn-order" onClick={handleClearCart} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Clear</motion.button>
//                     )}
//                   </div>
//                   {selectedProducts.length > 0 ? (
//                     <div className="product-summary-order">
//                       <div className="summary-items-list-order">
//                         {selectedProducts.map((product) => (
//                           <div key={product.id} className="summary-item-order">
//                             <span className="summary-name-order">{product.name}</span>
//                             <span className="summary-info-order">{product.quantity} × ₹{product.price.toFixed(2)}</span>
//                           </div>
//                         ))}
//                       </div>
//                       <div className="summary-footer-order">
//                         <div className="summary-total-order">
//                           <span>Total Items: {getTotalItems()}</span>
//                           <span className="total-price-order">₹{getTotalPrice().toFixed(2)}</span>
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="empty-cart-order">
//                       <ShoppingCartOutlined sx={{ fontSize: 50, color: '#d0d0d0' }} />
//                       <p>Your cart is empty.</p>
//                       <span>Add products to get started!</span>
//                     </div>
//                   )}
//                 </div>
//             </aside>
//           </div>

//           <div className="cart-floating-btn-order-container">
//           </div>

//           <div className="bottom-actions-order">
//             <motion.button className="action-btn-order back-btn-order" onClick={() => navigate("/Home")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Back</motion.button>
//             {selectedProducts.length > 0 && (
//               <motion.button className="action-btn-order payment-btn-order" onClick={handleViewCart} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Proceed to Payment</motion.button>
//             )}
//           </div>
//         </>
//       )}

//       {!modbusError && selectedProducts.length > 0 && (
//           <motion.div className="cart-floating-btn-order" initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleViewCart}>
//             <div className="cart-btn-content-order">
//               <ShoppingCartOutlined />
//               <span className="cart-btn-text-order">{getTotalItems()} items • ₹{getTotalPrice().toFixed(2)}</span>
//               <span className="cart-btn-arrow-order">→</span>
//             </div>
//           </motion.div>
//         )}

//       <div className="connection-status">
//         <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
//           {isOnline ? '🟢 Online' : '🔴 Offline'}
//         </span>
//       </div>
//     </div>
//   )
// }

import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Add, Remove, KeyboardArrowDown, ShoppingCartOutlined } from "@mui/icons-material"
import { CircularProgress, Typography, Box } from '@mui/material';
import refillApi from "../../services/refillApi";
import categoryApi from "../../services/categoryApi";
import productApi from "../../services/productApi";
import orderitemApi from "../../services/orderitemApi"
import "./OrderPage.css"
import logo from "../../assets/images/logo.webp"
import modbuscontrollerApi from "../../services/modbuscontrollerApi";
import allitems from "../../assets/images/allitems.webp"
import Header from "../../components/UI/Header/Header";

export default function OrderPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [fullMotorData, setFullMotorData] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const productsContainerRef = useRef(null)
  const [categories, setCategories] = useState([])
  const [modbusError, setModbusError] = useState(null);
  const isOnline = navigator.onLine

  const getRawProductsFromAPI = async () => {
    try {
      const machineId = localStorage.getItem("machine_id")
      if (!machineId) {
        throw new Error("Machine ID not found in localStorage")
      }
      const response = await refillApi.getStockByMachine(machineId)
      return Array.isArray(response) ? response : []
    } catch (error) {
      console.error("Error fetching from API:", error)
      throw error
    }
  }

  const fetchProductsAndCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    const appType = localStorage.getItem("AppType"); // Determine AppType
    const companyId = localStorage.getItem("company_id"); // Get company_id here

    try {
      if (!isOnline) {
        throw new Error("You are offline. Please connect to the internet.");
      }

      let activeMotorIds = null;

      // --- 1. GET THE ACTIVE MOTOR CONFIGURATION (VM ONLY) ---
      const isVM = (appType || '').trim().toUpperCase() === "VM";

      // --- 1. GET THE ACTIVE MOTOR CONFIGURATION (VM ONLY) ---
      if (isVM) {
        console.log("AppType is VM. Checking motor configuration."); // This should now log correctly
        const savedMotorConfig = localStorage.getItem("lastKnownMotorConfig");
        if (!savedMotorConfig) {
          throw new Error("Machine spirals are not configured. Please contact an operator.");
        }
        const motorStates = JSON.parse(savedMotorConfig);
        activeMotorIds = motorStates
          .map((isActive, index) => (isActive ? index + 1 : null))
          .filter(Boolean);

        if (activeMotorIds.length === 0) {
            setProducts([]);
            setFullMotorData([]);
            // Use getFilteredCategory with companyId here as well
            const categoriesData = await categoryApi.getFilteredCategory(companyId);
            if (Array.isArray(categoriesData?.data)) {
              const formattedCategories = categoriesData.data.map((cat) => ({
                id: cat.categories_id,
                name: cat.Name,
                image: cat.imagepath || "/images/all.png"
              }));
              setCategories([{ id: "All", name: "All Items", image: allitems }, ...formattedCategories]);
            }
            setLoading(false);
            return;
          }

      } else {
          console.log(`AppType is '${appType}'. Operating in KIOSK mode. Skipping motor configuration check.`);
      }
      
      // --- 2. FETCH ALL OTHER DATA ---
      // CORRECTED LINE BELOW: Using getFilteredCategory with companyId
      const [rawData, categoriesData, fullProductDetailsResponse] = await Promise.all([
        getRawProductsFromAPI(),
        companyId ? categoryApi.getFilteredCategory(companyId) : categoryApi.getcategory(), // Use filtered if companyId exists
        productApi.fullproductdetails(),
      ]);

      const fullProductDetails = fullProductDetailsResponse?.data || [];
      
      // --- 3. FILTER RAW STOCK DATA (VM ONLY) OR USE AS-IS (KIOSK) ---
      const activeRawData = appType === "VM"
        ? rawData.filter(stockItem => activeMotorIds.includes(stockItem.Motor_number))
        : rawData;

      console.log("Refreshed: Active stock data loaded from API:", activeRawData);
      setFullMotorData(activeRawData);

      // --- 4. THE REST OF THE LOGIC PROCESSES THE APPROPRIATE DATA ---
      const productToCategoryMap = new Map();
      if (Array.isArray(fullProductDetails)) {
        fullProductDetails.forEach((productDetail) => {
          productToCategoryMap.set(productDetail.product_id, productDetail.categories_id);
        });
      }

      const productMap = new Map();
      activeRawData.forEach((item) => {
        if (!item.Product || item.Product.id == null || item.stock <= 0) return;

        const productId = item.Product.id;
        const categoryId = productToCategoryMap.get(productId);
        if (!categoryId) return;

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            id: productId,
            name: item.Product.name,
            price: item.Product.price || 0,
            category: categoryId,
            image_path: item.Product.image_path
              ? `data:image/jpeg;base64,${item.Product.image_path}`
              : `/placeholder.svg?text=${item.Product.name}`,
            stock: 0,
          });
        }
        const productEntry = productMap.get(productId);
        productEntry.stock += item.stock || 0;
      });

      const uniqueProducts = Array.from(productMap.values());
      setProducts(uniqueProducts);

      if (Array.isArray(categoriesData?.data)) {
        const formattedCategories = categoriesData.data.map((cat) => ({
          id: cat.categories_id,
          name: cat.Name,
          image: cat.imagepath ? cat.imagepath : "/images/all.png",
        }));
        setCategories([
          { id: "All", name: "All Items", image: allitems },
          ...formattedCategories,
        ]);
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
      setError("No Products available in the Refill Motors");
      setProducts([]);
      setCategories([{ id: "All", name: "All Items", image: allitems }]);
    } finally {
      setLoading(false);
    }
  }, [isOnline]); // Added companyId to useCallback dependencies

 useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      const appType = localStorage.getItem("AppType");
      // --- ROBUST CHECK FIX ---
      const isVM = (appType || '').trim().toUpperCase() === "VM";

      try {
        // Step 1: Conditionally check Modbus connection for VM type
        if (isVM) {
          console.log("AppType is VM, checking Modbus connection."); // This should now log correctly
          // await modbuscontrollerApi.checkmodbus(); // Uncomment if Modbus check is required
        } else {
          console.log(`AppType is '${appType}'. Operating in KIOSK mode. Skipping Modbus check.`);
        }
        
        // Step 2: Proceed to fetch products and categories for all AppTypes
        await fetchProductsAndCategories();

      } catch (err) {
        // This catch block will now only be triggered by Modbus errors in VM mode
        console.error("Could not connect to Modbus (VM Mode):", err);
        setModbusError("Modbus Connection Failed");
        setLoading(false);
      }
    };
    initialLoad();
  }, [fetchProductsAndCategories]);



  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'refillMotors' || event.key === 'lastKnownMotorConfig' || event.key === 'company_id') { // Added company_id to trigger refresh
        console.log('Relevant data changed in localStorage. Refreshing OrderPage...');
        fetchProductsAndCategories();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchProductsAndCategories]);

  useEffect(() => {
    if (loading) return;
    setSelectedProducts(currentCart => {
      const updatedCart = currentCart.filter(cartItem => {
        const productInStock = products.find(p => p.id === cartItem.id);
        return productInStock && productInStock.stock > 0;
      });
      return updatedCart.map(cartItem => {
        const productInStock = products.find(p => p.id === cartItem.id);
        if (cartItem.quantity > productInStock.stock) {
          return { ...cartItem, quantity: productInStock.stock };
        }
        return cartItem;
      });
    });
  }, [products, loading]);

  useEffect(() => {
    const checkOverflow = () => {
      const container = productsContainerRef.current;
      if (container) {
        setShowScrollIndicator(container.scrollHeight > container.clientHeight);
      }
    };
    const timer = setTimeout(checkOverflow, 500);
    window.addEventListener("resize", checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkOverflow);
    };
  }, [products]);

  const handleAddToCart = (product) => {
    setSelectedProducts((prev) => {
      const existing = prev.find((p) => p.id === product.id)
      if (existing) {
        const newQuantity = existing.quantity + 1
        if (newQuantity <= product.stock) {
          return prev.map((p) => (p.id === product.id ? { ...p, quantity: newQuantity } : p))
        } else {
          alert(`Only ${product.stock} items available in stock`)
          return prev
        }
      } else {
        if (product.stock > 0) {
          return [...prev, { ...product, quantity: 1 }]
        } else {
          alert("This item is out of stock")
          return prev
        }
      }
    })
  }

  const handleQuantityChange = (productId, change) => {
    setSelectedProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newQuantity = p.quantity + change
          const product = products.find(prod => prod.id === productId)
          
          if (newQuantity <= 0) return null
          
          if (newQuantity > product.stock) {
            alert(`Only ${product.stock} items available in stock`)
            return p
          }
          
          return { ...p, quantity: newQuantity }
        }
        return p
      }).filter(Boolean)
    )
  }

  const handleClearCart = () => setSelectedProducts([])
  const getProductQuantity = (productId) => selectedProducts.find((p) => p.id === productId)?.quantity || 0
  const getTotalPrice = () => selectedProducts.reduce(( total, p) => total + (p.price * p.quantity), 0)
  const getTotalItems = () => selectedProducts.reduce((total, p) => total + p.quantity, 0)
  
 // OrderPage.jsx

// The corrected handleViewCart function.

const handleViewCart = async () => {
    if (selectedProducts.length > 0) {
      const appType = localStorage.getItem("AppType");
      const isVM = (appType || '').trim().toUpperCase() === "VM";
      const motorCommands = [];
      
      // ===================================================================
      // --- START OF THE FIX ---
      // This new list will store products with their *specific* motor IDs.
      let productsWithSpecificMotors = [];
      // ===================================================================

      if (isVM) {
        console.log("AppType is VM, generating motor commands for vending.");
        if (!Array.isArray(fullMotorData)) {
            alert("Error: Machine configuration data is not available.");
            return;
        }

        selectedProducts.forEach(cartItem => {
          let quantityToVend = cartItem.quantity;
          const availableMotors = fullMotorData
            .filter(motor => motor.Product?.id === cartItem.id && motor.stock > 0)
            .sort((a, b) => a.Motor_number - b.Motor_number);

          for (const motor of availableMotors) {
            if (quantityToVend <= 0) break;
            const vendFromThisMotor = Math.min(quantityToVend, motor.stock);
            
            // This logic is correct for VM and we will adapt it for KIOSK
            motorCommands.push({
              motorId: motor.Motor_number,
              quantity: vendFromThisMotor,
              productName: cartItem.name,
              productId: cartItem.id,
              price: cartItem.price,
              image: cartItem.image_path
            });
            quantityToVend -= vendFromThisMotor;
          }
        });

      } else {
        // ===================================================================
        // --- THIS IS THE FIX FOR KIOSK MODE ---
        // ===================================================================
        console.log(`AppType is '${appType}'. Calculating specific motors for stock decrement.`);
        if (!Array.isArray(fullMotorData)) {
            alert("Error: Machine configuration data is not available.");
            return;
        }

        // We replicate the VM's logic to correctly assign stock from multiple motors.
        selectedProducts.forEach(cartItem => {
          let quantityToVend = cartItem.quantity;
          const availableMotors = fullMotorData
            .filter(motor => motor.Product?.id === cartItem.id && motor.stock > 0)
            .sort((a, b) => a.Motor_number - b.Motor_number); // Important to vend from lowest motor first

          for (const motor of availableMotors) {
            if (quantityToVend <= 0) break; // Stop if we have assigned all quantities

            const vendFromThisMotor = Math.min(quantityToVend, motor.stock);

            // Create a new entry for each specific motor that will be used.
            productsWithSpecificMotors.push({
              ...cartItem, // a copy of the original cart item
              motor_id: motor.Motor_number, // The SPECIFIC motor ID
              quantity: vendFromThisMotor, // The quantity to vend from THIS motor
            });

            quantityToVend -= vendFromThisMotor; // Decrement the remaining quantity
          }
        });
        // ===================================================================
        // --- END OF KIOSK FIX ---
        // ===================================================================
      }

      const companyId = localStorage.getItem("company_id");
      for (const item of selectedProducts) {
        const payload = {
          Product_id: item.id,
          ProductName: item.name,
          Rate: item.price,
          GST: 0,
          Price: item.price * item.quantity,
          Vend_Quantity: item.quantity,
          company_id: companyId
        }
        await orderitemApi.orderupdate(payload);
      }
      
      // Determine which product list to use.
      // For KIOSK, we use our newly created specific list.
      // For VM, we still need to add the motor_id for consistency if needed elsewhere.
      // We'll map selectedProducts to include image and motor_id for VM consistency,
      // and use productsWithSpecificMotors for KIOSK.
      const finalProductsForOrder = isVM ? 
        selectedProducts.map(p => {
          const firstMotor = fullMotorData.find(m => m.Product?.id === p.id);
          return {...p, image:p.image_path, motor_id: firstMotor ? firstMotor.Motor_number : null };
        })
        : productsWithSpecificMotors;

      const orderData = {
        selectedProducts: finalProductsForOrder,
        totalPrice: getTotalPrice(),
        totalItems: getTotalItems(),
        motorCommands: motorCommands
      };
      
      console.log("Data being saved to localStorage (currentOrder):", orderData);

      const orderDataForBill = {
        selectedProducts: selectedProducts.map(p => ({ 
          id: p.id,
          productName: p.name,
          quantity: p.quantity,
          price: p.price
        })),
        totalPrice: getTotalPrice(),
        totalItems: getTotalItems(),
        motorCommands: motorCommands 
      };
      localStorage.setItem('currentOrder', JSON.stringify(orderData));
      localStorage.setItem('finalOrderForBill', JSON.stringify(orderDataForBill));

      navigate("/payment", { state: orderData });
    }
}
  const handleProductCardClick = (product, e) => {
    if (e.target.closest('.quantity-controls-order') || e.target.closest('.add-to-cart-btn-order')) return
    handleAddToCart(product)
  }

  const filteredProducts = selectedCategory === "All" 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  if (loading) {
    return (
     <div className="order-page-redesign-order">
  <Box
        className="loading-container"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Initializing Machine...
        </Typography>
      </Box>
</div>
    )
  }
  
  return (
    <div className="order-page-redesign-order">
      <AnimatePresence>
        {modbusError && (
          <motion.div
            className="modbus-error-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modbus-error-popup"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <p>{modbusError}</p>         
              <button
                className="modbus-error-close-btn"
                onClick={() => navigate('/Home')}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

       <Header/>

      {!modbusError && (
        <>
          <div className="main-content-order">
            <aside className="categories-panel-order">
                <div className="categories-panel-content-order">
              <div className="categories-section-order">
                <div className="categories-header-order">
                  <h3 className="categories-title-order">Categories</h3>
                </div>
                <div className="categories-grid-order">
                  {categories.map((category) => (
                    <motion.div
                      key={category.id}
                      className={`category-item-order ${selectedCategory === category.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(category.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="category-image-container-order">
                        <img src={category.image} alt={category.name} className="category-image-order" />
                      </div>
                      <span className="category-name-order">{category.name}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            </aside>

            <main className="products-section-order">
              <div className="products-container-order" ref={productsContainerRef}>
                {error && !error.includes("offline") ? (
                  <div className="error-container" style={{gridColumn: '1 / -1'}}>
                    <p className="error-message">{error}</p>
                    {/* <button onClick={() => window.location.reload()}>Retry</button> */}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="no-products-message">
                    <p>{error ? error : "No products available in this category"}</p>
                  </div>
                ) : (
                  <div className="products-grid-order">
                    {filteredProducts.map((product) => {
                      const quantity = getProductQuantity(product.id)
                      const isOutOfStock = product.stock === 0
                      return (
                        <motion.div 
                          key={product.id} 
                          className={`product-card-order ${isOutOfStock ? 'out-of-stock' : ''}`}
                          onClick={(e) => !isOutOfStock && handleProductCardClick(product, e)}
                          whileHover={!isOutOfStock ? { scale: 1.02 } : {}}
                          whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
                        >
                          <div className="product-image-container-order">
                            <img 
                              src={product.image_path} 
                              alt={product.name} 
                              className="product-image-order"
                              onError={(e) => { e.target.src = `/placeholder.svg?text=${product.name}` }}
                            />
                            {isOutOfStock && <div className="out-of-stock-overlay">Out of Stock</div>}
                          </div>
                          <div className="product-info-order">
                            <h3 className="product-name-order">{product.name}</h3>
                            <div className="product-details-order">
                              <small className="motor-info-order">Total Stock: {product.stock}</small>
                            </div>
                            <div className="product-footer-order">
                              <p className="product-price-order">₹{product.price.toFixed(2)}</p>
                              {!isOutOfStock && (
                                quantity === 0 ? (
                                  <motion.button className="add-to-cart-btn-order" onClick={(e) => { e.stopPropagation(); handleAddToCart(product) }} whileTap={{ scale: 0.95 }}>Add</motion.button>
                                ) : (
                                  <div className="quantity-controls-order">
                                    <motion.button className="quantity-btn-order decrease-btn" onClick={(e) => { e.stopPropagation(); handleQuantityChange(product.id, -1) }} whileTap={{ scale: 0.9 }}><Remove fontSize="small" /></motion.button>
                                    <div className="quantity-display-order">{quantity}</div>
                                    <motion.button className="quantity-btn-order increase-btn" onClick={(e) => { e.stopPropagation(); handleQuantityChange(product.id, 1) }} whileTap={{ scale: 0.9 }} disabled={quantity >= product.stock}><Add fontSize="small" /></motion.button>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </main>

            <aside className="cart-panel-order">
                <div className="cart-panel-content-order">
                  <div className="cart-header-order">
                    <div className="selected-label-order">Your Cart</div>
                    {selectedProducts.length > 0 && (
                      <motion.button className="clear-cart-btn-order" onClick={handleClearCart} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Clear</motion.button>
                    )}
                  </div>
                  {selectedProducts.length > 0 ? (
                    <div className="product-summary-order">
                      <div className="summary-items-list-order">
                        {selectedProducts.map((product) => (
                          <div key={product.id} className="summary-item-order">
                            <span className="summary-name-order">{product.name}</span>
                            <span className="summary-info-order">{product.quantity} × ₹{product.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="summary-footer-order">
                        <div className="summary-total-order">
                          <span>Total Items: {getTotalItems()}</span>
                          <span className="total-price-order">₹{getTotalPrice().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-cart-order">
                      <ShoppingCartOutlined sx={{ fontSize: 50, color: '#d0d0d0' }} />
                      <p>Your cart is empty.</p>
                      <span>Add products to get started!</span>
                    </div>
                  )}
                </div>
            </aside>
          </div>

          <div className="cart-floating-btn-order-container">
          </div>

          <div className="bottom-actions-order">
            <motion.button className="action-btn-order back-btn-order" onClick={() => navigate("/Home")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Back</motion.button>
            {selectedProducts.length > 0 && (
              <motion.button className="action-btn-order payment-btn-order" onClick={handleViewCart} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Proceed to Payment</motion.button>
            )}
          </div>
        </>
      )}

      {!modbusError && selectedProducts.length > 0 && (
          <motion.div className="cart-floating-btn-order" initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleViewCart}>
            <div className="cart-btn-content-order">
              <ShoppingCartOutlined />
              <span className="cart-btn-text-order">{getTotalItems()} items • ₹{getTotalPrice().toFixed(2)}</span>
              <span className="cart-btn-arrow-order">→</span>
            </div>
          </motion.div>
        )}

      <div className="connection-status">
        <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </span>
      </div>
    </div>
  )
}