import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { ArrowRight, UserPlus, Loader2, Shield, Settings, Store, Users, Package, BarChart, CreditCard, MessageSquare, Database, Gift, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import Loading from "@/components/common/loading";
import {mockApi} from "@/services/mockData"

interface Permission {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  module: string;
}

interface Role {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
}

interface Branch {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
}

const addUserSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول مطلوب"),
  lastName: z.string().min(2, "الاسم الأخير مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().min(10, "رقم الهاتف مطلوب"),
  jobTitle: z.string().min(2, "المسمى الوظيفي مطلوب"),
  roleId: z.number().min(1, "يجب اختيار دور"),
  branchId: z.number().optional(),
  isActive: z.boolean().default(true),
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
  data_management: Database
};

const moduleColors = {
  store_management: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  branch_management: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  user_management: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  product_management: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  offers_management: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  pos: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  analytics: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  marketing: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  payment: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  customer_service: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  data_management: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

export default function AddUserPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [permissions,setPermissions] = useState([]);
  const [permissionsLoading,setPermissionsLoading] = useState(true)
  const [roles,setRole] = useState([]);
  const [rolesLoading,setRoleLoding] = useState(true)
  const [branches,setBranches] = useState([])
  const [branchesLoading,setLodingBranches] = useState(true)
  const form = useForm<AddUserForm>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      roleId: 5, // Default to cashier role
      branchId: undefined,
      isActive: true,
    },
  });

  // const { data: role = [], isLoading: rolesLoading } = useQuery({
  //   queryKey: ["/api/roles"],
  // });
  // const roles = normalizeArray(role)
  useEffect(()=>{
    const fetchRoles = async () =>{
      const data = await mockApi.getRoles()
      setRole(data)
      setRoleLoding(false)
    }
    fetchRoles()
  },[])

  // const { data: branches = [], isLoading: branchesLoading } = useQuery({
  //   queryKey: ["/api/branches"],
  // });
  useEffect(()=>{
    const fetchBranches = async () => {
      const data = await mockApi.getBranches()
      setBranches(data)
      setLodingBranches(false)
    }
    fetchBranches()
  },[])


  
  useEffect(()=>{
    const fetchPermissions = async () => {
        const data = await mockApi.getPermissions();
        setPermissions(data)
        setPermissionsLoading(false)
    }
    fetchPermissions();
  },[])



  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc: any, permission: Permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {});

  const addUserMutation = useMutation({
    mutationFn: async (userData: AddUserForm & { permissions: number[] }) => {
      return await apiRequest("POST", "/users", userData);
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
      let errorMessage = "حدث خطأ أثناء إضافة المستخدم";
      
      if (error.message) {
        if (error.message.includes("البريد الإلكتروني مستخدم بالفعل")) {
          errorMessage = "البريد الإلكتروني مستخدم بالفعل";
        } else if (error.message.includes("Unauthorized")) {
          errorMessage = "ليس لديك صلاحية لإضافة مستخدمين";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "خطأ في إنشاء المستخدم",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddUserForm) => {
    addUserMutation.mutate({
      ...data,
      permissions: selectedPermissions
    });
  };

  const handlePermissionToggle = (permissionId: number, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  if (authLoading || rolesLoading || branchesLoading || permissionsLoading) {
    return <Loading />;
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

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
              
              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">الاسم الأول *</FormLabel>
                          <FormControl>
                            <Input className="h-9" placeholder="أدخل الاسم الأول" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">الاسم الأخير *</FormLabel>
                          <FormControl>
                            <Input className="h-9" placeholder="أدخل الاسم الأخير" {...field} />
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
                          <FormLabel className="text-sm">البريد الإلكتروني *</FormLabel>
                          <FormControl>
                            <Input 
                              className="h-9"
                              type="email" 
                              placeholder="example@company.com" 
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
                          <FormLabel className="text-sm">رقم الهاتف *</FormLabel>
                          <FormControl>
                            <Input className="h-9" placeholder="05xxxxxxxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">المسمى الوظيفي *</FormLabel>
                          <FormControl>
                            <Input className="h-9" placeholder="أدخل المسمى الوظيفي" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="roleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">الدور *</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="اختر الدور" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(roles as any[]).map((role: any) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
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

                  {/* Additional Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    <FormField
                      control={form.control}
                      name="branchId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">الفرع</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="اختر الفرع (اختياري)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">
                              حالة النشاط
                            </FormLabel>
                            <div className="text-xs text-muted-foreground">
                              تحديد ما إذا كان المستخدم نشطاً في النظام
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
                  </div>

                  {/* Permissions Management */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Shield className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold">إدارة الصلاحيات</h3>
                      <Badge variant="secondary">{selectedPermissions.length} مُختارة</Badge>
                    </div>

                    <div className="space-y-6">
                      {Object.entries(permissionsByModule).map(([module, modulePermissions]: [string, any]) => {
                        const IconComponent = moduleIcons[module as keyof typeof moduleIcons] || Settings;
                        const moduleColor = moduleColors[module as keyof typeof moduleColors] || "bg-gray-100 text-gray-800";
                        
                        return (
                          <Card key={module} className="border border-gray-200 dark:border-gray-700">
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${moduleColor}`}>
                                  <IconComponent className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <CardTitle className="text-base">
                                    {module === 'store_management' && 'إدارة المتجر'}
                                    {module === 'branch_management' && 'إدارة الفروع'}
                                    {module === 'user_management' && 'إدارة المستخدمين'}
                                    {module === 'product_management' && 'إدارة المنتجات'}
                                    {module === 'offers_management' && 'إدارة العروض'}
                                    {module === 'pos' && 'نقطة البيع'}
                                    {module === 'analytics' && 'التقارير والتحليلات'}
                                    {module === 'marketing' && 'التسويق'}
                                    {module === 'payment' && 'المدفوعات'}
                                    {module === 'customer_service' && 'خدمة العملاء'}
                                    {module === 'data_management' && 'إدارة البيانات'}
                                  </CardTitle>
                                  <div className="text-sm text-muted-foreground">
                                    {modulePermissions.length} صلاحية متاحة
                                  </div>
                                </div>
                                <Badge variant="outline" className={moduleColor}>
                                  {modulePermissions.filter((p: Permission) => selectedPermissions.includes(p.id)).length}
                                  /
                                  {modulePermissions.length}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {modulePermissions.map((permission: Permission) => (
                                  <div
                                    key={permission.id}
                                    className="flex items-start space-x-3 space-x-reverse p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                  >
                                    <Checkbox
                                      id={`permission-${permission.id}`}
                                      checked={selectedPermissions.includes(permission.id)}
                                      onCheckedChange={(checked) =>
                                        handlePermissionToggle(permission.id, checked as boolean)
                                      }
                                      className="mt-1"
                                    />
                                    <div className="flex-1 space-y-1">
                                      <label
                                        htmlFor={`permission-${permission.id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                      >
                                        {permission.displayName}
                                      </label>
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
                    </div>

                    {Object.keys(permissionsByModule).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد صلاحيات متاحة</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6 border-t">
                    <Button
                      type="submit"
                      disabled={addUserMutation.isPending}
                      className="flex items-center gap-2 h-9"
                    >
                      {addUserMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <UserPlus className="h-4 w-4" />
                      حفظ المستخدم مع الصلاحيات
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/users")}
                      className="h-9"
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