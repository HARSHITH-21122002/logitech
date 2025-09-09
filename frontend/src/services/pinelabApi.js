import baseUrl from "../api/axios";

const pinelabApi={
    startPayment:async(payload)=>{
        try{
            const response = await baseUrl.post("/payment/start",payload)
            return response.data
        }
        catch(error)
        {
            console.error("Failed to initiate payment")
            throw error
        }
    },

    getPaymentStatus:async(refId) => {
        try{
          const response = await baseUrl.post(`/payment/status/${refId}`)
          return response.data
        }
        catch(error)
        {
            console.error("failed to get rfid")
            throw error
        }

    },

    cancelpayment:async(payload)=>{
        try
        {
            const response = await baseUrl.post("/payment/cancel",payload)
            return response.data
        }
        catch(error)
        {
            console.error("Faile to cancel the payment")
            throw error
        }

    },

    initiaterefund:async(payload)=>{
           try{
            const response = await baseUrl.post("/payment/refund",payload)
            return response.data
           }
           catch(error)
           {
            console.error("Failed to initiate refund")
            throw error
           }
    }
}

export default pinelabApi