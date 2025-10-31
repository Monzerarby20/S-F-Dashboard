import api from "./auth";
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

export const getStoreBySlug = async (storeSlug: string) => {
    try{
        const response = await api.get(`stores/stores/${storeSlug}`);
        console.log(`Store ${storeSlug} fetched:`, response.data);
        return response.data;
    }catch(error){
        console.error(`Error fetching store ${storeSlug}:`, error);
        throw error;
    }
}


export const createNewStore = async (data : object) =>{
    try {
        const response = await api.post('stores/stores/',data)
        console.log("Create Store Successfully",response)
        return response.data;
    }catch(error){
        console.log("Error Adding New Store",error)
        throw error
    }
}

export const updateStoreinfo = async (data : object,storeSlug:string) => {
    try{
        const response = await api.patch(`stores/stores/${storeSlug}/`,data)
        console.log("Store Updated Successfully",response)
        return response.data

    }catch(error){
        console.log("Error Updating Store",error)
        throw error
    }
}