import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
});

// ========== Request Interceptor ==========
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

// ========== Refresh Token Function ==========
export const refreshToken = async () => {
  try {
    const refresh = localStorage.getItem("refresh-token");
    if (!refresh) throw new Error("No refresh token available");

    const response = await axios.post(`${BASE_URL}auth/token/refresh/`, { refresh });
    const { access } = response.data;
    localStorage.setItem("token", access);

    return access;
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
};

// ========== Response Interceptor ==========
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // لو الـ token انتهى (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // لو في refresh جاري، استنى لحد ما يخلص
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // أول طلب يحاول يجدد التوكن
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshToken();
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        console.error("Refresh token failed:", err);
        await signOut();
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ========== Auth Logic ==========
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

export const signInWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const response = await api.post(`auth/token/`, { email, password });

    const { access, refresh, user_id, store_slug, role } = response.data;
    localStorage.setItem("token", access);
    localStorage.setItem("refresh-token", refresh);
    localStorage.setItem("userId", user_id.toString());
    localStorage.setItem("userSlug", store_slug);
    localStorage.setItem("userRole", role);

    await getUserData(access);
    return response.data;
  } catch (error) {
    console.error("Error during sign-in:", error);
    throw new Error("فشل في تسجيل الدخول. يرجى التحقق من بياناتك.");
  }
};

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

export const fetchAuthUser = async (): Promise<user | null> => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  return await getUserData(token);
};

export const signOut = async () => {
  [
    "token",
    "refresh-token",
    "userId",
    "userSlug",
    "userRole",
    "user",
  ].forEach((key) => localStorage.removeItem(key));

  currentUser = null;
  userId = null;

  return Promise.resolve();
};

export default api;
