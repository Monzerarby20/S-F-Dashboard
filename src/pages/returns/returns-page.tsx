import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, RotateCcw, Scan, Clock, CheckCircle, XCircle, AlertTriangle, ScanBarcode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";
import { lookupInvoice } from "@/services/return";

interface ReturnOrder {
  id: number;
  qrCode: string;
  returnBarcode: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount: number;
  returnPolicy?: string;
  returnExpiryDate?: string;
  items: ReturnOrderItem[];
}

interface ReturnOrderItem {
  id: number;
  productId: number;
  productName: string;
  productBarcode: string;
  originalPrice: number;
  quantity: number;
  isReturned: boolean;
}

export default function ReturnsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scannerInputRef = useRef<HTMLInputElement>(null);

  const [currentReturn, setCurrentReturn] = useState<object | null>(null);
  const [scannerInput, setScannerInput] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    item?: ReturnOrderItem;
  }>({ open: false });
  
const [rmaType, setRmaType] = useState<'return' | 'replace'>('return');

  // Auto-focus scanner input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus scanner input on any key press (except when typing in other inputs)
      if (e.target === document.body) {
        scannerInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch return order by barcode
  const fetchReturnOrderMutation = useMutation({
    mutationFn: lookupInvoice,
    onSuccess: (data: ReturnOrder) => {
      const mapped: object = {
        id: Date.now(), // أو لو السيرفر بيرجع ID حطه
        qrCode: data.invoice_number,
        returnBarcode: data.invoice_number,
        customerName: data.customer_name,
        customerPhone: null,
        totalAmount: data.total_amount,
        returnPolicy: null,
        returnExpiryDate: null,

        paymentMethod: data.payment_method,
        items: data.items.map((item: any, index: number) => ({
          id: index + 1,
          productId: item.product_id,
          productImage: item.product_image,
          productName: item.product_name,
          productBarcode: item.barcode,
          originalPrice: item.unit_price,
          quantity: item.quantity,
          isReturned: false,
        })),
      };
      setCurrentReturn(mapped);
      toast({
        title: "تم العثور على الطلب",
        description: `طلب العميل ${data.customerName || 'غير محدد'} جاهز للاسترجاع`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في المسح",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Process return item
  const processReturnMutation = useMutation({
    mutationFn: async (data: { returnId: number; itemId: number; productBarcode: string }) => {
      const response = await apiRequest('POST', '/returns/process-item', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في معالجة الاسترجاع');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Update current return data
      if (currentReturn) {
        const updatedItems = currentReturn.items.map(item =>
          item.id === data.itemId ? { ...item, isReturned: true } : item
        );
        setCurrentReturn({ ...currentReturn, items: updatedItems });
      }

      toast({
        title: "تم الاسترجاع",
        description: `تم استرجاع ${data.productName} بنجاح`,
      });

      setScannerInput("");
      setConfirmDialog({ open: false });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الاسترجاع",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleScannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerInput.trim()) return;

    // Check if scanning return barcode
    if (!currentReturn) {
      console.log("Request", scannerInput.trim())
      const scannerInputRequest = {
        invoice_number: scannerInput.trim()
      }
      fetchReturnOrderMutation.mutate(scannerInputRequest);
    } else {
      // Check if scanning product barcode
      const item = currentReturn.items.find(
        item => item.productBarcode === scannerInput.trim() && !item.isReturned
      );

      if (item) {
        setConfirmDialog({ open: true, item });
      } else {
        toast({
          title: "منتج غير صالح",
          description: "هذا المنتج غير موجود في الطلب أو تم استرجاعه مسبقاً",
          variant: "destructive",
        });
      }
    }

    setScannerInput("");
  };

  const handleConfirmReturn = () => {
    if (confirmDialog.item && currentReturn) {
      processReturnMutation.mutate({
        returnId: currentReturn.id,
        itemId: confirmDialog.item.id,
        productBarcode: confirmDialog.item.productBarcode,
      });
    }
  };

  const isReturnExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const getRemainingDays = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getReturnedItemsCount = () => {
    return currentReturn?.items.filter(item => item.isReturned).length || 0;
  };

  const getTotalRefundAmount = () => {
    return currentReturn?.items
      .filter(item => item.isReturned)
      .reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0) || 0;
  };

  const resetReturn = () => {
    setCurrentReturn(null);
    setScannerInput("");
    setSelectedItems([]);
    setConfirmDialog({ open: false });
  };

  return (
    <PageLayout>
      <PageHeader
        title="انشاء استرجاع / استبدال"
        subtitle="يمكنك اختيار المنتجات التي تريد استرجاعها أو استبدالها"

      />

      <div className="space-y-6">
        {/* Scanner Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              {!currentReturn ? "مسح باركود الاسترجاع" : "مسح باركود المنتج"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScannerSubmit} className="space-y-4">
              <div className="flex gap-4">
                <Input
                  ref={scannerInputRef}
                  type="text"
                  placeholder={!currentReturn ? "امسح باركود الاسترجاع..." : "امسح باركود المنتج للاسترجاع..."}
                  value={scannerInput}

                  onChange={(e) => setScannerInput(e.target.value)}
                  className="flex-1 text-lg"
                  autoFocus
                />
                <Button type="submit" disabled={fetchReturnOrderMutation.isPending || processReturnMutation.isPending}>
                  <ScanBarcode className="h-4 w-4" />
                  {!currentReturn ? "مسح" : "استرجاع"}
                </Button>
              </div>
            </form>

            {currentReturn && (
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={resetReturn}>
                  <XCircle className="h-4 w-4 mr-2" />
                  إنهاء الاسترجاع
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Return Order Details */}
        {currentReturn && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>معلومات الطلب</span>
                  <Badge
                    variant={isReturnExpired(currentReturn.returnExpiryDate) ? "destructive" : "default"}
                    className="flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    {isReturnExpired(currentReturn.returnExpiryDate)
                      ? "منتهي الصلاحية"
                      : `${getRemainingDays(currentReturn.returnExpiryDate)} يوم متبقي`
                    }
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">العميل:</span>
                    <span className="font-medium">{currentReturn.customerName || 'غير محدد'}</span>
                  </div>
                  {currentReturn.customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الهاتف:</span>
                      <span className="font-medium">{currentReturn.customerPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم الفاتورة:</span>
                    <span className="font-medium">{currentReturn.qrCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">إجمالي الطلب:</span>
                    <span className="font-medium">{currentReturn.totalAmount.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">وسيلة الدفع:</span>
                    <span className="font-medium">{currentReturn.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">وسيلة الدفع:</span>
                    <span className="font-medium">Paid</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المسترجع:</span>
                    <span className="font-medium text-green-600">
                      {getTotalRefundAmount().toFixed(2)} ر.س
                    </span>
                  </div>
                </div>

                {currentReturn.returnPolicy && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                          سياسة الاسترجاع
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          {currentReturn.returnPolicy}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Return Progress */}
            <Card>
              <CardHeader>
                <CardTitle>ملخص العملية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>إجمالي المنتجات:</span>
                    <Badge variant="outline">{currentReturn.items.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>تم الاسترجاع:</span>
                    <Badge variant={getReturnedItemsCount() > 0 ? "default" : "secondary"}>
                      {getReturnedItemsCount()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>المتبقي:</span>
                    <Badge variant="outline">
                      {currentReturn.items.length - getReturnedItemsCount()}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between font-medium">
                      <span>إجمالي المبلغ المسترجع:</span>
                      <span className="text-green-600">
                        {getTotalRefundAmount().toFixed(2)} ر.س
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products List */}
        {currentReturn && (
          <Card>
            <CardHeader>
              <CardTitle>منتجات الطلب</CardTitle>  
            </CardHeader>
            
            <CardContent>
              {currentReturn.items.length === 0 ? (
                <EmptyState
                  icon={<RotateCcw className="h-12 w-12" />}
                  title="لا توجد منتجات"
                  description="لا توجد منتجات في هذا الطلب"
                />
              ) : (
                <div className="space-y-3">
                  {currentReturn.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-lg transition-colors ${item.isReturned
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItems([...selectedItems, item.id]);
                                } else {
                                  setSelectedItems(selectedItems.filter(id => id !== item.id));
                                }
                              }}
                              className="h-4 w-4"
                            />
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-16 h-16 rounded-md object-cover border"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{item.productName}</h4>
                              <p className="text-sm text-muted-foreground">
                                باركود: {item.productBarcode}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {(item.originalPrice * item.quantity).toFixed(2)} ر.س
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} × {item.originalPrice.toFixed(2)} ر.س
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mr-4">
                          {item.isReturned ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              مسترجع
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              في الانتظار
                            </Badge>
                          )}
                        </div>
                        
                      </div>
                      
                    </div>
                  ))}
                </div>
              )}
              
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الاسترجاع</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من استرجاع المنتج التالي؟
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-medium">{confirmDialog.item?.productName}</div>
                <div className="text-sm text-muted-foreground">
                  الكمية: {confirmDialog.item?.quantity} × {confirmDialog.item?.originalPrice.toFixed(2)} ر.س
                </div>
                <div className="text-sm font-medium text-green-600">
                  مبلغ الاسترجاع: {((confirmDialog.item?.originalPrice || 0) * (confirmDialog.item?.quantity || 0)).toFixed(2)} ر.س
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReturn}
              disabled={processReturnMutation.isPending}
            >
              {processReturnMutation.isPending ? "جاري الاسترجاع..." : "تأكيد الاسترجاع"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}