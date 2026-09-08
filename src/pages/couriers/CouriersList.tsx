import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Bike,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Store,
  Package,
  ClipboardList,
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
// import api from "@/services/auth";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CourierType = "store_courier" | "platform_courier";

export interface Courier {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  courier_type: CourierType;
  courier_type_display?: string;
  store_name?: string;
  store_id?: number;
  store_slug?: string;
  branch_name?: string;
  branch_id?: number;
  is_active: boolean;
  delivered_orders_count?: number | null;
  current_orders_count?: number | null;
}

export interface CourierDetails extends Courier {
  total_deliveries?: number | null;
  completed_orders?: number | null;
  cancelled_orders?: number | null;
  order_history?: CourierOrderHistory[];
}

export interface CourierOrderHistory {
  id: number;
  order_number: string;
  store_name?: string;
  branch_name?: string;
  order_type?: string;
  status: string;
  accepted_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
}

export interface CreateCourierPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  store_id?: number;
  branch_id?: number;
  courier_type: CourierType;
  is_active: boolean;
}

export type UpdateCourierPayload = CreateCourierPayload;

// ─── Service integration points (ready for backend connection) ─────────────

// const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getCouriers = async (): Promise<Courier[]> => {
  // When backend is ready:
  // let allCouriers: Courier[] = [];
  // let nextUrl: string | null = `${BASE_URL}couriers/`;
  // while (nextUrl) {
  //   const response = await api.get(nextUrl.startsWith("http") ? nextUrl : `${BASE_URL}${nextUrl}`);
  //   const data = response.data;
  //   if (data.results) {
  //     allCouriers = [...allCouriers, ...data.results];
  //     nextUrl = data.next || null;
  //   } else {
  //     allCouriers = data;
  //     nextUrl = null;
  //   }
  // }
  // return allCouriers;
  throw new Error("Courier API not connected");
};

export const getCourierById = async (id: number): Promise<CourierDetails> => {
  // When backend is ready:
  // const response = await api.get(`${BASE_URL}couriers/${id}/`);
  // return response.data;
  throw new Error("Courier API not connected");
};

export const createCourier = async (data: CreateCourierPayload): Promise<Courier> => {
  // When backend is ready:
  // const response = await api.post(`${BASE_URL}couriers/`, data);
  // return response.data;
  throw new Error("Courier API not connected");
};

export const updateCourier = async (
  id: number,
  data: UpdateCourierPayload
): Promise<Courier> => {
  // When backend is ready:
  // const response = await api.patch(`${BASE_URL}couriers/${id}/`, data);
  // return response.data;
  throw new Error("Courier API not connected");
};

export const deleteCourier = async (id: number): Promise<void> => {
  // When backend is ready:
  // await api.delete(`${BASE_URL}couriers/${id}/`);
  void id;
  throw new Error("Courier API not connected");
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const getCourierTypeLabel = (type: CourierType | string) => {
  const labels: Record<string, string> = {
    store_courier: "مندوب متجر",
    platform_courier: "مندوب منصة",
  };
  return labels[type] || type;
};

export const getCourierTypeBadgeVariant = (
  type: CourierType | string
): "default" | "secondary" | "outline" | "destructive" => {
  const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    store_courier: "default",
    platform_courier: "secondary",
  };
  return variants[type] || "outline";
};

// ─── List Page ───────────────────────────────────────────────────────────────

export default function CouriersList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [nameSearch, setNameSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCourierType, setSelectedCourierType] = useState<string>("all");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    courierId: number | null;
  }>({
    isOpen: false,
    courierId: null,
  });

  const {
    data: couriers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["couriers"],
    queryFn: getCouriers,
  });

  const deleteCourierMutation = useMutation({
    mutationFn: async (courierId: number) => await deleteCourier(courierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couriers"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المندوب بنجاح",
      });
      setDeleteDialog({ isOpen: false, courierId: null });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المندوب",
        variant: "destructive",
      });
    },
  });

  const filteredCouriers: Courier[] = couriers.filter((c: Courier) => {
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    const matchesName =
      !nameSearch || fullName.includes(nameSearch.toLowerCase());
    const matchesPhone =
      !phoneSearch || c.phone?.includes(phoneSearch);
    const matchesEmail =
      !emailSearch || c.email?.toLowerCase().includes(emailSearch.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && c.is_active) ||
      (selectedStatus === "inactive" && !c.is_active);
    const matchesType =
      selectedCourierType === "all" || c.courier_type === selectedCourierType;
    const matchesStore =
      selectedStore === "all" ||
      (c.store_id !== undefined && c.store_id.toString() === selectedStore);
    const matchesBranch =
      selectedBranch === "all" ||
      (c.branch_id !== undefined && c.branch_id.toString() === selectedBranch);

    return (
      matchesName &&
      matchesPhone &&
      matchesEmail &&
      matchesStatus &&
      matchesType &&
      matchesStore &&
      matchesBranch
    );
  });

  const handleDeleteCourier = (courierId: number) =>
    setDeleteDialog({ isOpen: true, courierId });

  const handleConfirmDelete = () => {
    if (deleteDialog.courierId) deleteCourierMutation.mutate(deleteDialog.courierId);
  };

  const hasActiveFilters =
    nameSearch ||
    phoneSearch ||
    emailSearch ||
    selectedStatus !== "all" ||
    selectedCourierType !== "all" ||
    selectedStore !== "all" ||
    selectedBranch !== "all";

  if (!user || isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="min-h-screen flex" dir="rtl">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <TopBar />
          <div className="p-6 overflow-y-auto h-full custom-scrollbar">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  المندوبين
                </h1>
                <Link href="/couriers/add">
                  <Button>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مندوب
                  </Button>
                </Link>
              </div>
              <Card>
                <CardContent className="p-10 text-center">
                  <p className="text-red-500 mb-2">حدث خطأ أثناء تحميل المندوبين</p>
                  <p className="text-sm text-muted-foreground">
                    يرجى التحقق من اتصال واجهة برمجة التطبيقات
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <TopBar />

        <div className="p-6 overflow-y-auto h-full custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                المندوبين
              </h1>
              <Link href="/couriers/add">
                <Button>
                  <Bike className="h-4 w-4 ml-2" />
                  إضافة مندوب
                </Button>
              </Link>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="البحث بالاسم..."
                        value={nameSearch}
                        onChange={(e) => setNameSearch(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="البحث برقم الهاتف..."
                        value={phoneSearch}
                        onChange={(e) => setPhoneSearch(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="البحث بالبريد الإلكتروني..."
                        value={emailSearch}
                        onChange={(e) => setEmailSearch(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                    >
                      <option value="all">جميع الحالات</option>
                      <option value="active">نشط</option>
                      <option value="inactive">معطل</option>
                    </select>

                    <select
                      value={selectedCourierType}
                      onChange={(e) => setSelectedCourierType(e.target.value)}
                      className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                    >
                      <option value="all">جميع الأنواع</option>
                      <option value="store_courier">مندوب متجر</option>
                      <option value="platform_courier">مندوب منصة</option>
                    </select>

                    <select
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(e.target.value)}
                      disabled
                      className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 opacity-60"
                      title="سيتم تفعيل فلتر المتجر عند ربط البيانات"
                    >
                      <option value="all">جميع المتاجر</option>
                    </select>

                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      disabled
                      className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 opacity-60"
                      title="سيتم تفعيل فلتر الفرع عند ربط البيانات"
                    >
                      <option value="all">جميع الفروع</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Couriers List */}
            {couriers.length === 0 ? (
              <EmptyState
                icon={Bike}
                title="لا يوجد مندوبين"
                description="لم يتم إضافة أي مندوبين بعد"
                action={
                  <Button asChild>
                    <Link href="/couriers/add">
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة أول مندوب
                    </Link>
                  </Button>
                }
              />
            ) : filteredCouriers.length === 0 ? (
              <EmptyState
                icon={Search}
                title="لا توجد نتائج"
                description={
                  hasActiveFilters
                    ? "لم يتم العثور على أي مندوبين مطابقين لمعايير البحث"
                    : "لم يتم العثور على أي مندوبين"
                }
              />
            ) : (
              <div className="grid gap-4">
                {filteredCouriers.map((c: Courier) => (
                  <Card key={c.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bike className="h-6 w-6 text-primary" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {c.first_name} {c.last_name}
                              </h3>
                              <Badge variant={getCourierTypeBadgeVariant(c.courier_type)}>
                                {getCourierTypeLabel(c.courier_type)}
                              </Badge>
                              {c.is_active ? (
                                <Badge
                                  variant="outline"
                                  className="text-green-600 border-green-600"
                                >
                                  نشط
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-red-600 border-red-600"
                                >
                                  معطل
                                </Badge>
                              )}
                            </div>

                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <strong>الهاتف:</strong> {c.phone || "—"}
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <strong>البريد:</strong> {c.email || "—"}
                              </div>
                              <div className="flex items-center gap-1">
                                <Store className="h-3 w-3" />
                                <strong>المتجر:</strong> {c.store_name || "—"}
                                {" · "}
                                <strong>الفرع:</strong> {c.branch_name || "—"}
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  <strong>الطلبات المسلّمة:</strong>{" "}
                                  {c.delivered_orders_count ?? "—"}
                                </div>
                                <div className="flex items-center gap-1">
                                  <ClipboardList className="h-3 w-3" />
                                  <strong>الطلبات الحالية:</strong>{" "}
                                  {c.current_orders_count ?? "—"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link href={`/couriers/${c.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 ml-1" />
                              عرض
                            </Button>
                          </Link>

                          <Link href={`/couriers/edit/${c.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 ml-1" />
                              تعديل
                            </Button>
                          </Link>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCourier(c.id)}
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
              setDeleteDialog({ isOpen, courierId: deleteDialog.courierId })
            }
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من رغبتك في حذف هذا المندوب؟ لا يمكن التراجع عن هذا
                  الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleConfirmDelete}
                  disabled={deleteCourierMutation.isPending}
                >
                  {deleteCourierMutation.isPending ? "جاري الحذف..." : "حذف المندوب"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
}
