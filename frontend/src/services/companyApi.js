import baseUrl from "../api/axios";

const companyApi = {
  getCompanyName: async () => {
    try {
      const response = await baseUrl.get("/company/details");
      console.log("Company API response:", response.data);
      
      if (response.data.success && response.data.data.length > 0) {
        return response.data.data[0]; // ✅ Only return first company
      } else {
        throw new Error("No company data found");
      }
    } catch (error) {    
      console.error("Error fetching company name:", error);
      throw error;
    }
  },

  getcompanyIds:async (company_id) =>{
    try{
      const response = await baseUrl.get(`/get/company/${company_id}`)
      return response.data
    }

    catch(error)
    {
      console.error("failed to get Id")
      throw error
    }
  }
};
export default companyApi