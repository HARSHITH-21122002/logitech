import baseUrl from "../api/axios";

const operatorloginApi={
      loginOperator:async(payload)=>{
        try{
            const response=await baseUrl.post("/operator/login",payload)
            return response.data
        }
        catch(error){
             console(error)
             throw error
        }
      }
}

export default operatorloginApi
