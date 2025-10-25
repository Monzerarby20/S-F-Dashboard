import axios from "axios";


const BASE_URL = import.meta.env.VITE_API_BASE_URL

const api = axios.create({
    baseURL: BASE_URL,
});
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});


export const getProductByBartcode = async (barcode) => {
    try{
        const response = await api.post(`stores/stores/scan/`,barcode)
        console.log("Product details : ",response)
        return response.data
    }catch(error){
        console.error("could't get product details",error)
        throw error;
    }
}