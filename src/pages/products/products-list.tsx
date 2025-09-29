import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Plus, Upload, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";
import {getAllProducts} from "@/services/products";


export default function ProductsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");

  const { data: products, isLoading } = useQuery({
    queryKey: [`/products?branchId=${user?.branchId}&search=${search}&departmentId=${departmentFilter}&stockStatus=${stockFilter}&expiryStatus=${expiryFilter}`],
  });

  // const {data: products = [], isLoading} = useQuery(
  //   {
  //     queryKey: ['products'],
  //     queryFn: () => getAllProducts(),
  //   }
  // )
  const { data: departments = [] } = useQuery({
    queryKey: [`/departments?branchId=${user?.branchId}`],
  });
  console.log("Departments:", typeof(departments));
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest('DELETE', `/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/products'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المنتج بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف المنتج",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return <Loading />;
  }

  const calculateFinalPrice = (product: any) => {
    if (product.isFixedPriceOffer && product.fixedOfferPrice) {
      return Number(product.fixedOfferPrice);
    }
    const originalPrice = Number(product.originalPrice);
    const discountPercentage = Number(product.discountPercentage || 0);
    return originalPrice - (originalPrice * discountPercentage / 100);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'out', text: 'نفد المخزون', variant: 'destructive' as const };
    if (quantity <= 10) return { status: 'low', text: 'مخزون منخفض', variant: 'secondary' as const };
    return { status: 'normal', text: 'متوفر', variant: 'default' as const };
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', text: 'منتهي الصلاحية', variant: 'destructive' as const };
    if (diffDays <= 30) return { status: 'expiring', text: 'ينتهي قريباً', variant: 'secondary' as const };
    return null;
  };

  const handleDeleteProduct = (productId: number) => {
    deleteProductMutation.mutate(productId);
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <TopBar />
        
        <div className="p-6 overflow-y-auto h-full custom-scrollbar">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  إدارة المنتجات
                </CardTitle>
                <div className="flex gap-2">
                  <Link href="/products/upload">
                    <Button variant="outline">
                      <Upload className="h-4 w-4 ml-2" />
                      رفع من Excel
                    </Button>
                  </Link>
                  <Link href="/products/new">
                    <Button className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة منتج جديد
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="البحث باسم المنتج أو الباركود أو رقم الصنف..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-10"
                  />
                </div>
                
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأقسام</SelectItem>
                    {Array.isArray(departments) && departments.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}

                  </SelectContent>
                </Select>
                
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="حالة المخزون" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="low">مخزون منخفض</SelectItem>
                    <SelectItem value="out">نفد المخزون</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={expiryFilter} onValueChange={setExpiryFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="حالة الصلاحية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المنتجات</SelectItem>
                    <SelectItem value="expiring">ينتهي قريباً</SelectItem>
                    <SelectItem value="expired">منتهي الصلاحية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <Loading />
              ) : !products?.length ? (
                <EmptyState
                  title="لا توجد منتجات"
                  description="لم يتم العثور على أي منتجات تطابق معايير البحث"
                  action={
                    <Link href="/products/new">
                      <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة منتج جديد
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          صورة
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          اسم المنتج
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          الباركود
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          القسم
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          السعر الأصلي
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          الخصم
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          السعر النهائي
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          المخزون
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          انتهاء الصلاحية
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {products.map((product: any) => {
                        const stockStatus = getStockStatus(product.stockQuantity);
                        const expiryStatus = getExpiryStatus(product.expiryDate);
                        const finalPrice = calculateFinalPrice(product);
                        
                        return (
                          <tr 
                            key={product.id} 
                            className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                              stockStatus.status === 'out' ? 'out-of-stock' :
                              stockStatus.status === 'low' ? 'low-stock' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <img 
                                src={product.imageUrl || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=40&h=40&fit=crop&crop=center"}
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {product.name}
                                </p>
                                {product.loyaltyPoints > 0 && (
                                  <p className="text-xs text-primary">
                                    {product.loyaltyPoints} نقطة ولاء
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {product.barcode || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {departments?.find((d: any) => d.id === product.departmentId)?.name || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {Number(product.originalPrice).toLocaleString('ar-SA')} ر.س
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {product.isFixedPriceOffer ? (
                                <Badge variant="secondary">عرض ثابت</Badge>
                              ) : product.discountPercentage > 0 ? (
                                <span className="text-green-600">
                                  %{Number(product.discountPercentage)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              {finalPrice.toLocaleString('ar-SA')} ر.س
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                  {product.stockQuantity}
                                </span>
                                <Badge variant={stockStatus.variant}>
                                  {stockStatus.text}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                {product.expiryDate && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {new Date(product.expiryDate).toLocaleDateString('ar-SA')}
                                  </p>
                                )}
                                {expiryStatus && (
                                  <Badge variant={expiryStatus.variant}>
                                    {expiryStatus.text}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Link href={`/products/edit/${product.id}`}>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>حذف المنتج</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        هل أنت متأكد من حذف المنتج "{product.name}"؟ 
                                        هذا الإجراء لا يمكن التراجع عنه.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        حذف
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
