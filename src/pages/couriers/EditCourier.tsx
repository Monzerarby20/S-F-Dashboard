import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useRoute } from "wouter";
import axios from "axios";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Save, Bike, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Loading from "@/components/common/loading";
import { Badge } from "@/components/ui/badge";
import {
  getCourierById,
  updateCourier,
  type CourierType,
  type UpdateCourierPayload,
} from "./CouriersList";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface StoreType {
  id: number;
  name: string;
  slug: string;
}

interface Branch {
  id: number;
  name: string;
}

const editCourierSchema = z.object({
  first_name: z.string().min(2, "الاسم الأول يجب أن يكون حرفين على الأقل"),
  last_name: z.string().min(2, "الاسم الأخير يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().min(10, "رقم الهاتف يجب أن يكون 10 أرقام على الأقل"),
  store_id: z.number().optional(),
  branch_id: z.number().optional(),
  courier_type: z.enum(["store_courier", "platform_courier"], {
    required_error: "يجب اختيار نوع المندوب",
  }),
  is_active: z.boolean().default(true),
});

type EditCourierForm = z.infer<typeof editCourierSchema>;

export default function EditCourierPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/couriers/edit/:id");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const courierId = params?.id;

  const [stores, setStores] = useState<StoreType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const form = useForm<EditCourierForm>({
    resolver: zodResolver(editCourierSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      store_id: undefined,
      branch_id: undefined,
      courier_type: "store_courier",
      is_active: true,
    },
  });

  const {
    data: courier,
    isLoading: courierLoading,
    isError: courierError,
  } = useQuery({
    queryKey: ["courier", courierId],
    enabled: !!courierId,
    queryFn: () => getCourierById(Number(courierId)),
  });

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoadingStores(true);
        const token = localStorage.getItem("token");
        const url = `${BASE_URL}stores/stores/`;
        const res = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data =
          res.data && Array.isArray(res.data)
            ? res.data
            : res.data && Array.isArray(res.data.results)
              ? res.data.results
              : [];
        setStores(data);
      } catch (err) {
        console.error("Error fetching stores:", err);
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, []);

  const handleStoreChange = async (storeId: number) => {
    form.setValue("branch_id", undefined);
    setBranches([]);

    const store = stores.find((s) => s.id === storeId);
    if (!store) return;

    try {
      setLoadingBranches(true);
      const storeSlug = store.slug ?? store.id;
      const token = localStorage.getItem("token");
      const base = BASE_URL?.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
      const url = `${base}stores/stores/${storeSlug}/branches/`;
      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data =
        res.data && Array.isArray(res.data)
          ? res.data
          : res.data && Array.isArray(res.data.results)
            ? res.data.results
            : [];
      setBranches(data);
    } catch (err) {
      console.error("Error fetching branches:", err);
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    if (courier) {
      form.reset({
        first_name: courier.first_name || "",
        last_name: courier.last_name || "",
        email: courier.email || "",
        phone: courier.phone || "",
        store_id: courier.store_id || undefined,
        branch_id: courier.branch_id || undefined,
        courier_type: courier.courier_type || "store_courier",
        is_active: courier.is_active ?? true,
      });
    }
  }, [courier, form]);

  useEffect(() => {
    if (courier?.store_id && stores.length > 0) {
      handleStoreChange(courier.store_id);
    }
  }, [courier?.store_id, stores]);

  const updateCourierMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateCourierPayload;
    }) => {
      return await updateCourier(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier", courierId] });
      queryClient.invalidateQueries({ queryKey: ["couriers"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات المندوب بنجاح",
      });
      setLocation("/couriers");
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث المندوب",
        variant: "destructive",
      });
    },
  });

  if (courierLoading || loadingStores) return <Loading />;

  if (!match || !courierId) {
    setLocation("/couriers");
    return null;
  }

  if (!currentUser) return <Loading />;

  if (courierError || !courier) {
    return (
      <PageLayout maxWidth="2xl">
        <PageHeader
          title="تعديل المندوب"
          onBack={() => setLocation("/couriers")}
          backLabel="العودة للمندوبين"
        />
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-red-500 mb-2">حدث خطأ أثناء تحميل بيانات المندوب</p>
            <p className="text-sm text-muted-foreground mb-4">
              يرجى التحقق من اتصال واجهة برمجة التطبيقات
            </p>
            <Button variant="outline" onClick={() => setLocation("/couriers")}>
              العودة للمندوبين
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const onSubmit = (data: EditCourierForm) => {
    const payload: UpdateCourierPayload = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      courier_type: data.courier_type as CourierType,
      is_active: !!data.is_active,
      ...(data.store_id && { store_id: data.store_id }),
      ...(data.branch_id && { branch_id: data.branch_id }),
    };
    updateCourierMutation.mutate({ id: Number(courierId), data: payload });
  };

  return (
    <PageLayout maxWidth="2xl">
      <PageHeader
        title="تعديل المندوب"
        subtitle={`تحديث بيانات المندوب ${courier.first_name} ${courier.last_name}`}
        onBack={() => setLocation("/couriers")}
        backLabel="العودة للمندوبين"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bike className="h-5 w-5" />
            بيانات المندوب
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="mb-4">
            {courier.is_active ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                نشط
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600 border-red-600">
                معطل
              </Badge>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الأول*</FormLabel>
                      <FormControl>
                        <Input placeholder="الاسم الأول" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الأخير*</FormLabel>
                      <FormControl>
                        <Input placeholder="الاسم الأخير" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني*</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="example@email.com" {...field} />
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
                      <FormLabel>رقم الهاتف*</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="0501234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="store_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المتجر</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const storeId = value ? Number(value) : undefined;
                          field.onChange(storeId);
                          if (storeId) handleStoreChange(storeId);
                        }}
                        value={field.value?.toString() || ""}
                        disabled={loadingStores}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المتجر" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stores.map((store) => (
                            <SelectItem key={store.id} value={store.id.toString()}>
                              {store.name}
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
                  name="branch_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الفرع</FormLabel>
                      <Select
                        disabled={!form.watch("store_id") || loadingBranches}
                        onValueChange={(value) =>
                          field.onChange(value ? Number(value) : undefined)
                        }
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفرع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches.map((branch) => (
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
              </div>

              <FormField
                control={form.control}
                name="courier_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع المندوب*</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع المندوب" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="store_courier">مندوب متجر</SelectItem>
                        <SelectItem value="platform_courier">مندوب منصة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between border p-4 rounded-lg">
                    <div>
                      <FormLabel>حالة النشاط</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        تحديد ما إذا كان المندوب نشطاً
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={updateCourierMutation.isPending}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 ml-2" />
                  {updateCourierMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/couriers")}
                  className="flex-1"
                >
                  <X className="h-4 w-4 ml-2" />
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
