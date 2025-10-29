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


export const getAllCustomers = async() =>{
    try{
        const response = await api.get(`auth/customers/`)
        console.log("fetch customers data",response.data)
        return response.data.results
    }catch(error){
        console.log("faild to get customers data", error);
        throw error;
    }
}