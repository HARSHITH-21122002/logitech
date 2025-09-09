class ThermalPrinterService {
  constructor() {
    this.device = null;
    this.configuration = null;
    this.interfaceNumber = null;
    this.endpointNumber = null;
  }

  async connectUSB() {
    try {
      // Request TVS-E RP 3230 printer with specific vendor ID
      const filters = [
        { vendorId: 0x1B1C }, // TVS Electronics vendor ID
      ];

      console.log('Requesting USB device with filters:', filters);
      this.device = await navigator.usb.requestDevice({ filters });
      if (!this.device) {
        throw new Error('No TVS-E RP 3230 printer selected');
      }
      console.log('Device selected:', this.device.productName, this.device.vendorId);

      // Open the device
      console.log('Attempting to open device...');
      await this.device.open();
      if (!this.device.opened) {
        throw new Error('Failed to open TVS-E RP 3230 printer');
      }
      console.log('Device opened successfully');

      // Select configuration
      this.configuration = this.device.configurations[0];
      if (!this.configuration) {
        throw new Error('No configuration found for TVS-E RP 3230');
      }
      console.log('Selecting configuration:', this.configuration.configurationValue);
      await this.device.selectConfiguration(this.configuration.configurationValue);

      // Claim interface
      this.interfaceNumber = this.configuration.interfaces[0].interfaceNumber;
      console.log('Claiming interface:', this.interfaceNumber);
      await this.device.claimInterface(this.interfaceNumber);

      // Find output endpoint
      const endpoints = this.configuration.interfaces[0].alternate.endpoints;
      const outEndpoint = endpoints.find(ep => ep.direction === 'out');
      if (!outEndpoint) {
        throw new Error('No output endpoint found for TVS-E RP 3230');
      }
      this.endpointNumber = outEndpoint.endpointNumber;
      console.log('Output endpoint found:', this.endpointNumber);

      return true;
    } catch (error) {
      console.error('Failed to connect to TVS-E RP 3230 printer:', error);
      // Handle port-specific errors
      if (String(error).includes('Port_#')) {
        throw 'USB connection error: Port issue (Port_#0005.Hub_#0001). Try a different USB port or check Device Manager.';
      }
      throw error.message || String(error) || 'Failed to connect to TVS-E RP 3230 printer';
    }
  }

  async print(data) {
    try {
      if (!this.device || !this.device.opened) {
        throw new Error('TVS-E RP 3230 printer not connected');
      }

      // Encode data for printing (ESC/POS commands)
      const encoder = new TextEncoder();
      const printData = encoder.encode(data);

      await this.device.transferOut(this.endpointNumber, printData);
      console.log('Print data sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to print:', error);
      throw error.message || String(error) || 'Failed to print';
    }
  }

  async testPrint() {
    try {
      // ESC/POS test print for TVS-E RP 3230
      const testData = '\x1B\x40\x1B\x21\x00TVS-E RP 3230 Test Print\nThank you!\n\x1D\x56\x00';
      return await this.print(testData);
    } catch (error) {
      console.error('Test print failed:', error);
      throw error.message || String(error) || 'Test print failed';
    }
  }

  async disconnect() {
    try {
      if (this.device && this.device.opened) {
        await this.device.releaseInterface(this.interfaceNumber);
        await this.device.close();
        this.device = null;
        this.configuration = null;
        this.interfaceNumber = null;
        this.endpointNumber = null;
        console.log('Printer disconnected successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to disconnect:', error);
      throw error.message || String(error) || 'Failed to disconnect';
    }
  }
}

export default new ThermalPrinterService();