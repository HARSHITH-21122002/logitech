import baseUrl from "../api/axios";

const merchantApi={
    getmerchant:async()=>{
        try{
            const response = await baseUrl.get("/merchant")
            return response.data
        }
        catch(error){
            console.error("Failed to get merchant")
            throw error
        }
    }
}

export default merchantApi