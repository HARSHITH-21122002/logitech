// // This service is now aware of the AppType and generates the appropriate receipt.

// const padRight = (str, length) => str.toString().padEnd(length, ' ');
// const padLeft = (str, length) => str.toString().padStart(length, ' ');
// const padCenter = (str, length) => {
//     const s = str.toString();
//     const spaces = Math.max(0, length - s.length);
//     const padLeft = Math.floor(spaces / 2);
//     return ' '.repeat(padLeft) + s + ' '.repeat(spaces - padLeft);
// };
// const separator = (char = '-', length = 48) => char.repeat(length) + '\n';

// export const printOrderSummaryReceipt = (orderData) => {
//     // Destructure AppType along with other data
//     const {
//         AppType, // 'VM' or 'KIOSK'
//         companyDetails,
//         orderNumber,
//         transactionId,
//         vendingLog,
//         totalPrice,
//         refundAmount,
//         finalAmountPaid,
//         vendedSubtotal,
//     } = orderData;

//     let receipt = '--- RECEIPT START ---\n';

//     // --- Common Header ---
//     receipt += padCenter(companyDetails?.company_name || "SMART VENDING", 48) + '\n';
//     receipt += padCenter(companyDetails?.company_Address || "Location", 48) + '\n';
//     receipt += padCenter(`Contact: ${companyDetails?.company_phone || "N/A"}`, 48) + '\n';
//     receipt += separator('=');
//     const now = new Date();
//     receipt += `${padRight('Order No:', 16)}${orderNumber}\n`;
//     receipt += `${padRight('Transaction ID:', 16)}${transactionId || "N/A"}\n`;
//     receipt += `${padRight('Date:', 16)}${now.toLocaleDateString("en-IN")}\n`;
//     receipt += `${padRight('Time:', 16)}${now.toLocaleTimeString("en-IN")}\n`;
//     receipt += separator();

//     // --- Conditional Logic for Receipt Body ---
//     if (AppType === 'KIOSK') {
//         // --- KIOSK RECEIPT LOGIC (Simple & Clean) ---
//         receipt += padCenter('[ BILL ]', 48) + '\n';
//         receipt += `${padRight('ITEM', 24)} ${padLeft('QTY', 5)} ${padLeft('RATE', 7)} ${padLeft('AMOUNT', 9)}\n`;
//         // For a kiosk, we assume the original requested quantity was fulfilled.
//         vendingLog.forEach(item => {
//             const originalQty = item.quantityVended + item.quantityFailed; // Recreate original quantity
//             const amount = item.price * originalQty;
//             receipt += `${padRight(item.productName.substring(0, 23), 24)} ${padLeft(originalQty, 5)} ${padLeft(item.price.toFixed(2), 7)} ${padLeft(amount.toFixed(2), 9)}\n`;
//         });
//         receipt += separator();
//         // Kiosk financial summary is based on totalPrice
//         receipt += `${padRight('Subtotal:', 36)} ${padLeft(`₹${totalPrice.toFixed(2)}`, 11)}\n`;
//         receipt += `${padRight('GST:', 36)} ${padLeft(`₹${(0).toFixed(2)}`, 11)}\n`;
//         receipt += separator();
//         receipt += `${padRight('TOTAL AMOUNT:', 36)} ${padLeft(`₹${totalPrice.toFixed(2)}`, 11)}\n`;
        
//     } else {
//         // --- VM RECEIPT LOGIC (Detailed Vending Log) ---
//         const vendedItems = vendingLog.filter(p => p.quantityVended > 0);
//         if (vendedItems.length > 0) {
//             receipt += padCenter('[ VENDED ITEMS ]', 48) + '\n';
//             receipt += `${padRight('ITEM', 24)} ${padLeft('QTY', 5)} ${padLeft('RATE', 7)} ${padLeft('AMOUNT', 9)}\n`;
//             vendedItems.forEach(item => {
//                 const amount = item.price * item.quantityVended;
//                 receipt += `${padRight(item.productName.substring(0, 23), 24)} ${padLeft(item.quantityVended, 5)} ${padLeft(item.price.toFixed(2), 7)} ${padLeft(amount.toFixed(2), 9)}\n`;
//             });
//             receipt += separator();
//         }

//         const failedItems = vendingLog.filter(p => p.quantityFailed > 0);
//         if (failedItems.length > 0) {
//             receipt += padCenter('[ FAILED / REFUNDED ITEMS ]', 48) + '\n';
//             receipt += `${padRight('ITEM', 38)} ${padLeft('QTY FAILED', 10)}\n`;
//             failedItems.forEach(item => {
//                 receipt += `${padRight(item.productName.substring(0, 37), 38)} ${padLeft(item.quantityFailed, 10)}\n`;
//             });
//             receipt += separator();
//         }

//         // VM financial summary is detailed
//         receipt += `${padRight('Original Cart Total:', 36)} ${padLeft(`₹${totalPrice.toFixed(2)}`, 11)}\n`;
//         if (refundAmount > 0) {
//             receipt += `${padRight('Refund Processed:', 36)} ${padLeft(`- ₹${refundAmount.toFixed(2)}`, 11)}\n`;
//         }
//         receipt += `${padRight('Subtotal (Paid):', 36)} ${padLeft(`₹${vendedSubtotal.toFixed(2)}`, 11)}\n`;
//         receipt += `${padRight('GST:', 36)} ${padLeft(`₹${(0).toFixed(2)}`, 11)}\n`;
//         receipt += separator();
//         receipt += `${padRight('FINAL AMOUNT PAID:', 36)} ${padLeft(`₹${finalAmountPaid.toFixed(2)}`, 11)}\n`;
//     }

//     // --- Common Footer ---
//     receipt += separator('=');
//     const totalItemsVended = vendingLog.reduce((sum, item) => sum + item.quantityVended, 0);
//     if (AppType === 'VM' && totalItemsVended > 0) {
//         receipt += padCenter('Please collect your items below.', 48) + '\n';
//     }
//     receipt += padCenter('Thank you! Visit us again!', 48) + '\n';
//     receipt += `GST No: ${companyDetails?.GSTNumber || "N/A"}\n`;
//     receipt += '\n\n\n'; // Space before cut
//     receipt += '--- RECEIPT END ---\n';

//     console.log("--- PRINTING RECEIPT ---");
//     console.log(receipt);
//     alert("Receipt generated. Check console (F12) for output.");
// };

import baseUrl from "../api/axios";

const printingService = {
  generateBill: async (billData) => {
    try {
      const response = await baseUrl.post("/print/bill", billData);
      return response.data;
    } catch (error) {
      console.error(`Failed to print ${billData.bill_type} bill:`, error);
      throw error;
    }
  }
};

export default printingService;