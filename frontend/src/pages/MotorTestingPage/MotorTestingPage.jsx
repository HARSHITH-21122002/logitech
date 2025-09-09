"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import modbuscontrollerApi from "../../services/modbuscontrollerApi" 
import "./MotorTestingPage.css"
import logo from "../../assets/images/logo.webp"

const pollForVendStatus = async (motorId, shouldStop) => {
  const pollInterval = 1000;
  const timeout = 15000;
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (shouldStop.value) {
      return { success: false, error: 'stopped' }; // Return status object
    }
    try {
      const response = await modbuscontrollerApi.checkvendstatus(motorId);
      
      // !! CHANGE THIS LINE BASED ON YOUR CONSOLE LOGS !!
      // Example: if the key was "status" and value was "OK" -> if (response && response.status === "OK")
      if (response && response["vend_status"] == 1) { 
        return { success: true, error: null };
      }
    } catch (error) {
      console.error(`Error polling vend status for motor ${motorId}:`, error);
      // Return an error status so the UI can display it
      return { success: false, error: 'api_error' };
    }
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  // If the loop finishes, it's a timeout
  return { success: false, error: 'timeout' };
};


const runSingleMotorTest = async (motorId, shouldStop = { value: false }) => {
  if (shouldStop.value) {
    return { motorId, status: 'stopped', message: `Test stopped before motor ${motorId}.` };
  }
  
  try {
    await modbuscontrollerApi.startmotor(motorId);
  } catch (error) {
    console.error(`Error starting motor ${motorId}:`, error);
    return { motorId, status: 'failed', message: `Motor ${motorId}: Start command FAILED.` };
  }

  // Poll for the result
  const result = await pollForVendStatus(motorId, shouldStop);
  
  // Provide detailed feedback based on the poll result
  if (result.success) {
    return { motorId, status: 'success', message: `Motor ${motorId} test PASSED.` };
  }
  
  // Handle different failure reasons
  switch (result.error) {
    case 'stopped':
      return { motorId, status: 'stopped', message: `Test stopped during motor ${motorId}.` };
    case 'api_error':
      return { motorId, status: 'failed', message: `Motor ${motorId} FAILED (API Error). Check console.` };
    case 'timeout':
    default:
      return { motorId, status: 'failed', message: `Motor ${motorId} FAILED (No sensor confirmation).` };
  }
};

// ========================================================================
// Your component with the State Bug Fix
// ========================================================================
export default function MotorTestingPage() {
  const navigate = useNavigate()
  const [motorNumber, setMotorNumber] = useState("")
  const [testResults, setTestResults] = useState([])
  const [isTestingMotor, setIsTestingMotor] = useState(false)
  const [isTestingAll, setIsTestingAll] = useState(false)
  const [isTestingModbus, setIsTestingModbus] = useState(false)
  const [modbusStatus, setModbusStatus] = useState(null)
  const [shouldStopAllTests, setShouldStopAllTests] = useState({ value: false });

  const numberPad = [
    ["1", "2", "3"],
    ["4",- "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "⌫"],
  ];
  
  const handleClearResults = () => {
    setTestResults([]);
    setModbusStatus(null);
  };

  const handleNumberPadClick = (value) => {
    if (value === "C") setMotorNumber("");
    else if (value === "⌫") setMotorNumber((prev) => prev.slice(0, -1));
    else setMotorNumber((prev) => (prev + value).slice(0, 2));
  };

  // FIX: Clear other test states before starting a new one
  const handleMotorTest = async () => {
    if (!motorNumber || Number.parseInt(motorNumber) < 1 || Number.parseInt(motorNumber) > 60) {
      setTestResults(prev => [{ status: 'failed', message: 'Enter a valid motor number (1-60)' }, ...prev]);
      return;
    }
    
    setModbusStatus(null); // Clear modbus status
    setIsTestingMotor(true);
    
    const motorId = Number.parseInt(motorNumber);
    const result = await runSingleMotorTest(motorId);

    setTestResults((prev) => [result, ...prev.slice(0, 19)]);
    setIsTestingMotor(false);
    setMotorNumber("");
  };

  // FIX: Clear other test states before starting a new one
  const handleAllMotorTest = async () => {
    setIsTestingAll(true);
    setModbusStatus(null); // Clear modbus status
    setTestResults([]);
    
    const stopFlag = { value: false };
    setShouldStopAllTests(stopFlag);

    for (let i = 1; i <= 60; i++) {
      const result = await runSingleMotorTest(i, stopFlag);
      setTestResults((prev) => [result, ...prev.slice(0, 19)]);
      if (result.status === 'stopped' || result.status === 'failed') {
        break; // Stop on first failure or user stop
      }
    }
    setIsTestingAll(false);
  };

  const handleStopAllMotorTest = () => {
    shouldStopAllTests.value = true;
  };

  // FIX: Clear other test states before starting a new one
  const handleModbusTest = async () => {
    setIsTestingModbus(true);
    setTestResults([]); // Clear motor test results
    setModbusStatus(null);
    try {
      const response = await modbuscontrollerApi.checkmodbus();
      setModbusStatus(response.success ? "success" : "failed");
    } catch (error) {
      console.error("API Error on Modbus test:", error);
      setModbusStatus("failed");
    } finally {
      setIsTestingModbus(false);
    }
  };

  const isAnyTestRunning = isTestingMotor || isTestingAll;

  // The JSX is unchanged. The fixes are purely in the logic.
  return (
    <div className="testing-pageMotors">
     <header className="add-motor-payment-headerMotors">
        <h1 className="add-motor-header-titleMotors">BVC</h1>
        <button className="add-motor-home-logo-btnMotors" onClick={() => navigate('/home')}>
          <img src={logo} alt="Home Logo" className="add-motor-logo-imageMotors" />
        </button>
      </header>

      <main className="testing-layoutMotors">
        <div className="control-sectionMotors">
          <div className="rotating-circle-containerMotors">
            <div className={`rotating-circleMotors ${isAnyTestRunning ? "testingMotors" : ""}`}></div>
          </div>
          <input
            type="text"
            className="motor-inputMotors"
            value={motorNumber}
            placeholder="Motor No."
            readOnly
          />
          <div className="action-buttonsMotors">
            <button className="action-btnMotors" onClick={handleMotorTest} disabled={isAnyTestRunning || isTestingModbus || !motorNumber}>
              {isTestingMotor ? "TESTING..." : "Motor Test"}
            </button>
            <button className="action-btnMotors" onClick={handleAllMotorTest} disabled={isAnyTestRunning || isTestingModbus}>
              {isTestingAll ? "TESTING ALL..." : "All Motor Test"}
            </button>
            {isTestingAll && (
              <button className="action-btnMotors stop-btnMotors" onClick={handleStopAllMotorTest}>
                STOP ALL
              </button>
            )}
            <button className="action-btnMotors" onClick={handleModbusTest} disabled={isAnyTestRunning || isTestingModbus}>
              {isTestingModbus ? "CHECKING..." : "Modbus Test"}
            </button>
          </div>
          <div className="number-pad-containerMotors">
            <div className="number-pad-gridMotors">
              {numberPad.flat().map((num) => (
                <motion.button
                  key={num}
                  className="num-keyMotors"
                  onClick={() => handleNumberPadClick(num)}
                  whileTap={{ scale: 0.9 }}
                >
                  {num}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="result-sectionMotors">
          <div className="result-containerMotors">
            <div className="result-headerMotors">
              <h3 className="result-titleMotors">Test Log</h3>
              <button
                className="clear-btnMotors"
                onClick={handleClearResults}
                disabled={testResults.length === 0 && !modbusStatus}
              >
                Clear
              </button>
            </div>
            <div className="result-listMotors">
              {modbusStatus && (
                <motion.div 
                  className={`result-itemMotors modbus-resultMotors ${modbusStatus}Motors`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {modbusStatus === 'success' 
                    ? 'Modbus connection successful.' 
                    : 'Modbus connection failed.'}
                </motion.div>
              )}
              {testResults.length > 0 ? (
                  testResults.map((result, index) => (
                      <motion.div 
                          key={index} 
                          className={`result-itemMotors ${result.status}Motors`}
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                      >
                          {result.message}
                      </motion.div>
                  ))
              ) : (
                !modbusStatus && <div className="result-itemMotors neutralMotors">Awaiting test results...</div>
              )}
            </div>
          </div>
        </div>
      </main>

      <motion.button
        className="fixed-back-btnMotors"
        onClick={() => navigate("/operator")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Back
      </motion.button>
    </div>
  )
}