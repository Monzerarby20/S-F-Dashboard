import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Megaphone, Plus, Edit, Trash2, Eye, Upload, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";
import { createPromotion, getAllPromotions } from "../../services/promotion";
import { createFlashSale, updateFlashSale, updateFlashSaleStatus, deleteFlashSale, getFlashSaleById, getFlashSalesByType, searchPromotions, getAllOffers } from "@/services/offers";
import PromotionsTable from "./promotions-table";
import { Switch } from "@/components/ui/switch";
const promotionSchema = z.object({
  name: z.string().min(1, "اسم العرض مطلوب"),
  slug: z.string(),
  promotion_type: z.enum([
    "flash_sale",
    "seasonal",
    "clearance",
    "bundle",
    "loyalty",
    "referral",
  ]),
  start_date: z.date(),
  end_date: z.date(),
  description: z.string(),
  is_active: z.boolean(),
  target_audience: z.enum(["all", "new_users", "vip", "returning"]),
  budget: z.coerce.number().min(0, "الميزانية لازم تكون رقم موجب"),

});
const arabicToEnglishMap: Record<string, string> = {
  ا: "a", أ: "a", إ: "e", آ: "a",
  ب: "b", ت: "t", ث: "th",
  ج: "g", ح: "h", خ: "kh",
  د: "d", ذ: "z", ر: "r",
  ز: "z", س: "s", ش: "sh",
  ص: "s", ض: "d", ط: "t",
  ظ: "z", ع: "a", غ: "gh",
  ف: "f", ق: "q", ك: "k",
  ل: "l", م: "m", ن: "n",
  ه: "h", و: "w", ي: "y",
  ة: "a", ى: "a", ؤ: "w", ئ: "e"
};

const generateSlug = (text: string) => {
  return text
    .split("")
    .map(char => arabicToEnglishMap[char] || char)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};


type PromotionFormData = z.infer<typeof promotionSchema>;

export default function PromotionsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");


  // const { data: promotions = [], isLoading } = useQuery({
  //   queryKey: ['/promotions'],
  // });

  // const {data : promotions = [] , isLoading} = useQuery({
  //   queryKey: ['/promotions'],
  //   queryFn: getAllPromotions,
  // });
  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ['/promotions'],
    queryFn: getAllOffers,
  });
  console.log("Fetched promotions:", promotions);
  console.log("Fetched promotions:", typeof (promotions));



  const promotionForm = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      promotion_type: "",
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      is_active: true,
      is_featured: false,
      target_audience: "all",
      banner_image: "",
      terms_conditions: "",
    },
  });

  useEffect(() => {
    const name = promotionForm.watch("name");
    if (name) {
      promotionForm.setValue("slug", generateSlug(name));
    }
  }, [promotionForm.watch("name")]);


  // Create Promotion Mutation
  const createPromotionMutation = useMutation({
    mutationFn: async (data: PromotionFormData) => {
      const payload = {
        name: data.name,
        description: data.description,
        slug: data.slug,
        promotion_type: data.promotion_type,
        start_date: data.start_date.toISOString().split("T")[0],
        end_date: data.end_date.toISOString().split("T")[0],
        is_active: data.is_active,
        target_audience: data.target_audience,
        budget: data.budget,
      };
      console.log("Creation Request:",payload)
      return createFlashSale(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/promotions"] });
      setIsDialogOpen(false);
      promotionForm.reset();
      toast({
        title: "تم إنشاء العرض",
        description: "تم حفظ العرض بنجاح",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطأ",
        description: err.message || "فشل في إنشاء العرض",
        variant: "destructive",
      });
    },
  });
  

  const updatePromotionMutation = useMutation({
    mutationFn: async (data: PromotionFormData) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('startDate', data.startDate.toISOString());
      formData.append('endDate', data.endDate.toISOString());
      formData.append('isActive', data.isActive.toString());

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch(`/api/promotions/${editingPromotion.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('فشل في تحديث العرض');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/promotions'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "تم التحديث",
        description: "تم تحديث العرض بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث العرض",
        variant: "destructive",
      });
    },
  });

  const deletePromotionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/promotions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('فشل في حذف العرض');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/promotions'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف العرض بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف العرض",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        toast({
          title: "نوع ملف غير صحيح",
          description: "يرجى اختيار صورة صالحة",
          variant: "destructive",
        });
        return;
      }

      // التحقق من حجم الملف (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "حجم الملف كبير",
          description: "يجب أن يكون حجم الصورة أقل من 5 ميجابايت",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (promotion: any) => {
    setEditingPromotion(promotion);
    promotionForm.reset({
      title: promotion.title,
      description: promotion.description,
      startDate: new Date(promotion.startDate),
      endDate: new Date(promotion.endDate),
      isActive: promotion.isActive,
    });
    if (promotion.imageUrl) {
      setImagePreview(promotion.imageUrl);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا العرض؟")) {
      deletePromotionMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setEditingPromotion(null);
    setSelectedImage(null);
    setImagePreview("");
    promotionForm.reset({
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    });
  };

  const handleSubmit = (data: PromotionFormData) => {
    // التحقق من صحة التواريخ
    if (data.endDate <= data.startDate) {
      toast({
        title: "خطأ في التواريخ",
        description: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية",
        variant: "destructive",
      });
      return;
    }

    if (editingPromotion) {
      updatePromotionMutation.mutate(data);
    } else {
      createPromotionMutation.mutate(data);
    }
  };

  const getStatusBadge = (promotion: any) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    if (!promotion.isActive) {
      return <Badge variant="secondary">معطل</Badge>;
    } else if (now < startDate) {
      return <Badge variant="outline">قادم</Badge>;
    } else if (now > endDate) {
      return <Badge variant="destructive">منتهي</Badge>;
    } else {
      return <Badge variant="default">نشط</Badge>;
    }
  };

  if (!user) {
    return <Loading />;
  }

  if (isLoading) {
    return (
      <PageLayout>
        <div className="p-6">
          <Loading />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="إدارة العروض والإعلانات"
        subtitle="إنشاء وإدارة العروض الترويجية والإعلانات"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                إضافة عرض جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPromotion ? "تعديل العرض" : "إضافة عرض جديد"}
                </DialogTitle>
              </DialogHeader>

              <Form {...promotionForm}>
                <form onSubmit={promotionForm.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={promotionForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عنوان العرض</FormLabel>
                          <FormControl>
                            <Input placeholder="أدخل عنوان العرض" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
  control={promotionForm.control}
  name="is_active"
  render={({ field }) => (
    <FormItem>
      <FormLabel>حالة العرض</FormLabel>
      <FormControl>
        <div className="flex items-center gap-2 rounded-lg border p-4">
          <Switch
            checked={field.value}
            className="data-[state=checked]:bg-primary"
            onCheckedChange={field.onChange}
          />
          <span className="text-sm text-muted-foreground">
            تفعيل أو إيقاف العرض
          </span>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

                    

                  </div>

                  <FormField
                    control={promotionForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وصف العرض</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="أدخل وصف مفصل للعرض"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={promotionForm.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug (Auto)</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly className="bg-muted cursor-not-allowed" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={promotionForm.control}
                      name="promotion_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع العرض</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر نوع العرض" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="flash_sale">Flash Sale</SelectItem>
                              <SelectItem value="seasonal">Seasonal</SelectItem>
                              <SelectItem value="clearance">Clearance</SelectItem>
                              <SelectItem value="bundle">Bundle</SelectItem>
                              <SelectItem value="loyalty">Loyalty</SelectItem>
                              <SelectItem value="referral">Referral</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={promotionForm.control}
                      name="target_audience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Audience</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="حدد الفئة المستهدفة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">All Users</SelectItem>
                              <SelectItem value="new_users">New Users</SelectItem>
                              <SelectItem value="vip">VIP</SelectItem>
                              <SelectItem value="returning">Returning Users</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={promotionForm.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الميزانية</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="100000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={promotionForm.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>تاريخ البداية</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: ar })
                                  ) : (
                                    <span>اختر تاريخ البداية</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={promotionForm.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>تاريخ الانتهاء</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: ar })
                                  ) : (
                                    <span>اختر تاريخ الانتهاء</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium">صورة العرض (اختيارية)</label>
                    <div className="flex items-center gap-4">
                      <Button type="button" variant="outline" asChild>
                        <label className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          اختيار صورة
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      </Button>
                      {selectedImage && (
                        <span className="text-sm text-muted-foreground">
                          {selectedImage.name}
                        </span>
                      )}
                    </div>
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="معاينة الصورة"
                          className="max-w-full h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPromotionMutation.isPending || updatePromotionMutation.isPending}
                    >
                      {createPromotionMutation.isPending || updatePromotionMutation.isPending
                        ? "جاري الحفظ..."
                        : editingPromotion
                          ? "تحديث العرض"
                          : "إضافة العرض"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {Array.isArray(promotions) && promotions.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="لا توجد عروض"
          description="لم يتم إنشاء أي عروض ترويجية بعد"
          action={
            <Button onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}>
              إضافة أول عرض
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <PromotionsTable />
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}