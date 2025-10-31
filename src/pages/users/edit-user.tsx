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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowRight, Save, UserCheck, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/common/loading";
import { changePassword, getUserByid, updateUserData } from "@/services/users";
import { getStoreBranches } from "@/services/branches";
import { Badge } from "@/components/ui/badge";

const editUserSchema = z.object({
  first_name: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
  last_name: z.string().min(2, "الاسم الأخير يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().min(10, "رقم الهاتف يجب أن يكون 10 أرقام على الأقل"),
  job_title_display: z.string().min(2, "المسمى الوظيفي مطلوب"),
  role_display: z.string().min(1, "يجب اختيار دور"),
  branch_display: z.number().optional(),
  is_active_display: z.boolean().default(true),
  store: z.number().optional(),
  gender: z.enum(["male", "female"], { message: "يجب اختيار الجنس" }),
  date_of_birth: z.string().optional(), // format: "YYYY-MM-DD"
});

type EditUserForm = z.infer<typeof editUserSchema>;

export default function EditUserPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/users/edit/:id");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const userId = params?.id;
  console.log(userId)

  const form = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      job_title_display: "",
      role_display: "",
      branch_display: undefined,
      is_active_display: true,
      store: undefined,
      gender: "male",
      date_of_birth: "",
    },
  });

  // ✅ Fetch user data
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ["user", userId],
    enabled: !!userId,
    queryFn: () => getUserByid(Number(userId)),
  });

  const userSlug = user?.store_slug;

  // ✅ Roles list
  const roles = [
    { id: 1, name: "owner", displayName: "مدير عام" },
    { id: 2, name: "manager", displayName: "مدير فرع" },
    { id: 3, name: "cashier", displayName: "كاشير" },
    { id: 4, name: "employee", displayName: "موظف" },
  ];

  // ✅ Fetch branches based on user store
  const {
    data: branches = [],
    isLoading: branchesLoading,
    error: branchesError,
  } = useQuery({
    queryKey: ["branches", userSlug],
    enabled: !!user?.store_slug,
    queryFn: () => getStoreBranches(userSlug),
  });

  // ✅ Populate form once user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        job_title_display: user.job_title_display || "",
        role_display: user.role_display || "",
        branch_display: user.branch_display || undefined,
        is_active_display: user.is_active_display ?? true,
        store: user.store || undefined,
        gender: user.gender || "male",
        date_of_birth: user.date_of_birth || "",
      });
    }
  }, [user, form]);

  // ✅ Mutation to update user
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: EditUserForm }) => {
      console.log(data)
      return await updateUserData(Number(userId),data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
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

  // ✅ Change Password Inner Component
  function ChangePasswordForm() {
    const { toast } = useToast();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChangePassword = async () => {
      if (newPassword !== confirmNewPassword) {
        toast({
          title: "خطأ",
          description: "كلمات المرور غير متطابقة",
          variant: "destructive",
        });
        return;
      }
  
      try {
        setIsLoading(true);
        await changePassword(oldPassword, newPassword, confirmNewPassword); // ✅ استخدمنا الفنكشن الجديدة
        toast({
          title: "تم التحديث",
          description: "تم تغيير كلمة المرور بنجاح",
        });
        setOldPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } catch (error: any) {
        toast({
          title: "فشل في تغيير كلمة المرور",
          description: error.message || "تحقق من البيانات المدخلة",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
  

    return (
      <div className="space-y-4">
        <div>
          <Label>كلمة المرور الحالية</Label>
          <Input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </div>
        <div>
          <Label>كلمة المرور الجديدة</Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <Label>تأكيد كلمة المرور الجديدة</Label>
          <Input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
        </div>
        <Button onClick={handleChangePassword} disabled={isLoading}>
          {isLoading ? "جارٍ التحديث..." : "تغيير كلمة المرور"}
        </Button>
      </div>
    );
  }

  // ✅ Handle Loading states
  if (userLoading || branchesLoading) return <Loading />;

  if (!match || !userId) {
    setLocation("/users");
    return null;
  }

  if (!currentUser) return <Loading />;
  if (!user) return <Loading />;

  // ✅ Submit handler
  const onSubmit = (data: EditUserForm) => {
    updateUserMutation.mutate({ userId: Number(userId), data });
  };

  return (
    <PageLayout maxWidth="2xl">
      <PageHeader
        title="تعديل المستخدم"
        subtitle={`تحديث بيانات المستخدم ${user.first_name} ${user.last_name}`}
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
          {/* ✅ User status badge */}
          <div className="mb-4">
            {user.is_active_display ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                نشط
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600 border-red-600">
                معطل
              </Badge>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* --- Name Fields --- */}
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

              {/* --- Contact Info --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني*</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="example@email.com" {...field} />
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
                        <Input type="tel" placeholder="0501234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* --- Job Title --- */}
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

              {/* --- Role & Branch --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role_display"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الدور*</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الدور" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.name}>
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
                        onValueChange={(val) =>
                          field.onChange(val === "none" ? undefined : parseInt(val))
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفرع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">بدون فرع</SelectItem>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id.toString()}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* --- Store --- */}
              <FormField
                control={form.control}
                name="store"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المتجر</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="أدخل رقم المتجر أو اتركه فارغًا"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- Gender --- */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الجنس</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الجنس" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- date_of_birth --- */}
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الميلاد</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- Active Status --- */}
              <FormField
                control={form.control}
                name="is_active_display"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between border p-4 rounded-lg">
                    <div>
                      <FormLabel>حالة النشاط</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        تحديد ما إذا كان المستخدم نشطاً
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* --- Action Buttons --- */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 ml-2" />
                  {updateUserMutation.isPending
                    ? "جاري الحفظ..."
                    : "حفظ التغييرات"}
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

          {/* --- Password Section --- */}
          <Card className="mt-10">
            <CardHeader>
              <CardTitle>تغيير كلمة المرور</CardTitle>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
