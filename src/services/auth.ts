import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
});

// 🟢 Attach access token to every request
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

// 🟡 Refresh token logic
export const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem("refresh-token");
      if (!refresh) throw new Error("No refresh token available");
  
      const response = await api.post("auth/token/refresh/", { refresh });
      const { access, refresh: newRefresh } = response.data;
  
      localStorage.setItem("token", access);
  
      // ✅ Save new refresh token if rotation is enabled
      if (newRefresh) {
        localStorage.setItem("refresh-token", newRefresh);
      }
  
      return access;
    } catch (error: any) {
      console.error("Error refreshing token:", error.response?.data || error);
      throw error;
    }
  };
  

// 🔴 Intercept responses to handle token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If access token expired → try refresh once
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest); // retry request
      } catch (refreshError: any) {
        console.error("Refresh token failed:", refreshError);

        // Refresh token also expired → logout and redirect
        if (refreshError.response?.status === 401) {
          await signOut();
          window.location.href = "/login"; // Force redirect to login
        }
      }
    }

    return Promise.reject(error);
  }
);

// 🧍‍♂️ User interface
export interface user {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: string;
  permissions?: string[];
  branchId?: number | null;
}

// 🧠 Globals
let currentUser: user | null = null;
let userId: number | null = null;
let userSlug: string | null = null;
let userRole: string | null = null;

// 🟢 Sign in and store tokens
export const signInWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const response = await api.post(`auth/token/`, { email, password });
    const { access, refresh } = response.data;

    localStorage.setItem("token", access);
    localStorage.setItem("refresh-token", refresh);

    userId = response.data.user_id;
    userSlug = response.data.store_slug;
    userRole = response.data.role;

    localStorage.setItem("userId", userId.toString());
    localStorage.setItem("userSlug", userSlug);
    localStorage.setItem("userRole", userRole);

    await getUserData(access);
    return response.data;
  } catch (error) {
    console.error("Error during sign-in:", error);
    throw new Error("فشل في تسجيل الدخول. يرجى التحقق من بياناتك.");
  }
};

// 🧾 Fetch user data
export const getUserData = async (token: string) => {
  try {
    const userId = localStorage.getItem("userId");
    const response = await api.get(`auth/users/${userId}`);
    currentUser = response.data;
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw new Error("فشل في جلب بيانات المستخدم.");
  }
};

// 🟦 Get current authenticated user
export const fetchAuthUser = async (): Promise<user | null> => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const res = await getUserData(token);
  return res;
};

// 🔴 Sign out and clear storage
export const signOut = async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh-token");
  localStorage.removeItem("userId");
  localStorage.removeItem("refresh");
  localStorage.removeItem("access");
  localStorage.removeItem("userSlug");
  localStorage.removeItem("userRole");
  localStorage.removeItem("user");

  currentUser = null;
  userId = null;
  userSlug = null;
  userRole = null;

  return Promise.resolve();
};

export default api;
