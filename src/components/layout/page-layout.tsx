import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import Sidebar from "./sidebar";
import TopBar from "./topbar";
import Loading from "@/components/common/loading";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "7xl" | "full";
  className?: string;
}

export default function PageLayout({ 
  children, 
  title, 
  actions, 
  maxWidth = "7xl",
  className = "" 
}: PageLayoutProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <Loading />;
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "7xl": "max-w-7xl",
    full: "max-w-full"
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <TopBar />
        
        <div className="p-6 overflow-y-auto h-full custom-scrollbar">
          <div className={`${maxWidthClasses[maxWidth]} mx-auto ${className}`}>
            {(title || actions) && (
              <div className="flex items-center justify-between mb-6">
                {title && (
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {title}
                  </h1>
                )}
                {actions && (
                  <div className="flex items-center gap-2">
                    {actions}
                  </div>
                )}
              </div>
            )}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}