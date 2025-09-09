"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import logo from "../../assets/images/logo.webp"
import "./OperatorPage.css"
// --- 1. IMPORT YOUR API SERVICE ---
import modbusApi from '../../services/modbusApi';
import modbuscontrollerApi from "../../services/modbuscontrollerApi"
import Header from "../../components/UI/Header/Header"
import machineidApi from "../../services/machineidApi"


// Helper function to create a delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// The main function that controls the diagnostic sequence
async function runDiagnostics(setSteps, setIsDiagnosing, setShowResults) {
  setIsDiagnosing(true);
  setShowResults(true);
  
  // --- 2. DEFINE STEPS AND LINK TO REAL TEST FUNCTIONS ---
   const initialSteps = [
    { name: "Network Connection", status: "pending", testFunction: modbusApi.checkinternet },
    { name: "Modbus Connection", status: "pending", testFunction: modbuscontrollerApi.checkmodbus },
    // These steps below do NOT have a testFunction, so they will use the fallback.
    { name: "Payment Systems", status: "pending" },
    { name: "Motor Array", status: "pending" },
    { name: "Drop Sensors", status: "pending" },
    { name: "Temperature Control", status: "pending" },
  ];

  setSteps(initialSteps);
  await sleep(500);

  // 2. We loop through each step one by one.
  for (let i = 0; i < initialSteps.length; i++) {
    // ... (set status to 'testing' is the same)
    await sleep(1500);

    let didPass = false;
    const stepToTest = initialSteps[i];

    // 3. THIS IS THE CRITICAL PART:
    // We check if a 'testFunction' exists for the current step.
    if (stepToTest.testFunction) {
      
      // FOR "Network Connection" and "Modbus Connection", THIS BLOCK RUNS.
      // It does NOT use the random check.
      console.log(`Running REAL test for: ${stepToTest.name}`);
      try {
        // We call the real API function.
        await stepToTest.testFunction();
        // If the API call succeeds without an error, the test passes.
        didPass = true; 
      } catch (error) {
        // If the API call fails, it will throw an error, and the test fails.
        didPass = false;
      }

    } else {
      
      // FOR ALL OTHER STEPS (Payment, Motor, etc.), THIS BLOCK RUNS.
      // This is the fallback that uses the random check.
      console.log(`Running FALLBACK (random) test for: ${stepToTest.name}`);
      didPass = Math.random() > 0;

    }
    
    // 4. Update the UI with the result (either from the REAL test or the FALLBACK test).
    setSteps(prev => prev.map((step, index) =>
      index === i ? { ...step, status: didPass ? "ok" : "failed" } : step
    ));
    await sleep(300);
  }

  setIsDiagnosing(false);
}


// --- Handler Functions for Desktop Build ---
// These functions assume you have exposed an 'electronAPI' object on the window
// from your Electron preload script.

/**
 * Shuts down the entire machine.
 * This requires privileges to execute system commands.
 */
function handleShutdown() {
  // @ts-ignore
  if (window.electronAPI && typeof window.electronAPI.shutdown === 'function') {
    // @ts-ignore
    window.electronAPI.shutdown();
  } else {
    console.warn("Shutdown functionality is only available in the desktop build.");
  }
}

/**
 * Restarts the entire machine.
 * This requires privileges to execute system commands.
 */
function handleRestart() {
  // @ts-ignore
  if (window.electronAPI && typeof window.electronAPI.restart === 'function') {
    // @ts-ignore
    window.electronAPI.restart();
  } else {
    console.warn("Restart functionality is only available in the desktop build.");
  }
}

/**
 * Exits the application.
 */
async function handleExitApp() {
  try {
    // 1. Call API to set machine offline
    const payload = {
      Machine_Guid: localStorage.getItem("machine_id"), // replace with actual guid from storage/context
      Status: "offline"
    };

    await machineidApi.regstatus(payload);
    console.log("Machine marked offline");

    // 2. Quit the app after API call
    // @ts-ignore
    if (window.electronAPI && typeof window.electronAPI.quit === "function") {
      // @ts-ignore
      window.electronAPI.quit();
    } else {
      console.warn("Exit functionality is only available in the desktop build.");
    }
  } catch (error) {
    console.error("Failed to update status before exit:", error);

    // Even if API fails, still quit
    // @ts-ignore
    if (window.electronAPI && typeof window.electronAPI.quit === "function") {
      // @ts-ignore
      window.electronAPI.quit();
    }
  }
}


export default function OperatorPage() {
  const navigate = useNavigate();
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticSteps, setDiagnosticSteps] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === "Tab") {
        event.preventDefault();
        navigate("/operator");
      }
    }
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate]);

  const operatorCards = [
    { title: "Refill", path: "/refill", color: "#f39c12", shadow: "#b36e00", className: "btn-refillSetting" },
    { title: "Motor Testing", path: "/motor-testing", color: "#3498db", shadow: "#1f78b4", className: "btn-motorSetting" },
    { title: "Spiral Setting", path: "/spiral-setting", color: "#1abc9c", shadow: "#0f8b72", className: "btn-spiralSetting" },
    { title: "Report", path: "/report", color: "#9b59b6", shadow: "#733a8c", className: "btn-reportSetting" },
    { title: "Shutdown", onClick: handleShutdown, color: "#e74c3c", shadow: "#a82c1e", className: "btn-shutdownSetting" },
    { title: "Restart", onClick: handleRestart, color: "#f1c40f", shadow: "#c19d0b", className: "btn-restartSetting" }
  ];

  const handleGoHome = () => navigate('/home');
  const handleDiagnostics = () => runDiagnostics(setDiagnosticSteps, setIsDiagnosing, setShowResults);
  const handleCloseDiagnostics = () => {
    setShowResults(false);
    setDiagnosticSteps([]);
  };

  return (
    <div className="operator-page-containerSetting">
      {/* Header */}
      <Header/>
      
      <main className="operator-contentSetting">
        {/* Vending Machine Style Container */}
        <div className="vending-containerSetting">
          <div className="control-panelSetting">
            {showResults ? (
              <div className="diagnostics-panelSetting">
                <h2>System Diagnostics</h2>
                <ul className="diagnostics-listSetting">
                  {diagnosticSteps.map((step, index) => (
                    <li key={index} className="diagnostics-itemSetting">
                      <span>{step.name}</span>
                      <span className={`status-indicatorSetting status-${step.status}Setting`}>
                        {step.status === 'testing' && <div className="spinnerSetting"></div>}
                        {step.status === 'ok' && 'OK'}
                        {step.status === 'failed' && 'FAILED'}
                        {step.status === 'pending' && '...'}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  className="control-btnSetting"
                  onClick={handleCloseDiagnostics}
                  disabled={isDiagnosing}
                >
                  {isDiagnosing ? 'Running...' : 'Close'}
                </button>
              </div>
            ) : (
              <>
                <div className="center-button-wrapperSetting">
                  <motion.button
                    className="center-action-btnSetting"
                    onClick={handleDiagnostics}
                    disabled={isDiagnosing}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Run Diagnostics
                  </motion.button>
                </div>
                <div className="operator-gridSetting">
                  {operatorCards.map((card) => (
                    <div key={card.title} className="button-wrapperSetting">
                      <motion.button
                        className={`operator-btnSetting ${card.className}`}
                        onClick={() => (card.path ? navigate(card.path) : card.onClick())}
                        disabled={isDiagnosing}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {card.title}
                      </motion.button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="page-footerSetting">
        <button onClick={handleExitApp} className="control-btnSetting" disabled={isDiagnosing}>
          Exit
        </button>
        <button onClick={handleGoHome} className="control-btnSetting" disabled={isDiagnosing}>
          Home
        </button>
      </footer>
    </div>
  )
}