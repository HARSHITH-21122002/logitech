import baseUrl from "../api/axios";

const stockrefillApi={

     onRefilling:async(payload)=>{
        try{
            const response = await baseUrl.post("/refillregister",payload)
            return response.data
        }
        catch(error){
            console.error("Refill Failed")
            throw error
        }
     },

     getRefilling:async()=>{
        try{
            const response = await baseUrl.get("/refills")
            return response.data
        }
        catch(error){
            console.error("get refill data failed")
            throw error

        }
     },

     updateRefilling:async(filterid)=>{
        try{
            const response = await baseUrl.put(`/refills/update/${filterid}`)
            return response.data
        }
        catch(error){
            console.error("Update refilling failed")
            throw error
        }
     }

}

export default stockrefillApi