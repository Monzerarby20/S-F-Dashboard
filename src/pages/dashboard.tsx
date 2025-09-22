import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import PageLayout from "@/components/layout/page-layout";
import MetricCards from "@/components/dashboard/metric-cards";
import SalesChart from "@/components/dashboard/sales-chart";
import RecentOrders from "@/components/dashboard/recent-orders";
import Alerts from "@/components/dashboard/alerts";
import Loading from "@/components/common/loading";

const TopProductsList = ({ branchId }: { branchId: number }) => {
  const { data: topProducts = [], isLoading } = useQuery({
    queryKey: ['/analytics/top-products', branchId],
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 rounded"></div>
      ))}
    </div>;
  }

  return (
    <div className="space-y-3">
      {Array.isArray(topProducts) && topProducts.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">لا توجد بيانات متاحة</p>
      ) : (
        Array.isArray(topProducts) && topProducts.map((product: any, index: number) => (
          <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{product.salesCount} مبيعة</p>
              </div>
            </div>
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {product.percentage}%
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  
  if (!user) {
    return <Loading />;
  }

  return (
    <PageLayout title="لوحة التحكم" maxWidth="full">
      <div className="space-y-6">
        <MetricCards branchId={1} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesChart branchId={1} />
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              المنتجات الأكثر مبيعاً
            </h3>
            <TopProductsList branchId={1} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentOrders branchId={1} />
          </div>
          <Alerts branchId={1} />
        </div>
      </div>
    </PageLayout>
  );
}