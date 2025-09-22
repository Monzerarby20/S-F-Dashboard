import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Printer, Mail, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/common/loading";
import { Link } from "wouter";

export default function OrderDetails() {
  const { user } = useAuth();
  const [, params] = useRoute("/orders/:id");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orderId = params?.id;

  const { data: orderData, isLoading } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (data: { status: string }) => {
      await apiRequest('PUT', `/api/orders/${orderId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الطلب بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الطلب",
        variant: "destructive",
      });
    },
  });

  if (!user || isLoading) {
    return <Loading />;
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            الطلب غير موجود
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            لم يتم العثور على الطلب المطلوب
          </p>
          <Link href="/orders">
            <Button>
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للطلبات
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const order = (orderData as any)?.order;
  const items = (orderData as any)?.items || [];

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'processing': return 'قيد التجهيز';
      case 'pending': return 'في الانتظار';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'نقدي';
      case 'card': return 'بطاقة ائتمان';
      case 'apple_pay': return 'Apple Pay';
      case 'mada': return 'مدى';
      case 'loyalty_points': return 'نقاط الولاء';
      default: return method;
    }
  };

  const handleStatusChange = (newStatus: string) => {
    updateOrderMutation.mutate({ status: newStatus });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    toast({
      title: "قريباً",
      description: "ميزة إرسال الفاتورة عبر البريد الإلكتروني ستكون متاحة قريباً",
    });
  };

  return (
    <PageLayout maxWidth="4xl">
      <PageHeader
        title={`طلب رقم ${order?.invoiceNumber || orderId}`}
        subtitle="عرض تفاصيل الطلب وإدارة الحالة"
        backPath="/orders"
        backLabel="العودة للطلبات"
        actions={
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              طباعة
            </Button>
            <Button onClick={handleSendEmail} variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              إرسال بالبريد
            </Button>
          </div>
        }
      />

      <div className="space-y-6">

            {/* Order Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">معلومات الطلب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">رقم الطلب</p>
                    <p className="font-medium">#{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">رقم الفاتورة</p>
                    <p className="font-medium">{order.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">التاريخ</p>
                    <p className="font-medium">
                      {new Date(order.createdAt).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">الحالة</p>
                    <div className="flex items-center gap-2">
                      <Badge>{getStatusText(order.status)}</Badge>
                      <Select value={order.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">في الانتظار</SelectItem>
                          <SelectItem value="processing">قيد التجهيز</SelectItem>
                          <SelectItem value="completed">مكتمل</SelectItem>
                          <SelectItem value="cancelled">ملغي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">معلومات العميل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">اسم العميل</p>
                    <p className="font-medium">
                      {order.customer?.name || 'عميل غير مسجل'}
                    </p>
                  </div>
                  {order.customer?.email && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">البريد الإلكتروني</p>
                      <p className="font-medium">{order.customer.email}</p>
                    </div>
                  )}
                  {order.customer?.phone && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">رقم الهاتف</p>
                      <p className="font-medium">{order.customer.phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">معلومات الدفع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">طريقة الدفع</p>
                    <p className="font-medium">{getPaymentMethodText(order.paymentMethod)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">المبلغ المدفوع</p>
                    <p className="font-medium">
                      {Number(order.paidAmount || order.totalAmount).toLocaleString('ar-SA')} ر.س
                    </p>
                  </div>
                  {order.changeAmount && Number(order.changeAmount) > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">الباقي</p>
                      <p className="font-medium text-green-600">
                        {Number(order.changeAmount).toLocaleString('ar-SA')} ر.س
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">منتجات الطلب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                          المنتج
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                          الكمية
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                          السعر الفردي
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                          الإجمالي
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {item.product?.name || `منتج #${item.productId}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {Number(item.unitPrice).toLocaleString('ar-SA')} ر.س
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {Number(item.totalPrice).toLocaleString('ar-SA')} ر.س
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <Separator className="my-4" />
                
                {/* Order Summary */}
                <div className="flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">الإجمالي الفرعي:</span>
                      <span>{Number(order.subtotal).toLocaleString('ar-SA')} ر.س</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">الخصم:</span>
                      <span className="text-green-600">
                        -{Number(order.discountAmount || 0).toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">ضريبة القيمة المضافة:</span>
                      <span>{Number(order.vatAmount).toLocaleString('ar-SA')} ر.س</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>الإجمالي النهائي:</span>
                      <span>{Number(order.totalAmount).toLocaleString('ar-SA')} ر.س</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code */}
            {order.qrCode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    رمز QR للطلب
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <img 
                        src={`data:image/png;base64,${order.qrCode}`}
                        alt="QR Code"
                        className="w-32 h-32"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
      </div>
    </PageLayout>
  );
}
