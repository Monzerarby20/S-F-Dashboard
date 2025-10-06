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

export const getAllPromotions = async () => {
    try{
        const response = await api.get(`/pricing/promotions/`);
        console.log("Promotions fetched:", response.data);
        console.log(response)
        return response.data.results;
    }catch(error){
        console.error("Error fetching promotions:", error);
        throw error;
    }
}