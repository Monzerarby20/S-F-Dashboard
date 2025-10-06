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
import mockApi from "@/services/mockData";

type BranchFormData = z.infer<typeof insertBranchSchema>;

export default function BranchesList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; branch: any | null }>({ isOpen: false, branch: null });

  const { data: branche, isLoading } = useQuery({
    queryKey: ['/branches'],
  });
  const handleDeleteBranch = (branch: any) => {
    setDeleteDialog({ isOpen: true, branch });
  }
  

  useEffect(() => {
    const fetchBranches = async () => {
      const data = await mockApi.getBranches();
      setBranches(data || []);
    };
    fetchBranches();
  }, []);

  const branchForm = useForm<BranchFormData>({
    resolver: zodResolver(insertBranchSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      isActive: true,
    },
  });

  const createBranchMutation = useMutation({
    mutationFn: async (data: BranchFormData) => {
      const response = await apiRequest('POST', '/branches', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/branches'] });
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
    mutationFn: async (data: BranchFormData) => {
      const response = await apiRequest('PUT', `/api/branches/${editingBranch.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/branches'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "تم التحديث",
        description: "تم تحديث الفرع بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الفرع",
        variant: "destructive",
      });
    },
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/branches/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في حذف الفرع');
      }
      return response;
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
      isActive: branch.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (deleteDialog.branch) {
      deleteBranchMutation.mutate(deleteDialog.branch.id);
    }
  };

  const resetForm = () => {
    setEditingBranch(null);
    branchForm.reset();
  };

  const handleSubmit = (data: BranchFormData) => {
    if (editingBranch) {
      updateBranchMutation.mutate(data);
    } else {
      createBranchMutation.mutate(data);
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
                    <form onSubmit={branchForm.handleSubmit(handleSubmit)} className="space-y-4">
                      <FormField
                        control={branchForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم الفرع *</FormLabel>
                            <FormControl>
                              <Input placeholder="اسم الفرع" {...field} />
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
                              <Textarea 
                                placeholder="عنوان الفرع الكامل"
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={branchForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>رقم الهاتف</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="05xxxxxxxx"
                                  {...field} 
                                />
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
                                <Input 
                                  type="email"
                                  placeholder="branch@store.com"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          إلغاء
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createBranchMutation.isPending || updateBranchMutation.isPending}
                        >
                          {editingBranch ? "تحديث الفرع" : "إنشاء الفرع"}
                        </Button>
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
                        <Badge variant={branch.isActive ? "default" : "secondary"}>
                          {branch.isActive ? "نشط" : "غير نشط"}
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
                        تم الإنشاء: {new Date(branch.createdAt).toLocaleDateString('ar-SA')}
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
                          onClick={() => handleDeleteBranch(branch.id)}
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