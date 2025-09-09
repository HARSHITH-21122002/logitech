import React, { useState, useEffect } from 'react';
// 1. Import necessary components from MUI
import { 
    Card, 
    Typography, 
    Button, 
    Dialog, 
    DialogActions, 
    DialogContent, 
    DialogContentText, 
    DialogTitle,
    CircularProgress,
    Snackbar,
    Alert,
    Box,           // --- NEW ---
    Divider,       // --- NEW ---
    List,          // --- NEW ---
    ListItem,      // --- NEW ---
    ListItemText,  // --- NEW ---
    Select,        // --- NEW ---
    MenuItem,      // --- NEW ---
    FormControl,   // --- NEW ---
    InputLabel     // --- NEW ---
} from '@mui/material';
// --- NEW: Imports for Date Picker ---
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import ContactlessIcon from '@mui/icons-material/Contactless';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/UI/Header/Header';
// 2. Import your API services
import rfidApi from '../../services/rfidregisterApi';
import accounttransactionApi from '../../services/accounttransactionApi'; 
import './ScanningPage.css';

const ScanningPage = () => {
    const navigate = useNavigate();

    // 3. Add state for dialog, loading, user details, and snackbar
    const [isLoading, setIsLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [userDetails, setUserDetails] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

    // --- NEW: State for transaction history and filters ---
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [filterDayRange, setFilterDayRange] = useState('all');
    const [filterDate, setFilterDate] = useState(null);


    // --- This useEffect is MODIFIED to be cleaner ---
    useEffect(() => {
        let rfidBuffer = [];
        let lastKeystrokeTime = Date.now();

        const scanHandler = async (event) => {
             // If we're loading or a dialog is open, ignore new scans
            if (isLoading || openDialog) return;

            const currentTime = Date.now();
            // Reset buffer if keystrokes are too far apart
            if (currentTime - lastKeystrokeTime > 100) {
                rfidBuffer = [];
            }
            lastKeystrokeTime = currentTime;

            if (event.key === 'Enter') {
                event.preventDefault();
                if (rfidBuffer.length > 0) {
                    const scannedRfid = rfidBuffer.join('');
                    localStorage.setItem('user_rfid', scannedRfid);
                    await fetchAccountDetails(scannedRfid);
                }
                rfidBuffer = []; // Clear buffer after processing
            } else if (event.key.length === 1) { // Only push single characters
                rfidBuffer.push(event.key);
            }
        };
        
        window.addEventListener('keydown', scanHandler);
        
        return () => {
            window.removeEventListener('keydown', scanHandler);
        };
    }, [isLoading, openDialog]); 

    // --- NEW: useEffect to apply filters when they change ---
  useEffect(() => {
    let newFilteredList = Array.isArray(transactions) ? [...transactions] : [];

    // Apply day range filter
    if (filterDayRange !== 'all' && Array.isArray(transactions)) {
        const now = dayjs();
        let startDate;
        if (filterDayRange === 'today') {
            startDate = now.startOf('day');
        } else if (filterDayRange === '7days') {
            startDate = now.subtract(7, 'day').startOf('day');
        } else if (filterDayRange === '30days') {
            startDate = now.subtract(30, 'day').startOf('day');
        }
        newFilteredList = newFilteredList.filter(t =>
            dayjs(t.transaction_date).isAfter(startDate)
        );
    }

    // Apply specific date filter (overrides day range if set)
    if (filterDate && Array.isArray(transactions)) {
        newFilteredList = transactions.filter(t =>
            dayjs(t.transaction_date).isSame(filterDate, 'day')
        );
    }

    setFilteredTransactions(newFilteredList);

}, [filterDayRange, filterDate, transactions]);


    // 5. --- MODIFIED: Function to fetch both user data and transactions ---
    const fetchAccountDetails = async (rfid) => {
        setIsLoading(true);
        try {
            // Fetch user details and transactions in parallel for better performance
            const [userData, transactionData] = await Promise.all([
                rfidApi.getregister(rfid),
                accounttransactionApi.getTransactionsByRFID(rfid)
            ]);

            setUserDetails(userData);
            setTransactions(transactionData || []);
            setFilteredTransactions(transactionData || []); // Initially, show all transactions
            setOpenDialog(true);
        } catch (error) {
            let message = "Failed to fetch details. Please try again.";
            if (error.response && error.response.status === 404) {
                message = "Account not found. Please register this card.";
            }
            setSnackbar({ open: true, message, severity: 'error' });
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- DIALOG HANDLERS ---
    // --- MODIFIED: Reset transaction state on close ---
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setUserDetails(null);
        setTransactions([]);
        setFilteredTransactions([]);
        setFilterDayRange('all');
        setFilterDate(null);
    };

    const handleConfirm = () => {
        navigate('/topup', { state: { userDetails: userDetails } });
        handleCloseDialog();
    };

    // --- NEW: Handlers for filter controls ---
    const handleFilterDayRangeChange = (event) => {
        setFilterDayRange(event.target.value);
        setFilterDate(null); // Reset specific date when a range is chosen
    };

    const handleFilterDateChange = (newDate) => {
        setFilterDate(newDate);
        setFilterDayRange('all'); // Reset day range when a specific date is chosen
    };
    
    const handleClearFilters = () => {
        setFilterDate(null);
        setFilterDayRange('all');
    }

    const handleNewRegister = () => navigate("/register");
    const handleCheckBalance = () => navigate("/check-balance");
    const handleBack = () => navigate("/home");
    
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    // --- Helper function to format transaction text ---
    const formatTransactionPrimary = (t) => {
        if (t.product_name) {
            return `Purchase: ${t.product_name} (x${t.quantity})`;
        }
        return `Account Top-Up`;
    };

    return (
        <div className="scanning-page-scan">
            {/* ... Your existing Header, RFID Card, and Buttons ... */}
            <Header />
            <div className="scanning-content-scan">
                <div className="rfid-section-scan">
                    <Typography variant="h4" className="topup-prompt-scan">
                        Tap Your Card to Top-Up
                    </Typography>
                    
                    <Card className="rfid-card-scan" elevation={10}>
                        {isLoading && (
                            <div className="loading-overlay-scan">
                                <CircularProgress color="inherit" />
                            </div>
                        )}
                        <div className="rfid-card-content-scan">
                            <div className="scan-circle-scan">
                                <ContactlessIcon className="contactless-icon-scan" />
                                <div className="orbit-animation-scan">
                                    <div className="orbit-ring-scan ring-1-scan"></div>
                                    <div className="orbit-ring-scan ring-2-scan"></div>
                                    <div className="orbit-ring-scan ring-3-scan"></div>
                                </div>
                            </div>
                            <Typography 
                                variant="h5" 
                                component="h2" 
                                className="rfid-text-scan"
                            >
                                {/* Scan Your RFID Card */}
                                Authenticate to proceed
                            </Typography>
                            <div className="status-text-scan">Awaiting Scan...</div>
                        </div>
                    </Card>

                    <Button
                        variant="contained"
                        size="large"
                        className="new-register-btn-scan"
                        onClick={handleNewRegister}
                    >
                        <span className="btn-text-scan">New Register</span>
                        <div className="btn-glow-scan"></div>
                    </Button>

                    <Button
                        variant="contained"
                        size="large"
                        className="check-balance-btn-scan"
                        onClick={handleCheckBalance}
                    >
                        <span className="btn-text-btn-scan">Check balance</span>
                        <div className="btn-glow-btn-scan"></div>
                    </Button>
                </div>
            </div>

            <Button
                variant="contained"
                className="back-btn-scan"
                onClick={handleBack}
            >
                Back
            </Button>


            {/* --- MODIFIED: Dialog now includes transaction history --- */}
            {userDetails && (
                <Dialog open={openDialog} onClose={handleCloseDialog} PaperProps={{className: 'details-dialog-scan'}} maxWidth="md" fullWidth>
                    <DialogTitle className="dialog-title-scan">Confirm Your Details</DialogTitle>
                    <DialogContent>
                        {/* User Details Section */}
                        <div className="details-container-scan">
                            <div className="detail-row-scan">
                                <Typography className="detail-label-scan">Name:</Typography>
                                <Typography className="detail-value-scan">{userDetails.Name}</Typography>
                            </div>
                            <div className="detail-row-scan">
                                <Typography className="detail-label-scan">User Number:</Typography>
                                <Typography className="detail-value-scan">{userDetails.User_No}</Typography>
                            </div>
                        </div>

                        <Divider sx={{ my: 2 }} />

                        {/* --- NEW: Transaction History Section --- */}
                        <Box className="history-section-scan">
                            <Typography variant="h6" gutterBottom>Transaction History</Typography>
                            
                            {/* Filter Controls */}
                            <Box className="filter-controls-scan">
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>Date Range</InputLabel>
                                    <Select
                                        value={filterDayRange}
                                        label="Date Range"
                                        onChange={handleFilterDayRangeChange}
                                    >
                                        <MenuItem value="all">All Time</MenuItem>
                                        <MenuItem value="today">Today</MenuItem>
                                        <MenuItem value="7days">Last 7 Days</MenuItem>
                                        <MenuItem value="30days">Last 30 Days</MenuItem>
                                    </Select>
                                </FormControl>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Specific Date"
                                        value={filterDate}
                                        onChange={handleFilterDateChange}
                                        slotProps={{ textField: { size: 'small' } }}
                                    />
                                </LocalizationProvider>
                                <Button onClick={handleClearFilters} variant="outlined" size="small">Clear</Button>
                            </Box>
                            
                            {/* Transaction List */}
                            <Box className="transaction-list-container-scan">
                                {filteredTransactions.length > 0 ? (
                                    <List dense>
                                        {filteredTransactions.map(t => (
                                            <ListItem key={t.transaction_id} divider className="transaction-item-scan">
                                                <ListItemText
                                                    primary={formatTransactionPrimary(t)}
                                                    secondary={`Date: ${dayjs(t.transaction_date).format('DD/MM/YYYY hh:mm A')}`}
                                                />
                                                <Box className="transaction-details-right-scan">
                                                    <Typography 
                                                        variant="h6"
                                                        className={`transaction-amount-scan ${t.amount > 0 ? 'topup' : 'purchase'}`}
                                                    >
                                                        {t.amount > 0 ? `+₹${t.amount.toFixed(2)}` : `-₹${Math.abs(t.amount).toFixed(2)}`}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Balance: ₹{t.balance_after.toFixed(2)}
                                                    </Typography>
                                                </Box>
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography sx={{ mt: 2, textAlign: 'center' }}>No transactions found for the selected period.</Typography>
                                )}
                            </Box>
                        </Box>
                        
                        <DialogContentText className="dialog-confirm-text-scan">
                            Please confirm your details before proceeding to top-up.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog} className="dialog-btn-cancel-scan">Cancel</Button>
                        <Button onClick={handleConfirm} className="dialog-btn-confirm-scan" autoFocus>
                            RECHARGE
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
}
export default ScanningPage;