import api from "./auth";


export const getAllOrders= async ()=>{
    try{
        const response = await api.get('/orders/order/');
        console.log("Fetched orders:", response.data.results);
        return response.data.results;
    }catch(error){
        console.error("Error fetching orders:", error);
        throw error;
    }
}

export const getOrderById= async (id:number)=>{
    try{
        const response = await api.get(`/orders/order/${id}/`);
        console.log("Fetched order:", response.data);
        return response.data;
    }catch(error){
        console.error("Error fetching order:", error);
        throw error;
    }
}

export async function apiRequest(
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  url: string,
  data?: unknown,
) {
  try {
    const response = await api.request({
      method,
      url,
      data,
    });
    return response.data;
  } catch (error) {
    console.error("API Request error:", error);
    throw error;
  }
}

