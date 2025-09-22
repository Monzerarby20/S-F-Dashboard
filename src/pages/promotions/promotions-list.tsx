import { useState } from "react";
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

const promotionSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean().default(true),
});

type PromotionFormData = z.infer<typeof promotionSchema>;

export default function PromotionsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ['/promotions'],
  });

  const promotionForm = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  const createPromotionMutation = useMutation({
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

      const response = await fetch('/promotions', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'فشل في إنشاء العرض');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/promotions'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "تم الحفظ",
        description: "تم إنشاء العرض بنجاح",
      });
    },
    onError: (error: Error) => {
      console.error('Error creating promotion:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء العرض",
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
                      name="title"
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
                      name="isActive"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>حالة العرض</FormLabel>
                          <Select
                            value={field.value ? "true" : "false"}
                            onValueChange={(value) => field.onChange(value === "true")}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="true">نشط</SelectItem>
                              <SelectItem value="false">معطل</SelectItem>
                            </SelectContent>
                          </Select>
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
                      name="startDate"
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
                      name="endDate"
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
          action={{
            label: "إضافة أول عرض",
            onClick: () => {
              resetForm();
              setIsDialogOpen(true);
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(promotions) && promotions.map((promotion: any) => (
            <Card key={promotion.id} className="overflow-hidden">
              {promotion.imageUrl && (
                <div className="aspect-video relative">
                  <img
                    src={promotion.imageUrl}
                    alt={promotion.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {promotion.title}
                  </CardTitle>
                  {getStatusBadge(promotion)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {promotion.description}
                </p>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    من: {format(new Date(promotion.startDate), "dd/MM/yyyy")}
                  </span>
                  <span>
                    إلى: {format(new Date(promotion.endDate), "dd/MM/yyyy")}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-4 mt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(promotion)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(promotion.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  );
}