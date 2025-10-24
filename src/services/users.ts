import axios from "axios";

// Base URL from environment variable (e.g. http://127.0.0.1:8000/api/)
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create a preconfigured axios instance
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
});

// 🔐 Automatically attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Define TypeScript types
export interface User {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_display: string;
  store_name?: string;
  branch_display?: string;
  job_title_display?: string;
  avg_experience_rating?: {
    average: number;
    count: number;
  } | null;
}

// ✅ Fetch all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get("auth/users/");
    console.log("✅ Fetched users:", response.data.results);
    return response.data.results;
  } catch (error: any) {
    console.error("❌ Error fetching users:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Delete a specific user
export const deleteUser = async (userId: string): Promise<number> => {
  try {
    const response = await api.delete(`auth/users/${userId}/`);
    console.log("🗑️ Status after delete:", response.status);
    return response.status;
  } catch (error: any) {
    console.error("❌ Error deleting user:", error.response?.status, error.response?.data);
    throw error;
  }
};
