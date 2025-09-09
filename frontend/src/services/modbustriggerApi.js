import baseUrl from "../api/axios";

const modbustriggerApi = {
    coilregistercontinue: async (payload) => {
        try {
            const response = await baseUrl.post("/modbus/trigger/continue", payload);
            return response.data;
        } catch (error) {
            console.error("Failed to trigger coil register for continue", error);
            throw error;
        }
    },
    
    coilregisterfinsih: async (payload) => {
        try {
            const response = await baseUrl.post("/modbus/trigger/finish", payload);
            return response.data;
        } catch (error) {
            console.error("Failed to trigger coil register for finish", error);
            throw error;
        }
    },

    triggerhome:async()=>{
        try{
            const response = await baseUrl.get("/modbus/trigger/home")
            return response.data
        }
        catch(error)
        {
            console.error("Failed to trigger the value",error)
            throw error
        }
    }
};

export default modbustriggerApi;