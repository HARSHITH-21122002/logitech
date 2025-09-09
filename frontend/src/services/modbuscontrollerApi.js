import baseUrl from "../api/axios";

const modbuscontrollerApi={
    startmotor:async(motor_id)=>{
            try{
            const response=await baseUrl.post(`/start/motor/${motor_id}`)
            return response.data
            }
            catch(error){
                console.error("motor Rotate failed")
                throw error
            }
    },

    getmodbusstatus:async()=>{
            try{
                const response = await baseUrl.get("/modbus/status")
                return response.data
            }
            catch(error){
                 console.error("Modbus status failed")
                 throw error
            }
    },

    checkmodbus:async()=>{
        try{
            const response = await baseUrl.post("/check/modbus/connection")
            return response.data
        }
        catch(error){
            console.error("modbus connection Failed")
            throw error
        }
    }
}

export default modbuscontrollerApi