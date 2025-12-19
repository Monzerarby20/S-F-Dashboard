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
import { ScanBarcode, ShoppingCart, Plus, Minus, X, Menu, Package, QrCode, CheckCircle, XCircle, AlertTriangle, User, CreditCard, Trash2, Wallet, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/common/loading";
import QuickCustomerAdd from "@/components/customers/quick-customer-add";
import { checkoutProcess, getProductByBartcode, removeProduct, updateCartItem, getSummary, emptyCart, addToCartApi, getCartItem, checkoutOrder, validateCashPayment, getOrderByOrd, verifyOrder } from "@/services/cashier";
import SixPointsIcon from "@/components/ui/SixPointsIcon";
import { getStoreBySlug } from "@/services/stores";
import { motion, AnimatePresence } from "framer-motion";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
}

interface QROrderItem {
  productId: number;
  name: string;
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
  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  //order data in order with qr tap
  const [orderDataDetails, setOrderData] = useState<any>(null)

  const [step, setStep] = useState("select"); // select | cash | processing | success
  const [paidAmount, setPaidAmount] = useState("");

  const [change, setChange] = useState(0);

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  // const [cartApi,setCartApi] = useState<CartItem[]>([])
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // QR Verification State
  const [activeTab, setActiveTab] = useState("pos");
  const [currentOrder, setCurrentOrder] = useState<QROrder | null>(null);
  const [qrInput, setQrInput] = useState("");
  const [isQRScanning, setIsQRScanning] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")
  // Customer Orders Verification State
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  const [isOrderDone, setIsOrderDone] = useState<boolean>(false)
  //order state
  const [orderState, setOrderState] = useState<boolean>(false)
  const [ordValue, setOrdValue] = useState<string>("")

  // Fetch user store data
  const userStoreSlug: string = localStorage.getItem("userSlug")
  const { data: store, isLoading: storeLoading, error: storeError } = useQuery({
    queryKey: ['/stores', userStoreSlug],
    queryFn: () => getStoreBySlug(userStoreSlug),
    enabled: !!userStoreSlug,
  });
  //Fetch cart data
  const { data: cartApi, isLoading: cartLoading, error: carError } = useQuery({
    queryKey: ['cartApi'],
    queryFn: getCartItem,
  })
  console.log("cartItems", cartApi)
  const { data: cartSummary = [], isLoading: cartSummaryLoading, error: carSummaryError } = useQuery({
    queryKey: ['cartSummary'],
    queryFn: getSummary,
  })
  console.log("cartItems from summary", cartSummary)

  useEffect(() => {
    console.log("fetched current store", store);
  }, [store]);

  const storeLatitude = store?.latitude ?? null;
  const storeLongitude = store?.longitude ?? null;
  console.log("fetched current store", store)

  console.log(storeLatitude, storeLongitude)
  // Fetch products by barcode
  const handleProcessOrder2 = () => {
    if (!paymentMethod) return;

    if (paymentMethod === "cash") {
      setStep("cash");
    } else if (paymentMethod === "visa") {
      setStep("processing");
      // simulate processing
      setTimeout(() => {
        setStep("success");
      }, 2000);
    } else if (step === "cash") {
      setStep("success");
    }
  };

  const findProductMutation = useMutation({
    mutationFn: async (payload) => {
      console.log("➡️ Mutation started with:", payload);
      const response = await getProductByBartcode(payload);
      console.log("✅ Product fetched:", response);

      return response;
    },
    onSuccess: (data) => {
      const product = data.product;
      console.log("🎉 onSuccess fired:", product);
      addToCart(product);

      const productDate = {
        "product_id": data.product.id,
        "quantity": 1,
        "latitude": storeLatitude,
        "longitude": storeLongitude,
        "notes": data.product.description
      }
      console.log("Product data that will add in cart", productDate)
      addToCartMutation.mutate(productDate)
      setBarcodeInput("");
      setIsScanning(false);
      toast({
        title: "تم إضافة المنتج",
        description: `تم إضافة ${product.name} للسلة`,
      });
    },
    onError: (error) => {
      console.log("❌ onError fired:", error);
      setBarcodeInput("");
      setIsScanning(false);
      toast({
        title: "المنتج غير موجود",
        description: "لم يتم العثور على منتج بهذا الباركود",
        variant: "destructive",
      });
    },
  });

  //Empty cart
  const emptyCartMutation = useMutation({
    mutationFn: emptyCart,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cartSummary'] });

      toast({
        title: "تم مسح السلة",
        description: "تم تفريغ جميع المنتجات من السلة",
      });
      console.log("🧹 Cart cleared:", data);
      queryClient.invalidateQueries({ queryKey: ["cartApi"] });
    },
    onError: (error) => {
      toast({
        title: "خطأ في التفريغ",
        description: "لم يتم مسح السلة بنجاح",
        variant: "destructive",
      });
      console.error("❌ Error clearing cart:", error);
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: addToCartApi,
    onSuccess: (data) => {
      toast({
        title: "تمت الإضافة",
        description: "تمت إضافة المنتج إلى السلة بنجاح",
      });
      console.log("✅ Added to cart:", data);
      queryClient.invalidateQueries({ queryKey: ["cartApi"] });
      queryClient.invalidateQueries({ queryKey: ['cartSummary'] });

    },
    onError: (error) => {
      toast({
        title: "خطأ في الإضافة",
        description: "فشل في إضافة المنتج إلى السلة",
        variant: "destructive",
      });
      console.error("❌ Error adding to cart:", error);
    },
  });
  // Remove Product
  const removeProductMutation = useMutation({
    mutationFn: removeProduct,
    onSuccess: (data) => {
      toast({
        title: "تم حذف المنتج",
        description: "تم حذف المنتج من السلة بنجاح",
      });
      console.log("🗑️ Product removed:", data);
      queryClient.invalidateQueries({ queryKey: ["cartApi"] });
      queryClient.invalidateQueries({ queryKey: ['cartSummary'] });

    },
    onError: (error) => {
      toast({
        title: "خطأ في الحذف",
        description: "لم يتم حذف المنتج من السلة",
        variant: "destructive",
      });
      console.error("❌ Error removing product:", error);
    },
  });

  // Process order mutation
  const processOrderMutation = useMutation({
    mutationFn: checkoutProcess,

    onSuccess: (data) => {

      console.log("Created Order:", data);

      // نجيب الاوردر نمبر مباشرة بدون استخدام ستايت
      const newOrderNumber = data.order_number;

      // نعمل verify فورا مباشرة بعد الإنشاء
      verifyOrderMutation.mutate({
        order_number: newOrderNumber,
        paid_amount: paidAmount,
        confirm: true
      });

      // لو محتاج تخزنها للواجهة فقط
      setOrdValue(newOrderNumber);

      setIsOrderDone(true);
      clearCart();
      setSelectedCustomer(null);

      toast({
        title: "تم إتمام البيع",
        description: "تم حفظ الطلب وتم تأكيده",
      });
    },

    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الطلب",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    console.log("🔥 ordValue UPDATED:", ordValue);
  }, [ordValue]);
  const handleProcessOrder3 = () => {
    if (step === "cash") {
      // هنا المستخدم في شاشة الكاش وضغط "إصدار الفاتورة"
      if (!paidAmount || paidAmount < total) {
        toast({
          title: "الرجاء ادخال مبلغ مناسب",
          description: "ادخل مبلغ يعادل السعر المناسب",
          variant: "destructive",
        });
        return;
      }
      // setPaidAmount(paidAmount)
      setStep("success"); // لو تمام، يروح لشاشة النجاح
    }
  };

  // mutation to get order by ord
  const getOrderMutation = useMutation({
    mutationFn: (ord: string) => getOrderByOrd(ord),

    onSuccess: (orderData) => {
      setOrderData(orderData.qr_decoded)
      setOrderState(true)
      setBarcodeInput("");
      setOrdValue(orderData.order_number)
      toast({
        title: "تم جلب الطلب بنجاح",
        description: `رقم الطلب: ${orderData?.order_number ?? "غير معروف"}`,
      });

      console.log("Order Data:", orderData);
    },

    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات الطلب",
        variant: "destructive",
      });
    },
  });



  //verify order mutation
  // mutation to verify order
  const verifyOrderMutation = useMutation({
    mutationFn: (data: object) => verifyOrder(data),

    onSuccess: (res) => {
      setOrderData(null)
      setShowPopup(false)
      setOrderState(false)
      setOrdValue("")
      setStep("select")
      toast({
        title: "تم التحقق من الدفع بنجاح",
        description: "تم التأكيد على الطلب.",
      });

      console.log("Verify Order Response:", res);
    },

    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في التحقق من الطلب",
        variant: "destructive",
      });

      console.log("Verify Order Error:", error);
    },
  });

  //remove order 
  const removeOrder = () => {
    setOrderState(false)
    setOrderData(null)
  }
  // Handle barcode scanning
  const handleBarcodeSubmit = () => {
    if (!barcodeInput.trim()) return;

    const input = barcodeInput.trim();

    // Handle invoice (PDF) input
    if (input.endsWith(".pdf")) {
      setInvoiceUrl(input);
      toast({
        title: "تم تحميل الفاتوره",
        description: "يمكنك الآن عرض أو طباعة الفاتورة من الأسفل.",
      });
      return;
    }

    // Handle QR code scanning (for customer orders)
    if (input.startsWith("QR-") && activeTab === "qr-verification") {
      setQrInput(input);
      fetchQROrderMutation.mutate(input);
    } else {
      // Regular barcode scanning
      if (activeTab === "pos") {
        setIsScanning(true);


        // ✅ Correct payload for your backend
        const payload = {
          barcode: input,
          latitude: storeLatitude ?? 29.9601,
          longitude: storeLongitude ?? 31.2594,
        };

        console.log("📦 Payload sent:", payload);

        // ✅ Fixed mutation call to send payload properly
        findProductMutation.mutate(payload);
      } else if (activeTab === "customer-orders") {
        if (input.startsWith("ORD")) {
          getOrderMutation.mutate(input);

        }
      }
      // Handle QR verification scanning
      else if (activeTab === "qr-verification" && currentOrder) {
        setIsQRScanning(true);

        // ✅ Make sure we send full object for QR order scan
        scanProductMutation.mutate({
          qrOrderId: currentOrder.id,
          barcode: input,
        });
      }
    }
  };



  // Cart operations
  const addToCart = (product: any) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);

      if (existingItem) {
        // If item already exists, just increment quantity
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item with extra details
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: parseFloat(product.pricing.final_price),
            quantity: 1,
            barcode: product.barcode,
            image_url: product.image_url || "",             // 🆕 image
            loyalty_points: product.loyalty_points || 0,     // 🆕 points
            weight: product.weight || "",                    // 🆕 weight
          },
        ];
      }
    });
  };



  const updateQuantity = (
    cartItemId: number,
    productId: number,
    newQuantity: number
  ) => {

    if (newQuantity <= 0) {
      removeFromCart(cartItemId);

      console.log("Deleting cart item:", cartItemId);

      removeProductMutation.mutate(cartItemId);
      return;
    }

    const editedData = {
      product_id: productId,   // ده جوه البودي
      quantity: newQuantity,
      notes: "Need them ASAP"
    };

    console.log("Edited data:", editedData);

    updateCartMutation.mutate({
      cartItemId,  // ده اللي هيتبعت في الريكوست
      editedData
    });

    // تحديث الواجهة
    setCart(prev =>
      prev.map(item =>
        item.cart_item_id === cartItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };


  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));

    removeProductMutation.mutate(id);


  };

  const clearCart = () => {
    emptyCartMutation.mutate();

    setCart([]);
  };

  const calculateTotal = () => {
    return cartSummary.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
  };

  //Get Total
  const getTotal = () => {
    if (activeTab === "pos") {
      return calculateTotal() * 1.15;

    }

    if (activeTab === "customer-orders") {
      return orderDataDetails?.totals.grand_total ?? 0;
    }

    return 0;
  };

  const total = getTotal();

  const handleProcessOrder = () => {
    console.log("I'm here in handleprocessorder")

    if (activeTab === "pos") {

      if (cartApi.length === 0) return;

      const orderData = {

        // customerId: selectedCustomer?.id,
        branchId: 1, // Default branch
        employeeId: user?.id,
        status: 'completed',
        payment_method: paymentMethod,
        subtotal: calculateTotal().toFixed(2),
        latitude: storeLatitude,
        longitude: storeLongitude,
        discountAmount: "0",
        vatAmount: (calculateTotal() * 0.15).toFixed(2),
        totalAmount: (calculateTotal() * 1.15).toFixed(2),
        paidAmount: (calculateTotal() * 1.15).toFixed(2),
        changeAmount: "0"
      };
      console.log("Order details", orderData)

      processOrderMutation.mutate(orderData);
    } else if (activeTab === "customer-orders") {
      const payload = {
        "order_number": ordValue,
        "paid_amount": paidAmount,
        "confirm": true
      }

      console.log("order verifecaiton", payload)

      verifyOrderMutation.mutate(payload)
    }
  };
  //Update item in cart
  const updateCartMutation = useMutation({
    mutationFn: ({ cartItemId, editedData }: { cartItemId: number; editedData: any }) =>
      updateCartItem(cartItemId, editedData),
    onSuccess: (data) => {
      toast({
        title: "تم التحديث",
        description: "تم تعديل المنتج في السلة بنجاح",
      });
      console.log("📝 Product updated:", data);
      queryClient.invalidateQueries({ queryKey: ["cartApi"] });
      queryClient.invalidateQueries({ queryKey: ['cartSummary'] });

    },
    onError: (error) => {
      toast({
        title: "خطأ في التحديث",
        description: "فشل تعديل المنتج في السلة",
        variant: "destructive",
      });
      console.error("❌ Error updating product:", error);
    },
  });


  // QR Order mutations
  const fetchQROrderMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      return await fetchQROrderByCode(qrCode);
    },
    onSuccess: (order) => {
      setCurrentOrder(order);
      setBarcodeInput("");
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

  const handleCancel = () => {
    setStep("select");
    setPaymentMethod("");
    setPaidAmount("");
    setShowPopup(false);
  };
  console.log("PaidAmount: ", paidAmount)
  console.log("total: ", total)

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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pos" className="flex items-center gap-2">
                  <ScanBarcode className="h-4 w-4" />
                  نقطة البيع العادية
                </TabsTrigger>
                <TabsTrigger value="customer-orders" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  التحقق من طلبات العملاء
                </TabsTrigger>
                <TabsTrigger value="qr-verification" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  مسح كود الفاتورة
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
                            type="text"
                            placeholder="امسح باركود المنتج..."
                            value={barcodeInput}
                            onChange={(e) => {
                              let value = e.target.value;

                              // حروف + أرقام فقط
                              value = value.replace(/[^a-zA-Z0-9]/g, "");

                              // حد أقصى 20
                              value = value.slice(0, 20);

                              // إجبار قيمة الـ DOM (مهم مع scanner)
                              e.target.value = value;

                              setBarcodeInput(value);
                              setOrdValue(value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && barcodeInput.trim()) {
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
                          <Badge variant="secondary">{cartSummary.length} منتج</Badge>
                        </CardTitle>
                      </CardHeader>

                      <CardContent>
                        {cartSummary.length === 0 ? (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>لا توجد منتجات في السلة</p>
                            <p className="text-sm">امسح باركود المنتج لإضافته</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {cartSummary.map((item) => (

                              <Card key={item.id} className="p-4">
                                <div className="flex items-center justify-between gap-4">

                                  {/* ✅ Product Image */}
                                  {item.product_image && (
                                    <img
                                      src={item.product_image}
                                      alt={item.product_name}
                                      className="w-16 h-16 rounded-md object-cover border"
                                    />
                                  )}

                                  {/* ✅ Product Info */}
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                      {item.name}
                                    </h4>

                                    {/* ✅ Weight */}
                                    {item.weight && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {item.weight} جرام
                                      </p>
                                    )}

                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {Number(item.unit_price).toLocaleString('ar-SA')} ر.س للقطعة
                                    </p>

                                    {/* ✅ Barcode */}
                                    {item.barcode && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        الباركود: {item.barcode}
                                      </p>
                                    )}

                                    {/* ✅ Loyalty Points */}
                                    {item.loyalty_points_per_item !== undefined && (
                                      <div className="flex items-center gap-1 mt-1 text-green-600 dark:text-green-400 text-sm">
                                        <span><SixPointsIcon /></span>
                                        <span>{item.loyalty_points_per_item} نقاط</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* ✅ Quantity Controls + Total + Remove */}
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border border-red-500 text-red-500 bg-white hover:bg-red-500 hover:text-white transition-all duration-200 rounded-full w-8 h-8 flex items-center justify-center"

                                        onClick={() => updateQuantity(item.cart_item_id, item.product_id, item.quantity - 1)}

                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="font-medium w-8 text-center">
                                        {item.quantity}
                                      </span>
                                      <Button
                                        variant="outline"
                                        className="border border-[#038203] text-[#038203] bg-white hover:bg-[#038203] hover:text-white transition-all duration-200 rounded-full w-8 h-8 flex items-center justify-center"

                                        size="sm"
                                        onClick={() => updateQuantity(item.cart_item_id, item.product_id, item.quantity + 1)}


                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>

                                    <div className="text-center">
                                      <p className="font-bold text-lg">
                                        {(item.unit_price * item.quantity).toLocaleString('ar-SA')} ر.س
                                      </p>
                                    </div>

                                    <Button
                                      variant="destructive"
                                      className="text-red-500 bg-white hover:bg-red-500 hover:text-white transition-all duration-200 w-8 h-8 flex items-center justify-center rounded-full"
                                      size="sm"
                                      onClick={() => removeFromCart(item.cart_item_id)}
                                    >
                                      <Trash2 className="h-5 w-5" />
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

                        {/* Loyalty Points Earned */}
                        <div className="flex justify-between text-green-600 font-medium">
                          <span>نقاط الولاء المكتسبة:</span>
                          <span>
                            {cart
                              .reduce(

                                (total, item) =>
                                  total +
                                  (item.loyalty_points_per_item ? item.loyalty_points_per_item * item.quantity : 0),
                                0
                              )
                              .toLocaleString('ar-SA')}{" "}
                            نقطة
                          </span>
                        </div>

                        <div className="space-y-3">
                          <Button
                            className="w-full"
                            size="lg"
                            disabled={(cartApi?.length ?? 0) === 0 || processOrderMutation.isPending}
                            onClick={() => setShowPopup(true)}
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
                            disabled={cartSummary.length === 0}
                          >
                            مسح السلة
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="customer-orders" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-center text-xl">مسح المنتجات</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Input
                            placeholder="امسح باركود المنتج..."
                            value={barcodeInput}
                            onChange={(e) => {
                              let value = e.target.value;

                              // حروف + أرقام فقط
                              value = value.replace(/[^a-zA-Z0-9]/g, "");

                              // حد أقصى 20
                              value = value.slice(0, 20);

                              // إجبار قيمة الـ DOM (مهم مع QR / Scanner)
                              e.target.value = value;

                              setBarcodeInput(value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && barcodeInput.trim()) {
                                handleBarcodeSubmit();
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleBarcodeSubmit();
                              }
                            }}
                            className="flex-1 text-lg p-4"
                            disabled={isScanning}
                            autoFocus
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

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">طلب العميل</CardTitle>

                          <Badge variant="secondary" className="text-base px-4 py-1">
                            {orderDataDetails?.summary?.total_items ?? 0} منتج
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {orderDataDetails?.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border"
                          >
                            {/* اليسار */}
                            <div className="flex items-center gap-4 flex-1">
                              {/* الصورة */}
                              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center overflow-hidden">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.product_name}
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <Package className="h-8 w-8 text-gray-400" />
                                )}
                              </div>

                              {/* اسم المنتج + الباركود */}

                            </div>

                            {/* Controls Right */}
                            <div className="flex items-center gap-4">


                              {/* النقاط والسعر */}
                              <div className="text-left min-w-[80px]">
                                <div className="flex flex-row items-center gap-1 w-[41px] h-[24px] justify-center">
                                  <p className="text-green-600 dark:text-green-400 font-bold text-lg">
                                    {item.loyalty_points_earned}
                                  </p>
                                  <SixPointsIcon />
                                </div>

                                <p className="font-bold text-base">
                                  {item.line_subtotal} ر.س
                                </p>
                              </div>

                              {/* زرار الحذف */}
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                  {item.product_name}
                                </h4>
                                <p className="text-sm text-gray-500">الباركود: {item.barcode}</p>
                              </div>

                            </div>
                          </div>
                        ))}

                        {/* كود خصم */}
                        <div className="flex gap-2 pt-4 border-t">
                          <Input placeholder="كود الخصم أو البروموكود" className="flex-1" />
                          <Button variant="outline" className="px-6">
                            إلغاء
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                  </div>

                  <div className="space-y-6">


                    <Card>
                      <CardHeader>
                        <CardTitle className="text-center">ملخص الطلب</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {orderDataDetails?.totals ? (
                          <>

                            <div className="space-y-3">
                              <div className="flex justify-between text-base">
                                <span className="text-gray-600 dark:text-gray-400">المجموع الفرعي</span>
                                <span className="font-medium">{orderDataDetails.totals.subtotal}</span>
                              </div>
                              {/* ضريبة القيمة المضافة */}
                              <div className="flex justify-between text-base">
                                <span className="text-gray-600 dark:text-gray-400">
                                  ضريبة القيمة المضافة (%{orderDataDetails.totals.tax_rate})
                                </span>
                                <span className="font-medium">
                                  {orderDataDetails.totals.tax} ر.س
                                </span>
                              </div>
                              <div className="flex justify-between text-base">
                                <span className="text-gray-600 dark:text-gray-400">خصم</span>
                                <span className="font-medium">{orderDataDetails.totals.discount} ر.س</span>
                              </div>


                              <Separator className="my-3" />

                              <div className="flex justify-between items-center">
                                <span className="text-lg font-bold">الإجمالي الكلي</span>
                                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                  {orderDataDetails.totals.grand_total} ر.س
                                </span>
                              </div>

                              <div className="text-center flex flex-row items-center gap-1 justify-between">
                                <p className="text-xs text-gray-500 mt-1">نقاط الولاء المكتسبة</p>
                                <div className="flex flex-row items-center gap-1 w-[41px] h-[24px] justify-center">
                                  <p className="text-green-600 dark:text-green-400 font-bold text-lg">
                                    {orderDataDetails.totals.loyalty_points_earned}
                                  </p>
                                  <SixPointsIcon />
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (<p className="text-center text-gray-500 py-4">لا توجد بيانات للملخص</p>
                        )}

                        <Separator />

                        <div className="space-y-3">
                          <Button
                            className="w-full"
                            size="lg"
                            disabled={orderState == false || orderDataDetails == null}
                            onClick={() => setShowPopup(true)}
                          >
                            {processOrderMutation.isPending ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                                جاري المعالجة...
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="h-4 w-4 ml-2" />
                                تأكيد الطلب
                              </>
                            )}
                          </Button>


                          <Button
                            variant="outline"
                            className="w-full border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                            size="lg"
                            onClick={removeOrder}
                          >
                            إلغاء
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
                              type="text"
                              placeholder="امسح QR كود العميل أو باركود المنتج..."
                              value={barcodeInput}
                              onChange={(e) => {
                                let value = e.target.value;

                                // حروف + أرقام فقط
                                value = value.replace(/[^a-zA-Z0-9]/g, "");

                                // حد أقصى 20
                                value = value.slice(0, 20);

                                // إجبار قيمة الـ DOM (مهم مع QR / Scanner)
                                e.target.value = value;

                                setBarcodeInput(value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && barcodeInput.trim()) {
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
                    {invoiceUrl && (
                      <Card className="p-4">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>عرض الفاتورة</span>
                            <Button variant="outline" onClick={() => window.open(invoiceUrl, "_blank")}>
                              فتح في نافذة جديدة
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <iframe
                            src={invoiceUrl}
                            className="w-full h-[600px] border rounded-lg"
                            title="Invoice PDF"
                          />
                          <Button
                            className="w-full "
                            onClick={() => {
                              const iframe = document.querySelector("iframe") as HTMLIFrameElement;
                              if (iframe) iframe.contentWindow?.print();
                            }}
                          >
                            🖨️ طباعة الفاتورة
                          </Button>
                        </CardContent>
                      </Card>
                    )}


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
                              type="text"
                              placeholder="امسح باركود المنتج للتحقق..."
                              value={barcodeInput}
                              onChange={(e) => {
                                let value = e.target.value;

                                // امنع أي رموز (حروف + أرقام فقط)
                                value = value.replace(/[^a-zA-Z0-9]/g, "");

                                // اقصى 20 حرف
                                value = value.slice(0, 20);

                                // اجبار قيمة الـ DOM (مهم جدًا مع scanner)
                                e.target.value = value;

                                setBarcodeInput(value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && barcodeInput.trim()) {
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
                                  <span>{item.name}</span>
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
              <AnimatePresence>
                {showPopup && (
                  <>
                    {/* الخلفية */}
                    <motion.div
                      className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                      onClick={() => setShowPopup(false)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />

                    {/* المحتوى */}
                    <motion.div
                      className="fixed top-1/2 left-1/2 w-[90%] max-w-md bg-white rounded-2xl shadow-lg p-6 text-right z-50"
                      initial={{ opacity: 0, scale: 0.9, y: "-50%", x: "-50%" }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.25 }}
                    >
                      {step === "select" && (
                        <>
                          <h2 className="text-xl font-semibold mb-1">اختر وسيلة الدفع</h2>
                          <p className="text-gray-500 mb-4 text-sm">
                            اختر طريقة الدفع المناسبة لإتمام العملية
                          </p>

                          <div className="space-y-3">
                            {/* نقدي */}
                            <label className="flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer hover:border-primary transition">
                              <input
                                type="radio"
                                name="payment"
                                value="cash"
                                checked={paymentMethod === "cash"}
                                onChange={() => setPaymentMethod("cash")}
                                className="accent-primary"
                              />
                              <div className="flex items-center gap-2">
                                <Wallet size={18} />
                                <span className="font-medium">نقدي</span>
                              </div>
                            </label>

                            {/* بطاقة ائتمانية */}
                            <label className="flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer hover:border-primary transition">
                              <input
                                type="radio"
                                name="payment"
                                value="visa"
                                checked={paymentMethod === "visa"}
                                onChange={() => setPaymentMethod("visa")}
                                className="accent-primary"
                              />
                              <div className="flex items-center gap-2">
                                <CreditCard size={18} />
                                <span className="font-medium">بطاقة ائتمانية</span>
                              </div>
                            </label>
                          </div>
                        </>
                      )}

                      {/* الأزرار */}
                      {step === "select" && (
                        <>
                          <div className="flex justify-between mt-6">
                            <button
                              onClick={() => setShowPopup(false)}
                              className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg hover:bg-gray-100 transition"
                            >
                              إلغاء
                            </button>
                            <button
                              onClick={handleProcessOrder2}
                              className="text-primary-foreground hover:bg-primary/90 text-white px-5 py-2 rounded-lg bg-primary transition"
                            >
                              تأكيد
                            </button>
                          </div>
                        </>
                      )}

                      {step === "cash" && (
                        <>

                          <h2 className="text-xl font-semibold mb-1">إتمام الدفع النقدي</h2>
                          <p className="text-gray-500 mb-4 text-sm">أدخل المبلغ المدفوع</p>
                          {activeTab === "pos" ? (

                            <div className="bg-green-100 text-green-600 px-4 py-2 rounded-lg font-semibold text-center mb-4">
                              إجمالي المبلغ: {total.toFixed(2)} ﷼
                            </div>
                          ) : (<div className="bg-green-100 text-green-600 px-4 py-2 rounded-lg font-semibold text-center mb-4">
                            إجمالي المبلغ: {orderDataDetails.totals.grand_total} ﷼
                          </div>)}

                          <input
                            type="number"
                            className="w-full border rounded-lg px-3 py-2 mb-3 text-right focus:outline-none focus:ring-2 focus:ring-[#009689]"
                            placeholder="المبلغ المدفوع"
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(e.target.value)}
                          />

                          {paidAmount && (
                            <p className="text-gray-700 font-medium text-right mb-2">
                              الباقي:{" "}
                              <span className="text-green-600">
                                {paidAmount - total > 0 ? (paidAmount - total).toFixed(2) : 0} ﷼
                              </span>
                            </p>
                          )}

                          <div className="flex justify-between mt-6">
                            <button
                              onClick={handleCancel}
                              className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg hover:bg-gray-100 transition"
                            >
                              إلغاء
                            </button>
                            <button
                              onClick={() => {
                                handleProcessOrder3();
                                handleProcessOrder();
                              }}
                              className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg transition"
                            >
                              إصدار الفاتورة
                            </button>
                          </div>
                        </>
                      )}
                      {/* === المرحلة 3: معالجة البطاقة === */}
                      {step === "processing" && (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Loader2 className="h-10 w-10 text-[#009689] animate-spin mb-4" />
                          <p className="text-gray-700">جارٍ معالجة الدفع من جهاز البطاقة...</p>
                          <p className="text-gray-400 text-sm mt-1">الرجاء الانتظار...</p>
                          <button
                            onClick={handleCancel}
                            className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg mt-5 hover:bg-gray-100 transition"
                          >
                            إلغاء
                          </button>
                        </div>
                      )} {step === "success" && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-3">
                          <div className="bg-green-100 rounded-full p-3">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                          </div>
                          <h2 className="text-green-600 text-2xl font-bold">تم الدفع بنجاح!</h2>
                          <p className="text-gray-600">المبلغ: {total} ﷼</p>

                          {change > 0 && (
                            <p className="text-gray-700 font-medium">
                              الباقي: <span className="text-green-600">{change} ﷼</span>
                            </p>
                          )}

                          <div className="flex justify-between w-full px-6 mt-4">
                            <button
                              onClick={handleCancel}
                              className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg hover:bg-gray-100 transition"
                            >
                              إلغاء
                            </button>
                            <button
                              onClick={handleProcessOrder}
                              className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg transition"
                            >
                              إصدار الفاتورة
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>


            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}