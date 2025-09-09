import { useState, useCallback } from 'react';
import ThermalPrinterService from '../services/thermalPrinter';

export const useThermalPrinter = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState(null);

  const connectPrinter = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const success = await ThermalPrinterService.connectUSB();
      setIsConnected(success);
      return success;
    } catch (error) {
      setError(error.message || String(error) || 'Failed to connect to TVS-E RP 3230 printer');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const printReceipt = async (data) => {
    setIsPrinting(true);
    setError(null);
    try {
      const success = await ThermalPrinterService.print(data);
      return success;
    } catch (error) {
      setError(error.message || String(error) || 'Failed to print');
      return false;
    } finally {
      setIsPrinting(false);
    }
  };

  const testPrint = async () => {
    setIsPrinting(true);
    setError(null);
    try {
      const success = await ThermalPrinterService.testPrint();
      return success;
    } catch (error) {
      setError(error.message || String(error) || 'Test print failed');
      return false;
    } finally {
      setIsPrinting(false);
    }
  };

  const disconnectPrinter = async () => {
    try {
      const success = await ThermalPrinterService.disconnect();
      setIsConnected(!success);
      return success;
    } catch (error) {
      setError(error.message || String(error) || 'Failed to disconnect');
      return false;
    }
  };

  return {
    isConnected,
    isConnecting,
    isPrinting,
    error,
    connectPrinter,
    printReceipt,
    testPrint,
    disconnectPrinter,
  };
};