import React, { useState, useEffect } from 'react';

const VendingLoadingAnimation = ({ message = "Preparing to dispense your items..." }) => {
  const [currentProduct, setCurrentProduct] = useState(0);
  const [dispensedProducts, setDispensedProducts] = useState([]);
  const [progress, setProgress] = useState(0);

  const products = [
    { id: 1, emoji: '🥤', name: 'Soda' },
    { id: 2, emoji: '🍫', name: 'Chocolate' },
    { id: 3, emoji: '🍪', name: 'Cookies' },
    { id: 4, emoji: '🥨', name: 'Pretzel' },
    { id: 5, emoji: '🧃', name: 'Juice' },
    { id: 6, emoji: '🥜', name: 'Nuts' },
  ];

  useEffect(() => {
    const productInterval = setInterval(() => {
      setCurrentProduct((prev) => (prev + 1) % products.length);
    }, 2000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev + 1) % 100);
    }, 80);

    const dispenseInterval = setInterval(() => {
      if (Math.random() > 0.75) {
        const newProduct = {
          id: Date.now(),
          emoji: products[Math.floor(Math.random() * products.length)].emoji,
          x: Math.random() * 70 + 15,
          delay: Math.random() * 1
        };
        setDispensedProducts(prev => [...prev, newProduct]);
        
        setTimeout(() => {
          setDispensedProducts(prev => prev.filter(p => p.id !== newProduct.id));
        }, 2500);
      }
    }, 3000);

    return () => {
      clearInterval(productInterval);
      clearInterval(progressInterval);
      clearInterval(dispenseInterval);
    };
  }, []);

  return (
    <div className="vending-animation-container">
      <style jsx>{`
        @keyframes subtleGlow {
          0% { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); }
          50% { box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15); }
          100% { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); }
        }
        
        @keyframes productHighlight {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        @keyframes productFall {
          0% { 
            transform: translateY(-50px) rotate(0deg);
            opacity: 1;
          }
          100% { 
            transform: translateY(180px) rotate(180deg);
            opacity: 0;
          }
        }
        
        @keyframes textFlow {
          0% { transform: translateX(-50%); opacity: 0; }
          50% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(50%); opacity: 0; }
        }
        
        @keyframes statusBlink {
          0%, 70% { opacity: 0.3; }
          35% { opacity: 1; }
        }
        
        .vending-animation-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          position: relative;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 16px;
          padding: 2rem;
          overflow: hidden;
          border: 1px solid #dee2e6;
        }
        
        .vending-machine {
          position: relative;
          width: 220px;
          height: 320px;
          background: linear-gradient(145deg, #ffffff, #f8f9fa);
          border-radius: 12px;
          animation: subtleGlow 3s ease-in-out infinite;
          border: 2px solid #dee2e6;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .machine-header {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          height: 50px;
          background: linear-gradient(145deg, #343a40, #495057);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid #6c757d;
        }
        
        .header-text {
          color: #28a745;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11px;
          font-weight: 600;
          animation: textFlow 4s ease-in-out infinite;
          white-space: nowrap;
          letter-spacing: 0.5px;
        }
        
        .product-grid {
          position: absolute;
          top: 80px;
          left: 16px;
          right: 16px;
          height: 140px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 8px;
          padding: 12px;
          background: linear-gradient(145deg, #f8f9fa, #e9ecef);
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }
        
        .product-slot {
          background: linear-gradient(145deg, #ffffff, #f8f9fa);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          position: relative;
          overflow: hidden;
          border: 1px solid #e9ecef;
          transition: all 0.3s ease;
        }
        
        .product-slot.active {
          animation: productHighlight 2s ease-in-out infinite;
          border-color: #007bff;
          box-shadow: 0 0 12px rgba(0, 123, 255, 0.2);
        }
        
        .control-panel {
          position: absolute;
          bottom: 60px;
          left: 16px;
          right: 16px;
          height: 40px;
          background: linear-gradient(145deg, #6c757d, #495057);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid #495057;
        }
        
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #28a745;
          animation: statusBlink 2s ease-in-out infinite;
        }
        
        .control-text {
          color: #ffffff;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.5px;
        }
        
        .dispense-area {
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
          height: 32px;
          background: linear-gradient(145deg, #343a40, #495057);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #6c757d;
          overflow: hidden;
        }
        
        .dispense-opening {
          width: 60px;
          height: 8px;
          background: #000000;
          border-radius: 4px;
          position: relative;
        }
        
        .progress-container {
          position: absolute;
          bottom: 2px;
          left: 16px;
          right: 16px;
          height: 3px;
          background: rgba(108, 117, 125, 0.3);
          border-radius: 2px;
          overflow: hidden;
        }
        
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #007bff, #28a745);
          border-radius: 2px;
          width: ${progress}%;
          transition: width 0.1s ease;
        }
        
        .falling-products {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }
        
        .falling-product {
          position: absolute;
          font-size: 20px;
          animation: productFall 2.5s ease-in-out forwards;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }
        
        .message-section {
          margin-top: 2rem;
          text-align: center;
        }
        
        .message-text {
          font-size: 1.25rem;
          color: #495057;
          font-weight: 500;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.4;
          opacity: 0.9;
        }
        
        .loading-dots {
          display: inline-block;
          animation: loadingDots 1.5s ease-in-out infinite;
        }
        
        @keyframes loadingDots {
          0%, 20% { opacity: 0; }
          50% { opacity: 1; }
          80%, 100% { opacity: 0; }
        }
        
        .brand-label {
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          background: #007bff;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
      `}</style>
      
      <div className="vending-machine">
        {/* <div className="brand-label">VEND-O-MATIC</div> */}
        
        <div className="machine-header">
          <div className="header-text">PROCESSING REQUEST...</div>
        </div>
        
        <div className="product-grid">
          {products.map((product, index) => (
            <div 
              key={product.id} 
              className={`product-slot ${index === currentProduct ? 'active' : ''}`}
            >
              <span>{product.emoji}</span>
            </div>
          ))}
        </div>
        
        <div className="control-panel">
          <div className="status-indicator"></div>
          <div className="control-text">SYSTEM ACTIVE</div>
          <div className="status-indicator"></div>
        </div>
        
        <div className="dispense-area">
          <div className="dispense-opening"></div>
        </div>
        
        <div className="progress-container">
          <div className="progress-bar"></div>
        </div>
        
        <div className="falling-products">
          {dispensedProducts.map((product) => (
            <div
              key={product.id}
              className="falling-product"
              style={{
                left: `${product.x}%`,
                animationDelay: `${product.delay}s`
              }}
            >
              {product.emoji}
            </div>
          ))}
        </div>
      </div>
      
      <div className="message-section">
        <div className="message-text">
          {message}
          <span className="loading-dots">...</span>
        </div>
      </div>
    </div>
  );
};

export default VendingLoadingAnimation;