import { useEffect, useState } from "react";
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
import { Search, Plus, Upload, Edit, Trash2, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";
import { getAllProducts, getInventory } from "@/services/products";


export default function ProductsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  console.log("User Data: ",user)
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isFeaturedFilter, setIsFeaturedFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");

  const isOwner = user?.role_display === "owner";



  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', page, pageSize, search, categoryFilter, brandFilter, minPrice, maxPrice, isFeaturedFilter, user?.store_slug ],
    queryFn: () => getAllProducts({
      page,
      page_size: pageSize,
      category: categoryFilter || undefined,
      brand: brandFilter || undefined,
      price__gte: minPrice || undefined,
      price__lte: maxPrice || undefined,
      is_featured: isFeaturedFilter === 'all' ? undefined : isFeaturedFilter,
      search: search || undefined,
      store_slug: isOwner ? user.store_slug : undefined, // 🔥 هنا الصح
    }),
  enabled: isOwner && !!user?.store_slug,
  });
  

  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', stockStatusFilter],
    queryFn: () => getInventory({
      page_size: 1000, // Get all inventory items
      is_out_of_stock: stockStatusFilter === 'out_of_stock' ? 'true' : undefined,
      is_low_stock: stockStatusFilter === 'low_stock' ? 'true' : undefined,
    }),
  });

  const products = productsData?.results || [];
  const inventory = inventoryData?.results || [];
  const totalCount = productsData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Create a map of product_id to inventory for quick lookup
  const inventoryMap = new Map();
  inventory.forEach((inv: any) => {
    inventoryMap.set(inv.product, inv);
  });

  // Merge products with their inventory data
  const productsWithInventory = products.map((product: any) => ({
    ...product,
    inventory: inventoryMap.get(product.id)
  }));
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
    return Number(product.price);
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setBrandFilter("");
    setMinPrice("");
    setMaxPrice("");
    setIsFeaturedFilter("all");
    setStockStatusFilter("all");
    setPage(1);
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
              <div className="space-y-4 mt-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="البحث باسم المنتج..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="pr-10"
                    />
                  </div>
                  
                  <Input
                    placeholder="الفئة"
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full lg:w-48"
                  />
                  
                  <Input
                    placeholder="الماركة"
                    value={brandFilter}
                    onChange={(e) => {
                      setBrandFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full lg:w-48"
                  />
                </div>
                
                <div className="flex flex-col lg:flex-row gap-4">
                  <Input
                    type="number"
                    placeholder="السعر من"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      setPage(1);
                    }}
                    className="w-full lg:w-48"
                  />
                  
                  <Input
                    type="number"
                    placeholder="السعر إلى"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      setPage(1);
                    }}
                    className="w-full lg:w-48"
                  />
                  
                  <Select value={isFeaturedFilter} onValueChange={(value) => {
                    setIsFeaturedFilter(value);
                    setPage(1);
                  }}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="المنتجات المميزة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="true">مميز</SelectItem>
                      <SelectItem value="false">غير مميز</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={stockStatusFilter} onValueChange={(value) => {
                    setStockStatusFilter(value);
                    setPage(1);
                  }}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="حالة المخزون" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المنتجات</SelectItem>
                      <SelectItem value="low_stock">مخزون منخفض</SelectItem>
                      <SelectItem value="out_of_stock">نفد المخزون</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleResetFilters}
                    className="w-full lg:w-auto"
                  >
                    إعادة تعيين الفلاتر
                  </Button>
                </div>
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
                          الفئة
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          المتجر
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          السعر الأصلي
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          السعر الحالي
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          الخصم
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          الكمية المتاحة
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          حالة المخزون
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          تاريخ الإنشاء
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {productsWithInventory.map((product: any) => {
                        const finalPrice = calculateFinalPrice(product);
                        const inv = product.inventory;
                        
                        return (
                          <tr 
                            key={product.id} 
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <td className="px-4 py-3">
                              {product.primary_image_url ? (
                                <img 
                                  src={product.primary_image_url}
                                  alt={product.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {product.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  SKU: {product.sku}
                                </p>
                                {product.is_featured && (
                                  <Badge variant="default" className="mt-1">مميز</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {product.barcode || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {product.category_name || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {product.store_name || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {product.compare_price ? (
                                <span className="text-gray-400 line-through">
                                  {Number(product.compare_price).toLocaleString('ar-SA')} ر.س
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              {finalPrice.toLocaleString('ar-SA')} ر.س
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {product.is_on_sale && (
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">خصم</Badge>
                                  <span className="text-green-600 font-medium">
                                    %{product.calculated_discount_percentage?.toFixed(0)}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {inv ? (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{inv.quantity_available}</span>
                                    <span className="text-xs text-gray-500">متاح</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span>{inv.quantity_on_hand} إجمالي</span>
                                    {inv.quantity_reserved > 0 && (
                                      <span className="text-orange-600">({inv.quantity_reserved} محجوز)</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {inv ? (
                                <div className="flex flex-col gap-1">
                                  {inv.is_out_of_stock ? (
                                    <Badge variant="destructive">نفد المخزون</Badge>
                                  ) : inv.is_low_stock ? (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                      مخزون منخفض
                                    </Badge>
                                  ) : (
                                    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                      متوفر
                                    </Badge>
                                  )}
                                  {inv.reorder_level && (
                                    <span className="text-xs text-gray-500">
                                      حد إعادة الطلب: {inv.reorder_level}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {product.created_at ? new Date(product.created_at).toLocaleDateString('ar-SA') : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Link href={`/products/edit/${product.slug}`}>
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
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6 px-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      عرض {products.length > 0 ? ((page - 1) * pageSize) + 1 : 0} - {Math.min(page * pageSize, totalCount)} من {totalCount} منتج
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={page === 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                        السابق
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              className="w-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={page === totalPages || totalPages === 0}
                      >
                        التالي
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
