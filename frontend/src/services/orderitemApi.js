import baseUrl from "../api/axios";

const orderitemApi={
    orderupdate:async(payload)=>{
        try{
        const response= await baseUrl.post("/orderitem",payload)
        return response.data
        }
        catch(error){
            console.error("Order Id generated failed")
            return response.data
        }
    }
}

export default orderitemApi