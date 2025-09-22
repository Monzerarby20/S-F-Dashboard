import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Calendar, CheckCircle, Upload } from "lucide-react";
import Loading from "@/components/common/loading";

interface AlertsProps {
  branchId: number;
}

export default function Alerts({ branchId }: AlertsProps) {
  const { data: alerts, isLoading } = useQuery({
    queryKey: [`/alerts/${branchId}`],
  });

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'low_stock': return AlertTriangle;
      case 'expiring_soon': return Calendar;
      case 'expired': return Calendar;
      default: return CheckCircle;
    }
  };

  const getAlertIconColor = (alertType: string) => {
    switch (alertType) {
      case 'low_stock': return 'text-red-500';
      case 'expiring_soon': return 'text-yellow-500';
      case 'expired': return 'text-red-500';
      default: return 'text-green-500';
    }
  };

  const getAlertBgColor = (alertType: string) => {
    switch (alertType) {
      case 'low_stock': return 'bg-red-100 dark:bg-red-900';
      case 'expiring_soon': return 'bg-yellow-100 dark:bg-yellow-900';
      case 'expired': return 'bg-red-100 dark:bg-red-900';
      default: return 'bg-green-100 dark:bg-green-900';
    }
  };

  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const alertDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - alertDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `قبل ${diffInMinutes} دقيقة`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `قبل ${diffInHours} ساعة`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `قبل ${diffInDays} يوم`;
  };

  // Mock alerts for demonstration if no real alerts
  const mockAlerts = [
    {
      id: 1,
      alertType: 'low_stock',
      message: 'منتج "آيفون 15 برو" متبقي منه 3 قطع فقط',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: 2,
      alertType: 'expiring_soon',
      message: '5 منتجات ستنتهي صلاحيتها خلال أسبوع',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
      id: 3,
      alertType: 'new_order',
      message: 'وصل طلب جديد برقم #12345',
      createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    }
  ];

  const displayAlerts = alerts?.length ? alerts : mockAlerts;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          التنبيهات والإشعارات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loading text="جاري تحميل التنبيهات..." />
        ) : !displayAlerts?.length ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            لا توجد تنبيهات جديدة
          </div>
        ) : (
          <div className="space-y-4">
            {displayAlerts.map((alert: any) => {
              const Icon = getAlertIcon(alert.alertType);
              const iconColor = getAlertIconColor(alert.alertType);
              const bgColor = getAlertBgColor(alert.alertType);
              
              return (
                <div key={alert.id} className="flex items-start space-x-3 space-x-reverse">
                  <div className={`flex-shrink-0 w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`${iconColor} h-4 w-4`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {alert.alertType === 'low_stock' ? 'مخزون منخفض' :
                       alert.alertType === 'expiring_soon' ? 'انتهاء صلاحية' :
                       alert.alertType === 'expired' ? 'منتهي الصلاحية' :
                       alert.alertType === 'new_order' ? 'طلب جديد' : 'إشعار'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {getTimeAgo(alert.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
