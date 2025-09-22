import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Loading from "@/components/common/loading";

interface SalesChartProps {
  branchId: number;
}

export default function SalesChart({ branchId }: SalesChartProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: [`/dashboard/sales-chart/${branchId}?days=7`],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            مبيعات الأسبوع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Loading text="جاري تحميل بيانات المبيعات..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const formattedData = Array.isArray(chartData)
  ? chartData.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('ar-SA', { 
        month: 'short', 
        day: 'numeric' 
      }),
      sales: Number(item.sales),
    }))
  : [];

  // const formattedData = chartData?.map((item: any) => ({
  //   date: new Date(item.date).toLocaleDateString('ar-SA', { 
  //     month: 'short', 
  //     day: 'numeric' 
  //   }),
  //   sales: Number(item.sales),
  // })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-lg font-bold text-primary">
            {Number(payload[0].value).toLocaleString('ar-SA')} ر.س
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          مبيعات الأسبوع
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {formattedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value) => `${Number(value).toLocaleString('ar-SA')}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              لا توجد بيانات مبيعات متاحة
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
