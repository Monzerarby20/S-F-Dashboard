
// Mock Data Service - Replaces Firebase Firestore


export interface mockRole {
    id: number;
    name: string;
    displayName: string;
    description: string | null;
  }
export interface MockPermission{
    id: number;
    name: string;
    displayName: string;
    description: string | null;
    module: string;
}
export interface MockProduct {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  barcode?: string;
  image?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface mockBrache{
    id: number,
    name: string,
    address: string,
    phone: string,
    email: string,
    isActive: boolean,
}

export interface MockOrder {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'digital';
  createdAt: string;
  updatedAt: string;
}

export interface mockDepartment{
  id: Number,
  name: String,
  description: String,
  branchId: Number,
  createdAt: String,
}
export interface MockCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  isActive: boolean;
  createdAt: string;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  branchId: number;
  isActive: boolean;
  createdAt: string;
}

// Mock data
export const MockRoles: mockRole[] = [
    {
        id: 1,
        name: "admin",
        displayName: "Admin",
        description: "admin role" ,
    },
    {
        id: 2,
        name: "cashier",
        displayName: "Cashier",
        description: "cashier role" ,
    },
    {
        id: 3,
        name: "user",
        displayName: "User",
        description: "User role" ,
    }

]
export const MockPermissions: MockPermission[] = [
    {
      id: 1,
      name: "store_management",
      displayName: "إدارة المتجر",
      description: "store_management",
      module: "store_management",
    },
    {
      id: 2,
      name: "branch_management",
      displayName: "إدارة الفروع",
      description: "branch_management",
      module: "branch_management",
    },
    {
      id: 3,
      name: "user_management",
      displayName: "إدارة المستخدمين",
      description: "user_management",
      module: "user_management",
    },
    {
      id: 4,
      name: "product_management",
      displayName: "إدارة المنتجات",
      description: "product_management",
      module: "product_management",
    },
    {
      id: 5,
      name: "offers_management",
      displayName: "إدارة العروض",
      description: "offers_management",
      module: "offers_management",
    },
    {
      id: 6,
      name: "pos",
      displayName: "نقطة البيع",
      description: "pos",
      module: "pos",
    },
    {
      id: 7,
      name: "analytics",
      displayName: "التقارير والتحليلات",
      description: "analytics",
      module: "analytics",
    },
    {
      id: 8,
      name: "marketing",
      displayName: "التسويق",
      description: "marketing",
      module: "marketing",
    },
    {
      id: 9,
      name: "payment",
      displayName: "المدفوعات",
      description: "payment",
      module: "payment",
    },
    {
      id: 10,
      name: "customer_service",
      displayName: "خدمة العملاء",
      description: "customer_service",
      module: "customer_service",
    },
    {
      id: 11,
      name: "data_management",
      displayName: "إدارة البيانات",
      description: "data_management",
      module: "data_management",
    },
  ];
  
export const mockProducts: MockProduct[] = [
  {
    id: "prod-001",
    name: "Laptop",
    nameAr: "لابتوب",
    price: 1500,
    cost: 1200,
    stock: 10,
    category: "Electronics",
    barcode: "1234567890123",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "prod-002", 
    name: "Smartphone",
    nameAr: "هاتف ذكي",
    price: 800,
    cost: 600,
    stock: 25,
    category: "Electronics",
    barcode: "1234567890124",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "prod-003",
    name: "Coffee Mug",
    nameAr: "كوب قهوة",
    price: 15,
    cost: 8,
    stock: 100,
    category: "Kitchen",
    barcode: "1234567890125",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  }
];
export const mockDepartments: mockDepartment[] = [
    {
        id: 1,
        name: "department1",
        description: "department Descirption",
        branchId: 1,
        createdAt: "1/9/2025",
    },    
    {
        id: 2,
        name: "department2",
        description: "department Descirption",
        branchId: 2,
        createdAt: "2/9/2025",
    },    
    {
        id: 3,
        name: "department3",
        description: "department Descirption",
        branchId: 3,
        createdAt: "3/9/2025",
    },    

]
export const mockOrders: MockOrder[] = [
  {
    id: "order-001",
    orderNumber: "ORD-2024-001",
    customerId: "cust-001",
    customerName: "أحمد محمد",
    items: [
      {
        productId: "prod-001",
        productName: "Laptop",
        quantity: 1,
        price: 1500,
        total: 1500
      }
    ],
    subtotal: 1500,
    tax: 150,
    discount: 0,
    total: 1650,
    status: "completed",
    paymentMethod: "card",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "order-002",
    orderNumber: "ORD-2024-002", 
    customerId: "cust-002",
    customerName: "فاطمة علي",
    items: [
      {
        productId: "prod-002",
        productName: "Smartphone",
        quantity: 2,
        price: 800,
        total: 1600
      },
      {
        productId: "prod-003",
        productName: "Coffee Mug",
        quantity: 3,
        price: 15,
        total: 45
      }
    ],
    subtotal: 1645,
    tax: 164.5,
    discount: 50,
    total: 1759.5,
    status: "pending",
    paymentMethod: "cash",
    createdAt: "2024-01-16T14:20:00Z",
    updatedAt: "2024-01-16T14:20:00Z"
  }
];

export const mockCustomers: MockCustomer[] = [
  {
    id: "cust-001",
    name: "أحمد محمد",
    email: "ahmed@example.com",
    phone: "+966501234567",
    address: "الرياض، المملكة العربية السعودية",
    totalOrders: 5,
    totalSpent: 8250,
    lastOrderDate: "2024-01-15T10:30:00Z",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "cust-002",
    name: "فاطمة علي",
    email: "fatima@example.com", 
    phone: "+966507654321",
    address: "جدة، المملكة العربية السعودية",
    totalOrders: 3,
    totalSpent: 2759.5,
    lastOrderDate: "2024-01-16T14:20:00Z",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z"
  }
];

export const mockUsers: MockUser[] = [
  {
    id: "user-001",
    name: "مدير النظام",
    email: "admin@mys-f.com",
    role: "admin",
    permissions: ["all"],
    branchId: 1,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "user-002",
    name: "أمين الصندوق",
    email: "cashier@mys-f.com",
    role: "cashier", 
    permissions: ["pos", "orders", "customers"],
    branchId: 1,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z"
  }
];

export const mockBraches:mockBrache[] = [
    {
    id:1,
    name: "brach1",
    address: "Jadah",
    phone: "12345",
    email: "branch1@gmail.com",
    isActive: true,
    },
    {
    id:2,
    name: "brach2",
    address: "Jadah",
    phone: "22345",
    email: "branch2@gmail.com",
    isActive: true,
    },
    {
    id:3,
    name: "brach3",
    address: "Jadah",
    phone: "33345",
    email: "branch3@gmail.com",
    isActive: true,
    }
]

// Mock API functions
export const mockApi = {
  // Products
  getProducts: async (): Promise<MockProduct[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockProducts;
  },
  
  getProduct: async (id: string): Promise<MockProduct | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockProducts.find(p => p.id === id) || null;
  },
  
  createProduct: async (product: Omit<MockProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockProduct> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newProduct: MockProduct = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockProducts.push(newProduct);
    return newProduct;
  },
  
  updateProduct: async (id: string, updates: Partial<MockProduct>): Promise<MockProduct> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Product not found");
    
    mockProducts[index] = {
      ...mockProducts[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return mockProducts[index];
  },
  
  deleteProduct: async (id: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    mockProducts.splice(index, 1);
    return true;
  },
  
  // Orders
  getOrders: async (): Promise<MockOrder[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockOrders;
  },
  
  getOrder: async (id: string): Promise<MockOrder | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockOrders.find(o => o.id === id) || null;
  },
  
  createOrder: async (order: Omit<MockOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<MockOrder> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newOrder: MockOrder = {
      ...order,
      id: `order-${Date.now()}`,
      orderNumber: `ORD-2024-${String(mockOrders.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockOrders.push(newOrder);
    return newOrder;
  },
  
  // Customers
  getCustomers: async (): Promise<MockCustomer[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockCustomers;
  },
  
  getCustomer: async (id: string): Promise<MockCustomer | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockCustomers.find(c => c.id === id) || null;
  },
  
  // Users
  getUsers: async (): Promise<MockUser[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockUsers;
  },
  
  getUser: async (id: string): Promise<MockUser | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockUsers.find(u => u.id === id) || null;
},
  getBranches: async (): Promise<mockBrache[] |null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockBraches;
  },
  getDepartements: async (): Promise<mockDepartment [] | null> =>{
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockDepartments;
  },
  getPermissions: async (): Promise<MockPermission [] | null> =>{
    await new Promise(resolve => setTimeout(resolve,300));
    return MockPermissions;
},
getRoles: async (): Promise<MockRole [] | null> =>{
    await new Promise(resolve => setTimeout(resolve,300));
    return MockRoles;
  }

};


export default mockApi;
