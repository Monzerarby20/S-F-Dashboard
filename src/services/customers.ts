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

export const deleteCustomer = async(customerId: Number) =>{
    try{
        const response = await api.delete(`auth/customers/${customerId}/`);
        console.log("delete customer data",response.data)
        return response.data
    }catch(error){
        console.log("faild to delete customer data", error);
        throw error;    
    }
}

// update customer_type and preferred_payment_method
export const updateCustomer = async(customerId: Number, data: object) =>{
    try{
        const response = await api.put(`auth/customers/${customerId}/`, data);
        console.log("update customer data",response.data)
        return response.data
    }catch(error){
        console.log("faild to update customer data", error);
        throw error;    
    }
} 

// create customer
export const createCustomer = async(data: object) =>{
    try{
        const response = await api.post(`auth/customers/`, data);
        console.log("create customer data",response.data)
        return response.data
    }catch(error){
        console.log("faild to create customer data", error);
        throw error;    
    }
}