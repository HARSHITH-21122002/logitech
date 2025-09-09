"use client"

import { useState, useEffect } from "react"
// --- FIX 1: Add missing Dialog components to the import list ---
import { Card, Typography, TextField, Button, Snackbar, Alert, CircularProgress, Dialog, DialogTitle, DialogContent } from "@mui/material"
import ContactlessIcon from "@mui/icons-material/Contactless"
import { useNavigate, useLocation } from "react-router-dom"
import Header from "../../components/UI/Header/Header"
import rfidregisterApi from "../../services/rfidregisterApi"
import "./UserRegisterPage.css"

const UserRegisterPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [hasTapped, setHasTapped] = useState(false)
  const [activeField, setActiveField] = useState('Name')
  const [isShifted, setIsShifted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    RFID: location.state?.RFID || "",
    Name: "",
    User_No: "",
    balance: "0",
  })
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [isCheckingRfid, setIsCheckingRfid] = useState(false);
  const [popup, setPopup] = useState({
    isOpen: false,
    message: '',
  });

  const checkRfidAndProceed = async (scannedRfid) => {
    setIsCheckingRfid(true);
    try {
      await rfidregisterApi.getregister(scannedRfid);
      setPopup({
        isOpen: true,
        message: 'User is already exist.',
      });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setFormData((prev) => ({ ...prev, RFID: scannedRfid }));
        setHasTapped(true);
      } else {
        setPopup({
          isOpen: true,
          message: 'An error occurred while checking the card. Please try again.',
        });
      }
    } finally {
      setIsCheckingRfid(false);
    }
  };

  useEffect(() => {
    // This dependency array is correct. It prevents the listener from running
    // when a card is already successfully scanned or while a check is in progress.
    if (hasTapped || isCheckingRfid) return;

    let rfidBuffer = [];
    let lastKeystrokeTime = Date.now();

    const handleKeyDown = (e) => {
      const currentTime = Date.now();
      if (currentTime - lastKeystrokeTime > 100) {
        rfidBuffer = [];
      }
      lastKeystrokeTime = currentTime;
      if (e.key === "Enter") {
        e.preventDefault();
        if (rfidBuffer.length > 0) {
          const scannedRfid = rfidBuffer.join("");
          checkRfidAndProceed(scannedRfid);
        }
        rfidBuffer = [];
      } else {
        if (e.key.length === 1) rfidBuffer.push(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasTapped, isCheckingRfid]);

  // This effect for the popup timer is correct.
  useEffect(() => {
    let timer;
    if (popup.isOpen && popup.message === 'User is already exist.') {
      timer = setTimeout(() => {
        navigate('/scanning-page');
      }, 5000); // 5 seconds
    }
    return () => clearTimeout(timer);
  }, [popup, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleClosePopup = () => {
    setPopup({ isOpen: false, message: '' });
  };

  const handleKeypadClick = (key) => {
    if (!activeField) return;
    switch (key) {
      case '⌫':
        setFormData((prev) => ({ ...prev, [activeField]: prev[activeField].slice(0, -1) }));
        break;
      case 'C':
        setFormData((prev) => ({ ...prev, [activeField]: '' }));
        break;
      case 'Shift':
        setIsShifted((prev) => !prev);
        break;
      case '␣':
        setFormData((prev) => ({ ...prev, [activeField]: prev[activeField] + ' ' }));
        break;
      default:
        const char = isShifted ? key.toUpperCase() : key.toLowerCase();
        setFormData((prev) => ({ ...prev, [activeField]: prev[activeField] + char }));
        if (isShifted) setIsShifted(false);
        break;
    }
  };

  const handleRegister = async () => {
    if (!formData.Name || !formData.User_No) {
      setSnackbar({ open: true, message: "Name and User number field are required", severity: 'error' });
      return;
    }
    setIsLoading(true);

    const atvendor = localStorage.getItem("vendor_id")

    try {
      const payload = {
        RFID: formData.RFID,
        Name: formData.Name,
        User_No: formData.User_No,
        balance: parseFloat(formData.balance),
        Vendor_id:atvendor,
        image_path:null
      };
      console.log("payload for new reg:",payload)
      await rfidregisterApi.newregister(payload);
      setSnackbar({
        open: true,
        message: 'Registration Successful! You are ready to top up.',
        severity: 'success'
      });
      
      setTimeout(() => {
        navigate("/scanning-page");
      }, 3000); // 3 seconds is enough for the user to read the message

    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed. Please try again.";
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      console.error(err);
      // --- FIX 2: Set loading to false ONLY in the catch block ---
      // This ensures the button becomes active again if registration fails.
      setIsLoading(false);
    }
    // The incorrect `finally` block has been removed.
  }

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleBack = () => {
    navigate("/scanning-page")
  }

  const keyboardLayout = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '⌫'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '@'],
    ['C', '␣']
  ];

  const getKeyClass = (key) => {
    let className = 'keypad-btn-reg'
    if (['⌫', 'Shift', 'C'].includes(key)) className += ' key-function-reg';
    if (key === 'Shift' && isShifted) className += ' active-reg';
    if (key === '␣') className += ' key-space-reg';
    return className
  };

  return (
    <div className="register-page-reg">
      <Header />
      <div className="register-content-reg">
        {!hasTapped ? (
          <div className="rfid-section-reg">
            <Card className="rfid-card-reg" elevation={10}>
              {isCheckingRfid && (
                  <div className="loading-overlay-reg">
                    <CircularProgress color="inherit" size={60}/>
                  </div>
              )}
              <div className="rfid-card-content-reg">
                <div className="scan-circle-reg">
                  <ContactlessIcon className="contactless-icon-reg" />
                  <div className="orbit-animation-reg">
                    <div className="orbit-ring-reg ring-1-reg"></div>
                    <div className="orbit-ring-reg ring-2-reg"></div>
                    <div className="orbit-ring-reg ring-3-reg"></div>
                  </div>
                </div>
                <Typography variant="h5" component="h2" className="rfid-text-reg">
                  TAP YOUR CARD
                </Typography>
                <div className="status-text-reg">
                  {isCheckingRfid ? 'Checking card...' : 'Ready to scan...'}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="form-section-reg">
            <Card className="form-card-reg" elevation={8}>
              <Typography variant="h5" className="form-title-reg">
                Register New User
              </Typography>
              <div className="form-content-reg">
                <TextField
                  label="RFID"
                  name="RFID"
                  value={formData.RFID}
                  fullWidth
                  disabled
                  margin="normal"
                  helperText="RFID captured successfully."
                  // This className is used by the CSS to add a pulse effect
                  className={isCheckingRfid ? 'checking-reg' : ''}
                />
                <TextField label="Name" name="Name" value={formData.Name} onChange={handleInputChange} onFocus={() => setActiveField('Name')} fullWidth className="form-field-reg" margin="normal" autoFocus />
                <TextField label="User No" name="User_No" value={formData.User_No} onChange={handleInputChange} onFocus={() => setActiveField('User_No')} fullWidth className="form-field-reg" margin="normal" />
                <TextField label="Balance" name="balance" value={formData.balance} type="number" fullWidth disabled className="form-field-reg" margin="normal" />
                
                <Button 
                  variant="contained" 
                  className="register-btn-reg" 
                  onClick={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
                </Button>
              </div>
            </Card>
            <Card className="keypad-card-reg" elevation={8}>
              <div className="keyboard-container-reg">
                {keyboardLayout.map((row, rowIndex) => (
                  <div key={rowIndex} className="keyboard-row-reg">
                    {row.map((key) => (
                      <Button key={key} variant="outlined" className={getKeyClass(key)} onClick={() => handleKeypadClick(key)}>
                        {key.length === 1 ? (isShifted ? key.toUpperCase() : key.toLowerCase()) : key}
                      </Button>
                    ))}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
      <Button variant="contained" className="back-btn-reg" onClick={handleBack}>
        Back
      </Button>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <Dialog 
        open={popup.isOpen} 
        onClose={popup.message !== 'User is already exist.' ? handleClosePopup : null}
        PaperProps={{ style: { borderRadius: 16, padding: '1rem' } }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          {popup.message === 'User is already exist.' ? 'Scan Result' : 'Error'}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography>{popup.message}</Typography>
          {popup.message === 'User is already exist.' && (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <CircularProgress />
              <Typography variant="body2" color="textSecondary">
                Redirecting automatically...
              </Typography>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserRegisterPage