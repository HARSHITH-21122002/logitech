import baseUrl from "../api/axios";

const categoryApi = {
    getcategory: async (vendorId) => {
        try {
            const config = {};
            if (vendorId) {
                config.params = {
                    Vendor_id: vendorId
                };
            }
            
            // We pass the config object to the get request
            const response = await baseUrl.get("/categories", config);
            return response.data;
        } catch (error) {
            console.error("Failed to get categories:", error);
            throw(error);
        }
    },

    getFilteredCategory:async(company_id)=>{
        try{
            const response = await baseUrl.get(`/get/category?company_id=${company_id}`)
            return response.data
        }
        catch(error)
        {
            console.error("failed to filtered categories")
            throw error
        }
    }
};

export default categoryApi;