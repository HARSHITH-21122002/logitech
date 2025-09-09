import baseUrl from "../api/axios";

const videoApi={
       getVideo:async()=>{
        try{
             const response=await baseUrl.get("/videos/get")
             return response.data
        }
        catch(error){
             console.error("Video Loaded Failed", error)
             throw error
        }
       }
       
}

export default videoApi