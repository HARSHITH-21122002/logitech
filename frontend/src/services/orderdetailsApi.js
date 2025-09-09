import baseUrl from "../api/axios";

const orderdetailsApi={
    registerorder:async(payload)=>{
        try{
            const response = await baseUrl.post("/order/create",payload)
            return response.data
        }
        catch(error){
            console.error("QR creation Failed")
            throw error
        }
        
    }
}

export default orderdetailsApi