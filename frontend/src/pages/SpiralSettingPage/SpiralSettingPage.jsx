"use client"

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Snackbar, Alert, Box, TextField, CircularProgress, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import spiralApi from "../../services/spiralApi"; // Ensure this path is correct
import "./SpiralSettingPage.css"; // Ensure this path is correct
import logo from "../../assets/images/logo.webp"; // Ensure this path is correct
import spiral from "../../assets/images/spiral.webp"; // Ensure this path is correct
import Header from "../../components/UI/Header/Header";
import refillApi from "../../services/refillApi"; // <<< --- ADD THIS LINE


// --- Reusable Toggle Switch Component (No changes) ---
const ToggleSwitch = ({ isOn, onToggle }) => {
  return (
    <label className="toggle-switchspiral">
      <input type="checkbox" checked={isOn} onChange={onToggle} />
      <span className="sliderspiral"></span>
    </label>
  );
};

// --- Animation variants (No changes) ---
const pageVariants = {
  panelClosed: { paddingLeft: "40px" },
  panelOpen: { paddingLeft: "490px" },
};

// --- FIX: Define keys for BOTH persistent items in localStorage ---
const PENDING_ACTIONS_KEY = 'pendingSpiralActions';
const LAST_KNOWN_CONFIG_KEY = 'lastKnownMotorConfig'; // This is the persistent state snapshot

export default function SpiralSettingPage() {
  const navigate = useNavigate();

  // State for UI and data handling
  const [motorStates, setMotorStates] = useState(Array(60).fill(false));
  const [originalMotorStates, setOriginalMotorStates] = useState(Array(60).fill(false));

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [error, setError] = useState(null);
  const [alertInfo, setAlertInfo] = useState({ open: false, message: "", severity: "success" });
  const [showManagePanel, setShowManagePanel] = useState(false);
  const [spiralInput, setSpiralInput] = useState("");

  const numberPad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", ","],
  ];

  // --- Core Offline Logic (No changes needed in this function) ---
  const processPendingActions = useCallback(async () => {
    if (isSyncing || !navigator.onLine) {
      if (!navigator.onLine) console.log("Offline, skipping sync.");
      return;
    }
    let pendingActions = JSON.parse(localStorage.getItem(PENDING_ACTIONS_KEY) || '[]');
    if (pendingActions.length === 0) {
      return;
    }
    setIsSyncing(true);
    console.log(`Processing ${pendingActions.length} pending actions...`);
    setAlertInfo({ open: true, message: `Syncing ${pendingActions.length} pending changes...`, severity: "info" });
    const remainingActions = [];
    for (const action of pendingActions) {
      try {
        if (action.type === 'update') {
          await spiralApi.updatespiral(action.payload.motor, action.payload.is_enabled);
        } else if (action.type === 'initialize') {
          await spiralApi.spiralsetting();
        }
        console.log('Successfully synced action:', action);
      } catch (err) {
        console.error("Failed to sync action, will retry later:", action, err);
        remainingActions.push(action);
      }
    }
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(remainingActions));
    if (remainingActions.length === 0) {
      console.log("All pending actions synchronized successfully!");
      setAlertInfo({ open: true, message: "All changes saved to server!", severity: "success" });
    } else {
      console.log(`${remainingActions.length} actions failed to sync.`);
      setAlertInfo({ open: true, message: `Could not connect to server. Changes are saved locally and will be synced later.`, severity: "warning" });
    }
    setIsSyncing(false);
  }, [isSyncing]);


  // --- FIX: Completely rewritten, robust data loading logic ---
  useEffect(() => {
    const loadAndSync = async () => {
      setIsPageLoading(true);
      console.log("--- Starting app load sequence ---");

      // 1. Load the last saved snapshot from localStorage. This is our reliable base.
      let initialState = Array(60).fill(false);
      const localSnapshot = localStorage.getItem(LAST_KNOWN_CONFIG_KEY);
      if (localSnapshot) {
        try {
          initialState = JSON.parse(localSnapshot);
          console.log("Loaded base state from localStorage snapshot.");
        } catch (e) {
          console.error("Could not parse local snapshot, starting fresh.", e);
        }
      } else {
        console.log("No local snapshot found, starting with default state.");
      }

      // 2. Apply any pending actions on top of our base state.
      const pendingActions = JSON.parse(localStorage.getItem(PENDING_ACTIONS_KEY) || '[]');
      if (pendingActions.length > 0) {
        console.log(`Applying ${pendingActions.length} pending actions.`);
        pendingActions.forEach(action => {
          if (action.type === 'update') {
            const index = action.payload.motor - 1;
            if (index >= 0 && index < 60) {
              initialState[index] = action.payload.is_enabled;
            }
          } else if (action.type === 'initialize') {
            initialState = Array(60).fill(false);
          }
        });
      }

      // 3. Set the component state. The UI is now correct and reflects the user's latest work.
      console.log("Final initial state determined. Setting UI.", initialState);
      setMotorStates(initialState);
      setOriginalMotorStates(initialState);
      setIsPageLoading(false);
      
      // 4. In the background, try to sync with the server.
      await processPendingActions();
    };

    loadAndSync();

    window.addEventListener('online', processPendingActions);
    return () => {
      window.removeEventListener('online', processPendingActions);
    };
  }, [processPendingActions]); // Note: getInitialMotorStates is removed as logic is now inline.


  // --- Event Handlers ---

  const handleMotorToggle = (index) => {
    setMotorStates(prevStates => {
      const newStates = [...prevStates];
      newStates[index] = !newStates[index];
      return newStates;
    });
  };

  const handleSave = async () => {
setIsProcessing(true);
    const machineId = localStorage.getItem("machine_id"); // Get machine ID for API calls
    if (!machineId) {
        setAlertInfo({ open: true, message: "Machine ID not found. Cannot save.", severity: "error" });
        setIsProcessing(false);
        return;
    }

    const changesToQueue = [];
    // --- START: DELETION LOGIC (Step 1: Identify motors to delete) ---
    const motorsToDelete = []; 
    // --- END: DELETION LOGIC ---

    for (let i = 0; i < motorStates.length; i++) {
        if (motorStates[i] !== originalMotorStates[i]) {
            // This is your existing logic to queue updates for offline sync. It is preserved.
            changesToQueue.push({
                type: 'update',
                payload: { motor: i + 1, is_enabled: motorStates[i] }
            });

            // --- START: DELETION LOGIC (Step 2: Check if the change was a deactivation) ---
            // If the motor was previously active (true) and is now inactive (false)...
            if (originalMotorStates[i] === true && motorStates[i] === false) {
                // ...add its ID to our deletion list.
                motorsToDelete.push(i + 1);
            }
            // --- END: DELETION LOGIC ---
        }
    }

    if (changesToQueue.length === 0) {
        setAlertInfo({ open: true, message: "No changes to save.", severity: "info" });
        setIsProcessing(false);
        return;
    }

    // --- START: DELETION LOGIC (Step 3: Execute deletions before saving locally) ---
// Inside your function:
if (motorsToDelete.length > 0 && navigator.onLine) {
  setAlertInfo({
    open: true,
    message: `Clearing database stock for ${motorsToDelete.length} deactivated motor(s)...`,
    severity: "info",
  });

  try {
    const results = await Promise.allSettled(
      motorsToDelete.map((motorId) =>
        refillApi.deleteStockByMotor(machineId, Number(motorId))
      )
    );

    // Separate successes and failures
    const successes = results.filter(r => r.status === "fulfilled").map(r => r.value);
    const failures = results.filter(r => r.status === "rejected");

    if (successes.length > 0) {
      console.log("Deleted stock:", successes);
      setAlertInfo({
        open: true,
        message: `Successfully cleared stock for ${successes.length} motor(s).`,
        severity: "success",
      });
    }

    if (failures.length > 0) {
      console.error("Delete failures:", failures);
      setAlertInfo({
        open: true,
        message: `Failed to clear stock for ${failures.length} motor(s).`,
        severity: "warning",
      });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    setAlertInfo({
      open: true,
      message: "Unexpected error while clearing stock.",
      severity: "error",
    });
  }
}
   else if (motorsToDelete.length > 0 && !navigator.onLine) {
          setAlertInfo({
            open: true,
            message:
              "You are offline. Stock for deactivated motors will be cleared on the server when you reconnect and save again.",
            severity: "warning",
          });
        }


    const newStates = [...motorStates];
    // --- FIX: Persist the full state snapshot to localStorage ---
    localStorage.setItem(LAST_KNOWN_CONFIG_KEY, JSON.stringify(newStates));

    // Update state and queue
    setOriginalMotorStates(newStates);
    const pendingActions = JSON.parse(localStorage.getItem(PENDING_ACTIONS_KEY) || '[]');
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify([...pendingActions, ...changesToQueue]));
    setAlertInfo({ open: true, message: "Changes saved locally! Attempting to sync...", severity: "success" });
    setIsProcessing(false);

    await processPendingActions();
  };

  const handleInitialize = async () => {
    setIsProcessing(true);
    const allFalse = Array(60).fill(false);

    // --- FIX: Update the persistent snapshot for initialization ---
    localStorage.setItem(LAST_KNOWN_CONFIG_KEY, JSON.stringify(allFalse));
    
    // Update state and queue
    setMotorStates(allFalse);
    setOriginalMotorStates(allFalse);
    setError(null);
    const pendingActions = JSON.parse(localStorage.getItem(PENDING_ACTIONS_KEY) || '[]');
    const actionsWithoutUpdates = pendingActions.filter(a => a.type !== 'update');
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify([...actionsWithoutUpdates, { type: 'initialize' }]));
    setAlertInfo({ open: true, message: "Database initialization is queued! Syncing...", severity: "success" });
    handleCloseManagePanel();
    setIsProcessing(false);

    await processPendingActions();
  };

  // --- Panel/UI Handlers (No changes) ---
  const handleSelectSpirals = () => {
    const numbers = spiralInput.split(',').map(n => parseInt(n.trim(), 10)).filter(n => n >= 1 && n <= 60);
    const newStates = [...motorStates];
    numbers.forEach(num => { if (num) newStates[num - 1] = true; });
    setMotorStates(newStates);
    handleCloseManagePanel();
  };
  const handleSelectAll = () => { setMotorStates(Array(60).fill(true)); handleCloseManagePanel(); };
  const handleClearAll = () => { setMotorStates(Array(60).fill(false)); handleCloseManagePanel(); };
  const handleCloseManagePanel = () => { setShowManagePanel(false); setSpiralInput(""); };
  const handleNumpadClick = (value) => { if (value === "C") setSpiralInput(""); else setSpiralInput((prev) => prev + value); };
  const hasUnsavedChanges = JSON.stringify(motorStates) !== JSON.stringify(originalMotorStates);


  // --- RENDER LOGIC (No changes) ---
  if (isPageLoading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
        <p style={{ marginTop: '1rem' }}>Loading Motor Configuration...</p>
      </Box>
    );
  }

  return (
    <motion.div
      className="spiral-pagespiral"
      variants={pageVariants}
      animate={showManagePanel ? "panelOpen" : "panelClosed"}
      transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
    >
         {/* 
        THIS IS THE ONLY CHANGE NEEDED IN YOUR JSX.
        We wrap the Header in a new div. This div will be our fixed container.
      */}
      <div className="spiral-header-container">
        <Header 
          titleSuffix={isSyncing && <CircularProgress size={20} color="inherit" />}
        />
      </div>
      <div className="spiral-grid-containerspiral">
        {error ? (<Alert severity="error" sx={{ width: '100%', mt: 4 }}>{error}</Alert>) : (
          <div className="spiral-gridspiral">
            {motorStates.map((isActive, index) => (
              <motion.div key={index} className={`motor-cardspiral ${isActive ? "activespiral" : ""}`} whileHover={{ scale: 1.05, zIndex: 2 }} layout>
                <img src={spiral} alt="spring" className="spring-imagespiral" />
                <span className="spiral-numberspiral">{index + 1}</span>
                <ToggleSwitch isOn={isActive} onToggle={() => handleMotorToggle(index)} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showManagePanel && (
          <>
            <motion.div className="panel-backdropspiral" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseManagePanel} />
            <motion.div className="manage-panelspiral" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}>
              <div className="panel-headerspiral">
                <h3>Manage Spirals</h3>
                <IconButton onClick={handleCloseManagePanel}><Close /></IconButton>
              </div>
              <div className="panel-contentspiral">
                {(isProcessing || isSyncing) && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress size={24} /></Box>}
                <TextField fullWidth variant="outlined" value={spiralInput} placeholder="e.g. 1,5,22 to enable" className="modal-inputspiral" InputProps={{ readOnly: true }} disabled={isProcessing || isSyncing} />
                <div className="modal-actionsspiral">
                  <Button className="modal-action-btnspiral" onClick={handleSelectSpirals} disabled={isProcessing || isSyncing}>Enable Selected</Button>
                  <Button className="modal-action-btnspiral" onClick={handleSelectAll} disabled={isProcessing || isSyncing}>Enable All</Button>
                  <Button className="modal-action-btnspiral" onClick={handleClearAll} disabled={isProcessing || isSyncing}>Disable All</Button>
                </div>
                <div className="number-pad-containerspiral">
                  <div className="number-pad-gridspiral">
                    {numberPad.flat().map((num) => (
                      <motion.button key={num} className="num-keyspiral" onClick={() => handleNumpadClick(num)} whileTap={{ scale: 0.9 }} disabled={isProcessing || isSyncing}>
                        {num}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <Box mt={3} borderTop="1px solid #e0e0e0" pt={2}>
                  <Button fullWidth variant="contained" color="secondary" onClick={handleInitialize} disabled={isProcessing || isSyncing}>
                    Initialize Database
                  </Button>
                </Box>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Button className="fixed-back-btnspiral" onClick={() => navigate("/operator")}>Back</Button>
      <Button className="fixed-manage-btnspiral" onClick={() => setShowManagePanel(true)}>Manage</Button>
      <Button
        className="fixed-save-btnspiral"
        onClick={handleSave}
        variant={hasUnsavedChanges ? "contained" : "outlined"}
        color={hasUnsavedChanges ? "primary" : "inherit"}
        disabled={!hasUnsavedChanges || isProcessing || isSyncing}
      >
        {(isProcessing || isSyncing) ? <CircularProgress size={24} color="inherit" /> : "SAVE"}
      </Button>

      <Snackbar open={alertInfo.open} autoHideDuration={6000} onClose={() => setAlertInfo(p => ({ ...p, open: false }))}>
        <Alert onClose={() => setAlertInfo(p => ({ ...p, open: false }))} severity={alertInfo.severity} variant="filled" sx={{ width: "100%" }}>
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
}