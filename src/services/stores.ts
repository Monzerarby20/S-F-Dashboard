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

export const getAllStores = async () => {
    try{
        const response = await api.get(`stores/stores`);
        console.log("Stores fetched:", response.data);
        return response.data.results;
    }catch(error){
        console.error("Error fetching stores:", error);
        throw error;
    }
}

export const getStoreById = async (storeId: string) => {
    try{
        const response = await api.get(`stores/stores/${storeId}`);
        console.log(`Store ${storeId} fetched:`, response.data);
        return response.data;
    }catch(error){
        console.error(`Error fetching store ${storeId}:`, error);
        throw error;
    }
}