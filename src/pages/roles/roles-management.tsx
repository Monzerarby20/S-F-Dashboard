import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Shield, Users, Settings, UserCheck, Key, ChevronRight, Home, Database, BarChart3, Package, ShoppingCart, CreditCard, Bell, Lock, Search, Filter, Store, Building2, UserPlus, FileText, Activity, Globe } from "lucide-react";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";
import { normalizeArray } from "@/services/normalize";

interface Role {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  isSystemRole: boolean;
  createdAt: string;
}

interface Permission {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  module: string;
  createdAt: string;
}

export default function RolesManagement() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'roles' | 'permissions' | 'modules'>('overview');
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleForm, setRoleForm] = useState({
    name: "",
    displayName: "",
    description: "",
  });

  // Fetch roles
  const { data: role = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/roles"],
  });
  const roles = normalizeArray(role)

  // Fetch permissions
  const { data: permission = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ["/api/permissions"],
  });

  const permissions = normalizeArray(permission)

  // Fetch role permissions when a role is selected
  const { data: rolePermission = [] } = useQuery({
    queryKey: ["/api/roles", selectedRole?.id, "permissions"],
    enabled: !!selectedRole,
  });
  const rolePermissions = normalizeArray(rolePermission)

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: typeof roleForm) => {
      return await apiRequest("POST", "/roles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "تم إنشاء الدور بنجاح",
        description: "تم إضافة الدور الجديد إلى النظام",
      });
      setIsRoleDialogOpen(false);
      resetRoleForm();
    },
    onError: () => {
      toast({
        title: "خطأ في إنشاء الدور",
        description: "حدث خطأ أثناء إنشاء الدور",
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof roleForm }) => {
      return await apiRequest("PUT", `/api/roles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "تم تحديث الدور بنجاح",
        description: "تم حفظ التغييرات على الدور",
      });
      setIsRoleDialogOpen(false);
      resetRoleForm();
    },
    onError: () => {
      toast({
        title: "خطأ في تحديث الدور",
        description: "حدث خطأ أثناء تحديث الدور",
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "تم حذف الدور بنجاح",
        description: "تم إزالة الدور من النظام",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في حذف الدور",
        description: "لا يمكن حذف الدور، قد يكون مرتبط بمستخدمين",
        variant: "destructive",
      });
    },
  });

  // Assign/remove permission mutations
  const assignPermissionMutation = useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: number; permissionId: number }) => {
      return await apiRequest("POST", `/api/roles/${roleId}/permissions/${permissionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles", selectedRole?.id, "permissions"] });
      toast({
        title: "تم تعيين الصلاحية",
        description: "تم إضافة الصلاحية للدور بنجاح",
      });
    },
  });

  const removePermissionMutation = useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: number; permissionId: number }) => {
      return await apiRequest("DELETE", `/api/roles/${roleId}/permissions/${permissionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles", selectedRole?.id, "permissions"] });
      toast({
        title: "تم إزالة الصلاحية",
        description: "تم حذف الصلاحية من الدور بنجاح",
      });
    },
  });

  const resetRoleForm = () => {
    setRoleForm({
      name: "",
      displayName: "",
      description: "",
    });
    setSelectedRole(null);
  };

  const handleEditRole = (role: Role) => {
    setRoleForm({
      name: role.name,
      displayName: role.displayName,
      description: role.description || "",
    });
    setSelectedRole(role);
    setIsRoleDialogOpen(true);
  };

  const handleSubmitRole = () => {
    if (selectedRole) {
      updateRoleMutation.mutate({ id: selectedRole.id, data: roleForm });
    } else {
      createRoleMutation.mutate(roleForm);
    }
  };

  const handlePermissionToggle = (permission: Permission, isChecked: boolean) => {
    if (!selectedRole) return;

    if (isChecked) {
      assignPermissionMutation.mutate({
        roleId: selectedRole.id,
        permissionId: permission.id,
      });
    } else {
      removePermissionMutation.mutate({
        roleId: selectedRole.id,
        permissionId: permission.id,
      });
    }
  };

  const isPermissionAssigned = (permissionId: number) => {
    return rolePermissions.some((p: Permission) => p.id === permissionId);
  };

  const groupedPermissions = permissions.reduce((acc: Record<string, Permission[]>, permission: Permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {});

  // Store management navigation items
  const storeManagementItems = [
    {
      title: "لوحة التحكم",
      icon: Home,
      href: "/dashboard",
      description: "الصفحة الرئيسية"
    },
    {
      title: "إدارة المتاجر",
      icon: Store,
      href: "/stores",
      description: "معلومات وإعدادات المتاجر"
    },
    {
      title: "إدارة الفروع",
      icon: Building2,
      href: "/branches",
      description: "فروع المتجر والمواقع"
    },
    {
      title: "إدارة المستخدمين",
      icon: UserPlus,
      href: "/users",
      description: "مستخدمي النظام والموظفين"
    },
    {
      title: "إدارة المنتجات",
      icon: Package,
      href: "/products",
      description: "كتالوج المنتجات والمخزون"
    },
    {
      title: "إدارة الطلبات",
      icon: ShoppingCart,
      href: "/orders",
      description: "طلبات العملاء والمبيعات"
    },
    {
      title: "إدارة العملاء",
      icon: Users,
      href: "/customers",
      description: "قاعدة بيانات العملاء"
    },
    {
      title: "التقارير",
      icon: FileText,
      href: "/reports",
      description: "تقارير المبيعات والأداء"
    },
    {
      title: "الإعدادات",
      icon: Settings,
      href: "/settings",
      description: "إعدادات النظام العامة"
    }
  ];

  // Sidebar navigation items
  const sidebarItems = [
    {
      title: "نظرة عامة",
      icon: Home,
      id: "overview",
      description: "إحصائيات الأدوار والصلاحيات",
      count: (roles?.length || 0) + (permissions?.length || 0)
    },
    {
      title: "إدارة الأدوار",
      icon: Users,
      id: "roles",
      description: "إنشاء وتعديل الأدوار",
      count: roles?.length || 0
    },
    {
      title: "إدارة الصلاحيات",
      icon: Key,
      id: "permissions",
      description: "إدارة الصلاحيات والوصول",
      count: permissions?.length || 0
    },
    {
      title: "الوحدات",
      icon: Database,
      id: "modules",
      description: "تنظيم الصلاحيات حسب الوحدات",
      count: Object.keys(groupedPermissions).length
    }
  ];

  // Permission modules with icons
  const permissionModules = [
    { id: "all", name: "جميع الوحدات", icon: Home },
    { id: "dashboard", name: "لوحة التحكم", icon: BarChart3 },
    { id: "products", name: "إدارة المنتجات", icon: Package },
    { id: "orders", name: "إدارة الطلبات", icon: ShoppingCart },
    { id: "customers", name: "إدارة العملاء", icon: Users },
    { id: "payments", name: "المدفوعات", icon: CreditCard },
    { id: "notifications", name: "التنبيهات", icon: Bell },
    { id: "security", name: "الأمان", icon: Lock },
    { id: "settings", name: "الإعدادات", icon: Settings }
  ];

  // Filter permissions based on search and module
  const filteredPermissions = permissions.filter((permission: Permission) => {
    const matchesSearch = !searchTerm || 
      permission.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (permission.description && permission.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesModule = selectedModule === "all" || permission.module === selectedModule;
    
    return matchesSearch && matchesModule;
  });

  if (rolesLoading || permissionsLoading) {
    return <Loading text="جاري تحميل الأدوار والصلاحيات..." />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            إدارة الأدوار والصلاحيات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            تحكم في أدوار المستخدمين وصلاحياتهم في النظام
          </p>
        </div>
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetRoleForm}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة دور جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedRole ? "تعديل الدور" : "إضافة دور جديد"}
              </DialogTitle>
              <DialogDescription>
                {selectedRole ? "تعديل معلومات الدور المحدد" : "إنشاء دور جديد في النظام"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">اسم الدور (بالإنجليزية)</Label>
                <Input
                  id="name"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="manager"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="displayName">الاسم المعروض</Label>
                <Input
                  id="displayName"
                  value={roleForm.displayName}
                  onChange={(e) => setRoleForm({ ...roleForm, displayName: e.target.value })}
                  placeholder="مدير"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="وصف مهام ومسؤوليات هذا الدور..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleSubmitRole}
                disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
              >
                {selectedRole ? "تحديث" : "إنشاء"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-6">
        {/* Enhanced Sidebar */}
        <div className="w-80 space-y-4">
          {/* Store Management Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" />
                إدارة النظام
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[320px]">
                <div className="space-y-1 p-4">
                  {storeManagementItems.map((item) => (
                    <Button
                      key={item.href}
                      variant="ghost"
                      className="w-full justify-start gap-2 h-auto p-3"
                      onClick={() => window.location.href = item.href}
                    >
                      <item.icon className="h-4 w-4" />
                      <div className="text-right flex-1">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Roles & Permissions Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                الأدوار والصلاحيات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[280px]">
                <div className="space-y-1 p-4">
                  {sidebarItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeSection === item.id ? "default" : "ghost"}
                      className="w-full justify-start gap-2 h-auto p-3"
                      onClick={() => setActiveSection(item.id as any)}
                    >
                      <item.icon className="h-4 w-4" />
                      <div className="text-right flex-1">
                        <div className="font-medium flex items-center justify-between">
                          {item.title}
                          <Badge variant="secondary" className="text-xs">
                            {item.count}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                إجراءات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setIsRoleDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                إضافة دور جديد
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => {
                  setActiveSection('permissions');
                  setSearchTerm('');
                }}
              >
                <Key className="h-4 w-4 mr-2" />
                عرض جميع الصلاحيات
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/users'}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                إدارة المستخدمين
              </Button>
            </CardContent>
          </Card>

          {/* Modules Filter */}
          {(activeSection === 'permissions' || activeSection === 'modules') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  فلترة حسب الوحدة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[200px]">
                  <div className="space-y-1 p-4">
                    {permissionModules.map((module) => {
                      const modulePermissions = permissions.filter((p: Permission) => p.module === module.id).length;
                      return (
                        <Button
                          key={module.id}
                          variant={selectedModule === module.id ? "default" : "ghost"}
                          className="w-full justify-start gap-2 h-auto p-2"
                          onClick={() => setSelectedModule(module.id)}
                        >
                          <module.icon className="h-4 w-4" />
                          <div className="flex-1 text-right">
                            <div className="text-sm flex items-center justify-between">
                              {module.name}
                              {module.id !== "all" && (
                                <Badge variant="outline" className="text-xs">
                                  {modulePermissions}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Role Selection for Permissions */}
          {activeSection === 'permissions' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">اختيار الدور لتعديل الصلاحيات</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[150px]">
                  <div className="space-y-1 p-4">
                    {roles.map((role: Role) => (
                      <Button
                        key={role.id}
                        variant={selectedRole?.id === role.id ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => setSelectedRole(role)}
                      >
                        <Shield className="h-3 w-3 mr-2" />
                        <div className="flex-1 text-right">
                          <div>{role.displayName}</div>
                          {role.isSystemRole && (
                            <div className="text-xs text-muted-foreground">دور النظام</div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Overview Tab */}
          {activeSection === 'overview' && (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      إجمالي الأدوار
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{roles?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">أدوار نشطة في النظام</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      إجمالي الصلاحيات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{permissions?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">صلاحيات متاحة</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      الوحدات النشطة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Object.keys(groupedPermissions).length}</div>
                    <p className="text-xs text-muted-foreground">وحدات النظام</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      أدوار النظام
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {roles?.filter((r: Role) => r.isSystemRole).length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">أدوار محمية</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>الأدوار الأساسية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {roles?.slice(0, 5).map((role: Role) => (
                        <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{role.displayName}</h4>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          </div>
                          <Badge variant={role.isSystemRole ? "default" : "secondary"}>
                            {role.isSystemRole ? "نظام" : "مخصص"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>توزيع الصلاحيات حسب الوحدات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(groupedPermissions).slice(0, 5).map(([module, perms]) => (
                        <div key={module} className="flex items-center justify-between">
                          <span className="text-sm">{module}</span>
                          <Badge variant="outline">{perms.length} صلاحية</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeSection === 'roles' && (
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              قائمة الأدوار
            </CardTitle>
            <CardDescription>
              جميع الأدوار المتاحة في النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="لا توجد أدوار"
                description="لم يتم إنشاء أي أدوار بعد"
              />
            ) : (
              <div className="space-y-3">
                {roles.map((role: Role) => (
                  <div
                    key={role.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedRole?.id === role.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{role.displayName}</h3>
                        <p className="text-sm text-gray-600">{role.description}</p>
                        {role.isSystemRole && (
                          <Badge variant="secondary" className="mt-1">
                            <Shield className="h-3 w-3 ml-1" />
                            دور النظام
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRole(role);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!role.isSystemRole && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRoleMutation.mutate(role.id);
                            }}
                            disabled={deleteRoleMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

          )}

          {activeSection === 'permissions' && (
            <>
              {/* Search and Filter Bar */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    البحث والفلترة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="البحث في الصلاحيات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Badge variant="outline" className="px-3 py-2">
                      {filteredPermissions.length} من {permissions.length} صلاحية
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    إدارة الصلاحيات
                  </CardTitle>
                  <CardDescription>
                    {selectedRole
                      ? `تحديد صلاحيات الدور: ${selectedRole.displayName}`
                      : "اختر دور من القائمة الجانبية لتحديد صلاحياته"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedRole ? (
                  <EmptyState
                    icon={<Settings className="h-12 w-12" />}
                    title="اختر دور"
                    description="اختر دور من القائمة الجانبية لتحديد صلاحياته"
                  />
                ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedPermissions)
                        .filter(([module]) => selectedModule === "all" || module === selectedModule)
                        .map(([module, modulePermissions]) => {
                          const filteredModulePermissions = modulePermissions.filter((permission: Permission) => {
                            return !searchTerm || 
                              permission.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (permission.description && permission.description.toLowerCase().includes(searchTerm.toLowerCase()));
                          });

                          if (filteredModulePermissions.length === 0) return null;

                          return (
                            <div key={module} className="space-y-3">
                              <div className="flex items-center justify-between border-b pb-2">
                                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                  {module}
                                </h4>
                                <Badge variant="outline">
                                  {filteredModulePermissions.length} صلاحية
                                </Badge>
                              </div>
                              <div className="grid gap-3 md:grid-cols-2">
                                {filteredModulePermissions.map((permission: Permission) => (
                                  <div
                                    key={permission.id}
                                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                  >
                                    <Checkbox
                                      id={`permission-${permission.id}`}
                                      checked={isPermissionAssigned(permission.id)}
                                      onCheckedChange={(checked) =>
                                        handlePermissionToggle(permission, checked as boolean)
                                      }
                                    />
                                    <div className="flex-1">
                                      <Label
                                        htmlFor={`permission-${permission.id}`}
                                        className="text-sm font-medium cursor-pointer"
                                      >
                                        {permission.displayName}
                                      </Label>
                                      {permission.description && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          {permission.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Modules Tab */}
          {activeSection === 'modules' && (
            <Card>
              <CardHeader>
                <CardTitle>الصلاحيات حسب الوحدات</CardTitle>
                <CardDescription>
                  عرض وإدارة الصلاحيات مجمعة حسب وحدات النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
                    const moduleIcon = permissionModules.find(m => m.id === module)?.icon || Package;
                    return (
                      <Card key={module} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            {moduleIcon && <moduleIcon className="h-5 w-5" />}
                            <CardTitle className="text-lg">{module}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">عدد الصلاحيات:</span>
                              <Badge variant="secondary">{modulePermissions.length}</Badge>
                            </div>
                            <Separator />
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {modulePermissions.slice(0, 5).map((permission: Permission) => (
                                <div key={permission.id} className="text-sm py-1">
                                  {permission.displayName}
                                </div>
                              ))}
                              {modulePermissions.length > 5 && (
                                <div className="text-xs text-muted-foreground">
                                  و {modulePermissions.length - 5} صلاحية أخرى...
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-3"
                              onClick={() => {
                                setSelectedModule(module);
                                setActiveSection("permissions");
                              }}
                            >
                              عرض الصلاحيات
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}