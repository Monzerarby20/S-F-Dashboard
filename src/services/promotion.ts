import api from "./auth"; 



export const getAllPromotions = async () => {
    try{
        const response = await api.get(`pricing/promotions/`);
        console.log("Promotions fetched:", response.data);
        console.log(response)
        return response.data;
    }catch(error){
        console.error("Error fetching promotions:", error);
        throw error;
    }
}

export  const createPromotion = async (data:object) => {
    try{
        const response = await api.post(`pricing/promotions/`,data);
        console.log("Promotion created Successfully",response.data);
        return response.data;
    }catch(error){
        console.log("Faild to create promotions",error)
        throw error;
    }
    
}