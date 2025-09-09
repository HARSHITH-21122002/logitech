import baseUrl from "../api/axios";

const refundApi={
    refundstatus:async(order_number)=>{
        try{
            const response = await baseUrl.get(`/paymentdetail/status/${order_number}`)
            return response.data
        }
        catch(error){
            console.error("unable to fetch payment details")
            throw error
        }
        
    },

    registerpaymentstatus:async(payload)=>{

        try{
            const response = await baseUrl.post("/paymentdetail/register",payload)
            return response.data
        }
        catch(error){
            console.error("unable to generate payments status")
            throw error
        }
    },
     updatePaymentStatus: async (transactionId, payload) => {
        try {
            // The backend endpoint should be something like '/paymentdetail/update/:transactionId'
            const response = await baseUrl.put(`/paymentdetail/update/${transactionId}`, payload);
            return response.data;
        } catch (error) {
            console.error("Unable to update payment status for transaction:", transactionId, error);
            throw error;
        }
    }
}

export default refundApi