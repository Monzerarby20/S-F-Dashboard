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
const storeSchema = z.object({
  name: z.string().min(1, "اسم المتجر مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phoneNumber: z.string().min(1, "رقم الهاتف مطلوب"),
  address: z.string().min(1, "العنوان مطلوب"),
  loginEmail: z.string().email("بريد إلكتروني غير صالح"),
  taxId: z.string().optional(),
  accountingRefId: z.string().optional(),
  permissionProfile: z.string().optional(),
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
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isEditing = !!id;

  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      address: "",
      loginEmail: "",
      taxId: "",
      accountingRefId: "",
      permissionProfile: "",
    },
  });

  // Fetch store data for editing
  const { data: stores, isLoading: storeLoading } = useQuery({
    queryKey: ['/stores', id],
    enabled: isEditing,
  });
  const store = normalizeArray(stores)

  // Fetch permission profiles
  const { data: permissionProfile = [] } = useQuery({
    queryKey: ['/storepermissionprofiles'],
  });
  const permissionProfiles = normalizeArray(permissionProfile)

  // Fetch branches for this store
  const { data: branche = [] } = useQuery({
    queryKey: ['/branches', { store_id: id }],
    enabled: isEditing,
  });
  const branches = normalizeArray(branche)

  // Update form when store data is loaded
  useEffect(() => {
    if (store && isEditing) {
      form.reset({
        name: store.name || "",
        email: store.email || "",
        phoneNumber: store.phoneNumber || "",
        address: store.address || "",
        loginEmail: store.loginEmail || "",
        taxId: store.taxId || "",
        accountingRefId: store.accountingRefId || "",
        permissionProfile: store.permissionProfile || "",
      });
    }
  }, [store, isEditing, form]);

  // Update mutation only
  const saveMutation = useMutation({
    mutationFn: async (data: StoreFormData) => {
      const response = await apiRequest('PUT', `/api/stores/${id}`, data);
      if (!response.ok) {
        throw new Error('فشل في تحديث المتجر');
      }
      return response.json();
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
    saveMutation.mutate(data);
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
                        name="phoneNumber"
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
                        name="loginEmail"
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
                      <span>{store.mainUserAccount || "غير محدد"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">أنشئ بواسطة:</span>
                      <span>{store.createdBy || 'غير محدد'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                      <span>{store.createdAt ? new Date(store.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">آخر تحديث:</span>
                      <span>{store.lastUpdated ? new Date(store.lastUpdated).toLocaleDateString('ar-SA') : 'غير محدد'}</span>
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