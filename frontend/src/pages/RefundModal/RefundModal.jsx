// In RefundModal.jsx

import React, { useEffect } from "react";
import "./RefundModal.css";
// We no longer need useNavigate here

const RefundModal = ({ isOpen, onClose, details }) => {
  // --- ACTION 1: ADD USEEFFECT FOR AUTO-CLOSING ---
  useEffect(() => {
    if (isOpen) {
      // Automatically call the onClose function after a delay (e.g., 5 seconds)
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // 5000ms = 5 seconds

      // Cleanup the timer if the component unmounts or isOpen changes
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]); // This effect runs whenever isOpen or onClose changes

  if (!isOpen) {
    return null;
  }

  // --- ACTION 2: REMOVE THE BUTTON FROM THE JSX ---
  return (
    <div className="modal-overlay-refund">
      <div className="modal-content-refund">
        <h2 className="modal-title-refund">{details.title}</h2>
        <p className="modal-message-refund">{details.message}</p>
        {details.amount > 0 && (
          <p className="modal-amount-refund">
            Refund Amount: <strong>₹{details.amount.toFixed(2)}</strong>
          </p>
        )}
        {/* The button has been removed */}
      </div>
    </div>
  );
};

export default RefundModal;