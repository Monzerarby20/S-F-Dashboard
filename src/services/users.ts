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
export const getAllUsers= async ()=>{
    try{
        

        const response = await api.get('auth/users/');
        console.log(response)
        console.log("Fetched users:", response.data);
        return response.data.results;
    }catch(error){
        console.error("Error fetching users:", error);
        throw error;
    }
}

export const deleteUser= async (userId:string)=>{
    try{
        const response = await api.delete(`auth/users/${userId}/`);
         console.log("Status after delete:", response.status); // هيكون 204
    return response.status;
    }catch(error){
        console.error("❌ Error deleting user:", error.response?.status, error.response?.data);
    throw error;
    }
}