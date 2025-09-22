import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDepartmentSchema } from "@shared/schema";
import { z } from "zod";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Edit, Trash2, Folder } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";

type FormData = z.infer<typeof insertDepartmentSchema>;

export default function Departments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);

  const { data: departments, isLoading } = useQuery({
    queryKey: [`/api/departments?branchId=${user?.branchId}`],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(insertDepartmentSchema),
    defaultValues: {
      name: "",
      description: "",
      branchId: user?.branchId || 1,
    },
  });

  const createDepartmentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('POST', '/departments', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/departments'] });
      toast({
        title: "تم الحفظ",
        description: "تم إنشاء القسم بنجاح",
      });
      setIsDialogOpen(false);
      form.reset();
      setEditingDepartment(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء القسم",
        variant: "destructive",
      });
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('PUT', `/api/departments/${editingDepartment.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/departments'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث القسم بنجاح",
      });
      setIsDialogOpen(false);
      form.reset();
      setEditingDepartment(null);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث القسم",
        variant: "destructive",
      });
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (departmentId: number) => {
      await apiRequest('DELETE', `/api/departments/${departmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/departments'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف القسم بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف القسم",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    if (editingDepartment) {
      updateDepartmentMutation.mutate(data);
    } else {
      createDepartmentMutation.mutate(data);
    }
  };

  const handleEdit = (department: any) => {
    setEditingDepartment(department);
    form.reset({
      name: department.name,
      description: department.description || "",
      branchId: department.branchId,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (departmentId: number) => {
    deleteDepartmentMutation.mutate(departmentId);
  };

  const handleNewDepartment = () => {
    setEditingDepartment(null);
    form.reset({
      name: "",
      description: "",
      branchId: user?.branchId || 1,
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingDepartment(null);
    form.reset();
  };

  if (!user) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <TopBar />
        
        <div className="p-6 overflow-y-auto h-full custom-scrollbar">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  إدارة الأقسام
                </CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleNewDepartment} className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة قسم جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingDepartment ? "تعديل القسم" : "إضافة قسم جديد"}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم القسم *</FormLabel>
                              <FormControl>
                                <Input placeholder="اسم القسم" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الوصف</FormLabel>
                              <FormControl>
                                <Textarea placeholder="وصف القسم" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                          <Button type="button" variant="outline" onClick={handleDialogClose}>
                            إلغاء
                          </Button>
                          <Button 
                            type="submit" 
                            className="bg-primary hover:bg-primary/90"
                            disabled={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}
                          >
                            {editingDepartment ? "تحديث" : "حفظ"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <Loading />
              ) : !departments?.length ? (
                <EmptyState
                  icon={<Folder className="h-12 w-12" />}
                  title="لا توجد أقسام"
                  description="لم يتم إنشاء أي أقسام بعد. ابدأ بإضافة قسم جديد."
                  action={
                    <Button onClick={handleNewDepartment} className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة قسم جديد
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {departments.map((department: any) => (
                    <Card key={department.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Folder className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {department.name}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                تم الإنشاء: {new Date(department.createdAt).toLocaleDateString('ar-SA')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(department)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>حذف القسم</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل أنت متأكد من حذف القسم "{department.name}"؟ 
                                    هذا الإجراء لا يمكن التراجع عنه.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(department.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        
                        {department.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {department.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
