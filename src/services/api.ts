let mookTocken: string | null = null;
let mockData: Record<string, any>[] = [
  { uid: 1, name: "Client A" },
  { uid: 2, name: "Client B" },
];

export function setMockToken(token: string | null) {
  mookTocken = token;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (mookTocken) {
    headers["Authorization"] = `Bearer ${mookTocken}`;
    console.log("Adding mock token to request headers");
  }
  return headers;
}

export async function apiRequests(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  console.log("Fake apiRequest called");
  await new Promise((resolve) => setTimeout(resolve, 500));

  const headers = await getAuthHeaders();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  console.log("API Request URL:", fullUrl);
  console.log("API Base URL from env:", import.meta.env.VITE_API_BASE_URL);
  if (!headers["Authorization"]) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (method === "GET" && url === "/clients") {
    return new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ message: "Not Found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}






export function getQueryFnc<T>({ on401 }: { on401: "returnNull" | "throw" }) {
  return async ({ queryKey }: { queryKey: any }) => {
    const url = queryKey[0] as string;
    const res = await apiRequests("GET", url);
    if (on401 === "returnNull" && res.status === 401) {
      return null as T;
    }
    return (await res.json()) as T;
  };
}
