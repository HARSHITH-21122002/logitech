import React from 'react';
import { Printer, Usb, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useThermalPrinter } from '../useThermalPrinter.jsx';
import './ThermalPrinterConnection.css';

const ThermalPrinterConnection = ({ onPrintSuccess, receiptData, autoConnect = false }) => {
  const {
    isConnected,
    isConnecting,
    isPrinting,
    error,
    connectPrinter,
    printReceipt,
    testPrint,
    disconnectPrinter,
  } = useThermalPrinter();

  const [showError, setShowError] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showConnectPrompt, setShowConnectPrompt] = React.useState(autoConnect && !isConnected && !isConnecting);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    if (error) {
      setShowError(true);
      // Ensure error is a string
      const errorString = error instanceof Error ? error.message : String(error || '');
      // Customize error messages
      if (errorString.includes('Access denied')) {
        setErrorMessage(
          'Cannot connect to the TVS-E RP 3230 printer: Access denied. Please ensure the printer is not in use by another application, check if drivers are installed, and try again.'
        );
      } else if (errorString.includes('No printer') || errorString.includes('No device')) {
        setErrorMessage(
          'No TVS-E RP 3230 printer detected. Please ensure the printer is powered on, connected via USB, and not in an error state (e.g., red light).'
        );
      } else if (errorString.includes('Port_#')) {
        setErrorMessage(
          'USB connection error for TVS-E RP 3230 (Port issue). Please try a different USB port, ensure the printer is powered on, and check for driver conflicts in Device Manager.'
        );
      } else {
        setErrorMessage(errorString || 'An error occurred while connecting to the TVS-E RP 3230 printer.');
      }
      setTimeout(() => setShowError(false), 10000); // Extended timeout for detailed message
    }
  }, [error]);

  React.useEffect(() => {
    setShowConnectPrompt(autoConnect && !isConnected && !isConnecting);
  }, [autoConnect, isConnected, isConnecting]);

  const handleConnect = async () => {
    const success = await connectPrinter();
    if (success) {
      setShowSuccess(true);
      setShowConnectPrompt(false);
    }
  };

  const handlePrint = async () => {
    if (!receiptData) {
      console.error('No receipt data provided');
      return;
    }

    const success = await printReceipt(receiptData);
    if (success) {
      setShowSuccess(true);
      onPrintSuccess && onPrintSuccess();
    }
  };

  const handleTestPrint = async () => {
    const success = await testPrint();
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleDismissPrompt = () => {
    setShowConnectPrompt(false);
  };

  return (
    <div className="thermal-printer-connection">
      <div className="printer-status">
        {isConnected ? (
          <div className="status-connected">
            <CheckCircle className="status-icon success" />
            <span>Printer Connected</span>
          </div>
        ) : (
          <div className="status-disconnected">
            <AlertCircle className="status-icon error" />
            <span>Printer Not Connected</span>
          </div>
        )}
      </div>

      <div className="printer-controls">
        {!isConnected ? (
          <button
            className="connect-button"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? <Loader2 className="button-icon spinning" /> : <Usb className="button-icon" />}
            {isConnecting ? 'Connecting...' : 'Connect Printer'}
          </button>
        ) : (
          <div className="connected-controls">
            <button
              className="print-button"
              onClick={handlePrint}
              disabled={isPrinting || !receiptData}
            >
              {isPrinting ? <Loader2 className="button-icon spinning" /> : <Printer className="button-icon" />}
              {isPrinting ? 'Printing...' : 'Print Receipt'}
            </button>
            
            <button
              className="test-button"
              onClick={handleTestPrint}
              disabled={isPrinting}
            >
              Test Print
            </button>
            
            <button
              className="disconnect-button"
              onClick={disconnectPrinter}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {showError && (
        <div className="alert error">
          <AlertCircle className="alert-icon" />
          {errorMessage}
        </div>
      )}

      {showSuccess && (
        <div className="alert success">
          <CheckCircle className="alert-icon" />
          Operation completed successfully!
        </div>
      )}

      {showConnectPrompt && (
        <div className="connect-prompt">
          <div className="prompt-content">
            <Usb className="prompt-icon" />
            <p>Please connect your TVS-E RP 3230 printer to proceed.</p>
            <div className="prompt-buttons">
              <button
                className="connect-button prompt-button"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? <Loader2 className="button-icon spinning" /> : <Usb className="button-icon" />}
                {isConnecting ? 'Connecting...' : 'Connect Now'}
              </button>
              <button
                className="dismiss-button prompt-button"
                onClick={handleDismissPrompt}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThermalPrinterConnection;