import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiRequests, getQueryFnc } from "../services/api";
import { getCurrentUser, getIdToken } from "../services/mockAuth";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export {apiRequests};


export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFnc({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const user = getCurrentUser();
    if (user) {
      const token = await getIdToken();
      headers["Authorization"] = `Bearer ${token}`;
      console.log("Adding mock token to request headers");
    }
  } catch (error) {
    console.warn("Failed to get mock token:", error);
  }

  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers = await getAuthHeaders();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  console.log(API_BASE_URL)
  console.log(url)
  console.log('🚀 API Request URL:', fullUrl);
  console.log('🔗 API Base URL from env:', import.meta.env.VITE_APP_API_BASE_URL);
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers = await getAuthHeaders();
    
    const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || '/api';
    const url = (queryKey[0] as string).startsWith('http') ? queryKey[0] as string : `${API_BASE_URL}${queryKey[0]}`;
    console.log('🌐 Query API URL:', url);
    
    const res = await fetch(url, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// export const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       queryFn: getQueryFn({ on401: "throw" }),
//       refetchInterval: false,
//       refetchOnWindowFocus: false,
//       staleTime: Infinity,
//       retry: false,
//     },
//     mutations: {
//       retry: false,
//     },
//   },
// });
