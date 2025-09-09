import React from 'react';
import './VendingProductCard.css';
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

const VendingProductCard = ({ product, status }) => {
  // status can be: 'pending', 'vending', 'success', 'failed'

  const getStatusContent = () => {
    switch (status) {
      case 'vending':
        return (
          <div className="status-overlay vending">
            <FaSpinner className="status-icon spinner" />
            <span className="status-text">Dispensing...</span>
          </div>
        );
      case 'success':
        return (
          <div className="status-overlay success">
            <div className="icon-wrapper">
              <FaCheck className="status-icon" />
            </div>
          </div>
        );
      case 'failed':
        return (
          <div className="status-overlay failed">
            <div className="icon-wrapper">
              <FaTimes className="status-icon" />
            </div>
            <span className="status-text small">Failed</span>
          </div>
        );
      default:
        return null; // 'pending' status has no overlay
    }
  };

  return (
    <div className={`vending-card-v2 ${status}`}>
      <div className="vending-card-v2-image-container">
        <img 
          src={product.image || 'path/to/default-image.png'} // Add a fallback image
          alt={product.productName} 
          className="vending-card-v2-image" 
        />
        {getStatusContent()}
      </div>
      <div className="vending-card-v2-details">
        <p className="vending-card-v2-name">{product.productName}</p>
        <p className="vending-card-v2-qty">Quantity: {product.quantity}</p>
      </div>
    </div>
  );
};

export default VendingProductCard;