import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Store, Building2, ArrowLeft, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import Loading from "@/components/common/loading";
import { normalizeArray } from "@/services/normalize";
import { getStoreBySlug , updateStoreinfo} from "../../services/stores";
import { getStoreBranches } from "@/services/branches";
const storeSchema = z.object({
  name: z.string().min(1, "اسم المتجر مطلوب"),
  description: z.string().optional(),
  phone: z.string().min(1, "رقم الهاتف مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  address: z.string().min(1, "العنوان مطلوب"),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  store_type: z.string().optional(),
  is_active: z.boolean().optional(),
});
type StoreFormData = z.infer<typeof storeSchema>;

interface Store extends StoreFormData {
  id: string;
  branchesCount: number;
  totalYearlyOperations: number;
  createdBy: string;
  createdAt: string;
  lastUpdated: string;
  mainUserAccount?: string;
}

export default function StoreFormPage() {

  // const storeSlug = localStorage.getItem("userSlug");
  const { slug } = useParams()
  const storeSlug = slug
  console.log(storeSlug)
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const days = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
  const defaultDaySchedule = { open: "09:00", close: "22:00", closed: false, all_day: false };
  const isEditing = !!slug;

  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      description: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
      latitude: "",
      longitude: "",
      store_type: "",
      is_active: true,
    },
  });

  const [openingHours, setOpeningHours] = useState(
    days.reduce((acc, day) => ({ ...acc, [day]: { ...defaultDaySchedule } }), {})
  );


  // Fetch store data for editing
  // const { data: stores, isLoading: storeLoading } = useQuery({
  //   queryKey: ['/stores', id],
  //   enabled: isEditing,
  // });

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ['/stores', storeSlug],
    queryFn: () => getStoreBySlug(storeSlug),
    enabled: isEditing,
  });
  console.log(storeSlug)
  console.log(store)

  useEffect(() => {
    if (store?.opening_hours) {
      try {
        const parsed = typeof store.opening_hours === "string"
          ? JSON.parse(store.opening_hours)
          : store.opening_hours;
        setOpeningHours({ ...openingHours, ...parsed });
      } catch (err) {
        console.error("Error parsing working hours:", err);
      }
    }
  }, [store]);
  // Fetch permission profiles
  const { data: permissionProfile = [] } = useQuery({
    queryKey: ['/storepermissionprofiles'],
  });
  const permissionProfiles = normalizeArray(permissionProfile)

  // Fetch branches for this store
  const { data: branches = [] } = useQuery({
    queryKey: ['/branches', storeSlug],
    queryFn: () => getStoreBranches(storeSlug),
    enabled: isEditing,
  });
  // const branches = normalizeArray(branche)
  function handleDayChange(day, field, value) {
    setOpeningHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
        ...(field === "closed" && value ? { all_day: false } : {}),
        ...(field === "all_day" && value ? { closed: false } : {}),
      },
    }));
  }
  // Update form when store data is loaded
  useEffect(() => {
    if (store && isEditing) {
      form.reset({
        name: store.name || "",
        description: store.description || "",
        phone: store.phone || "",
        email: store.email || "",
        address: store.address || "",
        city: store.city || "",
        state: store.state || "",
        country: store.country || "",
        postal_code: store.postal_code || "",
        latitude: store.latitude || "",
        longitude: store.longitude || "",
        store_type: store.store_type || "",
        is_active: store.is_active ?? true,
      });
    }
  }, [store, isEditing, form]);


  // Update mutation only
  const saveMutation = useMutation({
    mutationFn: async (data: StoreFormData) => {
      console.log(data)
      return await updateStoreinfo(data,storeSlug)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/stores'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث معلومات المتجر بنجاح",
      });
      setLocation('/stores');
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StoreFormData) => {
    const payload = {
      ...data,
      opening_hours: JSON.stringify(openingHours),
    };
    console.log("🚀 Data sent to backend:", payload);
    saveMutation.mutate(payload);
  };

  const handleCancel = () => {
    setLocation('/stores');
  };



  if (storeLoading) {
    return <Loading />;
  }

  return (
    <PageLayout>
      <PageHeader
        title={`تعديل المتجر: ${store?.name || 'غير محدد'}`}
        description="تحديث معلومات المتجر الحالي"
        icon={<Store className="h-8 w-8" />}
        actions={
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة للمعلومات
          </Button>
        }
      />

      <div className="space-y-6">
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">المعلومات الأساسية</TabsTrigger>
            {isEditing && <TabsTrigger value="branches">الفروع التابعة</TabsTrigger>}
            {isEditing && <TabsTrigger value="stats">الإحصائيات</TabsTrigger>}
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>معلومات المتجر</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم المتجر *</FormLabel>
                            <FormControl>
                              <Input placeholder="اسم المتجر" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="example@domain.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف *</FormLabel>
                            <FormControl>
                              <Input placeholder="+966XXXXXXXXX" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني للدخول *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="login@domain.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="taxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>معرف الضريبة</FormLabel>
                            <FormControl>
                              <Input placeholder="رقم التسجيل الضريبي" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accountingRefId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>معرف المرجع المحاسبي</FormLabel>
                            <FormControl>
                              <Input placeholder="رقم المرجع المحاسبي" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>العنوان *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="العنوان الكامل للمتجر"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel>ساعات العمل</FormLabel>
                      <div className="border p-3 rounded-md">
                        <div className="space-y-2">
                          {days.map((day) => (
                            <div key={day} className="flex items-center justify-between border-b py-2">
                              <span className="capitalize w-24">{day}</span>
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    checked={openingHours[day]?.closed}
                                    onChange={(e) => handleDayChange(day, "closed", e.target.checked)}
                                  />
                                  مغلق
                                </label>
                                <label className="flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    checked={openingHours[day]?.all_day}
                                    onChange={(e) => handleDayChange(day, "all_day", e.target.checked)}
                                  />
                                  24 ساعة
                                </label>
                              </div>
                              {!openingHours[day]?.closed && !openingHours[day]?.all_day && (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="time"
                                    value={openingHours[day]?.open}
                                    onChange={(e) => handleDayChange(day, "open", e.target.value)}
                                    className="w-28"
                                  />
                                  <Input
                                    type="time"
                                    value={openingHours[day]?.close}
                                    onChange={(e) => handleDayChange(day, "close", e.target.value)}
                                    className="w-28"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>


                    <FormField
                      control={form.control}
                      name="permissionProfile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ملف الصلاحيات</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر ملف الصلاحيات" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {permissionProfiles.map((profile: any) => (
                                <SelectItem key={profile.id} value={profile.id}>
                                  {profile.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        disabled={saveMutation.isPending}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saveMutation.isPending ? "جاري التحديث..." : "حفظ التعديلات"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {isEditing && (
            <TabsContent value="branches">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    الفروع التابعة ({branches?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!branches || branches.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد فروع مرتبطة بهذا المتجر
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(branches || []).map((branch: any) => (
                        <div key={branch.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{branch.name || 'غير محدد'}</h4>
                              <p className="text-sm text-muted-foreground">{branch.address || 'غير محدد'}</p>
                              <p className="text-sm text-muted-foreground">{branch.phoneNumber || 'غير محدد'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">مدير الفرع: {branch.manager || "غير محدد"}</p>
                              <p className="text-sm text-muted-foreground">العمولة: {branch.commissionPercentage || 0}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isEditing && store && (
            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>معلومات النظام</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">معرف المتجر:</span>
                      <span className="font-mono text-sm">{store.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الحساب الرئيسي:</span>
                      <span>{store.email || "غير محدد"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">أنشئ بواسطة:</span>
                      <span>{store.owner_name || 'غير محدد'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                      <span>{store.created_at ? new Date(store.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">آخر تحديث:</span>
                      <span>{store.updated_at ? new Date(store.updated_at).toLocaleDateString('ar-SA') : 'غير محدد'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>الإحصائيات</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">عدد الفروع:</span>
                      <span className="font-bold">{store.branchesCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">العمليات السنوية:</span>
                      <span className="font-bold text-green-600">
                        {store.totalYearlyOperations?.toLocaleString('ar-SA') || 0} ر.س
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>


    </PageLayout>
  );
}