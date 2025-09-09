import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { CircularProgress } from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import pinelabApi from '../../services/pinelabApi';
import Header from '../../components/UI/Header/Header';
import './CardPage.css';

// Import your app logos
import gpayLogo from '../../assets/images/gpay.webp';
import phonepeLogo from '../../assets/images/phonepe.webp';
import paytmLogo from '../../assets/images/paytm.webp';
import pinelabsLogo from '../../assets/images/pinelabs.webp';

const appLogos = { gpay: gpayLogo, phonepe: phonepeLogo, paytm: paytmLogo, pinelabs: pinelabsLogo };

// Helper functions defined outside the component for efficiency
const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
const formatAppName = (app) => ({ gpay: "GPay", phonepe: "PhonePe", paytm: "Paytm", pinelabs: "Card" }[app]);


export default function CardPage() {
    const navigate = useNavigate();
    const [paymentStatus, setPaymentStatus] = useState('loading');
    const [statusMessage, setStatusMessage] = useState('Validating order...');
    const [totalPrice, setTotalPrice] = useState(0);
    const [countdown, setCountdown] = useState(180);
    const pollingInterval = useRef(null);
    
    // State to manage the cancellation process
    const [referenceId, setReferenceId] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);

    // This main useEffect runs only ONCE when the component mounts
    useEffect(() => {
        const initializePayment = async () => {
            console.log("CardPage: Starting payment initialization...");

            // --- 1. ROBUST DATA VALIDATION ---
            const storedOrder = localStorage.getItem('currentOrder');
            if (!storedOrder) {
                console.error("VALIDATION FAILED: 'currentOrder' not found in localStorage.");
                setStatusMessage('Error: Order details not found.');
                return setPaymentStatus('failed');
            }

            let parsedOrder;
            try {
                parsedOrder = JSON.parse(storedOrder);
            } catch (e) {
                console.error("VALIDATION FAILED: Could not parse 'currentOrder' from localStorage.", e);
                setStatusMessage('Error: Corrupted order details.');
                return setPaymentStatus('failed');
            }

            if (typeof parsedOrder.totalPrice !== 'number' || isNaN(parsedOrder.totalPrice)) {
                console.error("VALIDATION FAILED: 'totalPrice' is not a valid number.", parsedOrder);
                setStatusMessage('Error: Invalid amount in order details.');
                return setPaymentStatus('failed');
            }

            console.log("Validation successful. Total price:", parsedOrder.totalPrice);
            setTotalPrice(parsedOrder.totalPrice);

            // --- 2. CREATE PAYLOAD ---
            const payload = {
                order_number: `BVC-${Date.now()}`,
                order_total: parsedOrder.totalPrice,
                payment_type: 'Card'
            };

            // --- 3. INITIATE PAYMENT ---
            setStatusMessage('Connecting to payment terminal...');
            try {
                const response = await pinelabApi.startPayment(payload);
                if (response.status === 'pending' && response.reference_id) {
                    console.log("Initiation successful. Storing ref_id and starting polling:", response.reference_id);
                    setReferenceId(response.reference_id); // Store the ID for cancellation
                    setStatusMessage('Please use the card machine to pay');
                    setPaymentStatus('processing');
                    startPolling(response.reference_id);
                } else {
                    console.error("Initiation failed on server. Response:", response);
                    setStatusMessage(response.message || 'Terminal is not ready.');
                    setPaymentStatus('failed');
                }
            } catch (error) {
                const serverMessage = error.response?.data?.message || 'Connection Error.';
                console.error("Critical error during payment initiation:", serverMessage);
                setStatusMessage(serverMessage);
                setPaymentStatus('failed');
            }
        };

        initializePayment();

        // This cleanup function is crucial. It runs when the user navigates away.
        return () => {
            if (pollingInterval.current) {
                console.log("Component unmounting, clearing polling interval.");
                clearInterval(pollingInterval.current);
            }
        };
    }, []); // The empty dependency array [] ensures this runs only once.

    // This function sets up the repeated check for payment status
    const startPolling = (refId) => {
        pollingInterval.current = setInterval(async () => {
            if (document.hidden) return;
            try {
                const statusResponse = await pinelabApi.getPaymentStatus(refId);
                if (statusResponse.status === 'success') {
                    setPaymentStatus('success');
                    clearInterval(pollingInterval.current);
                    setTimeout(() => navigate('/order'), 3000);
                } else if (statusResponse.status === 'failed') {
                    setStatusMessage('Payment was declined or cancelled.');
                    setPaymentStatus('failed');
                    clearInterval(pollingInterval.current);
                }
            } catch (error) {
                setStatusMessage('Error checking status. Stopping polls.');
                setPaymentStatus('failed');
                clearInterval(pollingInterval.current);
            }
        }, 5000);
    };

    // A separate useEffect to manage the visual countdown timer
    useEffect(() => {
        if (countdown <= 0) {
            setStatusMessage('Payment timed out.');
            setPaymentStatus('failed');
            if (pollingInterval.current) clearInterval(pollingInterval.current);
            return;
        }
        if (paymentStatus === 'processing') {
            const timerId = setInterval(() => setCountdown(prev => prev - 1), 1000);
            return () => clearInterval(timerId);
        }
    }, [countdown, paymentStatus]);
    
    // The fully functional cancel handler
    const handleCancel = async () => {
        setIsCancelling(true);

        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
        }

        if (referenceId) {
            try {
                console.log(`Attempting to cancel transaction with ID: ${referenceId}`);
                await pinelabApi.cancelPayment({ reference_id: referenceId });
            } catch (error) {
                console.error("Failed to send cancel request, but navigating away anyway.", error);
            }
        } else {
            console.log("No reference ID was available to cancel.");
        }
        
        navigate('/payment');
    };

    const renderInstructionArea = () => {
        switch (paymentStatus) {
            case 'loading':
                return <CircularProgress style={{ color: "#75d857" }} />;
            case 'processing':
                return <>
                    <CreditCardIcon className="instruction-icon-cardpay" />
                    <p className="instruction-text-cardpay">{statusMessage}</p>
                </>;
            case 'failed':
                 return <p className="instruction-text-cardpay" style={{ color: '#f44336' }}>{statusMessage}</p>;
            default:
                return null;
        }
    };
    
    return (
        <div className="card-page-new-cardpay">
            <div className={`success-overlay-cardpay ${paymentStatus === "success" ? "visible-cardpay" : ""}`}>
                {paymentStatus === "success" && (
                    <div className="success-animation-cardpay">
                        <DotLottieReact src="https://lottie.host/e86f1ca1-0286-47ed-8913-8c31b6f9f104/YzENLsP3x.lottie" loop={false} autoplay />
                    </div>
                )}
                <p className="success-text-cardpay">Payment Successful</p>
            </div>
            <Header isHidden={paymentStatus === "success"} />
            <main className="content-section-cardpay">
                <motion.div className="payment-card-cardpay" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <div className="amount-area-cardpay">
                        <div className="amount-label-cardpay">Amount to Pay</div>
                        <div className="amount-value-cardpay">₹{totalPrice?.toFixed(2)}</div>
                    </div>
                    <div className="timer-area-cardpay">
                        <div className="timer-label-cardpay">TIME REMAINING</div>
                        <div className={`timer-value-cardpay ${countdown <= 30 ? "timer-warning" : ""}`}>{formatTime(countdown)}</div>
                    </div>
                    <div className="instruction-area-cardpay">{renderInstructionArea()}</div>
                    <div className="apps-area-cardpay">
                        {["gpay", "phonepe", "paytm", "pinelabs"].map((app) => (
                            <div key={app} className="app-item-cardpay">
                                <img src={appLogos[app]} alt={formatAppName(app)} className="app-icon-cardpay" />
                                <span className="app-name-cardpay">{formatAppName(app)}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </main>
            <footer className="button-section-cardpay">
                <button 
                    className="action-btn-cardpay" 
                    onClick={handleCancel}
                    disabled={isCancelling}
                >
                    {isCancelling ? 'Cancelling...' : 'Cancel'}
                </button>
            </footer>
        </div>
    );
}