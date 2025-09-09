import baseUrl from "../api/axios";

const machineidApi={
    getmachinedetails:async()=>{
       try{
        const response = await baseUrl.get("/machines")
        return response.data
       }
       catch(error){
        console.error("get machine detailed error")
        throw error
       }
    },

    getspecificname:async(machine_guid)=>{
        try{
              const response=await baseUrl.get(`/machine/detail/${machine_guid}`)
              return response.data
        }     

        catch(error)
        {
            console.error("Failed to get details")
            throw error
        }
    },
    regstatus:async(payload)=>{
        try{
             const response = await baseUrl.post('/machine/status',payload)
             return response.data
        }
        catch(error)
        {
          console.error("Failed to fetch status")
          throw error
        }
    }
}


export default machineidApi