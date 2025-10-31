import api from "./auth";


export const getAllDepartments = async (storeId: number ) => {
    try{
        const response = await api.get(`/catalog/categories/?store_id=${storeId}`);
        console.log("Departments fetched:", response.data.results);
        return response.data.results;
    }catch(error){
        console.error("Error fetching departments:", error);
        throw error;
    }
}

export const updateDepartment = async(categorySlug: string,data:any) => {
    try {
        
        const response = await api.put(`/catalog/categories/${categorySlug}/`, {
            ...data
        });
        console.log("Department updated:", response.data);
        return response.data;
    }catch(error){
        console.error("Error updating department:", error);
        throw error;
    }
}

export const createDepartment = async(data:any) => {
    try {
        const response = await api.post(`/catalog/categories/`, {
            ...data
        });
        console.log("Department created:", response.data);
        return response.data;
    }catch(error){
        console.error("Error creating department:", error);
        throw error;
    }
}

