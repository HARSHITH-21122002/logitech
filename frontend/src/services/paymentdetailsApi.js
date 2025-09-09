import baseUrl from "../api/axios";

const paymentdetailsApi={
    paymentdetails:async(payload)=>{
        try{
        const response = await baseUrl.post("/paymentdetail/register",payload)
        return response.data
        }
        catch(error){
            console.error("get payment details error")
            throw error
        }
    },
    checkpaymentstatus:async(order_number)=>{
        try{
            const response = await baseUrl.get(`/paymentdetail/status/${order_number}`)
            return response.data
        }
        catch(error){
            console.error("get payment status error:",error)
            throw error
        }

     },

     updatepaymenntstatus:async(transaction_Id,payload)=>{
             try{
                const response = await baseUrl.put(`/payment/refundstatus/${transaction_Id}`,payload)
                return response.data
             }
             catch(error)
             {
                console.error("payment updation Failed")
                throw error
             }
     },


}

    

export default paymentdetailsApi