import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  Edit,
  Bike,
  Phone,
  Mail,
  Store,
  Package,
  ClipboardList,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";
import {
  getCourierById,
  getCourierTypeLabel,
  getCourierTypeBadgeVariant,
  type CourierOrderHistory,
} from "./CouriersList";

export default function CourierDetails() {
  const { user } = useAuth();
  const [, params] = useRoute("/couriers/:id");
  const courierId = params?.id;

  const {
    data: courier,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["courier", courierId],
    enabled: !!courierId,
    queryFn: () => getCourierById(Number(courierId)),
  });

  if (!user || isLoading) {
    return <Loading />;
  }

  if (isError || !courier) {
    return (
      <PageLayout maxWidth="4xl">
        <PageHeader
          title="تفاصيل المندوب"
          backPath="/couriers"
          backLabel="العودة للمندوبين"
        />
        <Card>
          <CardContent className="p-10 text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              المندوب غير موجود
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              لم يتم العثور على المندوب المطلوب أو أن واجهة برمجة التطبيقات غير متصلة
            </p>
            <Link href="/couriers">
              <Button>
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للمندوبين
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const orderHistory: CourierOrderHistory[] = courier.order_history ?? [];

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("ar");
  };

  return (
    <PageLayout maxWidth="4xl">
      <PageHeader
        title={`${courier.first_name} ${courier.last_name}`}
        subtitle="عرض تفاصيل المندوب وأدائه"
        backPath="/couriers"
        backLabel="العودة للمندوبين"
        actions={
          <Link href={`/couriers/edit/${courier.id}`}>
            <Button size="sm">
              <Edit className="h-4 w-4 ml-2" />
              تعديل المندوب
            </Button>
          </Link>
        }
      />

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bike className="h-5 w-5" />
              المعلومات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">الاسم الكامل</p>
                <p className="font-medium">
                  {courier.first_name} {courier.last_name}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">رقم الهاتف</p>
                <p className="font-medium flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {courier.phone || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">البريد الإلكتروني</p>
                <p className="font-medium flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {courier.email || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">نوع المندوب</p>
                <Badge variant={getCourierTypeBadgeVariant(courier.courier_type)}>
                  {getCourierTypeLabel(courier.courier_type)}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">المتجر</p>
                <p className="font-medium flex items-center gap-1">
                  <Store className="h-4 w-4" />
                  {courier.store_name || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">الفرع</p>
                <p className="font-medium">{courier.branch_name || "—"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">الحالة</p>
                {courier.is_active ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    نشط
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    معطل
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              الأداء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">إجمالي التسليمات</p>
                <p className="text-2xl font-bold mt-1">
                  {courier.total_deliveries ?? "—"}
                </p>
              </div>

              <div className="border rounded-lg p-4 text-center">
                <ClipboardList className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">الطلبات الحالية</p>
                <p className="text-2xl font-bold mt-1">
                  {courier.current_orders_count ?? "—"}
                </p>
              </div>

              <div className="border rounded-lg p-4 text-center">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-muted-foreground">الطلبات المكتملة</p>
                <p className="text-2xl font-bold mt-1">
                  {courier.completed_orders ?? "—"}
                </p>
              </div>

              <div className="border rounded-lg p-4 text-center">
                <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <p className="text-sm text-muted-foreground">الطلبات الملغاة/المرفوضة</p>
                <p className="text-2xl font-bold mt-1">
                  {courier.cancelled_orders ?? "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order History */}
        <Card>
          <CardHeader>
            <CardTitle>سجل الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            {orderHistory.length === 0 ? (
              <EmptyState
                title="لا يوجد سجل طلبات"
                description="سيظهر سجل الطلبات هنا عند ربط البيانات من الخادم"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الطلب</TableHead>
                      <TableHead>المتجر/الفرع</TableHead>
                      <TableHead>نوع الطلب</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>وقت القبول</TableHead>
                      <TableHead>وقت الاستلام</TableHead>
                      <TableHead>وقت التسليم</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderHistory.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.order_number}
                        </TableCell>
                        <TableCell>
                          {order.store_name || "—"}
                          {order.branch_name ? ` / ${order.branch_name}` : ""}
                        </TableCell>
                        <TableCell>{order.order_type || "—"}</TableCell>
                        <TableCell>{order.status}</TableCell>
                        <TableCell>{formatDate(order.accepted_at)}</TableCell>
                        <TableCell>{formatDate(order.picked_up_at)}</TableCell>
                        <TableCell>{formatDate(order.delivered_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
