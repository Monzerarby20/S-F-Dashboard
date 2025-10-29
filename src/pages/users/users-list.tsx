import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  UserPlus,
  Shield,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Store,
  Briefcase,
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getAllUsers, deleteUser } from "@/services/users";

// ✅ Match Django serializer naming
interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  store_name?: string;
  role_display: string;
  branch_display?: string | number;
  job_title_display?: string;
  date_of_birth?: string;
  avg_experience_rating?: number | null;
  is_active_display?: boolean;
  date_joined?: string;
  profile_image?: string;
}

export default function UsersList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; userId: number | null }>({
    isOpen: false,
    userId: null,
  });

  // ✅ Fetch users
  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });

  // ✅ Delete user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => await deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المستخدم بنجاح",
      });
      setDeleteDialog({ isOpen: false, userId: null });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المستخدم",
        variant: "destructive",
      });
    },
  });

  // ✅ Toggle active/inactive
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, is_active_display }: { userId: number; is_active: boolean }) =>
      await apiRequest("PATCH", `/api/users/${userId}/status/`, { is_active_display }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة المستخدم بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة المستخدم",
        variant: "destructive",
      });
    },
  });

  // ✅ Filter users by role and search
  const filteredUsers: User[] = users.filter((u: User) => {
    const matchesSearch =
      u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || u.role_display === selectedRole;
    return matchesSearch && matchesRole;
  });

  // ✅ Arabic role labels
  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: "مدير عام",
      manager: "مدير فرع",
      cashier: "كاشير",
      employee: "موظف",
    };
    return roles[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      admin: "destructive",
      manager: "default",
      cashier: "secondary",
      employee: "outline",
    };
    return variants[role] || "outline";
  };

  const handleDeleteUser = (userId: number) => setDeleteDialog({ isOpen: true, userId });
  const handleConfirmDelete = () => {
    if (deleteDialog.userId) deleteUserMutation.mutate(deleteDialog.userId);
  };
  const handleToggleStatus = (userId: number, currentStatus: boolean) =>
    toggleUserStatusMutation.mutate({ userId, is_active_display: !currentStatus });

  if (!user || isLoading) return <Loading />;
  if (isError)
    return <div className="text-center text-red-500 p-10">حدث خطأ أثناء تحميل المستخدمين</div>;

  return (
    <div className="min-h-screen flex" dir="rtl">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <TopBar />

        <div className="p-6 overflow-y-auto h-full custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة المستخدمين</h1>
              <Link href="/users/add">
                <Button>
                  <UserPlus className="h-4 w-4 ml-2" />
                  إضافة مستخدم
                </Button>
              </Link>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="البحث في المستخدمين..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <div className="md:w-48">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                    >
                      <option value="all">جميع الأدوار</option>
                      <option value="admin">مدير عام</option>
                      <option value="manager">مدير فرع</option>
                      <option value="cashier">كاشير</option>
                      <option value="employee">موظف</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            {filteredUsers.length === 0 ? (
              <EmptyState
                icon={<UserPlus className="h-12 w-12" />}
                title="لا يوجد مستخدمين"
                description="لم يتم العثور على أي مستخدمين مطابقين للبحث"
                action={
                  <Button asChild>
                    <Link href="/users/add">
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة أول مستخدم
                    </Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4">
                {filteredUsers.map((u: User) => (
                  <Card key={u.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        {/* Left Side */}
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={u.profile_image} />
                            <AvatarFallback>
                              {u.first_name?.[0]}
                              {u.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {u.first_name} {u.last_name}
                              </h3>
                              <Badge variant={getRoleBadgeVariant(u.role_display)}>
                                {getRoleLabel(u.role_display)}
                              </Badge>
                              {!u.is_active_display && (
                                <Badge variant="outline" className="text-red-600 border-red-600">
                                  معطل
                                </Badge>
                              )}
                            </div>

                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                <strong>المسمى الوظيفي:</strong>{" "}
                                {u.job_title_display || "—"}
                              </div>
                              <div className="flex items-center gap-1">
                                <Store className="h-3 w-3" />
                                <strong>المتجر:</strong> {u.store_name || "—"}
                              </div>
                              <div className="flex items-center gap-1">
                                <strong>الفرع:</strong> {u.branch_display || "—"}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <strong>تاريخ الميلاد:</strong>{" "}
                                {u.date_of_birth
                                  ? new Date(u.date_of_birth).toLocaleDateString("ar")
                                  : "—"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(u.id, u.is_active_display!)}
                          >
                            <Shield className="h-4 w-4 ml-1" />
                            {u.is_active_display? "تعطيل" : "تفعيل"}
                          </Button>

                          

                          <Link href={`/users/edit/${u.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 ml-1" />
                              تعديل
                            </Button>
                          </Link>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-600 hover:text-red-700 hover:border-red-600"
                          >
                            <Trash2 className="h-4 w-4 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Delete confirmation */}
          <AlertDialog
            open={deleteDialog.isOpen}
            onOpenChange={(isOpen) =>
              setDeleteDialog({ isOpen, userId: deleteDialog.userId })
            }
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من رغبتك في حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleConfirmDelete}
                  disabled={deleteUserMutation.isPending}
                >
                  {deleteUserMutation.isPending ? "جاري الحذف..." : "حذف المستخدم"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
}
