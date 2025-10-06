// Centralized API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Log the API base URL for debugging
console.log('🌐 API Base URL:', API_BASE_URL);

// Enhanced fetch wrapper with better error handling
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`🚀 API Request: ${options.method || 'GET'} ${url}`);
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
  };

  // Get mock token from localStorage or auth state
  const mockToken = localStorage.getItem('mock-token');
  if (mockToken) {
    defaultHeaders['Authorization'] = `Bearer ${mockToken}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    console.log(`📡 API Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ API Success:`, data);
    return data;
  } catch (error) {
    console.error(`💥 API Request Failed:`, error);
    throw error;
  }
};

export default apiRequest;