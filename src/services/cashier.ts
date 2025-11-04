import api from "./auth"



export const getProductByBartcode = async (barcode:string) => {
    try{
        const response = await api.post(`stores/stores/scan/`,barcode)
        console.log("Product details : ",response)
        return response.data
    }catch(error){
        console.error("could't get product details",error)
        throw error;
    }
}


