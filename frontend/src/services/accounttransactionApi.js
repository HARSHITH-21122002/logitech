import baseUrl from "../api/axios";

const accounttransactionApi = {
  // Create new transaction
  createtransaction: async (payload) => {
    try {
      const response = await baseUrl.post("/transactions", payload);
      return response.data;
    } catch (error) {
      console.error("Create transaction failed", error);
      throw error;
    }
  },

  updateaccounttransaction:async(order_id,payload)=>
  {
    try{
      const response = await baseUrl.put(`/transactions/update-by-order/${order_id}`,payload)
      return response.data
    }
    catch(error)
    {
      console.error("Failed to update the paymentststaus")
      throw error
    }
  }, 

  // Get all transactions (if implemented)
  getAllTransactions: async () => {
    try {
      const response = await baseUrl.get("/transactions");
      return response.data;
    } catch (error) {
      console.error("Get all transactions failed", error);
      throw error;
    }
  },

  // Get by RFID
  getTransactionsByRFID: async (rfid) => {
    try {
      const response = await baseUrl.get(`/transactions/rfid/${rfid}`);
      return response.data;
    } catch (error) {
      console.error("Get transactions by RFID failed", error);
      throw error;
    }
  },

  // Get by Transaction ID
  getTransactionById: async (transactionId) => {
    try {
      const response = await baseUrl.get(`/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error("Get transaction by ID failed", error);
      throw error;
    }
  }
};

export default accounttransactionApi;
