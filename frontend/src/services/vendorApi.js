import baseUrl from "../api/axios";

const vendorApi={
    getvendor:async(vendor_id)=>{
        try{
            const response = await baseUrl.get(`/vendors/${vendor_id}`)
            return response.data
        }
        catch(error)
        {
            console.error("failed to get the details")
            throw error
        }
    }
}

export default vendorApi;