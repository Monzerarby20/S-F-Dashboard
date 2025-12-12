import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RotateCcw, Scan, Clock, CheckCircle, XCircle, AlertTriangle, ScanBarcode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import EmptyState from "@/components/common/empty-state";
import { confirmReturn, lookupInvoice, requestRma, selectItmeToReturn, selectItmeToReplace, confirmReplace } from "@/services/return";

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
  const [replaceDailog,setReplaceDailog] = useState<boolean>(false)
  const [currentReturn, setCurrentReturn] = useState<object | null>(null);
  const [scannerInput, setScannerInput] = useState("");
  const [selectedItems, setSelectedItems] = useState<number | null>(null);
  const [finalConfirm, setFinalConfirm] = useState<boolean>(false);

  const [rmaId, setRmaId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    item?: ReturnOrderItem;
  }>({ open: false });
  const [returnData, setReturnData] = useState({});

  // const [rmaType, setRmaType] = useState<'return' | 'replace'>('return');
  const [rmaType, setRmaType] = useState('select');

  console.log("Opreation state: ", rmaType)
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
  // Resons
  const REASONS = [
    { value: "damaged", label: "المنتج تالف" },
    { value: "wrong_item", label: "تم استلام منتج خاطئ" },
    { value: "not_needed", label: "لا يحتاج المنتج" },
    { value: "wrong_size", label: "مقاس غير مناسب" },
    { value: "missing_parts", label: "المنتج ناقص قطع" },
    { value: "quality_issue", label: "مشاكل جودة" },
    { value: "changed_mind", label: "العميل غير رأيه" },
    { value: "other", label: "سبب آخر" },
  ]

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
  console.log("Current Return:", currentReturn);
  console.log("test invoice number:", currentReturn?.qrCode, "scannerInput:", scannerInput);
  //Mutation to request RMA
  const requestRmaMutation = useMutation({
    mutationFn: async (invoiceData: object) => {
      try {
        const response = await requestRma(invoiceData);
        return response;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || "فشل في إرسال طلب الاسترجاع");
      }
    },

    onSuccess: (data) => {
      setRmaId(data.id);
      toast({
        title: "تم إرسال الطلب",
        description: "تم إنشاء طلب الاسترجاع (RMA) بنجاح",
      });

      console.log("RMA Response:", data);
    },

    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  // test select item return
  console.log("selectedItems:", selectedItems);
  console.log("rmaId:", rmaId);

  // Process return item
  const processReturnMutation = useMutation({
    mutationFn: async (productData: object) => {
      try {
        const response = await selectItmeToReturn(rmaId as number, productData);
        return response;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || "فشل في إضافة المنتج إلى الاسترجاع");
      }
    },
    onSuccess: (data) => {
      // Update current return data
      if (currentReturn) {
        const updatedItems = currentReturn.items.map((item: any) =>
          item.id === data.itemId ? { ...item, isReturned: true } : item
        );
        setCurrentReturn({ ...currentReturn, items: updatedItems });
      }

      toast({
        title: "تم الاسترجاع",
        description: `تم اضافة المنتج إلى الاسترجاع بنجاح`,
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

  // Process replace item
  const processReplaceMutation = useMutation({
    mutationFn: async (productData: object) => {
      try {
        const response = await selectItmeToReplace(rmaId as number, productData);
        return response;
      } catch (error: any) {
        throw new Error(
          error.response?.data?.message || "فشل في إضافة المنتج للاستبدال"
        );
      }
    },

    onSuccess: (data) => {
      // تحديث بيانات الاستبدال الحالية
      if (currentReplace) {
        const updatedItems = currentReplace.items.map((item: any) =>
          item.id === data.itemId ? { ...item, isReplaced: true } : item
        );

        setCurrentReplace({ ...currentReplace, items: updatedItems });
      }

      toast({
        title: "تم إضافة المنتج للاستبدال",
        description: "تم إضافة المنتج المطلوب لاستبدال بنجاح",
      });

      setScannerInput("");
      setConfirmDialog({ open: false });
    },

    onError: (error: any) => {
      toast({
        title: "خطأ في الاستبدال",
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
      const item = currentReturn.items.find((item: any) =>
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
  console.log("confirmDialog:", confirmDialog);
  console.log("returnData:", returnData);
  const handleConfirmReturn = () => {
    if (rmaType === "return") {

      setFinalConfirm(true)
      const productData = {
        "product_id": selectedItems,
        "quantity": returnData[selectedItems]?.qty,
        "reason": returnData[selectedItems]?.reason,
        "notes": returnData[selectedItems]?.notes,
      }
      console.log("productData:", productData);
      processReturnMutation.mutate(productData);

    } else if (rmaType === "replace") {
      setReplaceDailog(true)
      const replaceData = {
        "product_to_return":selectedItems,
        "quantity_of_returned_product": returnData[selectedItems]?.qty,

        "product_replaced": 4,
        "quantity_of_replaced_product": 1,

        "reason": returnData[selectedItems]?.reason,
        "notes": returnData[selectedItems]?.notes
      }
    }
  };

  const confirmReturnMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await confirmReturn(rmaId as number);
        return response;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || "فشل في تأكيد الاسترجاع");
      }
    },

    onSuccess: (data) => {
      console.log("here from success")
      toast({
        title: "تم تأكيد الاسترجاع",
        description: "تم تأكيد الاسترجاع بنجاح.",
      });

      // Close the final confirm dialog
      setFinalConfirm(false);
      setTimeout(() => {
        resetReturn()
      }, 100)
    },

    onError: (error: Error) => {
      toast({
        title: "خطأ أثناء التأكيد",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  const handleConfirm = () => {
    console.log("here from confirm")
    confirmReturnMutation.mutate();
  }

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
    setSelectedItems(null);
    setConfirmDialog({ open: false });
    setReturnData({});
    setRmaId(null);
    setRmaType("select");
    setFinalConfirm(false);
    // لو في أي حقول أو ورق مربوط بالطلب نظّفها برضو
    queryClient.clear(); // optional لو عايز تمسح أي data cached
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
                              checked={selectedItems === item.productId}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItems(item.productId);

                                  setReturnData(prev => ({
                                    ...prev,
                                    [item.productId]: {
                                      qty: 1,
                                      reason: "",
                                      notes: ""
                                    }
                                  }));
                                } else {
                                  setSelectedItems(null);
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

                        {/* Return / Replace Selector */}
                        <div className="mb-4">
                          <label className="block mb-2 font-medium">نوع العملية</label>

                          <select
                            className="w-full border rounded-lg p-1 m-2 bg-white text-[#747474] dark:bg-gray-900"
                            value={rmaType}
                            onChange={(e) => {
                              const value = e.target.value as 'return' | 'replace';
                              setRmaType(value);
                              const rmaData = {
                                "invoice_number": currentReturn.qrCode,
                                "rma_type": value,
                                "notes": "Customer wants to return items"
                              }

                              // 🔥 شغّل الميوتيشن
                              requestRmaMutation.mutate(
                                rmaData
                              );
                            }}
                          >
                            <option disabled value="select">اختر العملية</option>

                            <option value="return">استرجاع</option>
                            <option value="replace">استبدال</option>
                          </select>
                        </div>

                      </div>

                      {selectedItems === item.productId && (
                        <div className="mt-4 p-4 border rounded-lg bg-gray-50">

                          {/* كمية الاسترجاع */}
                          <label className="font-medium">الكمية المسترجعة</label>
                          <div className="flex items-center mt-2 gap-2">
                            <button
                              className="px-3 py-1 border rounded"
                              onClick={() => {
                                setReturnData(prev => ({
                                  ...prev,
                                  [item.productId]: {
                                    ...prev[item.productId],
                                    qty: Math.max(1, prev[item.productId].qty - 1)
                                  }
                                }));
                              }}
                            >
                              -
                            </button>

                            <span className="px-4">{returnData[item.productId]?.qty}</span>

                            <button
                              className="px-3 py-1 border rounded"
                              onClick={() => {
                                setReturnData(prev => ({
                                  ...prev,
                                  [item.productId]: {
                                    ...prev[item.productId],
                                    qty: Math.min(item.quantity, prev[item.productId].qty + 1) // 🔥 هنا الضمان إن الكمية لا تتعدى الفاتورة
                                  }
                                }));
                              }}
                            >
                              +
                            </button>
                          </div>

                          {/* سبب الاسترجاع */}

                          <label className="font-medium mt-4 block">سبب الاسترجاع</label>
                          <select
                            className="w-full p-2 border rounded mt-2"
                            value={returnData[item.productId]?.reason}
                            onChange={(e) => {
                              setReturnData(prev => ({
                                ...prev,
                                [item.productId]: {
                                  ...prev[item.productId],
                                  reason: e.target.value
                                }
                              }));
                            }}
                          >
                            <option value="">اختر السبب</option>
                            {REASONS.map((reason) => (
                              <option key={reason.value} value={reason.value}>
                                {reason.label}
                              </option>
                            ))}
                          </select>

                          {/* ملاحظات */}
                          <label className="font-medium mt-4 block">ملاحظات</label>
                          <textarea
                            className="w-full p-2 border rounded mt-2"
                            placeholder="أضف أي ملاحظات..."
                            value={returnData[item.productId]?.notes}
                            onChange={(e) => {
                              setReturnData(prev => ({
                                ...prev,
                                [item.productId]: {
                                  ...prev[item.productId],
                                  notes: e.target.value
                                }
                              }));
                            }}
                          />


                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </CardContent>
          </Card>
        )}
        {/* الأزرار */}

        <div className="space-y-3">
          <Button
            className="w-full"
            size="lg"
            disabled={fetchReturnOrderMutation.isPending || requestRmaMutation.isPending || processReturnMutation.isPending}
            onClick={handleConfirmReturn}
          >
            {fetchReturnOrderMutation.isPending || requestRmaMutation.isPending || processReturnMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                جاري المعالجة...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 ml-2" />
                إتمام الاسترجاع
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSelectedItems(null)}
            disabled={selectedItems === null}
          >
            الغاء
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {/* <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open })}>
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
            <AlertDialogAction asChild>
  <Button onClick={handleConfirm}>تأكيد</Button>
</AlertDialogAction>

          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}
      <AlertDialog open={finalConfirm} onOpenChange={setFinalConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">تأكيد العملية</AlertDialogTitle>

            <AlertDialogDescription asChild>
              <div className="text-right">

                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">

                  {/* خط واحد: عنوان يمين + قيمة شمال */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم الفاتورة:</span>
                    <span className="font-medium">{currentReturn?.qrCode}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">اسم العميل:</span>
                    <span className="font-medium">{currentReturn?.customerName}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم الهاتف:</span>
                    <span className="font-medium">{currentReturn?.customerPhone}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">مبلغ الاسترجاع:</span>
                    <span className="font-medium">{currentReturn?.totalAmount}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">طريقة الدفع:</span>
                    <span className="font-medium">{currentReturn?.paymentMethod}</span>
                  </div>

                </div>

                <p className="mt-4">عند تأكيد العملية سيتم:</p>

                <ul className="mt-3 list-disc pr-5 space-y-1">
                  <li>إنشاء عملية استرجاع للمنتجات المحددة</li>
                  <li>معالجة عملية استرداد المبلغ</li>
                  <li>تحديث حالة الفاتورة</li>
                  <li>إصدار إشعار دائن (إن لزم)</li>
                </ul>

              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>رجوع</AlertDialogCancel>

            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm(); // ← مهم جداً
              }}
              disabled={confirmReturnMutation.isPending}
            >
              {confirmReturnMutation.isPending ? "جاري التأكيد..." : "تأكيد"}
            </AlertDialogAction>

          </AlertDialogFooter>
        </AlertDialogContent>


      </AlertDialog>

    </PageLayout>
  );
}