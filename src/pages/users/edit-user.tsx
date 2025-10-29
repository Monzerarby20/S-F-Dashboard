import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, useRoute } from "wouter";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowRight, Save, UserCheck, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/common/loading";
import { getUserByid } from "@/services/users";
import {getStoreBranches} from "@/services/branches"
const editUserSchema = z.object({
  first_name: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
  last_name: z.string().min(2, "الاسم الأخير يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().min(10, "رقم الهاتف يجب أن يكون 10 أرقام على الأقل"),
  job_title_display: z.string().min(2, "المسمى الوظيفي مطلوب"),
  role_display: z.number().min(1, "يجب اختيار دور"),
  branch_display: z.number().optional(),
  is_active_display: z.boolean().default(true),
});

type EditUserForm = z.infer<typeof editUserSchema>;

export default function EditUserPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/users/edit/:id');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  const userId = params?.id;
  
  const form = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      job_title_display: "",
      role_display: 0,
      branch_display: undefined,
      is_active_display: true,
    },
  });
  
  
  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user",userId],
    enabled: !!userId,
    queryFn: ()=> getUserByid(Number(userId)),
  });
  console.log("Current user data",user)
  const userSlug = user?.store_slug;
  console.log("user Slug",userSlug)
  // Static roles
  const roles = [
    { id: 1, name: "owner", displayName: "مدير عام" },
    { id: 2, name: "manager", displayName: "مدير فرع" },
    { id: 3, name: "cashier", displayName: "كاشير" },
    { id: 4, name: "employee", displayName: "موظف" },
  ];
  
  
  const {data: branches = [], isLoading: branchesLoading} = useQuery({
    queryKey:['branches',userSlug],
    enabled: !!user?.store_slug,
    queryFn:() => getStoreBranches(userSlug),
  })
  console.log("current branch ",branches)
  
  // Update form when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        first_name: (user as any).first_name || "",
        last_name: (user as any).last_name || "",
        email: (user as any).email || "",
        phone: (user as any).phone || "",
        job_title_display: (user as any).job_title_display|| "",
        role_display: (user as any).role_display || 0,
        branch_display: (user as any).branch_display || undefined,
        is_active_display: (user as any).is_active_display ?? true,
      });
    }
  }, [user, form]);
  
  const updateUserMutation = useMutation({
    mutationFn: async (data: EditUserForm) => {
      return await apiRequest("PUT", `/api/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات المستخدم بنجاح",
      });
      setLocation("/users");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث المستخدم",
        variant: "destructive",
      });
    },
  });
  
  if(branchesLoading|| !branches){
    console.log("⏳ branches data not ready yet");
    return <Loading />;
  }
  const onSubmit = (data: EditUserForm) => {
    updateUserMutation.mutate(data);
  };
  
  if (!match || !userId) {
    setLocation("/users");
    return null;
  }
  
  if (!currentUser) {
    return <Loading />;
  }
  
  if (userLoading  || branchesLoading) {
    return <Loading />;
  }
  if ( !user) {
    console.log("⏳ User data not ready yet");
    return <Loading />;
  }
  
  if (!user) {
    return (
      <PageLayout>
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">المستخدم غير موجود</h2>
          <Button onClick={() => setLocation("/users")}>
            العودة إلى قائمة المستخدمين
          </Button>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout maxWidth="2xl">
      <PageHeader
        title="تعديل المستخدم"
        subtitle={`تحديث بيانات المستخدم ${(user as any).first_name} ${(user as any).last_name}`}
        onBack={() => setLocation("/users")}
        backLabel="العودة لإدارة المستخدمين"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            بيانات المستخدم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم الأول*</FormLabel>
                            <FormControl>
                              <Input placeholder="الاسم الأول" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم الأخير*</FormLabel>
                            <FormControl>
                              <Input placeholder="الاسم الأخير" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني*</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="example@email.com" 
                                {...field} 
                              />
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
                            <FormLabel>رقم الهاتف*</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="0501234567" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Job Information */}
                    <FormField
                      control={form.control}
                      name="job_title_display"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المسمى الوظيفي*</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: مدير المتجر" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                    {/* Role and Branch Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="role_display"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الدور*</FormLabel>
                            <Select
                              value={field.value?.toString()}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الدور" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(roles as any[]).map((role: any) => (
                                  <SelectItem key={role.id} value={role.name.toString()}>
                                    {role.displayName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="branch_display"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الفرع</FormLabel>
                            <Select
                              value={field.value?.toString() || "none"}
                              onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الفرع (اختياري)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">بدون فرع محدد</SelectItem>
                                {(branches as any[]).map((branch: any) => (
                                  <SelectItem key={branch.id} value={branch.id.toString()}>
                                    {branch.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Active Status */}
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              حالة النشاط
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              تحديد ما إذا كان المستخدم نشطاً أم لا
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6">
                      <Button
                        type="submit"
                        disabled={updateUserMutation.isPending}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 ml-2" />
                        {updateUserMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation("/users")}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 ml-2" />
                        إلغاء
                      </Button>
                    </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageLayout>
  );
}