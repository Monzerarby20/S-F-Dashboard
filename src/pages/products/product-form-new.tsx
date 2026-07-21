import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Save, Plus, X, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/common/loading";
import axios from "axios";
import { getCategories, getStores } from "@/services/products";
import { getAllStores, getStoreBySlug } from "@/services/stores";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ProductFormNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Check if user is admin/superuser
  const isAdmin = (user as any)?.is_superuser || 
                  (user as any)?.role === 'admin' || 
                  (user as any)?.role === 'superuser' ||
                  (user as any)?.role === 'owner' ||
                  (user as any)?.is_staff;
  
  // Get store_id from current user
  const userStoreId = (user as any)?.store_id || (user as any)?.store || '9';
  const savedStoreSlug = localStorage.getItem("userSlug");
  

  const { data: userStore = [], isLoading, error } = useQuery({
    queryKey: ['userStore'],
    queryFn: () => {
      if (isAdmin === "admin" ){
        return getAllStores();
      } else{
        return getStoreBySlug(savedStoreSlug);
      }
     
    }
  });
  console.log("Stores That I featched",userStore)

  // Selected store state (Admin can change it, regular user uses their store)
  const [selectedStore, setSelectedStore] = useState<string>("");
  
  console.log('👤 Is Admin:', isAdmin);
  console.log('🏪 User Store ID:', userStoreId);
  console.log('🏪 Selected Store:', selectedStore);
  
  // Fetch stores
  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: () => getStores(),
    enabled: !!user,
  });
  
  const stores = storesData?.results || storesData || [];
  
  // Set default selected store when stores load
  // تعيين المتجر تلقائيًا
  useEffect(() => {
    if (!userStore) return;
    if (isAdmin) return;
  
    // تأكد إن فيه id فعلاً
    if (userStore?.id) {
      setSelectedStore(String(userStore.id));
    }
  }, [userStore, isAdmin]);
  
  console.log('🏬 Stores count:', stores.length);
  
  // Fetch ALL categories (including global) without store filter
  const { data: allCategoriesData, isLoading: allCategoriesLoading } = useQuery({
    queryKey: ['all-categories'],
    queryFn: () => getCategories(), // No store_id = get all including global
    enabled: !!user,
  });
  
  // Fetch categories for selected store
  const { data: storeCategoriesData, isLoading: storeCategoriesLoading } = useQuery({
    queryKey: ['store-categories', selectedStore],
    queryFn: () => getCategories(selectedStore),
    enabled: !!user && !!selectedStore,
  });
  console.log("Categories",storeCategoriesData)
 
  
  
  const categoriesLoading = allCategoriesLoading || storeCategoriesLoading;
  
  // Get all categories and filter global ones
  const allCategories = allCategoriesData?.results || [];
  const globalCategoriesOnly = allCategories.filter((cat: any) => cat.parent === null);
  
  // Get store categories
  const storeCategories = storeCategoriesData?.results || [];
  console.log("Categories",storeCategories.length)
  // Merge: Global + Store categories (remove duplicates)
  const categories = selectedStore 
    ? [...globalCategoriesOnly, ...storeCategories.filter((cat: any) => cat.parent !== null)]
    : [];
  
  // Separate global and store-specific categories
  const globalCategories = categories.filter((cat: any) => cat.parent === null);
  const storeCategoriesFiltered = categories.filter((cat: any) => cat.parent !== null);
  const hasOnlyGlobal = categories.length > 0 && storeCategoriesFiltered.length === 0;
  
  console.log('✅ Total Categories:', categories.length);
  console.log('🌐 Global Categories:', globalCategories.length);
  console.log('🏪 Store Categories:', storeCategoriesFiltered.length);
  console.log('🔄 Has Only Global:', hasOnlyGlobal);

  // Images state
  const [images, setImages] = useState<Array<{
    image_url: string;
    is_primary: boolean;
    alt_text: string;
    image_type: string;
  }>>([]);

  // New image form state
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageAlt, setNewImageAlt] = useState("");
  const [newImageType, setNewImageType] = useState("product");
  const [newImagePrimary, setNewImagePrimary] = useState(false);
  
  console.log('🖼️ Images count:', images.length);

  const [formData, setFormData] = useState({
    name: "",
    // sku: "",
    name_en: "",
    category: "",
    price: "",
    description: "",
    short_description: "",
    barcode: "",
    // item_number: "",
    unit_number: "",
    brand: "",
    compare_price: "",
    cost_price: "",
    discount_percentage: "",
    weight: "",
    dimensions: "",
    loyalty_points: "",
    expiry_date: "",
    is_featured: false,
    is_active: true,
    // Inventory fields
    quantity_on_hand: "",
    reorder_level: "",
    max_stock_level: "",
    cost_per_unit: "",
    location_in_store: "",
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('token');
      
      // Prepare payload
      const payload: any = {
        name: data.name,
        // sku: data.sku,
        name_en: data.name_en,
        unit_number: data.unit_number,
        category: parseInt(data.category),
        price: parseFloat(data.price),
        store: parseInt(selectedStore),  // ← Add selected store
      };

      // Add optional fields if they have values
      if (data.description) payload.description = data.description;
      if (data.short_description) payload.short_description = data.short_description;
      if (data.barcode) payload.barcode = data.barcode;
      // if (data.item_number) payload.item_number = data.item_number;
      if (data.brand) payload.brand = data.brand;
      if (data.compare_price) payload.compare_price = parseFloat(data.compare_price);
      if (data.cost_price) payload.cost_price = parseFloat(data.cost_price);
      if (data.discount_percentage) payload.discount_percentage = parseFloat(data.discount_percentage);
      if (data.weight) payload.weight = parseFloat(data.weight);
      if (data.dimensions) payload.dimensions = data.dimensions;
      if (data.loyalty_points) payload.loyalty_points = parseInt(data.loyalty_points);
      if (data.expiry_date) payload.expiry_date = data.expiry_date;
      
      // Boolean fields
      payload.is_featured = data.is_featured;
      payload.is_active = data.is_active;

      // Add images if provided
      if (images.length > 0) {
        payload.images = images;
      }

      // Add inventory data if provided
      if (data.quantity_on_hand || data.reorder_level || data.cost_per_unit || data.max_stock_level || data.location_in_store) {
        payload.inventory_data = {};
        if (data.quantity_on_hand) payload.inventory_data.quantity_on_hand = parseInt(data.quantity_on_hand);
        if (data.reorder_level) payload.inventory_data.reorder_level = parseInt(data.reorder_level);
        if (data.max_stock_level) payload.inventory_data.max_stock_level = parseInt(data.max_stock_level);
        if (data.cost_per_unit) payload.inventory_data.cost_per_unit = parseFloat(data.cost_per_unit);
        if (data.location_in_store) payload.inventory_data.location_in_store = data.location_in_store;
      }

      console.log('Sending payload:', payload);
      console.log("New Product Data ", data)

      const response = await axios.post(
        `${API_BASE_URL}catalog/products/`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log("Response from create product",response.data)
      console.log("Payload that send to create product",payload)

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "تم الحفظ",
        description: "تم إنشاء المنتج بنجاح",
      });
      setLocation("/products");
    },
    onError: (error: any) => {
      console.error('❌ Full Error:', error);
      console.error('❌ Error Response:', error.response);
      console.error('❌ Error Data:', error.response?.data);
      console.error('❌ Error Status:', error.response?.status);
      console.error('❌ Error Message:', error.message);
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          JSON.stringify(error.response?.data) || 
                          "فشل في إنشاء المنتج";
      
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProductMutation.mutate(formData as any);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCancel = () => {
    setLocation("/products");
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
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Button onClick={handleCancel} variant="ghost" size="sm">
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للمنتجات
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                إضافة منتج جديد
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>المعلومات الأساسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        اسم المنتج <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="اسم المنتج"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        product name (product name in English)<span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="name_en"
                        value={formData.name_en }
                        onChange={handleChange}
                        placeholder="Product Name in English"
                        required
                      />
                    </div>
                  </div>

                  {/* Store Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      المتجر <span className="text-red-500">*</span>
                    </label>
                    {storesLoading ? (
                      <Input value="جاري التحميل..." disabled />
                    ) : isAdmin ? (
                      <Select 
                        value={selectedStore} 
                        onValueChange={setSelectedStore}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المتجر" />
                        </SelectTrigger>
                        <SelectContent>
                          {stores.map((store: any) => (
                            <SelectItem key={store.id} value={store.id.toString()}>
                              <div className="flex items-center justify-between w-full">
                                <span>{store.name}</span>
                                {store.id.toString() === userStoreId.toString() && (
                                  <span className="text-xs text-green-600 font-semibold">👤 متجرك</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        value={stores.find((s: any) => s.id.toString() === selectedStore)?.name || 'متجرك'}
                        disabled
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        القسم <span className="text-red-500">*</span>
                      </label>
                      {!selectedStore ? (
                        <Input 
                          value="اختر متجر أولاً" 
                          disabled 
                          className="bg-gray-100 dark:bg-gray-800 text-gray-500"
                        />
                      ) : categoriesLoading ? (
                        <Input value="جاري التحميل..." disabled />
                      ) : (
                        <div>
                          <Select 
                            value={formData.category} 
                            onValueChange={(value) => setFormData({...formData, category: value})}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر القسم" />
                            </SelectTrigger>
                            <SelectContent>
                              {storeCategories.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{cat.name}</span>
                                    {cat.parent === null && (
                                      <span className="text-xs text-blue-600 font-semibold">⭐ Global</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {hasOnlyGlobal && (
                            <p className="text-xs text-blue-600 mt-1">
                              🌐 هذا المتجر ليس له تصنيفات خاصة - يظهر فقط التصنيفات العالمية (Global)
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        السعر <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">الوصف المختصر</label>
                    <Input
                      name="short_description"
                      value={formData.short_description}
                      onChange={handleChange}
                      placeholder="وصف مختصر للمنتج"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">الوصف التفصيلي</label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="وصف تفصيلي للمنتج"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">الباركود</label>
                      <Input
                        name="barcode"
                        value={formData.barcode}
                        onChange={handleChange}
                        placeholder="1234567890123"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">رقم الصنف</label>
                      <Input
                        name="unit_number"
                        value={formData.unit_number || "Unit Number 1"}
                        onChange={handleChange}
                        placeholder="Unit Number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">العلامة التجارية</label>
                    <Input
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="اسم العلامة التجارية"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle>صور المنتج</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current images list */}
                  {images.length > 0 && (
                    <div className="space-y-2">
                      {images.map((img, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-shrink-0">
                            {img.image_url ? (
                              <img src={img.image_url} alt={img.alt_text} className="w-16 h-16 object-cover rounded" />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                <Image className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{img.alt_text || 'بدون وصف'}</p>
                            <p className="text-xs text-gray-500 truncate">{img.image_url}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {img.is_primary && (
                                <span className="text-xs bg-primary text-white px-2 py-0.5 rounded">صورة أساسية</span>
                              )}
                              <span className="text-xs text-gray-500">{img.image_type}</span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setImages(images.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new image */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <Input
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="رابط الصورة (URL)"
                      />
                      <Input
                        value={newImageAlt}
                        onChange={(e) => setNewImageAlt(e.target.value)}
                        placeholder="وصف الصورة"
                      />
                      <div className="flex items-center gap-3">
                        <Select 
                          value={newImageType} 
                          onValueChange={setNewImageType}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="نوع الصورة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="product">صورة منتج</SelectItem>
                            <SelectItem value="gallery">معرض صور</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center space-x-2 space-x-reverse whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={newImagePrimary}
                            onChange={(e) => setNewImagePrimary(e.target.checked)}
                            className="w-4 h-4 text-primary border-gray-300 rounded"
                          />
                          <label className="text-sm">أساسية</label>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        console.log('📸 Add Image Button Clicked!');
                        console.log('Current URL:', newImageUrl);
                        console.log('Current Alt:', newImageAlt);
                        console.log('Current Type:', newImageType);
                        console.log('Current Primary:', newImagePrimary);
                        console.log('Current Images Array:', images);
                        
                        if (newImageUrl.trim()) {
                          const newImage = {
                            image_url: newImageUrl,
                            alt_text: newImageAlt || '',
                            image_type: newImageType,
                            is_primary: newImagePrimary || images.length === 0,
                          };
                          console.log('✅ Adding new image:', newImage);
                          setImages([...images, newImage]);
                          console.log('📦 Updated images array:', [...images, newImage]);
                          
                          // Reset form
                          setNewImageUrl("");
                          setNewImageAlt("");
                          setNewImageType("product");
                          setNewImagePrimary(false);
                          console.log('🔄 Form reset complete');
                        } else {
                          console.warn('⚠️ Image URL is empty!');
                          toast({
                            title: "تنبيه",
                            description: "الرجاء إدخال رابط الصورة",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة صورة
                    </Button>
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
                    <div>
                      <label className="block text-sm font-medium mb-2">سعر المقارنة</label>
                      <Input
                        name="compare_price"
                        type="number"
                        step="0.01"
                        value={formData.compare_price}
                        onChange={handleChange}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">سعر التكلفة</label>
                      <Input
                        name="cost_price"
                        type="number"
                        step="0.01"
                        value={formData.cost_price}
                        onChange={handleChange}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">نسبة الخصم (%)</label>
                      <Input
                        name="discount_percentage"
                        type="number"
                        step="0.01"
                        value={formData.discount_percentage}
                        onChange={handleChange}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">نقاط الولاء</label>
                      <Input
                        name="loyalty_points"
                        type="number"
                        value={formData.loyalty_points}
                        onChange={handleChange}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">الوزن (كجم)</label>
                      <Input
                        name="weight"
                        type="number"
                        step="0.001"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="0.000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">الأبعاد (الطول x العرض x الارتفاع)</label>
                    <Input
                      name="dimensions"
                      value={formData.dimensions}
                      onChange={handleChange}
                      placeholder="مثال: 160x77x8.25 mm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">تاريخ انتهاء الصلاحية</label>
                    <Input
                      name="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Boolean fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                        id="is_featured"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <label htmlFor="is_featured" className="text-sm font-medium">
                        منتج مميز ⭐
                      </label>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <label htmlFor="is_active" className="text-sm font-medium">
                        نشط ✓
                      </label>
                    </div>
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
                    <div>
                      <label className="block text-sm font-medium mb-2">الكمية في المخزون</label>
                      <Input
                        name="quantity_on_hand"
                        type="number"
                        value={formData.quantity_on_hand}
                        onChange={handleChange}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">حد إعادة الطلب</label>
                      <Input
                        name="reorder_level"
                        type="number"
                        value={formData.reorder_level}
                        onChange={handleChange}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">الحد الأقصى للمخزون</label>
                      <Input
                        name="max_stock_level"
                        type="number"
                        value={formData.max_stock_level}
                        onChange={handleChange}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">تكلفة الوحدة</label>
                      <Input
                        name="cost_per_unit"
                        type="number"
                        step="0.01"
                        value={formData.cost_per_unit}
                        onChange={handleChange}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">الموقع في المتجر</label>
                    <Input
                      name="location_in_store"
                      value={formData.location_in_store}
                      onChange={handleChange}
                      placeholder="مثال: قسم الموبايلات - رف A3"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4">
                <Button type="button" onClick={handleCancel} variant="outline">
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90"
                  disabled={createProductMutation.isPending}
                >
                  <Save className="h-4 w-4 ml-2" />
                  {createProductMutation.isPending ? "جاري الحفظ..." : "حفظ المنتج"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}