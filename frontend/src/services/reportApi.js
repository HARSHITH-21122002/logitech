import baseUrl from "../api/axios";


const reportApi = {
  
     storereport:async(payload)=>{
      try{
        const response = await baseUrl.post("/storereport",payload)
        return response.data
      }
      catch(error)
      {
        console.error("Failed to store data")
        throw error
      }
     },

     

     updatereport:async(orderNumber,payload)=>{
        try{
          const response = await baseUrl.put(`/update-refund/${orderNumber}`,payload)
          return response.data
        }
        catch(error)
        {
          console.error("Failed to update report")
          throw error
        }
     }

};

export default reportApi;
