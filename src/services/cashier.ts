import api from "./auth"



export const getProductByBartcode = async (payload: { 
    barcode: string; 
    latitude: number; 
    longitude: number; 
  }) => {
    try {
      const response = await api.post(
        "stores/stores/scan/",
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
  
      console.log("✅ Product details:", response.data);
      return response.data; // returns { product, store, user_location, scan_info }
    } catch (error: any) {
      console.error("❌ Couldn't get product details");
      if (error.response) {
        console.log("Response data:", error.response.data);
        console.log("Status:", error.response.status);
      }
      throw error;
    }
  };
  