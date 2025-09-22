import { useTheme } from '@/contexts/ThemeContext';

// Translation dictionary
const translations = {
  ar: {
    // Navigation
    dashboard: 'لوحة التحكم',
    products: 'المنتجات',
    orders: 'الطلبات',
    customers: 'العملاء',
    pos: 'نقطة البيع',
    reports: 'التقارير',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    
    // Common actions
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    import: 'استيراد',
    
    // Dashboard
    totalSales: 'إجمالي المبيعات',
    totalOrders: 'إجمالي الطلبات',
    totalCustomers: 'إجمالي العملاء',
    todaysSales: 'مبيعات اليوم',
    recentOrders: 'الطلبات الأخيرة',
    topProducts: 'أفضل المنتجات',
    
    // Products
    productName: 'اسم المنتج',
    price: 'السعر',
    stock: 'المخزون',
    category: 'الفئة',
    barcode: 'الباركود',
    
    // Login
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    login: 'تسجيل الدخول',
    loginTitle: 'تسجيل الدخول - نظام نقطة البيع',
    
    // Theme
    lightMode: 'الوضع الفاتح',
    darkMode: 'الوضع الداكن',
    language: 'اللغة',
    
    // Time
    today: 'اليوم',
    yesterday: 'أمس',
    thisWeek: 'هذا الأسبوع',
    thisMonth: 'هذا الشهر',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    products: 'Products',
    orders: 'Orders',
    customers: 'Customers',
    pos: 'Point of Sale',
    reports: 'Reports',
    settings: 'Settings',
    logout: 'Logout',
    
    // Common actions
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    
    // Dashboard
    totalSales: 'Total Sales',
    totalOrders: 'Total Orders',
    totalCustomers: 'Total Customers',
    todaysSales: "Today's Sales",
    recentOrders: 'Recent Orders',
    topProducts: 'Top Products',
    
    // Products
    productName: 'Product Name',
    price: 'Price',
    stock: 'Stock',
    category: 'Category',
    barcode: 'Barcode',
    
    // Login
    email: 'Email',
    password: 'Password',
    login: 'Login',
    loginTitle: 'Login - POS System',
    
    // Theme
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    language: 'Language',
    
    // Time
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
  }
};

export function useTranslation() {
  // Add error boundary for useTheme
  let language = 'ar';
  try {
    const themeContext = useTheme();
    language = themeContext.language;
  } catch (error) {
    console.warn('useTranslation: ThemeProvider not found, using default language');
  }
  
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };
  
  return { t, language };
}