// import axios from "axios";

// // Base URL from environment variable (e.g. http://127.0.0.1:8000/api/)
// const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// // Create a preconfigured axios instance
// const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: false,
// });

// // 🔐 Automatically attach token to every request
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );
import { Thermometer } from "lucide-react";
import api from "./auth";

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
  is_active_display?: boolean;
}
 let BASE_URL = import.meta.env.VITE_API_BASE_URL;
 console.log(BASE_URL) 
// ✅ Fetch all users

export const getAllUsers = async (): Promise<User[]> => {
  try {
    let allUsers: User[] = [];
    let nextUrl: string | null = `${BASE_URL}auth/users/`;

    while (nextUrl) {
      // 🔒 تأكد إن اللينك HTTPS مش HTTP
      if (nextUrl.startsWith("http://")) {
        nextUrl = nextUrl.replace("http://", "https://");
      }

      // 🧠 لو مش URL كامل، ضيف الـ BASE_URL
      const response: any = await api.get(
        nextUrl.startsWith("http") ? nextUrl : `${BASE_URL}${nextUrl}`
      );

      const data = response.data;

      if (data.results) {
        allUsers = [...allUsers, ...data.results];
        nextUrl = data.next || null;
      } else {
        allUsers = data;
        nextUrl = null;
      }
    }

    console.log(`✅ Fetched ${allUsers.length} users in total`);
    return allUsers;
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

export const getUserByid = async (userId:number) =>{
  try{
    const response = await api.get(`auth/users/${userId}`);
    console.log("current user data",response.data)
    return response.data
  }catch(error){
    console.log("faild to get usre",error);
    throw error;
  }
}
export const updateUserData = async (userId: number, data: object) => {
  try {
    console.log("📤 Payload Sent:", data);
    const response = await api.patch(`auth/users/${userId}/`, data);
    console.log("✅ User Updated Successfully", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to update user:", error.response?.data || error);
    throw error;
  }
};
export const changePassword = async (oldPassword: string, newPassword: string, confirmNewPassword: string) => {
  try {
    const response = await api.post("auth/reset/password/", {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    });
    console.log("✅ Password changed successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to change password:", error.response?.data || error);
    throw error;
  }
};