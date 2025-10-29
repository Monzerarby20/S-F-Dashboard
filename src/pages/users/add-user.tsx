import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import {
  UserPlus,
  Loader2,
 
  Store,
  Users,
  Package,
  BarChart,
  CreditCard,
  MessageSquare,
  Database,
  Gift,
  Calendar,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent,} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import Loading from "@/components/common/loading";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;



interface Role {
  id: number;
  name: string;
  displayName: string;
}

interface StoreType {
  id: number;
  name: string;
  slug: string;
}

interface Branch {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
}

const addUserSchema = z
  .object({
    first_name: z.string().min(2, "الاسم الأول مطلوب"),
    last_name: z.string().min(2, "الاسم الأخير مطلوب"),
    email: z.string().email("البريد الإلكتروني غير صحيح"),
    phone: z.string().min(10, "رقم الهاتف مطلوب"),
    job_title: z.string().min(2, "المسمى الوظيفي مطلوب"),
    role: z.string().min(1, "يجب اختيار دور"),
    store_id: z.number().optional(),
    branch_id: z.number().optional(),
    gender: z.enum(["male", "female"], { required_error: "الجنس مطلوب" }),
    date_of_birth: z.string().min(1, "تاريخ الميلاد مطلوب"),
    password: z.string().min(6, "كلمة السر يجب أن تكون 6 أحرف على الأقل"),
    confirm_password: z.string().min(6, "تأكيد كلمة المرور مطلوب"),
    is_active: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "كلمتا المرور غير متطابقتان",
    path: ["confirm_password"],
  });


type AddUserForm = z.infer<typeof addUserSchema>;

const moduleIcons = {
  store_management: Store,
  branch_management: Store,
  user_management: Users,
  product_management: Package,
  offers_management: Gift,
  pos: CreditCard,
  analytics: BarChart,
  marketing: Calendar,
  payment: CreditCard,
  customer_service: MessageSquare,
  data_management: Database,
};

const moduleColors = {
  store_management:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  branch_management:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  user_management:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  product_management:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  offers_management:
    "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  pos: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  analytics:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  marketing: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  payment:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  customer_service:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  data_management:
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function AddUserPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

 

  const [stores, setStores] = useState<StoreType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const form = useForm<AddUserForm>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      job_title: "",
      password: "",
      confirm_password: "",
      gender: "male",
      date_of_birth: "",
      role: "",
      store_id: undefined,
      branch_id: undefined,
      is_active: false,
    },
  });


  // Fetch roles
  const staticRoles = [
    { id: 1, name: "owner", displayName: "مدير عام" },
    { id: 2, name: "manager", displayName: "مدير فرع" },
    { id: 3, name: "cashier", displayName: "كاشير" },
    { id: 4, name: "employee", displayName: "موظف" },
  ];


  // Fetch stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoadingStores(true);
        const token = localStorage.getItem("token");
        const url = `${BASE_URL}stores/stores/`;
        console.debug("Fetching stores from:", url);
        const res = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        // Normalize response whether backend uses pagination or not:
        const data = res.data && Array.isArray(res.data) ? res.data
          : res.data && Array.isArray(res.data.results) ? res.data.results
            : res.data && res.data.results ? res.data.results
              : [];

        if (!Array.isArray(data)) {
          console.warn("Unexpected stores response shape:", res.data);
        }
        setStores(data);
        console.debug("Loaded stores:", data);
      } catch (err) {
        console.error("Error fetching stores:", err);
        toast({
          title: "تعذر تحميل المتاجر",
          description: String(err?.message || err),
          variant: "destructive",
        });
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, [toast]);


  // Fetch permissions
  // useEffect(() => {
  //   const fetchPermissions = async () => {
  //     const data = await mockApi.getPermissions();
  //     setPermissions(data);
  //     setPermissionsLoading(false);
  //   };
  //   fetchPermissions();
  // }, []);

  // Fetch branches when store changes
  const handleStoreChange = async (selectedStoreIdOrSlug: number | string | undefined) => {
    // reset branch field
    form.setValue("branch_id", undefined);
    setBranches([]);

    if (!selectedStoreIdOrSlug) {
      return;
    }

    try {
      setLoadingBranches(true);

      // find store by id or slug
      const store = stores.find(s => s.id === Number(selectedStoreIdOrSlug) || s.slug === selectedStoreIdOrSlug);
      if (!store) {
        console.warn("Selected store not found in stores list:", selectedStoreIdOrSlug, stores);
        return;
      }

      // prefer slug if available
      const storeSlug = store.slug ?? store.id;
      const token = localStorage.getItem("token");
      // Ensure BASE_URL ends with a single slash
      const base = BASE_URL?.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
      const url = `${base}stores/stores/${storeSlug}/branches/`;

      console.debug("Fetching branches from:", url);
      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = res.data && Array.isArray(res.data) ? res.data
        : res.data && Array.isArray(res.data.results) ? res.data.results
          : res.data && res.data.results ? res.data.results
            : [];

      if (!Array.isArray(data)) {
        console.warn("Unexpected branches response shape:", res.data);
      }
      setBranches(data);
      console.debug("Loaded branches:", data);
    } catch (err) {
      console.error("Error fetching branches:", err);
      toast({
        title: "تعذر تحميل الفروع",
        description: String(err?.message || err),
        variant: "destructive",
      });
    } finally {
      setLoadingBranches(false);
    }
  };


  const addUserMutation = useMutation({
    mutationFn: async (userData: AddUserForm) => {
      return await apiRequest("POST", "auth/register/", userData);
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء المستخدم بنجاح",
        description: "تم إضافة المستخدم الجديد إلى النظام",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setLocation("/users");
    },
    onError: (error: any) => {
      console.error("Add user error:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المستخدم",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddUserForm) => {
    const payload = {
      gender: data.gender,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      confirm_password: data.confirm_password,
      date_of_birth: data.date_of_birth,
      store_id: data.store_id || null,
      role: data.role,
      branch_id: data.branch_id || null,
      job_title: data.job_title,
      is_active: data.is_active ?? false, // لو مش متحددة هتكون false
    };

    console.log("Submitting user:", payload);
    addUserMutation.mutate(payload);
  };

  // const handlePermissionToggle = (permissionId: number, checked: boolean) => {
  //   if (checked) setSelectedPermissions((p) => [...p, permissionId]);
  //   else setSelectedPermissions((p) => p.filter((id) => id !== permissionId));
  // };

  if (authLoading  || loadingStores) {
    return <Loading />;
  }


  if (!user) {
    setLocation("/login");
    return null;
  }

  // Group permissions by module
  // const permissionsByModule = permissions.reduce((acc: any, permission) => {
  //   if (!acc[permission.module]) acc[permission.module] = [];
  //   acc[permission.module].push(permission);
  //   return acc;
  // }, {});

  return (
    <PageLayout maxWidth="2xl">
      <PageHeader
        title="إضافة مستخدم جديد"
        subtitle="إدخال بيانات مستخدم جديد في النظام"
        onBack={() => setLocation("/users")}
        backLabel="العودة لإدارة المستخدمين"
      />

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* ========== BASIC INFO ========== */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* First Name */}
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الأول *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل الاسم الأول" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Last Name */}
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الأخير *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل الاسم الأخير" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="example@shop.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف *</FormLabel>
                      <FormControl>
                        <Input placeholder="010xxxxxxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Job Title */}
                <FormField
                  control={form.control}
                  name="job_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المسمى الوظيفي *</FormLabel>
                      <FormControl>
                        <Input placeholder="مثل: Cashier - Downtown" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Store Select */}
                <FormField
                  control={form.control}
                  name="store_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">المتجر</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value ? Number(value) : undefined);
                          const store = stores.find((s) => s.id === Number(value));
                          if (store) {
                            handleStoreChange(store.slug ?? store.id);
                          }
                        }}
                        value={field.value?.toString() || ""}
                        disabled={loadingStores}
                      >
                        <SelectTrigger className="w-full">
                          {loadingStores
                            ? "جاري تحميل المتاجر..."
                            : field.value
                              ? stores.find((s) => s.id === Number(field.value))?.name || "اختر المتجر"
                              : "اختر المتجر"}
                        </SelectTrigger>

                        <SelectContent>
                          {stores.length > 0 ? (
                            stores.map((store) => (
                              <SelectItem key={store.id} value={store.id.toString()}>
                                {store.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-gray-500 text-sm text-center">
                              لا توجد متاجر متاحة
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Branch Select */}
                <FormField
                  control={form.control}
                  name="branch_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">الفرع</FormLabel>
                      <Select
                        disabled={!form.watch("store_id") || loadingBranches}
                        onValueChange={(value) =>
                          field.onChange(value ? Number(value) : undefined)
                        }
                        value={field.value?.toString() || ""}
                      >
                        <SelectTrigger className="w-full">
                          {!form.watch("store_id")
                            ? "اختر المتجر أولاً"
                            : loadingBranches
                              ? "جاري تحميل الفروع..."
                              : field.value
                                ? branches.find((b) => b.id === Number(field.value))?.name ||
                                "اختر الفرع"
                                : "اختر الفرع"}
                        </SelectTrigger>

                        <SelectContent>
                          {branches.length > 0 ? (
                            branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id.toString()}>
                                {branch.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-gray-500 text-sm text-center">
                              {!form.watch("store_id")
                                ? "اختر المتجر أولاً"
                                : "لا توجد فروع متاحة"}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                {/* Gender Select */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الجنس</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الجنس" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">ذكر</SelectItem>
                          <SelectItem value="female">أنثى</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date of Birth */}
                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ الميلاد</FormLabel>
                      <Input type="date" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
                      <Input type="password" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تأكيد كلمة المرور</FormLabel>
                      <Input type="password" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />


                {/* Role */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الدور *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الدور" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {staticRoles.map((role) => (
                            <SelectItem key={role.name} value={role.name}>
                              {role.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              {/* Permissions */}
              {/* <div className="pt-6 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">إدارة الصلاحيات</h3>
                  <Badge variant="secondary">
                    {selectedPermissions.length} مُختارة
                  </Badge>
                </div>

                {Object.entries(permissionsByModule).map(([module, modulePermissions]) => {
                  const Icon = moduleIcons[module as keyof typeof moduleIcons] || Settings;
                  const color = moduleColors[module as keyof typeof moduleColors];
                  return (
                    <Card key={module} className="mb-4 border border-gray-200 dark:border-gray-700">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base">
                              {modulePermissions[0].module}
                            </CardTitle>
                          </div>
                          <Badge variant="outline" className={color}>
                            {
                              modulePermissions.filter((p: any) =>
                                selectedPermissions.includes(p.id)
                              ).length
                            }
                            /{modulePermissions.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {modulePermissions.map((permission: Permission) => (
                            <div
                              key={permission.id}
                              className="flex items-start p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <Checkbox
                                checked={selectedPermissions.includes(permission.id)}
                                onCheckedChange={(checked) =>
                                  handlePermissionToggle(permission.id, checked as boolean)
                                }
                              />
                              <div className="ms-2">
                                <p className="text-sm font-medium">
                                  {permission.displayName}
                                </p>
                                {permission.description && (
                                  <p className="text-xs text-muted-foreground">
                                    {permission.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div> */}

              {/* Submit */}
              <div className="flex gap-3 pt-6 border-t">
                <Button type="submit" disabled={addUserMutation.isPending}>
                  {addUserMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  <UserPlus className="h-4 w-4 mr-2" />
                  حفظ المستخدم
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/users")}
                >
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
