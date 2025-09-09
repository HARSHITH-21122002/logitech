import baseUrl from "../api/axios";

const clearstockApi={
    initializeclearstocks:async(payload)=>{
        try{
            const response = await baseUrl.post("/clear/stock",payload)
            return response.data
        }
        catch(error)
        {
            console.error("Failed to initialize the clearstocks")
            throw error
        }
    },

    getclearstocks:async(machine_guid)=>
    {
        try{
            const response = await baseUrl.get(`/clear/stock/${machine_guid}`)
            return response.data
        }
        catch(error)
        {
            console.error("Failed to get clear stock data")
            throw error
        }
    }
}

export default clearstockApi