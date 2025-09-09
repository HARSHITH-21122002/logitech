import baseUrl from "../api/axios";

const productApi={
    getproduct:async()=>{
        try{
          const response=await baseUrl.get("/products")
          return response.data
        }
        catch(error)
        {
            console.error("product Loaded Failed",error)
            throw error
        }
    },

    fullproductdetails:async()=>{
        try{
            const response = await baseUrl.get("/products/detail")
            return response.data
        }
        catch(error)
        {
            console.error("product details failed")
            throw error
        }
    },
    getFilteredProductDetails :async (id)=>{
    try{
     const response = await baseUrl.get(`/products?Vendor_id=${id}`)
     return response.data;
    }
    catch(error){
    console.log(error)
    throw error
    }
},
}

export default productApi