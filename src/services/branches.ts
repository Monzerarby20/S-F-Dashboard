import api from "./auth";

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
// /api/stores/branches/by-id/{id}/
export const getBranchById = async(branchId:number) =>{
    try{
        const response = await api.get(`stores/branches/by-id/${branchId}`);
        console.log("Fetched Branch ",response)
        return response.data
    }catch(error){
        console.error("Error fetching branch",error)
        throw error
    }
}