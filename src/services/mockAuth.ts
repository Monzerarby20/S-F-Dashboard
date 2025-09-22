// Mock Authentication Service - Replaces Firebase Auth
export interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: string;
  permissions?: string[];
  branchId?: number | null;
}
export interface Customer {
    id: number;
    name: string;
    phone: string;
    email?: string;
    loyaltyPoints: number;
    storeCredit: number;
    totalOrders: number;
    totalSpent: number;
    isGuest: boolean;
    createdAt: string;
  }

// mock customers data
const allCustomers = [
    {
        id:1,
        name:"customer1",
        phone:"12345",
        email:"customer@gmail.com",
        loyaltyPoints: 10,
        storeCredit: 5,
        totalOrders: 3,
        totalSpent: 1000,
        isGuest: false,
        createdAt: "10/9/2025"
    },
    {
        id:2,
        name:"customer2",
        phone:"12345",
        email:"customer2@gmail.com",
        loyaltyPoints: 10,
        storeCredit: 5,
        totalOrders: 3,
        totalSpent: 1000,
        isGuest: false,
        createdAt: "10/9/2025"
    },
    {
        id:3,
        name:"customer3",
        phone:"13345",
        email:"customer3@gmail.com",
        loyaltyPoints: 10,
        storeCredit: 5,
        totalOrders: 3,
        totalSpent: 1000,
        isGuest: false,
        createdAt: "10/9/2025"
    }
]

// Mock user data
const mockUsers = [
  {
    uid: "admin-001",
    email: "admin@mys-f.com",
    displayName: "مدير النظام",
    role: "admin",
    permissions: ["all"],
    branchId: 1
  },
  {
    uid: "cashier-001", 
    email: "cashier@mys-f.com",
    displayName: "أمين الصندوق",
    role: "cashier",
    permissions: ["pos", "orders", "customers"],
    branchId: 1
  },
  {
    uid: "manager-001",
    email: "manager@mys-f.com", 
    displayName: "مدير الفرع",
    role: "manager",
    permissions: ["products", "orders", "reports", "customers"],
    branchId: 1
  }
];

let currentUser: MockUser | null = null;
let authStateListeners: ((user: MockUser | null) => void)[] = [];

// Mock authentication functions
export const signInWithEmailAndPassword = async (email: string, password: string) => {
  console.log("🔐 Mock signInWithEmailAndPassword called with:", email);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Find user by email
  const user = mockUsers.find(u => u.email === email);
  
  if (!user) {
    throw new Error("Invalid email or password");
  }
  
  // Simple password validation (in real app, this would be hashed)
  if (password !== "password123") {
    throw new Error("Invalid email or password");
  }
  
  currentUser = user;
  
  // Store token in localStorage
  const token = await getIdToken();
  localStorage.setItem('mock-token', token);
  
  // Notify all listeners
  authStateListeners.forEach(listener => listener(currentUser));
  
  return { user };
};

export const createUserWithEmailAndPassword = async (email: string, password: string) => {
  console.log("👤 Mock createUserWithEmailAndPassword called with:", email);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if user already exists
  const existingUser = mockUsers.find(u => u.email === email);
  if (existingUser) {
    throw new Error("User already exists");
  }
  
  // Create new user
  const newUser: MockUser = {
    uid: `user-${Date.now()}`,
    email,
    displayName: email.split('@')[0],
    role: 'user',
    permissions: ['basic'],
    branchId: 1
  };
  
  mockUsers.push(newUser);
  currentUser = newUser;
  
  // Store token in localStorage
  const token = await getIdToken();
  localStorage.setItem('mock-token', token);
  
  // Notify all listeners
  authStateListeners.forEach(listener => listener(currentUser));
  
  return { user: newUser };
};

export const signOut = async () => {
  console.log("🚪 Mock signOut called");
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  currentUser = null;
  
  // Clear token from localStorage
  localStorage.removeItem('mock-token');
  
  // Notify all listeners
  authStateListeners.forEach(listener => listener(null));
  
  return true;
};

export const onAuthStateChanged = (
  _auth: any, 
  callback: (user: MockUser | null) => void
) => {
  console.log("👂 Mock onAuthStateChanged called");
  
  // Add listener
  authStateListeners.push(callback);
  
  // Immediately call with current user state
  setTimeout(() => {
    callback(currentUser);
  }, 100);
  
  // Return unsubscribe function
  return () => {
    console.log("🔇 Mock unsubscribe called");
    const index = authStateListeners.indexOf(callback);
    if (index > -1) {
      authStateListeners.splice(index, 1);
    }
  };
};

// Mock token generation
export const getIdToken = async (): Promise<string> => {
  if (!currentUser) {
    throw new Error("No authenticated user");
  }
  
  // Generate a simple mock token
  const token = btoa(JSON.stringify({
    uid: currentUser.uid,
    email: currentUser.email,
    role: currentUser.role,
    exp: Date.now() + 3600000 // 1 hour
  }));
  
  return `mock-token-${token}`;
};

// Mock auth object
export const auth = {
  currentUser,
  getIdToken: async () => {
    if (!currentUser) return null;
    return getIdToken();
  }
};

export const getAllCustomers = () =>{
    return allCustomers;
}

// Helper function to get current user
export const getCurrentUser = (): MockUser | null => currentUser;

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => currentUser !== null;
