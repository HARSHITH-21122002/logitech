// src/pages/PrinterSetupPage/PrinterSetupPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, CircularProgress, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import UsbIcon from '@mui/icons-material/Usb';
// import { sendTestDataToPrinter } from "../../services/usbPrinter"; 
import Header from '../../components/UI/Header/Header';
import './PrinterSetupPage.css';

const PRINTER_STORAGE_KEY = 'kiosk_printer_details';

export default function PrinterSetupPage() {
    const navigate = useNavigate();
    const [device, setDevice] = useState(null);
    const [status, setStatus] = useState('Disconnected');
    const [error, setError] = useState('');
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        const autoConnect = async () => {
            if (!('usb' in navigator)) {
                setStatus('Error');
                setError('WebUSB is not supported in this browser.');
                return;
            }
            const permittedDevices = await navigator.usb.getDevices();
            if (permittedDevices.length > 0) {
                const savedDetails = JSON.parse(localStorage.getItem(PRINTER_STORAGE_KEY));
                if (savedDetails) {
                    const savedDevice = permittedDevices.find(
                        d => d.vendorId === savedDetails.vendorId && d.productId === savedDetails.productId
                    );
                    if (savedDevice) {
                        setDevice(savedDevice);
                        setStatus('Connected');
                    }
                }
            }
        };
        autoConnect();
    }, []);

    const handleConnect = async () => {
        setStatus('Connecting');
        setError('');
        try {
            const usbDevice = await navigator.usb.requestDevice({ filters: [] });
            setDevice(usbDevice);
            setStatus('Connected');
            
            const printerDetails = {
                vendorId: usbDevice.vendorId,
                productId: usbDevice.productId,
                productName: usbDevice.productName,
            };
            
            localStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(printerDetails));

            console.log('SUCCESSFULLY SAVED TO LOCALSTORAGE:', printerDetails);
            alert(`SUCCESS: Printer '${printerDetails.productName}' is now configured and saved.`);

        } catch (err) {
            setStatus('Error');
            setError('Connection failed. You must select a device from the popup.');
            console.error("Connection Error:", err);
        }
    };
    
    const handleDisconnect = () => {
        localStorage.removeItem(PRINTER_STORAGE_KEY);
        setDevice(null);
        setStatus('Disconnected');
        setError('');
        alert('Printer configuration has been cleared.');
    };

    const handleTestPrint = async () => {
        if (!device) {
            setError('No printer connected to test.');
            return;
        }
        setIsTesting(true);
        setError('');
        try {
            await sendTestDataToPrinter(device);
        } catch (err) {
            setStatus('Error');
            setError(`Test print failed: ${err.message}`);
        } finally {
            setIsTesting(false);
        }
    };

    const getStatusInfo = () => {
        const savedDetails = JSON.parse(localStorage.getItem(PRINTER_STORAGE_KEY));
        switch (status) {
            case 'Connected':
                return {
                    icon: <CheckCircleIcon />,
                    text: `Connected to: ${device?.productName || savedDetails?.productName}`,
                    className: 'connected'
                };
            case 'Error':
                return { icon: <ErrorOutlineIcon />, text: error, className: 'error' };
            default:
                return { icon: <UsbIcon />, text: 'No Printer Connected', className: 'disconnected' };
        }
    };
    const statusInfo = getStatusInfo();

    return (
        <div className="printer-setup-page">
            <Header />
            <main className="printer-setup-content">
                <div className="setup-card">
                    <h1>Printer Setup</h1>
                    <p>Connect and authorize a USB thermal printer for automatic receipt printing.</p>
                    <div className={`status-display ${statusInfo.className}`}>
                        {statusInfo.icon}
                        <span>{statusInfo.text}</span>
                    </div>
                    <Box className="setup-actions">
                        {!device ? (
                            <Button variant="contained" className="setup-button" onClick={handleConnect}>
                                Connect to Printer
                            </Button>
                        ) : (
                            <>
                                <Button variant="contained" color="secondary" className="setup-button" onClick={handleTestPrint} disabled={isTesting}>
                                    {isTesting ? <CircularProgress size={24} /> : 'Test Print'}
                                </Button>
                                <Button variant="outlined" color="error" className="setup-button" onClick={handleDisconnect}>
                                    Disconnect Printer
                                </Button>
                            </>
                        )}
                    </Box>
                </div>
            </main>
            <footer className="home-footer">
                <Button variant="text" onClick={() => navigate('/home')}>Back to Home</Button>
            </footer>
        </div>
    );
}