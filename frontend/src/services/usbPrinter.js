import baseUrl from "../api/axios";

const usbPrinter={

 getprint:async()=>{
    try{
    const response = await baseUrl.get("/print-bill")
    return response.data
    }
    catch(error)
    {
        console.error("failed to get print")
        throw error
    }
 }

}

export default usbPrinter;