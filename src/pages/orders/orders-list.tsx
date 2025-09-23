import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Plus } from "lucide-react";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";
import { getAllOrders } from "@/services/order";

export default function OrdersList() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const { data: mappedOrders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: getAllOrders,
  });

  const orders = mappedOrders?.map((o: any) => ({
    id: o.id,
    invoiceNumber: o.invoice_number,
    createdAt: o.created_at,
    customerName: o.customer_name || "عميل غير مسجل",
    totalAmount: o.total_amount,
    paymentMethod: o.payment_status,
    status: o.status,
  }));

  // ✅ فلترة + بحث
  const filteredOrders = orders?.filter((order: any) => {
    const matchesSearch =
      search === "" ||
      order.id.toString().includes(search) ||
      (order.invoiceNumber && order.invoiceNumber.toString().includes(search)) ||
      (order.customerName && order.customerName.includes(search));

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    const matchesPayment = paymentFilter === "all" || order.paymentMethod === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  if (!user) {
    return <Loading />;
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "processing":
        return "secondary";
      case "pending":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "مكتمل";
      case "processing":
        return "قيد التجهيز";
      case "pending":
        return "في الانتظار";
      case "cancelled":
        return "ملغي";
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cash":
        return "نقدي";
      case "card":
        return "بطاقة ائتمان";
      case "apple_pay":
        return "Apple Pay";
      case "mada":
        return "مدى";
      case "loyalty_points":
        return "نقاط الولاء";
      default:
        return method;
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title="إدارة الطلبات"
        subtitle="عرض وإدارة جميع الطلبات"
        actions={
          <Link href="/pos">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              طلب جديد
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث برقم الطلب أو رقم الفاتورة أو اسم العميل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="حالة الطلب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="processing">قيد التجهيز</SelectItem>
                <SelectItem value="confirmed">مكتمل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الطرق</SelectItem>
                <SelectItem value="cash">نقدي</SelectItem>
                <SelectItem value="card">بطاقة ائتمان</SelectItem>
                <SelectItem value="apple_pay">Apple Pay</SelectItem>
                <SelectItem value="mada">مدى</SelectItem>
                <SelectItem value="loyalty_points">نقاط الولاء</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <Loading />
          ) : !filteredOrders?.length ? (
            <EmptyState
              title="لا توجد طلبات"
              description="لم يتم العثور على أي طلبات تطابق معايير البحث"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      رقم الطلب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      رقم الفاتورة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      العميل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      المبلغ الإجمالي
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      طريقة الدفع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredOrders.map((order: any) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {order.invoiceNumber || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {new Date(order.createdAt).toLocaleDateString("ar-SA")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {Number(order.totalAmount).toLocaleString("ar-SA")} ر.س
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {getPaymentMethodText(order.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 ml-1" />
                            عرض التفاصيل
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
    </PageLayout>
  );
}
