import baseUrl from "../api/axios";

const qrgeneratorApi = {
    // Generate QR code for payment
    // No change needed here, your existing code is fine
    generateQr: async (paymentData) => {
        try {
            const PgSettingId = localStorage.getItem("PgSettingId");

      // merge PgSettingId into payload
          const payload = {
        ...paymentData,
           PgSettingId,  // ✅ required by backend
      };
            const response = await baseUrl.post("/create-qr", payload);
            return response.data;
        } catch (error) {
            console.error("QR Generation Error:", error.response?.data || error.message);
            // Return error response from backend to show in UI
            return error.response?.data || { success: false, message: "Network error occurred." };
        }
    },

   
checkPaymentStatus: async (order_number) => {
  try {
    const machine_id = localStorage.getItem("machine_id");
    const PgSettingId = localStorage.getItem("PgSettingId");

    const response = await baseUrl.get(`/status/${order_number}`, {
      params: { machine_id, PgSettingId },
    });

    return response.data;
  } catch (error) {
    console.error("Payment Status Check Error:", error.response?.data || error.message);
    return error.response?.data || { success: false, message: "Network error occurred." };
  }
},

    getrefund:async(payload)=>{
        try{
            const response=await baseUrl.post("/refund",payload)
            return response.data
        }
        catch(error){
            console.error("Refund failed")
            throw error
        }
    },
    callback:async(payload)=>{
        try{
            const response = await baseUrl.post("/gateway/phonepe",payload)
            return response.data
        }
        catch(error)
        {
            console.error("phonepe call Back Failed")
            throw error
        }
    }
};

export default qrgeneratorApi;
