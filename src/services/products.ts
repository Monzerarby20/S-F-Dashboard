import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL
});
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface ProductsParams {
  page?: number;
  page_size?: number;
  category?: string;
  brand?: string;
  price__gte?: string;
  price__lte?: string;
  is_featured?: string;
  search?: string;
}

interface InventoryParams {
  page?: number;
  page_size?: number;
  product?: string;
  store?: string;
  is_out_of_stock?: string;
  is_low_stock?: string;
}

export const getAllProducts = async (params?: ProductsParams) => {
  try {
    // Build query params
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.page_size)
        queryParams.append("page_size", params.page_size.toString());
      if (params.category) queryParams.append("category", params.category);
      if (params.brand) queryParams.append("brand", params.brand);
      if (params.price__gte)
        queryParams.append("price__gte", params.price__gte);
      if (params.price__lte)
        queryParams.append("price__lte", params.price__lte);
      if (params.is_featured)
        queryParams.append("is_featured", params.is_featured);
      if (params.search) queryParams.append("search", params.search);
    }

    const url = `/catalog/products/?${queryParams.toString()}`;
    console.log("Fetching products from:", url);

    const response = await api.get(url);
    console.log("Products fetched:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const getInventory = async (params?: InventoryParams) => {
  try {
    // Build query params
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.page_size)
        queryParams.append("page_size", params.page_size.toString());
      if (params.product) queryParams.append("product", params.product);
      if (params.store) queryParams.append("store", params.store);
      if (params.is_out_of_stock)
        queryParams.append("is_out_of_stock", params.is_out_of_stock);
      if (params.is_low_stock)
        queryParams.append("is_low_stock", params.is_low_stock);
    }

    const url = `/catalog/inventory/?${queryParams.toString()}`;
    console.log("Fetching inventory from:", url);

    const response = await api.get(url);
    console.log("Inventory fetched:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching inventory:", error);
    throw error;
  }
};

export const getCategories = async (store_id?: string) => {
  try {
    const queryParams = new URLSearchParams();
    if (store_id) {
      queryParams.append("store_id", store_id);
    }

    const url = `/catalog/categories/?${queryParams.toString()}`;
    console.log("Fetching categories from:", url);

    const response = await api.get(url);
    console.log("Categories fetched:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const getStores = async () => {
  try {
    const url = `/stores/stores/`;
    console.log("Fetching stores from:", url);

    const response = await api.get(url);
    console.log("Stores fetched:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching stores:", error);
    throw error;
  }
};
