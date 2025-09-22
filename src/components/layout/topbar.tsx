import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Bell, Settings, User, LogOut } from "lucide-react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeSwitcher, OneClickThemeSwitcher } from "@/components/ui/theme-switcher";
import { useTranslation } from "@/hooks/useTranslation";

interface TopBarProps {
  children?: React.ReactNode;
}

export default function TopBar({ children }: TopBarProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [hasNotifications] = useState(true); // This would come from notifications API

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUserGreeting = () => {
    const firstName = (user as any)?.firstName || 'مستخدم';
    const branchName = 'الفرع الرئيسي'; // This would come from branch data
    return `مرحباً ${firstName}، ${branchName}`;
  };

  const getUserInitials = () => {
    const firstName = (user as any)?.firstName || 'م';
    const lastName = (user as any)?.lastName || 'ع';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {getUserGreeting()}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {getCurrentDate()}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Custom children (like sidebar toggle) */}
            {children}
            
            {/* Theme Switchers */}
            <OneClickThemeSwitcher />
            <ThemeSwitcher className="hidden lg:flex" />
            
            {/* Notification Bell */}
            <Link href="/notifications">
              <Button 
                variant="ghost" 
                size="sm"
                className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Bell className="h-5 w-5" />
                {hasNotifications && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </Button>
            </Link>
            
            {/* User Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(user as any)?.profileImageUrl} alt="صورة المستخدم" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {(user as any)?.firstName || 'مستخدم'} {(user as any)?.lastName || ''}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {(user as any)?.email || 'user@example.com'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center w-full cursor-pointer">
                    <User className="ml-2 h-4 w-4" />
                    <span>الملف الشخصي</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center w-full cursor-pointer">
                    <Settings className="ml-2 h-4 w-4" />
                    <span>الإعدادات</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={logout}
                  className="text-red-600 dark:text-red-400 cursor-pointer"
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>{t('logout') || 'تسجيل الخروج'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
