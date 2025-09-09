import baseUrl from "../api/axios";

const spiralApi={
    spiralsetting:async()=>{
        try{
            const response =await baseUrl.post("/motors/initialize")
            return response.data
        }
        catch(error)
        {
            console.error("Failed to initialize the motor")
            throw error
        }
    },

    getspirals:async()=>{
        try{
            const response = await baseUrl.get("/motors/enabled")
            return response.data
        }
        catch(error)
        {
            console.error("Failed to get spirals")
            throw(error)
        }
    },

     updatespiral: async (position, isEnabled) => {
    try {
      const payload = { is_enabled: isEnabled };
      console.log(`Sending PUT to /motors/test/${position} with payload:`, payload); // <-- Add this for debugging
      const response = await baseUrl.put(`/motors/test/${position}`, payload);
      return response.data;
    } catch (error) {
      // --- THIS IS THE MOST IMPORTANT CHANGE ---
      // Log the detailed error response from the server
      if (error.response) {
        console.error(`Updation Failed for motor ${position}. Status: ${error.response.status}`, error.response.data);
      } else {
        console.error(`Updation Failed for motor ${position}:`, error.message);
      }
      throw error;
    }
  },

}

export default spiralApi