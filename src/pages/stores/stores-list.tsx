import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, Edit, Trash2, Store, Building2, Users, Phone, Mail, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";
import axios from "axios";
import { getAllStores } from "../../services/stores";

import { normalizeArray } from "@/services/normalize";

interface Store {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  loginEmail: string;
  taxId?: string;
  accountingRefId?: string;
  permissionProfile?: string;
  branchesCount: number;
  totalYearlyOperations: number;
  createdBy: string;
  createdAt: string;
  lastUpdated: string;
}

export default function StoresListPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; store?: Store }>({ open: false });

  const BASE_URL = import.meta.env.VITE_API_BASE_URL ;
  // Fetch all stores (admin) or current store (user)
  const {data: stores = [] , isLoading,error}  = useQuery({
    queryKey: ['stores'],
    queryFn: getAllStores,

  });
  console.log("Fetched stores:", stores);
  console.log(BASE_URL)

  // Fetch current user's store only
  // const { data: stores = [] , isLoading, error } = useQuery({
  //   queryKey: ['/stores/current'],
  // });

  // Delete store mutation
  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: string) => {
      const response = await apiRequest('DELETE', `/api/stores/${storeId}`);
      if (!response.ok) {
        throw new Error('فشل في حذف المتجر');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/stores'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المتجر بنجاح",
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

  //Normalize to array 
  const currentStore  = normalizeArray(stores);

  // Filter current store based on search
  const filteredStores = currentStore.filter((store: Store) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      store.name.toLowerCase().includes(q) ||
      store.email.toLowerCase().includes(q) ||
      store.loginEmail.toLowerCase().includes(q)
    );
  });
  
  // const matchesSearch = currentStore && searchTerm ? (
  //   currentStore.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   currentStore.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   currentStore.loginEmail.toLowerCase().includes(searchTerm.toLowerCase())
  // ) : true;

  // Remove delete functionality for stores

  if (isLoading) {
    return <Loading />;
  }

  return (
    <PageLayout>
      <PageHeader
        title="معلومات المتجر"
        description="عرض وإدارة معلومات المتجر الحالي"
        icon={<Store className="h-8 w-8" />}
      />

      <div className="space-y-6">
        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>البحث في معلومات المتجر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في معلومات المتجر..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات المتجر</CardTitle>
          </CardHeader>
          <CardContent>
            {!currentStore ? (
              <EmptyState
                icon={<Store className="h-12 w-12" />}
                title="لا توجد معلومات متجر"
                description="لم يتم العثور على معلومات المتجر الحالي"
              />
            ) : !filteredStores || filteredStores.length === 0 ? (
              <EmptyState
                icon={<Store className="h-12 w-12" />}
                title="لا توجد نتائج"
                description="لم يتم العثور على نتائج للبحث المحدد"
              />
            ) : (
              <div className="space-y-4">
                {filteredStores.map((store: Store) => (
                  <div
                    key={store.id}
                    className="p-6 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-bold text-xl">{store.name}</h3>
                          <Badge variant="outline">
                            {store.branchesCount || 0} فرع
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-600" />
                            <div>
                              <span className="font-medium">البريد الإلكتروني:</span>
                              <p className="text-muted-foreground">{store.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-600" />
                            <div>
                              <span className="font-medium">الهاتف:</span>
                              <p className="text-muted-foreground">{store.phoneNumber}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-600" />
                            <div>
                              <span className="font-medium">العنوان:</span>
                              <p className="text-muted-foreground">{store.city + " - " + store.country}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-600" />
                            <div>
                              <span className="font-medium">بريد الدخول:</span>
                              <p className="text-muted-foreground">{store.loginEmail}</p>
                            </div>
                          </div>

                          {store.taxId && (
                            <div>
                              <span className="font-medium">معرف الضريبة:</span>
                              <p className="text-muted-foreground">{store.taxId}</p>
                            </div>
                          )}

                          <div>
                            <span className="font-medium">العمليات السنوية:</span>
                            <p className="text-muted-foreground font-bold text-green-600">
                              {store.totalYearlyOperations?.toLocaleString('ar-SA') || 0} ر.س
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>أنشئ بواسطة: {store.owner_name || 'غير محدد'}</span>
                            <span>تاريخ الإنشاء: {store.created_at ? new Date(store.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Link href={`/stores/${store.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            تعديل معلومات المتجر
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>


    </PageLayout>
  );
}