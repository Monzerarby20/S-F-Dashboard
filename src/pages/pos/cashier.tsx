import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScanBarcode, ShoppingCart, Plus, Minus, X, Menu, Package, QrCode, CheckCircle, XCircle, AlertTriangle, User, CreditCard, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/common/loading";
import QuickCustomerAdd from "@/components/customers/quick-customer-add";
import TestQRGenerator from "@/components/qr/test-qr-generator";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
}

interface QROrderItem {
  productId: number;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  scannedQuantity: number;
  isComplete: boolean;
}

interface QROrder {
  id: number;
  qrCode: string;
  customerId?: number;
  customerName?: string;
  totalAmount: number;
  paymentStatus: string;
  paymentTransactionId?: string;
  items: QROrderItem[];
  status: string;
  createdAt: string;
}

export default function CashierPOS() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // QR Verification State
  const [activeTab, setActiveTab] = useState("pos");
  const [currentOrder, setCurrentOrder] = useState<QROrder | null>(null);
  const [qrInput, setQrInput] = useState("");
  const [isQRScanning, setIsQRScanning] = useState(false);

  // Fetch products by barcode
  const findProductMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const response = await apiRequest('GET', `/api/products/barcode/${barcode}`);
      return response.json();
    },
    onSuccess: (product) => {
      addToCart(product);
      setBarcodeInput("");
      setIsScanning(false);
      toast({
        title: "تم إضافة المنتج",
        description: `تم إضافة ${product.name} للسلة`,
      });
    },
    onError: () => {
      setBarcodeInput("");
      setIsScanning(false);
      toast({
        title: "المنتج غير موجود",
        description: "لم يتم العثور على منتج بهذا الباركود",
        variant: "destructive",
      });
    },
  });

  // Process order mutation
  const processOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest('POST', '/orders', orderData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إتمام البيع",
        description: "تم حفظ الطلب بنجاح",
      });
      clearCart();
      setSelectedCustomer(null);
      queryClient.invalidateQueries({ queryKey: ['/dashboard'] });
    },
    onError: () => {
      toast({
        title: "خطأ في الطلب",
        description: "فشل في حفظ الطلب",
        variant: "destructive",
      });
    },
  });

  // Handle barcode scanning
  const handleBarcodeSubmit = () => {
    if (!barcodeInput.trim()) return;
    
    const input = barcodeInput.trim();
    
    // Check if it's a QR code (starts with QR-) for customer orders
    if (input.startsWith('QR-') && activeTab === "qr-verification") {
      setQrInput(input);
      fetchQROrderMutation.mutate(input);
    } else {
      // Regular barcode scanning
      if (activeTab === "pos") {
        setIsScanning(true);
        findProductMutation.mutate(input);
      } else if (activeTab === "qr-verification" && currentOrder) {
        setIsQRScanning(true);
        scanProductMutation.mutate({
          qrOrderId: currentOrder.id,
          barcode: input
        });
      }
    }
  };

  // Cart operations
  const addToCart = (product: any) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, {
          id: product.id,
          name: product.name,
          price: parseFloat(product.originalPrice),
          quantity: 1,
          barcode: product.barcode
        }];
      }
    });
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleProcessOrder = () => {
    if (cart.length === 0) return;

    const orderData = {
      customerId: selectedCustomer?.id,
      branchId: 1, // Default branch
      employeeId: user?.id,
      status: 'completed',
      paymentMethod: 'cash',
      subtotal: calculateTotal().toFixed(2),
      discountAmount: "0",
      vatAmount: (calculateTotal() * 0.15).toFixed(2),
      totalAmount: (calculateTotal() * 1.15).toFixed(2),
      paidAmount: (calculateTotal() * 1.15).toFixed(2),
      changeAmount: "0"
    };

    processOrderMutation.mutate(orderData);
  };

  // QR Order mutations
  const fetchQROrderMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      const response = await apiRequest('GET', `/api/qr-orders/${encodeURIComponent(qrCode)}`);
      return response.json();
    },
    onSuccess: (order) => {
      setCurrentOrder(order);
      toast({
        title: "تم تحميل الطلب",
        description: `تم العثور على طلب العميل - ${order.items.length} منتج`,
      });
    },
    onError: () => {
      toast({
        title: "QR غير صحيح",
        description: "لم يتم العثور على طلب بهذا الرمز",
        variant: "destructive",
      });
    },
  });

  const scanProductMutation = useMutation({
    mutationFn: async (data: { qrOrderId: number; barcode: string }) => {
      const response = await apiRequest('POST', '/qr-orders/scan-product', data);
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        // Update local state
        setCurrentOrder(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map(item => 
              item.barcode === result.barcode
                ? { 
                    ...item, 
                    scannedQuantity: result.scannedQuantity,
                    isComplete: result.scannedQuantity >= item.quantity 
                  }
                : item
            )
          };
        });

        if (result.isComplete) {
          toast({
            title: "تم التحقق من المنتج",
            description: `تم التحقق من جميع قطع ${result.productName}`,
          });
        } else {
          toast({
            title: "تم مسح قطعة",
            description: `${result.productName} - ${result.scannedQuantity}/${result.expectedQuantity}`,
          });
        }
      } else {
        toast({
          title: result.message || "خطأ في المسح",
          variant: "destructive",
        });
      }
      setBarcodeInput("");
      setIsQRScanning(false);
    },
    onError: () => {
      toast({
        title: "خطأ في المسح",
        description: "فشل في تسجيل المسح",
        variant: "destructive",
      });
      setIsQRScanning(false);
    },
  });

  const completeVerificationMutation = useMutation({
    mutationFn: async (qrOrderId: number) => {
      const response = await apiRequest('POST', `/api/qr-orders/${qrOrderId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إتمام التحقق",
        description: "تم التحقق من جميع المنتجات بنجاح",
      });
      setCurrentOrder(null);
      setQrInput("");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إتمام التحقق",
        variant: "destructive",
      });
    },
  });

  const getVerificationCircles = (expected: number, scanned: number) => {
    const circles = [];
    for (let i = 0; i < expected; i++) {
      circles.push(
        <span
          key={i}
          className={`verification-circle ${i < scanned ? 'checked' : 'unchecked'}`}
        />
      );
    }
    return circles;
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">مدفوع</Badge>;
      case 'pending':
        return <Badge variant="secondary">في الانتظار</Badge>;
      case 'failed':
        return <Badge variant="destructive">فشل الدفع</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAllItemsVerified = () => {
    return currentOrder?.items.every(item => item.isComplete) || false;
  };

  const getMissingItems = () => {
    return currentOrder?.items.filter(item => !item.isComplete) || [];
  };

  if (!user) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      {!isSidebarCollapsed && <Sidebar />}
      
      <main className="flex-1 overflow-hidden">
        <TopBar>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="mr-2"
          >
            {isSidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </Button>
        </TopBar>
        
        <div className="p-4 overflow-y-auto h-full custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                شاشة الكاشير
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>القائمة الجانبية:</span>
                <Badge variant={isSidebarCollapsed ? "destructive" : "default"}>
                  {isSidebarCollapsed ? "مخفية" : "ظاهرة"}
                </Badge>
              </div>
            </div>

            {/* Mode Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pos" className="flex items-center gap-2">
                  <ScanBarcode className="h-4 w-4" />
                  نقطة البيع العادية
                </TabsTrigger>
                <TabsTrigger value="qr-verification" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  التحقق من طلبات العملاء
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pos" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Product Scanner & Cart */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Barcode Scanner */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ScanBarcode className="h-5 w-5" />
                          مسح المنتجات
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Input
                            placeholder="امسح باركود المنتج..."
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleBarcodeSubmit();
                              }
                            }}
                            className="flex-1 text-lg p-4"
                            disabled={isScanning}
                          />
                          <Button 
                            onClick={handleBarcodeSubmit}
                            disabled={isScanning || !barcodeInput.trim()}
                            className="px-6"
                          >
                            {isScanning ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <ScanBarcode className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Shopping Cart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            سلة التسوق
                          </span>
                          <Badge variant="secondary">{cart.length} منتج</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {cart.length === 0 ? (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>لا توجد منتجات في السلة</p>
                            <p className="text-sm">امسح باركود المنتج لإضافته</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {cart.map((item) => (
                              <Card key={item.id} className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                      {item.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {item.price.toLocaleString('ar-SA')} ر.س للقطعة
                                    </p>
                                    {item.barcode && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        الباركود: {item.barcode}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="font-medium w-8 text-center">
                                        {item.quantity}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    
                                    <div className="text-center">
                                      <p className="font-bold text-lg">
                                        {(item.price * item.quantity).toLocaleString('ar-SA')} ر.س
                                      </p>
                                    </div>
                                    
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => removeFromCart(item.id)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Order Summary & Payment */}
                  <div className="space-y-6">
                    {/* Customer Selection */}
                    <Card>
                      <CardHeader>
                        <CardTitle>العميل</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <QuickCustomerAdd
                          selectedCustomer={selectedCustomer}
                          onCustomerSelect={setSelectedCustomer}
                        />
                      </CardContent>
                    </Card>

                    {/* Order Total */}
                    <Card>
                      <CardHeader>
                        <CardTitle>ملخص الطلب</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>المجموع الفرعي:</span>
                            <span>{calculateTotal().toLocaleString('ar-SA')} ر.س</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ضريبة القيمة المضافة (15%):</span>
                            <span>{(calculateTotal() * 0.15).toLocaleString('ar-SA')} ر.س</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-lg font-bold">
                            <span>الإجمالي:</span>
                            <span>{(calculateTotal() * 1.15).toLocaleString('ar-SA')} ر.س</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Button 
                            className="w-full" 
                            size="lg"
                            disabled={cart.length === 0 || processOrderMutation.isPending}
                            onClick={handleProcessOrder}
                          >
                            {processOrderMutation.isPending ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                                جاري المعالجة...
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="h-4 w-4 ml-2" />
                                إتمام البيع
                              </>
                            )}
                          </Button>

                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={clearCart}
                            disabled={cart.length === 0}
                          >
                            مسح السلة
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="qr-verification" className="space-y-6">
                {!currentOrder ? (
                  <div className="space-y-6">
                    {/* QR Scanner */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <QrCode className="h-6 w-6" />
                          مسح QR كود العميل
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="max-w-md mx-auto space-y-4">
                          <div className="flex gap-2">
                            <Input
                              placeholder="امسح QR كود العميل أو باركود المنتج..."
                              value={barcodeInput}
                              onChange={(e) => setBarcodeInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleBarcodeSubmit();
                                }
                              }}
                              className="flex-1 text-lg p-4"
                              autoFocus
                            />
                            <Button 
                              onClick={handleBarcodeSubmit}
                              disabled={fetchQROrderMutation.isPending}
                              className="px-6"
                            >
                              {fetchQROrderMutation.isPending ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <ScanBarcode className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-center text-gray-600 dark:text-gray-400">
                            امسح QR كود من تطبيق العميل أو استخدم الماسح المتعدد (D1/D2)
                          </p>
                          <div className="text-center mt-2">
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              💡 استخدم المولد التجريبي أدناه لإنشاء QR تجريبي للاختبار
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Test QR Generator */}
                    <TestQRGenerator />
                  </div>
                ) : (
                  /* Order Verification Interface */
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Product Verification */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Barcode Scanner */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <ScanBarcode className="h-5 w-5" />
                            مسح المنتجات للتحقق
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2">
                            <Input
                              placeholder="امسح باركود المنتج للتحقق..."
                              value={barcodeInput}
                              onChange={(e) => setBarcodeInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleBarcodeSubmit();
                                }
                              }}
                              className="flex-1 text-lg p-4"
                              disabled={isQRScanning}
                            />
                            <Button 
                              onClick={handleBarcodeSubmit}
                              disabled={isQRScanning || !barcodeInput.trim()}
                              className="px-6"
                            >
                              {isQRScanning ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <ScanBarcode className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Product List */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Package className="h-5 w-5" />
                              قائمة المنتجات
                            </span>
                            <Badge variant={getAllItemsVerified() ? "default" : "secondary"}>
                              {currentOrder.items.filter(item => item.isComplete).length} / {currentOrder.items.length}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {currentOrder.items.map((item, index) => (
                              <Card key={index} className={`p-4 ${item.isComplete ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-red-50 dark:bg-red-900/20 border-red-200'}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${item.isComplete ? 'bg-green-500' : 'bg-red-500'}`}>
                                      {item.isComplete ? (
                                        <CheckCircle className="h-4 w-4 text-white" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-white" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {item.productName}
                                      </p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        الباركود: {item.barcode}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 mb-2">
                                      {getVerificationCircles(item.quantity, item.scannedQuantity)}
                                    </div>
                                    <p className="text-sm font-medium">
                                      {item.scannedQuantity} / {item.quantity}
                                    </p>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-6">
                      {/* Customer Info */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            معلومات الطلب
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span>العميل:</span>
                            <span>{currentOrder.customerName || 'عميل ضيف'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>إجمالي المبلغ:</span>
                            <span>{currentOrder.totalAmount.toLocaleString('ar-SA')} ر.س</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>حالة الدفع:</span>
                            {getPaymentStatusBadge(currentOrder.paymentStatus)}
                          </div>
                          {currentOrder.paymentTransactionId && (
                            <div className="flex justify-between">
                              <span>رقم العملية:</span>
                              <span className="text-sm font-mono">{currentOrder.paymentTransactionId}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>وقت الطلب:</span>
                            <span className="text-sm">{new Date(currentOrder.createdAt).toLocaleString('ar-SA')}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Missing Items Alert */}
                      {getMissingItems().length > 0 && (
                        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                              <AlertTriangle className="h-5 w-5" />
                              منتجات مفقودة
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {getMissingItems().map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span>{item.productName}</span>
                                  <span>{item.quantity - item.scannedQuantity} قطعة</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <Button
                          onClick={() => completeVerificationMutation.mutate(currentOrder.id)}
                          disabled={!getAllItemsVerified() || completeVerificationMutation.isPending}
                          className="w-full"
                          size="lg"
                        >
                          {completeVerificationMutation.isPending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                              جاري الإتمام...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 ml-2" />
                              إتمام التحقق
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            setCurrentOrder(null);
                            setQrInput("");
                          }}
                          className="w-full"
                        >
                          إلغاء والبدء من جديد
                        </Button>

                        {!getAllItemsVerified() && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 text-center">
                            يجب التحقق من جميع المنتجات قبل الإتمام
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}