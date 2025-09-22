import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import Loading from "@/components/common/loading";

interface RecentOrdersProps {
  branchId: number;
}

export default function RecentOrders({ branchId }: RecentOrdersProps) {
  const { data: recentOrders, isLoading } = useQuery({
    queryKey: [`/dashboard/recent-orders/${branchId}?limit=10`],
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'processing': return 'قيد التجهيز';
      case 'pending': return 'في الانتظار';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const orderDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `قبل ${diffInMinutes} دقيقة`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `قبل ${diffInHours} ساعة`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `قبل ${diffInDays} يوم`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            أحدث الطلبات
          </CardTitle>
          <Link href="/orders">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              عرض الكل
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loading text="جاري تحميل الطلبات..." />
        ) : !recentOrders?.length ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            لا توجد طلبات حديثة
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    رقم الطلب
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    العميل
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    الوقت
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      #{order.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {Number(order.totalAmount).toLocaleString('ar-SA')} ر.س
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {getTimeAgo(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
