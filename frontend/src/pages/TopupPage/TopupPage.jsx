import React, { useState } from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Correct import for useNavigate
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import Header from '../../components/UI/Header/Header';
import './TopupPage.css';

const TopupPage = () => {
  const [amount, setAmount] = useState('');
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const navigate = useNavigate();

  const handleKeypadClick = (value) => {
    if (value === 'C') {
      setAmount('');
    } else if (value === '=') {
      if (amount) {
        setShowPaymentMethods(true);
      }
    } else {
        // Prevent adding too many digits
        if (amount.length < 5) {
            setAmount(prev => prev + value);
        }
    }
  };

  const handleProceedToPay = () => {
    if (amount) {
      setShowPaymentMethods(true);
    }
  };

  const handleBack = () => {
    if (showPaymentMethods) {
      setShowPaymentMethods(false);
    } else {
      // Navigate back to the scanning page or home
      navigate("/scanning-page");
    }
  };

  // --- MODIFIED FUNCTION ---
  const handlePaymentMethod = (method) => {
    // 1. Get the user's RFID from localStorage.
    //    It is assumed the scanning page has stored this.
    const rfid = localStorage.getItem('user_rfid'); // Make sure you use the same key everywhere

    if (!rfid) {
        // Critical error: cannot proceed without an RFID.
        alert("User RFID not found. Please return to the home page and scan your card again.");
        navigate('/'); // Redirect to home/start page
        return;
    }

    // 2. Generate a unique order number for this top-up attempt and store it.
    //    This is useful for tracking and logs.
    const orderNumber = `ORD-TOPUP-${Date.now()}`;
    localStorage.setItem('order_number', orderNumber);

    console.log(`Preparing payment for RFID: ${rfid} with Order Number: ${orderNumber}`);

    // 3. Navigate to the correct payment page with the required state.
    if (method === "UPI") {
      // The state object MUST match what TopupPayingPage expects:
      // - 'topupAmount' as a Number
      // - 'rfid' as a String
      navigate("/topup-pay", { 
          state: { 
              topupAmount: Number(amount), // Convert amount string to a number
              rfid: rfid                  // Pass the rfid
            } 
        });
    } else if (method === "Card") {
        // Placeholder for future card payment implementation
        alert("Card payment is not yet supported.");
        // Example navigation for card payment:
        // navigate("/card-payment", { state: { topupAmount: Number(amount), rfid: rfid } });
    }
  };

  const handleClosePopup = () => {
    setShowPaymentMethods(false);
  };

  const keypadButtons = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'C', '0', '='
  ];

  return (
    <div className="topup-page">
      <Header />
      
      <div className="topup-content">
        <div className="left-panel">
          <div className="amount-section">
            <h2 className="amount-title">AMOUNT</h2>
            
            <div className="amount-input-container">
              <span className="rupee-symbol">₹</span>
              <input
                type="text"
                value={amount}
                placeholder="Enter the Amount"
                className="amount-input"
                readOnly
              />
            </div>

            <div className="keypad">
              {keypadButtons.map((button, index) => (
                <button
                  key={index}
                  className={`keypad-button ${button === '=' ? 'enter-button' : ''} ${button === 'C' ? 'clear-button' : ''}`}
                  onClick={() => handleKeypadClick(button)}
                >
                  {button}
                </button>
              ))}
            </div>

            <Button
              variant="contained"
              className="proceed-button"
              onClick={handleProceedToPay}
              disabled={!amount}
            >
              Proceed to pay
            </Button>
          </div>
        </div>

        {showPaymentMethods && (
          <div className="right-panel">
            <div className="payment-popup">
              <div className="popup-header">
                <h3 className="popup-title">Choose Payment Method</h3>
                <button className="close-button" onClick={handleClosePopup}>
                  <CloseIcon />
                </button>
              </div>
              
              <div className="amount-display">
                <span className="amount-label">Amount to Pay:</span>
                <span className="amount-value">₹{amount}</span>
              </div>
              
              <div className="payment-methods">
                <button
                  className="payment-method-button"
                  onClick={() => handlePaymentMethod('UPI')}
                >
                  <div className="payment-icon">
                    <AccountBalanceWalletIcon className="method-icon" />
                  </div>
                  <div className="payment-text">
                    <span className="method-name">UPI Payment</span>
                    <span className="method-desc">Pay using UPI apps</span>
                  </div>
                </button>
                
                <button
                  className="payment-method-button"
                  onClick={() => handlePaymentMethod('Card')}
                >
                  <div className="payment-icon">
                    <CreditCardIcon className="method-icon" />
                  </div>
                  <div className="payment-text">
                    <span className="method-name">Card Payment</span>
                    <span className="method-desc">Debit/Credit Card</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="back-button-container">
        <button
          className="back-button"
          onClick={handleBack}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default TopupPage;