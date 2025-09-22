import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Search, RotateCcw, QrCode, CreditCard, Banknote, ArrowRight, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/common/loading";

interface ReturnItem {
  productId: number;
  productName: string;
  originalPrice: number;
  originalQuantity: number;
  returnQuantity: number;
  reason: string;
  refundAmount: number;
}

const returnSchema = z.object({
  customerId: z.number().optional(),
  customerPhone: z.string().optional(),
  returnMethod: z.enum(['credit_balance', 'cash_refund', 'original_payment']),
  items: z.array(z.object({
    productId: z.number(),
    returnQuantity: z.number().min(1),
    reason: z.string().min(1, "سبب الإرجاع مطلوب"),
  })),
});

type ReturnFormData = z.infer<typeof returnSchema>;

export default function ReturnsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnMethod, setReturnMethod] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [qrVerified, setQrVerified] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ['/customers'],
  });

  const returnForm = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      returnMethod: 'cash_refund',
      items: [],
    },
  });

  const searchOrderMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('GET', `/api/orders?search=${encodeURIComponent(query)}`);
      return response.json();
    },
    onSuccess: (orders) => {
      if (orders.length > 0) {
        setSelectedOrder(orders[0]);
        initializeReturnItems(orders[0]);
      } else {
        toast({
          title: "لم يتم العثور على الطلب",
          description: "تأكد من رقم الطلب أو رقم الفاتورة",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "خطأ في البحث",
        description: "حدث خطأ أثناء البحث عن الطلب",
        variant: "destructive",
      });
    },
  });

  const verifyQrMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest('POST', `/api/orders/${orderId}/verify-qr`);
      return response.json();
    },
    onSuccess: () => {
      setQrVerified(true);
      toast({
        title: "تم التحقق من رمز QR",
        description: "الفاتورة صالحة ويمكن إجراء الإرجاع",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في التحقق",
        description: "رمز QR غير صالح أو مستخدم مسبقاً",
        variant: "destructive",
      });
    },
  });

  const processReturnMutation = useMutation({
    mutationFn: async (data: ReturnFormData) => {
      const response = await apiRequest('POST', `/api/orders/${selectedOrder.id}/return`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الإرجاع بنجاح",
        description: "تم إجراء عملية الإرجاع وتحديث المخزون",
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: "خطأ في الإرجاع",
        description: "فشل في إجراء عملية الإرجاع",
        variant: "destructive",
      });
    },
  });

  const initializeReturnItems = (order: any) => {
    const items = order.items?.map((item: any) => ({
      productId: item.productId,
      productName: item.productName || 'منتج غير معروف',
      originalPrice: parseFloat(item.unitPrice),
      originalQuantity: item.quantity,
      returnQuantity: 0,
      reason: '',
      refundAmount: 0,
    })) || [];
    setReturnItems(items);
  };

  const updateReturnQuantity = (productId: number, quantity: number) => {
    setReturnItems(items => 
      items.map(item => 
        item.productId === productId 
          ? { ...item, returnQuantity: Math.max(0, Math.min(quantity, item.originalQuantity)), refundAmount: item.originalPrice * Math.max(0, Math.min(quantity, item.originalQuantity)) }
          : item
      )
    );
  };

  const updateReturnReason = (productId: number, reason: string) => {
    setReturnItems(items => 
      items.map(item => 
        item.productId === productId 
          ? { ...item, reason }
          : item
      )
    );
  };

  const calculateTotalRefund = () => {
    return returnItems.reduce((total, item) => total + item.refundAmount, 0);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchOrderMutation.mutate(searchQuery.trim());
    }
  };

  const handleVerifyQr = () => {
    if (selectedOrder) {
      verifyQrMutation.mutate(selectedOrder.id);
    }
  };

  const handleProcessReturn = () => {
    const validItems = returnItems.filter(item => item.returnQuantity > 0 && item.reason.trim());
    
    if (validItems.length === 0) {
      toast({
        title: "لا توجد منتجات للإرجاع",
        description: "يجب تحديد كمية وسبب الإرجاع للمنتجات",
        variant: "destructive",
      });
      return;
    }

    if (!qrVerified) {
      toast({
        title: "التحقق من QR مطلوب",
        description: "يجب التحقق من رمز QR أولاً",
        variant: "destructive",
      });
      return;
    }

    const returnData: ReturnFormData = {
      customerId: selectedOrder.customerId,
      customerPhone: returnMethod === 'credit_balance' ? customerPhone : undefined,
      returnMethod: returnMethod as any,
      items: validItems.map(item => ({
        productId: item.productId,
        returnQuantity: item.returnQuantity,
        reason: item.reason,
      })),
    };

    processReturnMutation.mutate(returnData);
  };

  const resetForm = () => {
    setSelectedOrder(null);
    setReturnItems([]);
    setSearchQuery("");
    setReturnMethod("");
    setCustomerPhone("");
    setQrVerified(false);
  };

  if (!user) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <TopBar />
        
        <div className="p-6 overflow-y-auto h-full custom-scrollbar">
          <div className="space-y-6">
            {/* عنوان الصفحة */}
            <div className="flex items-center gap-3">
              <RotateCcw className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                إدارة الاسترجاع والاستبدال
              </h1>
            </div>

            {/* البحث عن الطلب */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  البحث عن الطلب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="رقم الطلب / رقم الفاتورة / امسح رمز QR"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSearch}
                    disabled={searchOrderMutation.isPending}
                  >
                    {searchOrderMutation.isPending ? "جاري البحث..." : "بحث"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* تفاصيل الطلب */}
            {selectedOrder && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* معلومات الطلب */}
                <Card>
                  <CardHeader>
                    <CardTitle>تفاصيل الطلب</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">رقم الطلب:</span>
                        <p>{selectedOrder.id}</p>
                      </div>
                      <div>
                        <span className="font-medium">رقم الفاتورة:</span>
                        <p>{selectedOrder.invoiceNumber}</p>
                      </div>
                      <div>
                        <span className="font-medium">التاريخ:</span>
                        <p>{new Date(selectedOrder.createdAt).toLocaleDateString('ar-SA')}</p>
                      </div>
                      <div>
                        <span className="font-medium">المبلغ الإجمالي:</span>
                        <p>{parseFloat(selectedOrder.totalAmount).toLocaleString('ar-SA')} ر.س</p>
                      </div>
                      <div>
                        <span className="font-medium">طريقة الدفع:</span>
                        <p>{selectedOrder.paymentMethod}</p>
                      </div>
                      <div>
                        <span className="font-medium">الحالة:</span>
                        <Badge variant={selectedOrder.status === 'completed' ? 'default' : 'secondary'}>
                          {selectedOrder.status}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* التحقق من QR */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">التحقق من رمز QR:</span>
                        {qrVerified ? (
                          <Badge className="bg-green-100 text-green-800">
                            تم التحقق ✓
                          </Badge>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleVerifyQr}
                            disabled={verifyQrMutation.isPending}
                          >
                            <QrCode className="h-4 w-4 ml-2" />
                            {verifyQrMutation.isPending ? "جاري التحقق..." : "تحقق من QR"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ملخص الإرجاع */}
                <Card>
                  <CardHeader>
                    <CardTitle>ملخص الإرجاع</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {calculateTotalRefund().toLocaleString('ar-SA')} ر.س
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        إجمالي المبلغ المستحق للإرجاع
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium">طريقة الإرجاع:</label>
                      <Select value={returnMethod} onValueChange={setReturnMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر طريقة الإرجاع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash_refund">إرجاع نقدي</SelectItem>
                          <SelectItem value="credit_balance">رصيد شراء</SelectItem>
                          <SelectItem value="original_payment">نفس طريقة الدفع الأصلية</SelectItem>
                        </SelectContent>
                      </Select>

                      {returnMethod === 'credit_balance' && (
                        <Input
                          placeholder="رقم هاتف العميل (لربط الرصيد)"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      )}
                    </div>

                    <Button 
                      onClick={handleProcessReturn}
                      disabled={!qrVerified || !returnMethod || processReturnMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <RotateCcw className="h-4 w-4 ml-2" />
                      {processReturnMutation.isPending ? "جاري المعالجة..." : "إتمام الإرجاع"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* جدول المنتجات للإرجاع */}
            {returnItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>المنتجات المراد إرجاعها</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                            المنتج
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                            الكمية الأصلية
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                            كمية الإرجاع
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                            سبب الإرجاع
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                            مبلغ الإرجاع
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {returnItems.map((item) => (
                          <tr key={item.productId}>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {item.productName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {item.originalPrice.toLocaleString('ar-SA')} ر.س للقطعة
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline">{item.originalQuantity}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 justify-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateReturnQuantity(item.productId, item.returnQuantity - 1)}
                                  disabled={item.returnQuantity <= 0}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-12 text-center">{item.returnQuantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateReturnQuantity(item.productId, item.returnQuantity + 1)}
                                  disabled={item.returnQuantity >= item.originalQuantity}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Select 
                                value={item.reason} 
                                onValueChange={(value) => updateReturnReason(item.productId, value)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue placeholder="اختر السبب" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="defective">منتج معيب</SelectItem>
                                  <SelectItem value="wrong_item">منتج خاطئ</SelectItem>
                                  <SelectItem value="expired">منتهي الصلاحية</SelectItem>
                                  <SelectItem value="customer_change">تغيير رأي العميل</SelectItem>
                                  <SelectItem value="other">أخرى</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-3 text-center font-medium">
                              {item.refundAmount.toLocaleString('ar-SA')} ر.س
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}