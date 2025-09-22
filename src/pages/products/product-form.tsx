import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";
import { z } from "zod";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Save, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/common/loading";
import { mockApi} from "../../services/mockData";

const formSchema = insertProductSchema.extend({
  finalPrice: z.number().optional(),
  isMultiPieceOffer: z.boolean().optional(),
  multiPieceQuantity: z.number().optional(),
  multiPiecePrice: z.string().optional(),
  multiPieceOfferType: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ProductForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/products/edit/:id");
  const isEditing = !!params?.id;
  const productId = params?.id ? parseInt(params.id) : null;
  const [departments, setDepartments] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState<boolean>(true);
  // const [products,setProducts] = useState<any[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null);

 
  useEffect(() => {
    const fetchProduct = async (productId) => {
      if (isEditing && productId) {
        setIsLoadingProduct(true);
        const data = await mockApi.getProduct(productId);
        setProduct(data);
        setIsLoadingProduct(false)
      }else{
        const data = await mockApi.getProduct(productId)
        setProduct(data)
        setIsLoadingProduct(false)
      }}
      fetchProduct("prod-002")},[])
  
  useEffect(() => {
    const fetchDepartments = async () => {
      const data = await mockApi.getDepartements();
      setDepartments(data);
    };
    fetchDepartments();
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      barcode: "",
      itemNumber: "",
      departmentId: 0,
      branchId: user?.branchId || 1,
      originalPrice: "0",
      discountPercentage: "0",
      isFixedPriceOffer: false,
      fixedOfferPrice: "0",
      isMultiPieceOffer: false,
      multiPieceQuantity: 2,
      multiPiecePrice: "0",
      multiPieceOfferType: "fixed_price",
      loyaltyPoints: 0,
      imageUrl: "",
      stockQuantity: 0,
      expiryDate: "",
    },
  });

  useEffect(() => {
    if (product && isEditing) {
      form.reset({
        name: product.name,
        description: product.description || "",
        barcode: product.barcode || "",
        itemNumber: product.itemNumber || "",
        departmentId: product.departmentId,
        branchId: product.branchId,
        originalPrice: product.originalPrice,
        discountPercentage: product.discountPercentage || "0",
        isFixedPriceOffer: product.isFixedPriceOffer,
        fixedOfferPrice: product.fixedOfferPrice || "0",
        isMultiPieceOffer: product.isMultiPieceOffer || false,
        multiPieceQuantity: product.multiPieceQuantity || 2,
        multiPiecePrice: product.multiPiecePrice || "0",
        multiPieceOfferType: product.multiPieceOfferType || "fixed_price",
        loyaltyPoints: product.loyaltyPoints || 0,
        imageUrl: product.imageUrl || "",
        stockQuantity: product.stockQuantity,
        expiryDate: product.expiryDate || "",
      });
      if (product.imageUrl) {
        setImagePreview(product.imageUrl);
      }
    }
  }, [product, isEditing, form]);

  const createProductMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { finalPrice, ...productData } = data;
      const response = await apiRequest('POST', '/products', productData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/products'] });
      toast({
        title: "تم الحفظ",
        description: "تم إنشاء المنتج بنجاح",
      });
      setLocation("/products");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء المنتج",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { finalPrice, ...productData } = data;
      const response = await apiRequest('PUT', `/api/products/${productId}`, productData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/products'] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث المنتج بنجاح",
      });
      setLocation("/products");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث المنتج",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    if (isEditing) {
      updateProductMutation.mutate(data);
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    setLocation("/products");
  };

  const calculateFinalPrice = () => {
    const originalPrice = parseFloat(form.watch("originalPrice") || "0");
    const isFixedOffer = form.watch("isFixedPriceOffer");
    const fixedOfferPrice = parseFloat(form.watch("fixedOfferPrice") || "0");
    const discountPercentage = parseFloat(form.watch("discountPercentage") || "0");

    if (isFixedOffer && fixedOfferPrice > 0) {
      return fixedOfferPrice;
    }

    return originalPrice - (originalPrice * discountPercentage / 100);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real implementation, you would upload the file to a storage service
      // For now, we'll create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        setImagePreview(imageUrl);
        form.setValue("imageUrl", imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return <Loading />;
  }

  if (isEditing && isLoadingProduct) {
    return (
      <div className="min-h-screen flex" dir="rtl">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <TopBar />
          <div className="p-6">
            <Loading text="جاري تحميل بيانات المنتج..." />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <TopBar />
        
        <div className="p-6 overflow-y-auto h-full custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button onClick={handleCancel} variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4 ml-2" />
                  العودة للمنتجات
                </Button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isEditing ? `تعديل المنتج: ${product?.name}` : "إضافة منتج جديد"}
                </h1>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>المعلومات الأساسية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم المنتج *</FormLabel>
                            <FormControl>
                              <Input placeholder="اسم المنتج" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="departmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>القسم *</FormLabel>
                            <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر القسم" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments?.map((dept: any) => (
                                  <SelectItem key={dept.id} value={dept.id.toString()}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الوصف</FormLabel>
                          <FormControl>
                            <Textarea placeholder="وصف المنتج" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="barcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الباركود</FormLabel>
                            <FormControl>
                              <Input placeholder="الباركود" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="itemNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الصنف</FormLabel>
                            <FormControl>
                              <Input placeholder="رقم الصنف" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Image Upload */}
                    <div>
                      <FormLabel>صورة المنتج</FormLabel>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="flex-1">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="cursor-pointer"
                          />
                        </div>
                        {imagePreview && (
                          <div className="w-20 h-20 border rounded-lg overflow-hidden">
                            <img 
                              src={imagePreview} 
                              alt="معاينة الصورة"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing */}
                <Card>
                  <CardHeader>
                    <CardTitle>التسعير والخصومات</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="originalPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>السعر الأصلي *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="loyaltyPoints"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نقاط الولاء</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="isFixedPriceOffer"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>عرض بسعر ثابت</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("isFixedPriceOffer") ? (
                      <FormField
                        control={form.control}
                        name="fixedOfferPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>سعر العرض الثابت</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="discountPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نسبة الخصم (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">السعر النهائي:</p>
                      <p className="text-2xl font-bold text-primary">
                        {calculateFinalPrice().toLocaleString('ar-SA')} ر.س
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Inventory */}
                <Card>
                  <CardHeader>
                    <CardTitle>المخزون</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="stockQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الكمية في المخزون *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تاريخ انتهاء الصلاحية</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-6">
                  <Button onClick={handleCancel} variant="outline">
                    <X className="h-4 w-4 ml-2" />
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/90"
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  >
                    <Save className="h-4 w-4 ml-2" />
                    {isEditing ? "تحديث المنتج" : "حفظ المنتج"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </main>
    </div>
  );
}
