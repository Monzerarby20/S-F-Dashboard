import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllCustomers } from "@/services/mockAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs,  TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search,  Edit, Trash2, Users, Star, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";
import QuickCustomerAdd from "@/components/customers/quick-customer-add";



interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  storeCredit: number;
  totalOrders: number;
  totalSpent: number;
  isGuest: boolean;
  createdAt: string;
}

export default function CustomersListPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; customer?: Customer }>({ open: false });

  // Fetch customers
  const { data: customer = [], isLoading } = useQuery({
    queryKey: ['/customers'],
  });
  const customers = getAllCustomers()
  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: number) => {
      const response = await apiRequest('DELETE', `/api/customers/${customerId}`);
      if (!response.ok) {
        throw new Error('فشل في حذف العميل');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/customers'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف العميل بنجاح",
      });
      setDeleteDialog({ open: false });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter customers based on search and tab
  const filteredCustomers = customers.filter((customer: Customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTab = selectedTab === "all" || 
                      (selectedTab === "registered" && !customer.isGuest) ||
                      (selectedTab === "guests" && customer.isGuest) ||
                      (selectedTab === "vip" && customer.loyaltyPoints >= 1000);
    
    return matchesSearch && matchesTab;
  });

  const handleDeleteCustomer = (customer: Customer) => {
    setDeleteDialog({ open: true, customer });
  };

  const confirmDelete = () => {
    if (deleteDialog.customer) {
      deleteCustomerMutation.mutate(deleteDialog.customer.id);
    }
  };

  const getCustomerTypeBadge = (customer: Customer) => {
    if (customer.isGuest) {
      return <Badge variant="secondary">ضيف</Badge>;
    }
    if (customer.loyaltyPoints >= 1000) {
      return <Badge variant="default" className="bg-yellow-600">VIP</Badge>;
    }
    return <Badge variant="outline">مسجل</Badge>;
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <PageLayout>
      <PageHeader
        title="إدارة العملاء"
        description="عرض وإدارة قاعدة بيانات العملاء ونقاط الولاء"
        icon={<Users className="h-8 w-8" />}
        actions={
          <QuickCustomerAdd onCustomerAdded={() => queryClient.invalidateQueries({ queryKey: ['/customers'] })} />
        }
      />

      <div className="space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>البحث والتصفية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث بالاسم أو الهاتف أو البريد الإلكتروني..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">جميع العملاء</TabsTrigger>
                <TabsTrigger value="registered">مسجلون</TabsTrigger>
                <TabsTrigger value="guests">ضيوف</TabsTrigger>
                <TabsTrigger value="vip">VIP</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Customers Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي العملاء</p>
                  <p className="text-2xl font-bold">{customers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Users className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">عملاء مسجلون</p>
                  <p className="text-2xl font-bold">{customers.filter((c: Customer) => !c.isGuest).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Users className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">عملاء ضيوف</p>
                  <p className="text-2xl font-bold">{customers.filter((c: Customer) => c.isGuest).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Star className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">عملاء VIP</p>
                  <p className="text-2xl font-bold">{customers.filter((c: Customer) => c.loyaltyPoints >= 1000).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customers List */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة العملاء ({filteredCustomers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="لا توجد عملاء"
                description={searchTerm ? "لا توجد نتائج للبحث المحدد" : "لم يتم إضافة أي عملاء بعد"}
              />
            ) : (
              <div className="space-y-4">
                {filteredCustomers.map((customer: Customer) => (
                  <div
                    key={customer.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-lg">{customer.name}</h3>
                          {getCustomerTypeBadge(customer)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">الهاتف:</span>
                            <p>{customer.phone}</p>
                          </div>
                          {customer.email && (
                            <div>
                              <span className="font-medium">البريد الإلكتروني:</span>
                              <p>{customer.email}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium">نقاط الولاء:</span>
                            <p className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {customer.loyaltyPoints.toLocaleString('ar-SA')}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">رصيد المتجر:</span>
                            <p className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3 text-green-500" />
                              {customer.storeCredit.toFixed(2)} ر.س
                            </p>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">إجمالي الطلبات:</span>
                            <p className="font-medium">{customer.totalOrders}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">إجمالي المشتريات:</span>
                            <p className="font-medium">{customer.totalSpent.toFixed(2)} ر.س</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">تاريخ التسجيل:</span>
                            <p className="font-medium">{new Date(customer.createdAt).toLocaleDateString('ar-SA')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          تعديل
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteCustomer(customer)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف العميل "{deleteDialog.customer?.name}"؟
              سيتم حذف جميع البيانات المرتبطة بهذا العميل.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteCustomerMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCustomerMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}