import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { Bike, Loader2 } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import Loading from "@/components/common/loading";
import {
  createCourier,
  type CourierType,
  type CreateCourierPayload,
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
  address: string | null;
  phone: string | null;
}

const addCourierSchema = z.object({
  first_name: z.string().min(2, "الاسم الأول مطلوب"),
  last_name: z.string().min(2, "الاسم الأخير مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().min(10, "رقم الهاتف مطلوب"),
  store_id: z.number().optional(),
  branch_id: z.number().optional(),
  courier_type: z.enum(["store_courier", "platform_courier"], {
    required_error: "يجب اختيار نوع المندوب",
  }),
  is_active: z.boolean().default(true),
});

type AddCourierForm = z.infer<typeof addCourierSchema>;

export default function AddCourierPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const form = useForm<AddCourierForm>({
    resolver: zodResolver(addCourierSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      store_id: undefined,
      branch_id: undefined,
      courier_type: undefined,
      is_active: true,
    },
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
        toast({
          title: "تعذر تحميل المتاجر",
          description: String((err as Error)?.message || err),
          variant: "destructive",
        });
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, [toast]);

  const handleStoreChange = async (selectedStoreIdOrSlug: number | string | undefined) => {
    form.setValue("branch_id", undefined);
    setBranches([]);

    if (!selectedStoreIdOrSlug) return;

    try {
      setLoadingBranches(true);
      const store = stores.find(
        (s) => s.id === Number(selectedStoreIdOrSlug) || s.slug === selectedStoreIdOrSlug
      );
      if (!store) return;

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
      toast({
        title: "تعذر تحميل الفروع",
        description: String((err as Error)?.message || err),
        variant: "destructive",
      });
    } finally {
      setLoadingBranches(false);
    }
  };

  const addCourierMutation = useMutation({
    mutationFn: async (courierData: CreateCourierPayload) => {
      return await createCourier(courierData);
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء المندوب بنجاح",
        description: "تم إضافة المندوب الجديد إلى النظام",
      });
      queryClient.invalidateQueries({ queryKey: ["couriers"] });
      setLocation("/couriers");
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة المندوب",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddCourierForm) => {
    const payload: CreateCourierPayload = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      courier_type: data.courier_type as CourierType,
      is_active: !!data.is_active,
      ...(data.store_id && { store_id: data.store_id }),
      ...(data.branch_id && { branch_id: data.branch_id }),
    };
    addCourierMutation.mutate(payload);
  };

  if (authLoading || loadingStores) {
    return <Loading />;
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <PageLayout maxWidth="2xl">
      <PageHeader
        title="إضافة مندوب جديد"
        subtitle="إدخال بيانات مندوب جديد في النظام"
        onBack={() => setLocation("/couriers")}
        backLabel="العودة للمندوبين"
      />

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الأول *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل الاسم الأول" {...field} />
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
                      <FormLabel>الاسم الأخير *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل الاسم الأخير" {...field} />
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
                      <FormLabel>البريد الإلكتروني *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="example@shop.com" {...field} />
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
                      <FormLabel>رقم الهاتف *</FormLabel>
                      <FormControl>
                        <Input placeholder="010xxxxxxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="store_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">المتجر</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value ? Number(value) : undefined);
                          const store = stores.find((s) => s.id === Number(value));
                          if (store) {
                            handleStoreChange(store.slug ?? store.id);
                          }
                        }}
                        value={field.value?.toString() || ""}
                        disabled={loadingStores}
                      >
                        <SelectTrigger className="w-full">
                          {loadingStores
                            ? "جاري تحميل المتاجر..."
                            : field.value
                              ? stores.find((s) => s.id === Number(field.value))?.name ||
                                "اختر المتجر"
                              : "اختر المتجر"}
                        </SelectTrigger>
                        <SelectContent>
                          {stores.length > 0 ? (
                            stores.map((store) => (
                              <SelectItem key={store.id} value={store.id.toString()}>
                                {store.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-gray-500 text-sm text-center">
                              لا توجد متاجر متاحة
                            </div>
                          )}
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
                      <FormLabel className="text-sm">الفرع</FormLabel>
                      <Select
                        disabled={!form.watch("store_id") || loadingBranches}
                        onValueChange={(value) =>
                          field.onChange(value ? Number(value) : undefined)
                        }
                        value={field.value?.toString() || ""}
                      >
                        <SelectTrigger className="w-full">
                          {!form.watch("store_id")
                            ? "اختر المتجر أولاً"
                            : loadingBranches
                              ? "جاري تحميل الفروع..."
                              : field.value
                                ? branches.find((b) => b.id === Number(field.value))?.name ||
                                  "اختر الفرع"
                                : "اختر الفرع"}
                        </SelectTrigger>
                        <SelectContent>
                          {branches.length > 0 ? (
                            branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id.toString()}>
                                {branch.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-gray-500 text-sm text-center">
                              {!form.watch("store_id")
                                ? "اختر المتجر أولاً"
                                : "لا توجد فروع متاحة"}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="courier_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع المندوب *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
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
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between border p-3 rounded-lg">
                    <div>
                      <FormLabel className="text-sm font-medium">حالة الحساب</FormLabel>
                      <FormMessage />
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked)}
                      />
                    </FormControl>
                    <span className="text-sm ms-2">
                      {field.value ? "نشط ✅" : "غير نشط ❌"}
                    </span>
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-6 border-t">
                <Button type="submit" disabled={addCourierMutation.isPending}>
                  {addCourierMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  <Bike className="h-4 w-4 mr-2" />
                  حفظ المندوب
                </Button>
                <Button type="button" variant="outline" onClick={() => setLocation("/couriers")}>
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
