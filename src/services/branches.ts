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

export const createNewBranch = async(storeSlug:string,data:object) =>{
    try{
        console.log("📤 Sending to backend:", JSON.stringify(data, null, 2));

        const response = await api.post(`stores/stores/${storeSlug}/branches/`,data);
        console.log("Create branch successfully",response)
        return response.data;
    }catch(error){
        console.log("problem with adding branch",error);
        throw error;
    }
}

export const updateBranch = async(storeSlug:string,branchSlug:string,data:object) => {
    try{
        const response = await api.put(`stores/stores/${storeSlug}/branches/${branchSlug}/`,data)
        console.log("Updated branch data successfully",response);
        return response.data
    }catch(error){
        console.error("could't update data branch",error);
        throw error;
    }
}

export const deleteBranch = async(storeSlug:string,branchSlug:string) =>{
    try{
        const response = await api.delete(`stores/stores/${storeSlug}/branches/${branchSlug}/`)

        console.log("Deleted branch Successfully",response.data)
        return response.data
    }catch(error){
        console.error("Faild to delete branch",error)
        throw error;
    }
}