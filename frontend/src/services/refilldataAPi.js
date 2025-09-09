import baseUrl from "../api/axios";

const refilldataApi={
    initializestock:async(payload)=>{
        try{
            const response = await baseUrl.post("/stock/required",payload)
            return response.data
        }
        catch(error)
        {
            console.error("Faile initialize stock required")
            throw error
        }
    },

    getrequiredstock:async(machine_guid)=>{
        try{
            const response = await baseUrl.get(`/stock/required/${machine_guid}`)
            return response.data
        }
        catch(error)
        {
            console.error("Failed to get required details")
            throw error
        }

    }
}

export default refilldataApi