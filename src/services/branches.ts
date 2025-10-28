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


export const getStoreBranches = async(storeSlug:any) =>{
    try{
        const response = await api.get(`stores/stores/${storeSlug}/branches`);
        console.log("Fetched Branches ",response)
        return response.data.results
    }catch(error){
        console.error("Error fetching branches",error)
        throw error
    }
}

export const createNewBranch = async(stoerSlug:string,data:object) =>{
    try{
        const response = await api.post(`stores/stores/${stoerSlug}/branches/`,data);
        console.log("Create branch successfully",response)
        return response.data;
    }catch(error){
        console.log("problem with adding branch",error);
        throw error;
    }
}