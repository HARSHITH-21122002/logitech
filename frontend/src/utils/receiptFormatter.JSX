export const formatReceiptData = (billData, companyDetails) => {
  const {
    totalPrice,
    vendingLog = [],
    refundAmount = 0,
    orderNumber,
    transactionId
  } = billData;

  const currentDate = new Date();
  
  // Calculate totals
  const vendedItems = vendingLog.filter(item => item.quantityVended > 0);
  const failedItems = vendingLog.filter(item => item.quantityFailed > 0);
  
  const vendedSubtotal = vendingLog.reduce((total, item) => 
    total + (item.price * item.quantityVended), 0
  );
  
  const tax = Math.round(vendedSubtotal * 0); // 0% tax as per original code
  const finalAmountPaid = vendedSubtotal + tax;
  const totalItemsVended = vendingLog.reduce((sum, item) => sum + item.quantityVended, 0);

  return {
    // Store information
    storeName: companyDetails?.company_name || "SMART VENDING MACHINE",
    storeAddress: companyDetails?.company_Address || "Location: Main Building Lobby",
    storeContact: companyDetails?.company_phone || "Contact: +91 98765 43210",
    gstNumber: companyDetails?.GSTNumber || "",

    // Transaction details
    date: currentDate.toLocaleDateString("en-IN"),
    time: currentDate.toLocaleTimeString("en-IN"),
    orderNumber: orderNumber || "N/A",
    transactionId: transactionId || "N/A",

    // Items
    vendedItems: vendedItems.map(item => ({
      name: item.productName,
      quantity: item.quantityVended,
      price: item.price,
      total: item.price * item.quantityVended
    })),
    
    failedItems: failedItems.map(item => ({
      name: item.productName,
      quantityFailed: item.quantityFailed
    })),

    // Financial totals
    originalTotal: totalPrice,
    refundAmount: refundAmount,
    subtotal: vendedSubtotal,
    tax: tax,
    finalAmount: finalAmountPaid,
    
    // Metadata
    totalItemsVended: totalItemsVended
  };
};

export const createPrintableReceipt = (receiptData) => {
  const lines = [];
  const width = 48;
  
  const addLine = (text = '', alignment = 'left') => {
    if (alignment === 'center') {
      const padding = Math.max(0, Math.floor((width - text.length) / 2));
      lines.push(' '.repeat(padding) + text);
    } else if (alignment === 'right') {
      const padding = Math.max(0, width - text.length);
      lines.push(' '.repeat(padding) + text);
    } else {
      lines.push(text);
    }
  };

  const addJustifiedLine = (left, right) => {
    const totalLength = left.length + right.length;
    if (totalLength >= width) {
      lines.push(left.substring(0, width - right.length - 1) + ' ' + right);
    } else {
      const spacesNeeded = width - totalLength;
      lines.push(left + ' '.repeat(spacesNeeded) + right);
    }
  };

  const addSeparator = (char = '-') => {
    lines.push(char.repeat(width));
  };

  // Header
  addLine(receiptData.storeName, 'center');
  addLine(receiptData.storeAddress, 'center');
  addLine(receiptData.storeContact, 'center');
  addLine();
  addSeparator('=');
  
  // Transaction details
  addJustifiedLine('Date:', receiptData.date);
  addJustifiedLine('Time:', receiptData.time);
  addJustifiedLine('Order No:', receiptData.orderNumber);
  addJustifiedLine('Transaction ID:', receiptData.transactionId);
  addSeparator();

  // Vended items
  if (receiptData.vendedItems.length > 0) {
    addLine('✓ VENDED ITEMS');
    addLine('ITEM                QTY  RATE   AMOUNT');
    addSeparator();
    
    receiptData.vendedItems.forEach(item => {
      const itemName = item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name;
      const qty = item.quantity.toString().padStart(3);
      const rate = `₹${item.price.toFixed(2)}`.padStart(6);
      const amount = `₹${item.total.toFixed(2)}`.padStart(7);
      addLine(`${itemName.padEnd(20)}${qty} ${rate} ${amount}`);
    });
    addSeparator();
  }

  // Failed items
  if (receiptData.failedItems.length > 0) {
    addLine('✗ FAILED/REFUNDED ITEMS');
    addLine('ITEM                    QTY FAILED');
    addSeparator();
    
    receiptData.failedItems.forEach(item => {
      const itemName = item.name.length > 24 ? item.name.substring(0, 21) + '...' : item.name;
      const qty = item.quantityFailed.toString();
      addJustifiedLine(itemName, qty);
    });
    addSeparator();
  }

  // Totals
  addJustifiedLine('Original Cart Total:', `₹${receiptData.originalTotal.toFixed(2)}`);
  
  if (receiptData.refundAmount > 0) {
    addJustifiedLine('Refund Processed:', `- ₹${receiptData.refundAmount.toFixed(2)}`);
  }
  
  addSeparator();
  addJustifiedLine('Subtotal (Paid):', `₹${receiptData.subtotal.toFixed(2)}`);
  addJustifiedLine('GST:', `₹${receiptData.tax.toFixed(2)}`);
  addSeparator('=');
  addJustifiedLine('FINAL AMOUNT PAID:', `₹${receiptData.finalAmount.toFixed(2)}`);
  addSeparator('=');

  // Footer
  addLine();
  if (receiptData.totalItemsVended > 0) {
    addLine('Please collect your items below.', 'center');
  }
  addLine('Thank you! Visit us again!', 'center');
  addLine();
  
  if (receiptData.gstNumber) {
    addLine(`GST No: ${receiptData.gstNumber}`, 'center');
  }

  return lines.join('\n');
};