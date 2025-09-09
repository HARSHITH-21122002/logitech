import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, CircularProgress, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { Contactless as ContactlessIcon } from '@mui/icons-material';
import Header from '../../components/UI/Header/Header';
import rfidregisterApi from '../../services/rfidregisterApi';
import useRfidListener from '../../services/useRfidListener';
import './UserDetailsPage.css';

function UserDetailsPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showUserDetails, setShowUserDetails] = useState(false);
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);

    const [scannedDataKey, resetScannedDataKey] = useRfidListener();

    const fetchAccountDetails = async (rfid) => {
        setIsLoading(true);
        setError(null);
        setShowUserDetails(false);
        setUserData(null);
        try {
            const data = await rfidregisterApi.getregister(rfid);
            setUserData(data);
            setShowUserDetails(true);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                // Set the exact error message for the popup
                setError("No account found. Kindly select 'New Register' to proceed with account creation.");
            } else {
                // Keep a generic message for other errors
                setError("An error occurred while scanning. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (scannedDataKey && !isLoading) {
            fetchAccountDetails(scannedDataKey);
            resetScannedDataKey();
        }
    }, [scannedDataKey, isLoading, resetScannedDataKey]);

    const handleBack = () => {
        navigate('/scanning-page');
    };

    const resetToScan = () => {
        setShowUserDetails(false);
        setUserData(null);
        setError(null);
        setIsLoading(false);
    };

    const handleCloseErrorAndRegister = () => {
        setError(null);
        navigate('/register'); // Or your dedicated registration route
    };

    const handleCloseError = () => {
        setError(null);
    };

    return (
    <div className="user-details-page-det">
        <Header />
        <div className="page-content-det">
            <div className="rfid-container-det">
                {!showUserDetails ? (
                    <Card className="rfid-card-det" elevation={10}>
                        {isLoading && (
                            <div className="loading-overlay-det">
                                <CircularProgress color="inherit" size={60} />
                            </div>
                        )}
                        <div className="rfid-card-content-det">
                            <div className="scan-circle-det">
                                <ContactlessIcon className="contactless-icon-det" />
                            </div>
                            <Typography variant="h5" component="h2" className="rfid-text-det">
                                Check Card Balance
                            </Typography>
                            <div className="status-text-det">
                                {isLoading ? 'Processing...' : 'Awaiting Card Scan...'}
                            </div>
                        </div>
                    </Card>
                ) : (
                    <div className="user-details-container-det">
                         <Card className="user-details-card-det" elevation={10}>
                            <div className="user-details-content-det">
                                <div className="profile-section-det">
                                    <Avatar className="profile-avatar-det" sx={{ width: 120, height: 120, fontSize: '3rem' }}>
                                        {userData?.Name?.charAt(0).toUpperCase()}
                                    </Avatar>
                                </div>
                                <div className="details-section-det">
                                    <div className="detail-item-det">
                                        <span className="detail-label-det">RFID NO:</span>
                                        <span className="detail-value-det">{userData?.RFID}</span>
                                    </div>
                                    <div className="detail-item-det">
                                        <span className="detail-label-det">Name:</span>
                                        <span className="detail-value-det">{userData?.Name}</span>
                                    </div>
                                    <div className="detail-item-det">
                                        <span className="detail-label-det">User Number:</span>
                                        <span className="detail-value-det">{userData?.User_No}</span>
                                    </div>
                                </div>
                                <div className="balance-section-det">
                                    <Typography variant="h4" className="balance-label-det">
                                        Current Balance
                                    </Typography>
                                    <Typography variant="h2" className="balance-amount-det">
                                        ₹{userData?.balance?.toFixed(2)}
                                    </Typography>
                                </div>
                                <button className="action-btn-order-det scan-again-btn-det" onClick={resetToScan}>
                                    Scan Another Card
                                </button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
            <button className="action-btn-order-det back-btn-det" onClick={handleBack}>
                Back
            </button>
        </div>

        <Dialog
            open={!!error}
            onClose={handleCloseError}
            PaperProps={{
                style: {
                    borderRadius: "16px",
                    padding: "1rem",
                    minWidth: "300px",
                    textAlign: "center"
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                Account Not Found
            </DialogTitle>
            <DialogContent>
                <Typography sx={{ color: 'text.secondary' }}>
                    {error}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', gap: '1rem', paddingBottom: '1rem' }}>
                <Button onClick={handleCloseError} variant="outlined">
                    Scan Again
                </Button>
                <Button onClick={handleCloseErrorAndRegister} variant="contained">
                    New Register
                </Button>
            </DialogActions>
        </Dialog>
    </div>
    );
}

export default UserDetailsPage;