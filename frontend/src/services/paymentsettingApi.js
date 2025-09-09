import baseUrl from "../api/axios";

const paymentsettingApi={
    getpaymenttype:async(machine_guid)=>{
        try{ 
            const response = await baseUrl.get(`/payment/type/${machine_guid}`)
            return response.data
        }
        catch(error)
        {
            console.error("Failed to get payment type ")
            throw(error)
        }
    }
}

export default paymentsettingApi