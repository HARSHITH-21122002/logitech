import baseUrl from "../api/axios"

const modbusApi={
    //object
    checkModbus:async()=>{
        try{
               const response=await baseUrl.get("/check/modbus")
               return response.data
        }
        catch(error){
               console.log("Modbus check failed",error)
               throw error;
        }
    },
    
    checkinternet:async()=>{
          try {
      const response = await baseUrl.get("/check/internet"); // Assuming this is the correct endpoint
      return response.data;
              } 
        catch (error) {
          console.error("Internet check failed:", error);
          throw error;
         }
    },

    checksensor:async()=>{
        try{
            const response=await baseUrl.get("/check/sensor")
            return response.data
        }
        catch(error){
            console.log("sensor check failed",error)
            throw error;
        }
    }
    
}

export default modbusApi