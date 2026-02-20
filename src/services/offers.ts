//offers service
import api from "./auth";

export const getAllOffers = async () => {
    try {
        const response = await api.get(`/pricing/promotions/`);
        console.log("Offers fetched:", response.data);
        return response.data.results;
    } catch (error) {
        console.error("Error fetching offers:", error);
        throw error;
    }
}
export const createFlashSale = async (data: any) => {
    try {
        const response = await api.post(`/pricing/promotions/`, data, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        console.log("Flash sale created:", response.data);
        console.log("Flash sale created:", data);

        return response.data;
    } catch (error) {
        console.error("Error creating flash sale:", error);
        throw error;
    }
}

export const updateFlashSale = async (id: string, data: any) => {
    try {
        const response = await api.put(`/pricing/promotions/${id}/`, data);
        console.log("Flash sale updated:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error updating flash sale:", error);
        throw error;
    }
}
export const updateFlashSaleStatus = async (id: string, data: any) => {
    try {
        const response = await api.patch(`/pricing/promotions/${id}/`, data);
        console.log("Flash sale status updated:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error updating flash sale status:", error);
        throw error;
    }
}
export const deleteFlashSale = async (id: string) => {
    try {
        const response = await api.delete(`/pricing/promotions/${id}/`);
        console.log("Flash sale deleted:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error deleting flash sale:", error);
        throw error;
    }
}
export const getFlashSaleById = async (id: string) => {
    try {
        const response = await api.get(`/pricing/promotions/${id}/details/`);
        console.log("Flash sale fetched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching flash sale:", error);
        throw error;
    }
}


export const getFlashSalesByType = async (params: any) => {
    try {
        const response = await api.get(`/pricing/promotions/`, { params });
        console.log("Flash sales fetched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching flash sales:", error);
        throw error;
    }
};

export const searchPromotions = async ({ q, page }: { q: string; page: number }) => {
    const res = await api.get(`/pricing/promotions/`, {
        params: { search: q, page }
    });
    return res.data;
};