import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Package, CreditCard, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TestQROrder {
  id: number;
  qrCode: string;
  branchId: number;
  totalAmount: string;
  paymentStatus: string;
  paymentTransactionId?: string;
  items: Array<{
    productId: number;
    productName: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
  }>;
  status: string;
  expiresAt: string;
}

export default function TestQRGenerator() {
  const { toast } = useToast();
  const [generatedOrder, setGeneratedOrder] = useState<TestQROrder | null>(null);

  const createTestOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/qr-orders/create-test', { branchId: 1 });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedOrder(data.qrOrder);
      toast({
        title: "تم إنشاء طلب تجريبي",
        description: `QR Code: ${data.qrCode} - يحتوي على ${data.qrOrder.items.length} منتج`,
      });
    },
    onError: (error: any) => {
      console.error("Test order creation error:", error);
      toast({
        title: "خطأ في إنشاء الطلب",
        description: "تأكد من وجود منتجات في قاعدة البيانات",
        variant: "destructive",
      });
    },
  });

  const handleCreateTestOrder = () => {
    createTestOrderMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          مولد QR تجريبي للعملاء
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Button 
            onClick={handleCreateTestOrder}
            disabled={createTestOrderMutation.isPending}
            className="w-full"
          >
            {createTestOrderMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 ml-2" />
                إنشاء طلب QR تجريبي
              </>
            )}
          </Button>
        </div>

        {generatedOrder && (
          <div className="space-y-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-mono font-bold bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border-2 border-dashed border-blue-300">
                {generatedOrder.qrCode}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                <strong>طلب عميل تجريبي</strong> - استخدم هذا الكود لاختبار التحقق من المنتجات
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                  حالة الدفع: مدفوع
                </div>
                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
                  {generatedOrder.items.length} منتج
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {parseFloat(generatedOrder.totalAmount).toLocaleString('ar-SA')} ر.س
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي المبلغ</div>
              </div>
              <div className="text-center">
                <Badge className="bg-green-500">مدفوع</Badge>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">حالة الدفع</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                المنتجات ({generatedOrder.items.length})
              </h4>
              <div className="space-y-2">
                {generatedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                      <div className="font-medium text-sm">{item.productName}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {item.barcode} • الكمية: {item.quantity}
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {(item.unitPrice * item.quantity).toLocaleString('ar-SA')} ر.س
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>ينتهي في: {new Date(generatedOrder.expiresAt).toLocaleString('ar-SA')}</span>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <strong>تعليمات الاختبار:</strong>
              <br />
              1. انسخ QR Code أعلاه
              <br />
              2. اذهب إلى صفحة "التحقق من QR العملاء"
              <br />
              3. الصق الكود في حقل QR Scanner
              <br />
              4. استخدم الباركود المعروض لكل منتج لاختبار التحقق
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}