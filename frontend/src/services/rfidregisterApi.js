import baseUrl from "../api/axios";

const rfidregisterApi={

    newregister:async(payload)=>{
        try{
            const response = await baseUrl.post("/account/register",payload)
            return response.data
        }
        catch(error){

            console.error("register failed")
            throw error
        }
    },

    getregister:async(rfid)=>{
        try{
            const response = await baseUrl.get(`/account/details/${rfid}`)
            return response.data
        }
        catch(error)
        {
            console.error("Failed to get details")
            throw error
        }
    },
    updateaccount:async(rfid,payload)=>{
        try{
              const response = await baseUrl.put(`/account/update/RFID/${rfid}`, payload);
              return response.data
        }
        catch(error)
        {
            console.error("Failed to get update")
            throw error
        }
    },

    deleteaccount:async(rfid)=>{

        try{
            const response = await baseUrl.delete(`delete/account/${rfid}`)
            return response.data
        }
        catch(error)
        {
            console.error("Failed to delete account")
            throw error
        }
    },
    


    


}

export default rfidregisterApi