import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBranchSchema } from "@shared/schema";
import { z } from "zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Edit, Trash2, MapPin, Phone, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";
import { Switch } from "@/components/ui/switch";

import { getStoreBranches, createNewBranch, updateBranch, deleteBranch } from "@/services/branches";

type BranchFormData = z.infer<typeof insertBranchSchema>;

export default function BranchesList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  // const [branches, setBranches] = useState<any[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; branch: any | null }>({ isOpen: false, branch: null });

  // const { data: branche, isLoading } = useQuery({
  //   queryKey: ['/branches'],
  // });
  const storeSlug = localStorage.getItem('userSlug')
  console.log(storeSlug)
  const handleDeleteBranch = (branch: any) => {
    setDeleteDialog({ isOpen: true, branch });
  }
  if (!storeSlug) return <Loading />;

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches', storeSlug],
    queryFn: () => getStoreBranches(storeSlug),
    enabled: !!storeSlug,
  })

  // useEffect(() => {
  //   const fetchBranches = async () => {
  //     const data = await mockApi.getBranches();
  //     setBranches(data || []);
  //   };
  //   fetchBranches();
  // }, []);
  const defaultDaySchedule = { open: "09:00", close: "22:00", closed: false, all_day: false };
  const days = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

  const [openingHours, setOpeningHours] = useState(
    days.reduce((acc, day) => ({ ...acc, [day]: { ...defaultDaySchedule } }), {})
  );
  useEffect(() => {
    if (editingBranch) {
      branchForm.reset({
        name: editingBranch.name || "",
        description: editingBranch.description || "",
        phone: editingBranch.phone || "",
        email: editingBranch.email || "",
        address: editingBranch.address || "",
        city: editingBranch.city || "",
        state: editingBranch.state || "",
        country: editingBranch.country || "",
        postal_code: editingBranch.postal_code || "",
        latitude: editingBranch.latitude || "",
        longitude: editingBranch.longitude || "",
        is_main_branch: editingBranch.is_main_branch || false,
        is_active: editingBranch.is_active || true,
        opening_hours: editingBranch.opening_hours || {},
      });
    } else {
      branchForm.reset(); // لو إنشاء جديد
    }
  }, [editingBranch]);

  let branchSlug = ""
  if (editingBranch) {
    branchSlug = editingBranch.slug || ""
  }
  console.log("branch slug", branchSlug)

  function handleDayChange(day: any, field: any, value: any) {
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
  const branchForm = useForm<BranchFormData>({
    resolver: zodResolver(insertBranchSchema),
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
      is_main_branch: false,
      is_active: true,
      opening_hours: {
        saturday: { open: "", close: "" },
        sunday: { open: "", close: "" },
        monday: "",
        tuesday: "",
        wednesday: "",
        thursday: { open: "", close: "" },
        friday: { open: "", close: "" },
      },
    },
  });



  const createBranchMutation = useMutation({
    mutationFn: async (data: BranchFormData) => {
      return await createNewBranch(storeSlug!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "تم الحفظ",
        description: "تم إنشاء الفرع بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الفرع",
        variant: "destructive",
      });
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: async ({ branchSlug, data }: { branchSlug: string; data: BranchFormData }) => {
      return await updateBranch(storeSlug!, branchSlug, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "تم التحديث",
        description: "تم تحديث الفرع بنجاح",
      });
    },
    onError: (error) => {
      console.error("❌ Update error:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الفرع",
        variant: "destructive",
      });
    },
  });


  const deleteBranchMutation = useMutation({
    mutationFn:  async ({ storeSlug, branchSlug }: { storeSlug: string; branchSlug: string }) => {
      return await deleteBranch(storeSlug, branchSlug);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/branches'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف الفرع بنجاح",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "فشل في حذف الفرع";
      toast({
        title: "خطأ في الحذف",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (branch: any) => {
    setEditingBranch(branch);
    branchForm.reset({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      is_active: branch.is_active??true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteDialog.branch) {
      deleteBranchMutation.mutate({
        storeSlug: storeSlug!,
        branchSlug: deleteDialog.branch.slug,
      });
    }
  };

  const resetForm = () => {
    setEditingBranch(null);
    branchForm.reset();
  };

  const handleSubmit = (data: BranchFormData) => {
    const finalPayload = {
      ...data,
      is_active: Boolean(data.is_active),
      opening_hours: openingHours,
    };
    console.log("📦 Final payload sent to API:", finalPayload);
    if (editingBranch) {
      const branchSlug = editingBranch.slug; // 👈 هنا بنجيبها لحظيًا
      console.log("🟢 Updating branch:", branchSlug, finalPayload);
      updateBranchMutation.mutate({ branchSlug, data: finalPayload });
    } else {
      console.log("🟢 Creating new branch:", finalPayload);
      createBranchMutation.mutate(finalPayload);
    }
  };

  if (!user) {
    return <Loading />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex" dir="rtl">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <TopBar />
          <div className="p-6">
            <Loading />
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
          <div className="space-y-6">
            {/* عنوان الصفحة */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  إدارة الفروع
                </h1>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة فرع جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editingBranch ? "تعديل الفرع" : "إضافة فرع جديد"}
                    </DialogTitle>
                  </DialogHeader>

                  <Form {...branchForm}>
                    <form
                      onSubmit={branchForm.handleSubmit(handleSubmit)}
                    >
                      <FormField
                        control={branchForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم الفرع</FormLabel>
                            <FormControl>
                              <Input placeholder="اسم الفرع" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={branchForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>"وصف الفرع</FormLabel>
                            <FormControl>
                              <Textarea placeholder="وصف الفرع" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={branchForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف</FormLabel>
                            <FormControl>
                              <Input placeholder="رقم الهاتف" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={branchForm.control}
                        name="email"

                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="البريد الإلكتروني" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={branchForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العنوان</FormLabel>
                            <FormControl>
                              <Input placeholder="العنوان" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={branchForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المدينة</FormLabel>
                            <FormControl>
                              <Input placeholder="المدينة" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={branchForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المحافظة</FormLabel>
                            <FormControl>
                              <Input placeholder="المحافظة" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={branchForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الدولة</FormLabel>
                            <FormControl>
                              <Input placeholder="الدولة" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={branchForm.control}
                        name="postal_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الرمز البريدي</FormLabel>
                            <FormControl>
                              <Input placeholder="الرمز البريدي" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={branchForm.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>خط العرض (latitude)</FormLabel>
                            <FormControl>
                              <Input placeholder="خط العرض (latitude)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={branchForm.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>خط الطول (longitude)</FormLabel>
                            <FormControl>
                              <Input placeholder="خط الطول (longitude)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={branchForm.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <FormLabel>هل الفرع نشط؟</FormLabel>
                            <FormControl>
                              <Switch
                                checked={!!field.value}
                                onCheckedChange={(checked) => field.onChange(checked)} 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />






                      {/* جدول مواعيد العمل نفس اللي في المتجر */}
                      <div className="border p-3 rounded-md">
                        <h4 className="font-semibold mb-2">مواعيد العمل</h4>
                        {days.map(day => (
                          <div key={day} className="flex items-center justify-between border-b py-2">
                            <span className="capitalize w-24">{day}</span>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={openingHours[day].closed}
                                  onChange={e => handleDayChange(day, "closed", e.target.checked)}
                                />
                                مغلق
                              </label>
                              <label className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={openingHours[day].all_day}
                                  onChange={e => handleDayChange(day, "all_day", e.target.checked)}
                                />
                                24 ساعة
                              </label>
                            </div>
                            {!openingHours[day].closed && !openingHours[day].all_day && (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="time"
                                  value={openingHours[day].open}
                                  onChange={e => handleDayChange(day, "open", e.target.value)}
                                  className="w-28"
                                />
                                <Input
                                  type="time"
                                  value={openingHours[day].close}
                                  onChange={e => handleDayChange(day, "close", e.target.value)}
                                  className="w-28"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit">حفظ</Button>
                      </div>
                    </form>

                  </Form>

                </DialogContent>
              </Dialog>
            </div>

            {/* قائمة الفروع */}
            {!branches || branches.length === 0 ? (
              <EmptyState
                icon={<Building2 className="h-12 w-12" />}
                title="لا توجد فروع"
                description="لم يتم إنشاء أي فروع بعد"
                action={
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة أول فرع
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map((branch: any) => (
                  <Card key={branch.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{branch.name}</CardTitle>
                        <Badge variant={branch.is_active ? "default" : "secondary"}>
                          {branch.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {branch.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {branch.address}
                          </p>
                        </div>
                      )}

                      {branch.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {branch.phone}
                          </p>
                        </div>
                      )}

                      {branch.email && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {branch.email}
                          </p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 pt-2 border-t">
                        تم الإنشاء: {new Date(branch.created_at).toLocaleDateString('ar-SA')}
                      </div>

                      <div className="flex justify-end gap-2 pt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(branch)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBranch(branch)} 
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <AlertDialog open={deleteDialog.isOpen} onOpenChange={(isOpen) => setDeleteDialog({ isOpen })}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من رغبتك في حذف هذا الفرع؟ سيتم حذف جميع البيانات المرتبطة به ولا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDelete}
                  disabled={deleteBranchMutation.isPending}
                >
                  {deleteBranchMutation.isPending ? 'جاري الحذف...' : 'حذف الفرع'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
}