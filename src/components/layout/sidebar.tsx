import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ShoppingCart, LayoutDashboard, ShoppingBag, Package, Warehouse, ScanBarcode, Folder, BarChart3, LogOut, Building2, Users, Megaphone, RotateCcw, Shield, Play, QrCode, Store, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {signOut} from "@/services/auth";
const navigationItems = [
  {
    title: "لوحة التحكم",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "إدارة الطلبات", 
    href: "/orders",
    icon: ShoppingBag,
  },
  {
    title: "إدارة المنتجات",
    href: "/products", 
    icon: Package,
  },
  {
    title: "إدارة الأقسام",
    href: "/departments",
    icon: Folder,
  },
  {
    title: "إدارة المتاجر",
    href: "/stores",
    icon: Store,
  },
  {
    title: "إدارة الفروع",
    href: "/branches",
    icon: Building2,
  },
  {
    title: "إدارة المستخدمين",
    href: "/users",
    icon: Users,
  },
  {
    title: "الأدوار والصلاحيات",
    href: "/roles",
    icon: Shield,
  },
  {
    title: "العروض والإعلانات",
    href: "/promotions",
    icon: Megaphone,
  },
  {
    title: "مقاطع الحالات",
    href: "/stories",
    icon: Play,
  },
  {
    title: "شاشة الكاشير",
    href: "/pos",
    icon: ScanBarcode,
  },
  {
    title: "العملاء",
    href: "/customers",
    icon: Users,
  },
  {
    title: "الاسترجاع والاستبدال",
    href: "/returns",
    icon: RotateCcw,
  },
  {
    title: "التقارير",
    href: "/reports",
    icon: BarChart3,
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/";
    signOut();
  };

  return (
    <aside className="w-64 bg-secondary text-white shadow-lg flex flex-col">
      <div className="p-6">
        {/* Logo with white background */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center p-2 shadow-sm border border-gray-200">
            <img 
              src="/logo.jpg" 
              alt="شعار نظام المتاجر" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <h2 className="text-xl font-bold text-center">نظام إدارة المتاجر</h2>
      </div>

      {/* Navigation */}
      <nav className="mt-8 flex-1">
        <ul className="space-y-2 px-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
            
            return (
              <li key={item.href}>
                <Link href={item.href} className={cn(
                  "flex items-center p-3 rounded-lg transition-colors",
                  isActive 
                    ? "bg-primary text-white" 
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                )}>
                  <Icon className="h-5 w-5 ml-3" />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-600">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center ml-3">
            <span className="text-sm font-medium">
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || 'مستخدم'
              }
            </p>
            <p className="text-xs text-gray-400">
              {user?.role === 'general_manager' ? 'مدير عام' :
               user?.role === 'branch_manager' ? 'مدير فرع' : 'موظف'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-400 hover:text-white p-2"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
