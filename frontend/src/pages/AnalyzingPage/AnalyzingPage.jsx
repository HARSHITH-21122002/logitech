import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Modal, Button, Typography, Box } from "@mui/material";
import { CheckCircle, Error, Settings, Circle } from "@mui/icons-material";

import LoadingSpinner from "../../components/UI/LoadingSpinner/LoadingSpinner";
import { ROUTES } from "../../utils/constants";
import { formatTime } from "../../utils/helpers";
import modbusApi from "../../services/modbusApi";
import modbuscontrollerApi from "../../services/modbuscontrollerApi";
import "./AnalyzingPage.css";

// Helper function to create a delay for better UX
const delay = (ms) => new Promise((res) => setTimeout(res, ms));


const waitForBackendReady = async (retries = 15, delay = 2000) => {
    const backendHealthUrl = `${apiBaseUrl}/health`
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(backendHealthUrl)
        if (res.ok) {
          console.log("Backend is ready.")
          return true
        }
      } catch (err) {
        console.log(`⏳ Waiting for backend... (${i + 1}/${retries})`)
      }
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    console.error("Backend not responding after waiting.")
    return false
  }

const runInitializationSequence = async ({ setHasErrors, setShowErrorModal, startAutoCloseTimer }) => {
    console.log("⏳ Waiting for backend to be ready...")
    const backendReady = await waitForBackendReady()

    if (!backendReady) {
      toast.error("Backend not responding. Please restart the app.")
      setHasErrors(true)
      setShowErrorModal(true)
      startAutoCloseTimer()
      return
    }

    console.log("🚀 Starting initialization sequence...")
    // Note: The original component's initialization logic is separate.
    // To use this function, you would call the other check steps here.
}
// --- End of new functions ---


const AnalyzingPage = () => {
  const navigate = useNavigate();
  const initializationRef = useRef(false); // Add ref to track initialization

  const [stepStatuses, setStepStatuses] = useState({
    modbus: "pending", // 'pending', 'success', 'error'
    internet: "pending",
    sensor: "pending",
  });

  const [currentStepKey, setCurrentStepKey] = useState("");
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [countdown, setCountdown] = useState(239);

  // Main effect to run initialization steps sequentially
  useEffect(() => {
    // Prevent multiple initialization runs
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initializeSystem = async () => {
      // --- Step 1: Modbus Connection ---
      setCurrentStepKey("modbus");
      try {
        await modbuscontrollerApi.checkmodbus();
        toast.success("Modbus Connection Successful");
        setStepStatuses((s) => ({ ...s, modbus: "success" }));
      } catch (error) {
        toast.error("Modbus connection error.");
        setStepStatuses((s) => ({ ...s, modbus: "error" }));
        setShowFailureModal(true);
        return;
      }
      await delay(1000);

      // --- Step 2: Internet Connection ---
      setCurrentStepKey("internet");
      try {
        await modbusApi.checkinternet();
        toast.success("Internet Connected");
        setStepStatuses((s) => ({ ...s, internet: "success" }));
      } catch (error) {
        toast.error("Unable to connect to internet.");
        setStepStatuses((s) => ({ ...s, internet: "error" }));
        setShowFailureModal(true);
        return;
      }
      await delay(1000);

      // --- Step 3: Sensor Reading ---
      setCurrentStepKey("sensor");
      try {
        await modbusApi.checksensor();
        toast.success("Sensor Reading Successful");
        setStepStatuses((s) => ({ ...s, sensor: "success" }));
      } catch (error) {
        toast.error("Sensor calibration error.");
        setStepStatuses((s) => ({ ...s, sensor: "error" }));
        setShowFailureModal(true);
        return;
      }

      // --- All steps successful ---
      setCurrentStepKey("done");
      toast.info("System Initialized Successfully!");
      setTimeout(() => navigate(ROUTES.HOME), 1500);
    };

    initializeSystem();
  }, []); // Remove dependencies to prevent re-runs
  
  // Effect for the failure modal countdown timer
  useEffect(() => {
    if (!showFailureModal) return;
    
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          window.close();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(countdownTimer);
  }, [showFailureModal]);

  const handleContinue = () => {
    setShowFailureModal(false);
    navigate(ROUTES.HOME);
  };

  const handleExit = () => {
    window.close();
  };

  // Helper functions for rendering UI
  const renderStepIcon = (key) => {
    const status = stepStatuses[key];
    if (status === "success") return <CheckCircle className="analyzing-page__step-icon" />;
    if (status === "error") return <Error className="analyzing-page__step-icon analyzing-page__step-icon--error" />;
    if (currentStepKey === key && !showFailureModal) return <LoadingSpinner size="small" />;
    return <Circle className="analyzing-page__step-icon" />;
  };

  const getStepClass = (key) => {
    const status = stepStatuses[key];
    if (status === "success") return "analyzing-page__step--completed";
    if (currentStepKey === key && !showFailureModal) return "analyzing-page__step--current";
    return "analyzing-page__step--pending";
  };

  // SVG Background Component
  const MachineSVGBackground = () => (
    <svg className="analyzing-page__bg-svg" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="circuitPattern" patternUnits="userSpaceOnUse" width="100" height="100">
          <rect width="100" height="100" fill="transparent"/>
          <path d="M10,10 L90,10 L90,30 L70,30 L70,50 L90,50 L90,90 L10,90 L10,70 L30,70 L30,50 L10,50 Z" 
                fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.3"/>
          <circle cx="20" cy="20" r="3" fill="#06b6d4" opacity="0.5"/>
          <circle cx="80" cy="80" r="3" fill="#10b981" opacity="0.5"/>
        </pattern>
        
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Circuit Board Pattern */}
      <rect width="100%" height="100%" fill="url(#circuitPattern)"/>
      
      {/* Large Gears */}
      <g className="gear-1" style={{transformOrigin: '300px 200px'}}>
        <circle cx="300" cy="200" r="80" fill="none" stroke="#3b82f6" strokeWidth="3" opacity="0.4"/>
        <g stroke="#3b82f6" strokeWidth="2" opacity="0.6">
          <rect x="295" y="120" width="10" height="20" rx="2"/>
          <rect x="295" y="260" width="10" height="20" rx="2"/>
          <rect x="220" y="195" width="20" height="10" rx="2"/>
          <rect x="360" y="195" width="20" height="10" rx="2"/>
          <rect x="250" y="150" width="15" height="15" rx="2" transform="rotate(45 257.5 157.5)"/>
          <rect x="335" y="235" width="15" height="15" rx="2" transform="rotate(45 342.5 242.5)"/>
          <rect x="335" y="150" width="15" height="15" rx="2" transform="rotate(-45 342.5 157.5)"/>
          <rect x="250" y="235" width="15" height="15" rx="2" transform="rotate(-45 257.5 242.5)"/>
        </g>
        <circle cx="300" cy="200" r="15" fill="#3b82f6" opacity="0.8"/>
      </g>
      
      <g className="gear-2" style={{transformOrigin: '1500px 300px'}}>
        <circle cx="1500" cy="300" r="60" fill="none" stroke="#06b6d4" strokeWidth="3" opacity="0.4"/>
        <g stroke="#06b6d4" strokeWidth="2" opacity="0.6">
          <rect x="1495" y="240" width="10" height="15" rx="2"/>
          <rect x="1495" y="345" width="10" height="15" rx="2"/>
          <rect x="1440" y="295" width="15" height="10" rx="2"/>
          <rect x="1545" y="295" width="15" height="10" rx="2"/>
          <rect x="1460" y="260" width="12" height="12" rx="2" transform="rotate(45 1466 1266)"/>
          <rect x="1528" y="328" width="12" height="12" rx="2" transform="rotate(45 1534 1334)"/>
          <rect x="1528" y="260" width="12" height="12" rx="2" transform="rotate(-45 1534 1266)"/>
          <rect x="1460" y="328" width="12" height="12" rx="2" transform="rotate(-45 1466 1334)"/>
        </g>
        <circle cx="1500" cy="300" r="12" fill="#06b6d4" opacity="0.8"/>
      </g>
      
      <g className="gear-3" style={{transformOrigin: '200px 800px'}}>
        <circle cx="200" cy="800" r="50" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.4"/>
        <g stroke="#10b981" strokeWidth="1.5" opacity="0.6">
          <rect x="197" y="750" width="6" height="12" rx="1"/>
          <rect x="197" y="838" width="6" height="12" rx="1"/>
          <rect x="150" y="797" width="12" height="6" rx="1"/>
          <rect x="238" y="797" width="12" height="6" rx="1"/>
          <rect x="165" y="765" width="8" height="8" rx="1" transform="rotate(45 169 769)"/>
          <rect x="227" y="827" width="8" height="8" rx="1" transform="rotate(45 231 831)"/>
          <rect x="227" y="765" width="8" height="8" rx="1" transform="rotate(-45 231 769)"/>
          <rect x="165" y="827" width="8" height="8" rx="1" transform="rotate(-45 169 831)"/>
        </g>
        <circle cx="200" cy="800" r="10" fill="#10b981" opacity="0.8"/>
      </g>
      
      <g className="gear-4" style={{transformOrigin: '1600px 800px'}}>
        <circle cx="1600" cy="800" r="70" fill="none" stroke="#f59e0b" strokeWidth="3" opacity="0.4"/>
        <g stroke="#f59e0b" strokeWidth="2" opacity="0.6">
          <rect x="1595" y="730" width="10" height="18" rx="2"/>
          <rect x="1595" y="852" width="10" height="18" rx="2"/>
          <rect x="1530" y="795" width="18" height="10" rx="2"/>
          <rect x="1652" y="795" width="18" height="10" rx="2"/>
          <rect x="1550" y="750" width="14" height="14" rx="2" transform="rotate(45 1557 1757)"/>
          <rect x="1636" y="836" width="14" height="14" rx="2" transform="rotate(45 1643 1843)"/>
          <rect x="1636" y="750" width="14" height="14" rx="2" transform="rotate(-45 1643 1757)"/>
          <rect x="1550" y="836" width="14" height="14" rx="2" transform="rotate(-45 1557 1843)"/>
        </g>
        <circle cx="1600" cy="800" r="14" fill="#f59e0b" opacity="0.8"/>
      </g>
      
      {/* Circuit Lines */}
      <g className="circuit-pulse">
        <path d="M300 200 Q600 100 900 200 T1500 300" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.5"/>
        <path d="M200 800 Q600 600 1000 700 T1600 800" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.5"/>
        <path d="M300 200 L200 400 Q400 600 600 500 L800 600" fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.5"/>
      </g>
      
      {/* Data Nodes */}
      <circle cx="600" cy="150" r="4" fill="#3b82f6" opacity="0.8" filter="url(#glow)">
        <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="1200" cy="400" r="4" fill="#06b6d4" opacity="0.8" filter="url(#glow)">
        <animate attributeName="r" values="4;8;4" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="800" cy="700" r="4" fill="#10b981" opacity="0.8" filter="url(#glow)">
        <animate attributeName="r" values="4;8;4" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      
      {/* CPU/Processor representation */}
      <g transform="translate(960, 540)">
        <rect x="-40" y="-30" width="80" height="60" rx="4" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.6"/>
        <rect x="-30" y="-20" width="60" height="40" rx="2" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.4"/>
        <g stroke="#10b981" strokeWidth="1" opacity="0.5">
          <line x1="-20" y1="-10" x2="20" y2="-10"/>
          <line x1="-20" y1="0" x2="20" y2="0"/>
          <line x1="-20" y1="10" x2="20" y2="10"/>
        </g>
        <circle cx="0" cy="0" r="3" fill="#f59e0b" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
        </circle>
      </g>
    </svg>
  );

  return (
    <div className="analyzing-page">
      <MachineSVGBackground />
      
      <div className="analyzing-page__container">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="analyzing-page__card"
        >
          <Settings className="analyzing-page__icon pulse-animation" />
          <h1 className="analyzing-page__title machine-title">INITIALIZING SYSTEM</h1>
          <LoadingSpinner size="large" className="analyzing-page__spinner" />

          <div className="analyzing-page__steps">
            {/* Step 1: Modbus Connection */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`analyzing-page__step ${getStepClass("modbus")}`}
            >
              <span>Modbus Connection</span>
              {renderStepIcon("modbus")}
            </motion.div>

            {/* Step 2: Internet Connection */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className={`analyzing-page__step ${getStepClass("internet")}`}
            >
              <span>Internet Connection</span>
              {renderStepIcon("internet")}
            </motion.div>

            {/* Step 3: Sensor Reading */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className={`analyzing-page__step ${getStepClass("sensor")}`}
            >
              <span>Sensor Reading</span>
              {renderStepIcon("sensor")}
            </motion.div>
          </div>

          <Typography variant="body2" className="analyzing-page__message">
            Please wait while the system initializes...
          </Typography>
        </motion.div>
      </div>

      <Modal open={showFailureModal} onClose={() => {}} aria-labelledby="failure-modal-title">
        <Box className="analyzing-page__modal">
          <Error className="analyzing-page__modal-icon" />
          <Typography variant="h6" className="machine-title analyzing-page__modal-title">
            INITIALIZATION FAILED
          </Typography>
          <Typography variant="body1" className="analyzing-page__modal-message">
            A component failed to initialize. You can continue with limited functionality or exit.
          </Typography>
          <Typography variant="h4" className="analyzing-page__modal-countdown">
            {formatTime(countdown)}
          </Typography>
          <div className="analyzing-page__modal-actions">
            <Button variant="contained" onClick={handleContinue} className="machine-button">
              Continue
            </Button>
            <Button
              variant="outlined"
              onClick={handleExit}
              className="analyzing-page__modal-exit-btn"
            >
              Exit
            </Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default AnalyzingPage;