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

export const refreshToken = async () => {
    try{
        const refresh = localStorage.getItem('refresh-token');
        if(!refresh) throw new Error("No refresh token available");
        const response = await api.post('auth/token/refresh/', { refresh });
        const { access } = response.data;
        localStorage.setItem('token', access);
        return access;
    }catch(error){
        console.error("Error refreshing token:", error);
        throw error;
    }
}

api.interceptors.response.use((response) => response, async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
            const newAccessToken = await refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
        }catch (err) {  
            console.error("Refresh token failed:", err);
            await signOut();
        }
    }
    return Promise.reject(error);
});

export interface user {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: string;
  permissions?: string[];
  branchId?: number | null;
}

let currentUser: user | null = null;
let userId: number | null = null;
let userSlug: string| null = null;
let userRole: string| null = null ;


export const signInWithEmailAndPassword = async (email:string,password:string) =>{
    try{
        const response = await api.post(`auth/token/`, { email, password });

        const {access,refresh} = response.data;
        localStorage.setItem('token', access);
        localStorage.setItem('refresh-token', refresh);
        console.log(response.data);
        userId = response.data.user_id;
        userSlug = response.data.store_slug;
        userRole = response.data.role
        localStorage.setItem('userId', userId.toString());
        localStorage.setItem('userSlug', userSlug.toString());
        localStorage.setItem('userRole',userRole.toString())

        await getUserData(access);
        return response.data;
    }catch(error){
        console.error("Error during sign-in:", error);
        throw new Error("فشل في تسجيل الدخول. يرجى التحقق من بياناتك.");
    }
}

export const getUserData = async (token:string) =>{
    try{
        const userId = localStorage.getItem('userId');
        console.log(userId);

        const response = await api.get(`auth/users/${userId}`);
        console.log("Fetched user data:", response.data);
        currentUser = response.data;
        console.log("Current user set to:", currentUser);
        return response.data;
    }catch(error){
        console.error("Error fetching user data:", error);
        throw new Error("فشل في جلب بيانات المستخدم.");
    }
}

export const fetchAuthUser = async () : Promise<user | null> => {
    const token = localStorage.getItem('token');
    if(!token) return null;
    const res = await getUserData(token);
    return res;
}

export const signOut = async () =>{
    localStorage.removeItem('token');
    localStorage.removeItem('refresh-token');
    localStorage.removeItem('userId');
    localStorage.removeItem('refresh');
    localStorage.removeItem('access');
    currentUser = null;
    userId = null;
    localStorage.removeItem('user');
    return Promise.resolve();
}

