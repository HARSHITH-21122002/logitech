import baseUrl from "../api/axios";

const refillApi={

    stockupdate:async(payload)=>{
        try{
               const response= await baseUrl.post("/stockregister",payload)
               return response.data
        }
        catch(error){
              console.error("Failed to update")
              throw error
        }
    },

    getStockByMachine:async(machine_id)=>{
        const machineId = localStorage.getItem("machine_id");
        const response =  await baseUrl.get(`/stock/machine/${machine_id}`)
        return response.data
    },

    getstocks:async()=>{
           try{
            const response=await baseUrl.get("/stockdetails")
            return response.data
           }
           catch(error){
            console.error("get details error")
            throw(error)
           }
    },

    updatestocks:async(machine_guid,payload)=>{
            try{
                const response= await baseUrl.put(`/stock/guid/${machine_guid}`,payload)
                return response.data
            }
            catch(error){
                console.error("update failed")
                throw error
            }
    },
   decrementStockAfterVend: async (vendingLog, machineId) => {
        try {
            // Filter for only the items that were successfully vended.
            const successfulVends = vendingLog
                .filter(item => item.quantityVended > 0)
                .map(item => ({
                    motor_id: item.motorId,
                    quantity_vended: item.quantityVended,
                }));

            // If nothing was vended, no need to call the API.
            if (successfulVends.length === 0) {
                return { success: true, message: "No items vended to update." };
            }

            const payload = {
                vendedItems: successfulVends,
                machine_id: machineId
            };
            
            // Call the new backend endpoint.
            const response = await baseUrl.post("/stock/vend-decrement", payload);
            return response.data;

        } catch (error) {
            // This is a background task, so we log the error but don't want to crash the UI.
            console.error("CRITICAL: Failed to update stock in database after vending.", error);
            // Re-throw so the calling function in VendingPage knows it failed.
            throw error;
        }
    },

    clearstock:async(payload)=>{
        try{
            const response = await baseUrl.post("/stock/clear",payload)
            return response.data
        }
        catch(error)
        {
            console.error("failed to clear stock")
            throw error
        }
    },

      decrementStockAfterKioskVend: async (machineId, vendedItems) => {
        try {
            // Early exit if no items were vended or input is invalid.
            if (!machineId || !Array.isArray(vendedItems) || vendedItems.length === 0) {
                console.log("No items to update or missing machine ID. Skipping API call.");
                return { success: true, message: "No items vended to update." };
            }
            
            // The payload must match the backend's expected keys: 'machine_id' and 'vendedItems'.
            const payload = {
                machine_id: machineId,
                vendedItems: vendedItems
            };

            // Call the backend endpoint specified in your Flask route.
            const response = await baseUrl.post("/stock/kiosk-decrement", payload);
            
            console.log("Kiosk stock successfully updated:", response.data);
            return response.data;

        } catch (error) {
            // Log the error for debugging purposes. This is a critical background task.
            console.error("CRITICAL: Failed to update kiosk stock in database after vending.", error.response?.data || error.message);
            // Re-throw the error so the calling function (e.g., in a UI component) knows it failed and can react.
            throw error;
        }
    },
        deleteStockByMotor: async (machine_id, motor_number) => {
        try {
            const response = await baseUrl.delete(
            `/stock/machine/${machine_id}/motor/${motor_number}`
            );
            return response.data;
        } catch (error) {
            console.error(`Failed to delete stock for motor ${motor_number}:`, error);
            throw error; // let caller handle it
        }
        },




}

export default refillApi 