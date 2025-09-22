import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, ShoppingBag, AlertTriangle, Star } from "lucide-react";
import Loading from "@/components/common/loading";

interface MetricCardsProps {
  branchId: number;
}

export default function MetricCards({ branchId }: MetricCardsProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: [`/dashboard/metrics/${branchId}`],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="mr-4 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricItems = [
    {
      title: "المبيعات اليومية",
      value: `${Number(metrics?.dailySales || 0).toLocaleString('ar-SA')} ر.س`,
      change: "+8.2% من أمس",
      changeType: "positive" as const,
      icon: DollarSign,
      bgColor: "bg-primary bg-opacity-10",
      iconColor: "text-primary",
    },
    {
      title: "الطلبات اليومية", 
      value: metrics?.dailyOrders?.toString() || "0",
      change: "+12.5% من أمس",
      changeType: "positive" as const,
      icon: ShoppingBag,
      bgColor: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "مخزون منخفض",
      value: metrics?.lowStockCount?.toString() || "0",
      change: "يحتاج إعادة تخزين",
      changeType: "warning" as const,
      icon: AlertTriangle,
      bgColor: "bg-warning bg-opacity-10",
      iconColor: "text-warning",
    },
    {
      title: "متوسط التقييمات",
      value: metrics?.averageRating?.toString() || "0",
      change: "ممتاز",
      changeType: "positive" as const,
      icon: Star,
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
      iconColor: "text-yellow-600 dark:text-yellow-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metricItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 w-12 h-12 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${item.iconColor} h-6 w-6`} />
                </div>
                <div className="mr-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {item.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {item.value}
                  </p>
                  <p className={`text-sm ${
                    item.changeType === 'positive' ? 'text-green-600' :
                    item.changeType === 'warning' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {item.change}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
