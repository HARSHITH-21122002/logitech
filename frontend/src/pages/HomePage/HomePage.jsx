"use client"
import { QRCodeCanvas } from 'qrcode.react';
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Close, BackspaceOutlined, KeyboardCapslockOutlined, LockOutlined, PersonOutline, Wifi, WifiOff } from "@mui/icons-material"
import "./HomePage.css"
import companyApi from '../../services/companyApi';
import operatorloginApi from '../../services/operatorloginApi';
import machineidApi from '../../services/machineidApi';
import vendorApi from '../../services/vendorApi';
// --- 1. IMPORT THE NEW API SERVICE ---
import paymentsettingApi from '../../services/paymentsettingApi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import orderbutton from "../../assets/images/orderbutton.webp";
import logo from "../../assets/images/logo.webp"
import { TailChase } from 'ldrs/react'
import 'ldrs/react/TailChase.css'

export default function HomePage() {
  const navigate = useNavigate();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeInput, setActiveInput] = useState('username');
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [isShift, setIsShift] = useState(false);
  const [showSymbols, setShowSymbols] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const longPressTimer = useRef();

  const [videoUrls, setVideoUrls] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);
  const [companyName, setCompanyName] = useState("BVC");
  const [companySupport,setCompanySupport] = useState("+91-12345-67890 • support@bvc.com")
  const [vendorMail,setVendorMail]=useState("") 
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [appType, setAppType] = useState(localStorage.getItem('AppType') || 'VM');
  
  // --- 2. ADD NEW STATE TO CONTROL THE ACCOUNT BUTTON ---
  const [isAccountPaymentAvailable, setIsAccountPaymentAvailable] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const videoModules = import.meta.glob('../../assets/videos/*.mp4', { as: 'url', eager: true });
    const urls = Object.values(videoModules);
    
    if (urls.length > 0) {
      setVideoUrls(urls);
    } else {
      console.warn("No videos found in the '../../assets/videos/' directory.");
    }
  }, []); 

  // --- 3. MODIFY THE INITIAL DATA FETCHING LOGIC ---
useEffect(() => {
  const fetchAndStoreInitialData = async () => {
    // --- Company fetch ---
    const companyId = localStorage.getItem("company_id");
    if (!companyId) {
      console.error("company id not found");
    } else {
      try {
        const companyData = await companyApi.getcompanyIds(companyId);
        if (companyData) {
          if (companyData.company_name) setCompanyName(companyData.company_name);
          if (companyData.company_phone) setCompanySupport(companyData.company_phone);
        }
      } catch (err) {
        console.error("Error loading company data:", err);
      }
    }

    // --- Vendor fetch ---
    const vendorId = localStorage.getItem("vendor_id");
      if (!vendorId) {
        console.error("vendor id not found");
      } else {
        try {
          const vendorData = await vendorApi.getvendor(vendorId);
          if (vendorData.success && vendorData.data) {
            setVendorMail(vendorData.data.Mail);
          }
        } catch (err) {
          console.error("Error loading vendor data:", err);
        }
      }
      try {
              const atmachines=localStorage.getItem("machine_id")   
              const paymentResponse = await paymentsettingApi.getpaymenttype(atmachines);
              console.log("paymentsettingresponse:",paymentResponse)
              if (paymentResponse?.available_methods?.includes("Account")) {
                setIsAccountPaymentAvailable(true);
              } else {
                setIsAccountPaymentAvailable(false);
              }
            } catch (paymentError) {
              console.error("Failed to fetch payment settings:", paymentError);
              setIsAccountPaymentAvailable(false);
            }
            

  };

  fetchAndStoreInitialData();
}, []);

  const handleVideoEnded = () => { setCurrentIndex((prevIndex) => (prevIndex + 1 < videoUrls.length ? prevIndex + 1 : 0)); };
  useEffect(() => { if (videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(() => {}); } }, [currentIndex, videoUrls]);
  useEffect(() => { const handleKeyPress = (event) => { if (event.ctrlKey && event.shiftKey && event.key === "Tab") { event.preventDefault(); navigate("/operator"); } }; window.addEventListener("keydown", handleKeyPress); return () => window.removeEventListener("keydown", handleKeyPress); }, [navigate]);
  const handleLogoClick = () => setShowQRModal(true);
  const handleOrderClick = () => navigate("/order");
  const handleCloseModal = () => setShowQRModal(false);
  const handleAccountClick = () => { navigate("/scanning-page"); };
  const handleAuthModalClose = () => { setShowAuthModal(false); setUsername(''); setPassword(''); setActiveInput('username'); setIsCapsLock(false); setIsShift(false); setShowSymbols(false); };
  
  const handlePressStart = () => { 
    longPressTimer.current = setTimeout(() => { 
      setIsLoading(true); 
      setTimeout(() => { 
        setIsLoading(false); 
        setShowAuthModal(true); 
      }, 2000); 
    }, 2000); 
  };
  const handlePressEnd = () => clearTimeout(longPressTimer.current);

  const handleKeyClick = (key) => { const targetStateSetter = activeInput === 'username' ? setUsername : setPassword; if (key === 'Backspace') { targetStateSetter((prev) => prev.slice(0, -1)); } else if (key === 'CapsLock') { setIsCapsLock(!isCapsLock); setIsShift(false); } else if (key === 'Shift') { setIsShift(!isShift); } else if (key === 'Symbols') { setShowSymbols(!showSymbols); } else if (key === 'Space') { targetStateSetter((prev) => prev + ' '); } else if (key === 'Enter') { if (username && password) { const payload = { username, password }; operatorloginApi.loginOperator(payload).then((res) => { if (res.success) { toast.success("Login Successful!"); setTimeout(() => { navigate("/operator"); handleAuthModalClose(); }, 1500); } else { toast.error("Invalid username or password."); } }).catch((err) => { console.error("Login failed:", err); toast.error("Login failed. Please try again."); }); } else { toast.warn("Please enter both username and password."); } } else { const char = isShift || isCapsLock ? key.toUpperCase() : key.toLowerCase(); targetStateSetter((prev) => prev + char); if (isShift) setIsShift(false); } };
  const getKeyboards = () => { const base = [ ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='], ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"], ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'] ]; const symbols = [ ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'], ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '|'], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"'], ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?'] ]; return showSymbols ? symbols : base; };
  const keyboardLayout = getKeyboards();

return (
    <div className="home-page-redesignHome">
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      
      <div 
        className="admin-trigger-areaHome" 
        onMouseDown={handlePressStart} 
        onMouseUp={handlePressEnd} 
        onTouchStart={handlePressStart} 
        onTouchEnd={handlePressEnd} 
        title="Long press for admin access"
      ></div>

      <AnimatePresence>{isLoading && ( <motion.div className="loading-spinner-overlayHome"><div className="loading-spinnerHome"><TailChase size="40" speed="1.75" color="white"/></div></motion.div> )}</AnimatePresence>
      
      <header className="top-containerHome">
        <div className="header-contentHome">
          <h1 className="main-headingHome">{companyName}</h1>
          <motion.div className="logo-containerHome" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogoClick} title="Click to scan" aria-label="Click to scan QR code">
            <img src={logo} alt="Company Logo" className="company-logoHome" />
          </motion.div>
        </div>
      </header>

      <main className="video-sectionHome">
        <div className="video-containerHome">
          <video ref={videoRef} className="background-videoHome" key={videoUrls[currentIndex] || 'fallback'} autoPlay muted playsInline onEnded={handleVideoEnded} loop={videoUrls.length <= 1}>
            {videoUrls.length > 0 && <source src={videoUrls[currentIndex]} type="video/mp4" />}
            <div className="video-fallbackHome"><img src={orderbutton} alt="Video Background" className="fallback-imageHome" /></div>
          </video>
        </div>

        {/* ORDER HERE Button (Always visible) */}
        <motion.div
          className="image-button-base position-bottom-right"
          onClick={handleOrderClick}
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="button-text-common">ORDER</div>
          <div className="button-text-common">HERE</div>
        </motion.div>

        {/* --- 4. UPDATE THE BUTTON'S RENDER CONDITION --- */}
        {/* ACCOUNT Button (Now visible based on the API response) */}
        {isAccountPaymentAvailable && (
          <motion.div
            className="image-button-base position-bottom-left"
            onClick={handleAccountClick}
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <div className="button-text-common">ACCOUNT</div>
          </motion.div>
        )}
      </main>

      <footer className="bottom-containerHome">
        <div className="status-indicatorHome">
          {isOnline ? (<Wifi style={{ color: '#2e7d32', verticalAlign: 'middle' }} />) : (<WifiOff style={{ color: '#d32f2f', verticalAlign: 'middle' }} />)}
          <span style={{ color: isOnline ? '#2e7d32' : '#d32f2f', marginLeft: '8px' }}>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <div className="contact-infoHome">
          <span>+91-{companySupport} • {vendorMail}</span>
        </div>
      </footer>
      
      {/* ... (Your AnimatePresence blocks for modals remain unchanged) ... */}
      <AnimatePresence>{showQRModal && ( <motion.div className="modal-overlayHome" onClick={handleCloseModal}><motion.div className="qr-modal-cardHome" onClick={(e) => e.stopPropagation()}><div className="modal-header-HomeHome"><h2 className="modal-title-HomeHome">Scan Me</h2><motion.button className="close-buttonHome" onClick={handleCloseModal}><Close /></motion.button></div><div className="qr-code-containerHome"><div className="qr-code-placeholderHome"><QRCodeCanvas value="https://bvc24.com" size={256} bgColor="#ffffff" fgColor="#000000" level="H" includeMargin={false} /></div><p className="qr-instruction-textHome">Scan with your phone's camera or any UPI app to learn more.</p></div></motion.div></motion.div> )}</AnimatePresence>
      <AnimatePresence>{showAuthModal && ( <motion.div className="modal-overlayHome" onClick={handleAuthModalClose}><motion.div className="auth-modal-cardHome" onClick={(e) => e.stopPropagation()}><div className="auth-brandingHome"><LockOutlined sx={{ fontSize: '4rem', color: '#fff' }} /><h2 className="auth-titleHome">Admin Login</h2><p className="auth-subtitleHome">Enter your credentials to access the operator panel.</p></div><div className="auth-formHome"><div className="auth-input-wrapperHome"><PersonOutline className="auth-input-iconHome" /><input type="text" className={`auth-inputHome ${activeInput === 'username' ? 'activeHome' : ''}`} value={username} placeholder="Username" readOnly onClick={() => setActiveInput('username')} /></div><div className="auth-input-wrapperHome"><LockOutlined className="auth-input-iconHome" /><input type="password" className={`auth-inputHome ${activeInput === 'password' ? 'activeHome' : ''}`} value={password} placeholder="Password" readOnly onClick={() => setActiveInput('password')} /></div><div className="keyboard-containerHome"><div className="keyboard-mainHome">{keyboardLayout.map((row, rowIndex) => (<div key={`row-${rowIndex}`} className="keyboard-rowHome">{row.map((key) => (<button key={key} className="keyboard-keyHome" onClick={() => handleKeyClick(key)}>{isShift || isCapsLock ? key.toUpperCase() : key.toLowerCase()}</button>))}</div>))}</div><div className="keyboard-rowHome"><button className={`keyboard-keyHome function-keyHome ${isCapsLock ? 'activeHome' : ''}`} onClick={() => handleKeyClick('CapsLock')}><KeyboardCapslockOutlined /></button><button className={`keyboard-keyHome function-keyHome ${isShift ? 'activeHome' : ''}`} onClick={() => handleKeyClick('Shift')}>Shift</button><button className={`keyboard-keyHome function-keyHome symbols-keyHome ${showSymbols ? 'activeHome' : ''}`} onClick={() => handleKeyClick('Symbols')}>#+=</button><button className="keyboard-keyHome space-barHome" onClick={() => handleKeyClick('Space')}></button><button className="keyboard-keyHome function-keyHome" onClick={() => handleKeyClick('Backspace')}><BackspaceOutlined /></button><button className="keyboard-keyHome enter-keyHome" onClick={() => handleKeyClick('Enter')}>Enter</button></div></div></div></motion.div></motion.div> )}</AnimatePresence>
    </div>
  )
}