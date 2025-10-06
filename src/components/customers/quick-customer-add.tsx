import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Search, Phone, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Customer {
  id: number;
  customerNumber: string;
  name: string;
  phone: string | null;
  email: string | null;
  isGuest: boolean;
  loyaltyPoints: number;
  totalSpent: string;
  createdAt: Date;
}

interface QuickCustomerAddProps {
  onCustomerSelected: (customer: Customer) => void;
  trigger?: React.ReactNode;
}

export default function QuickCustomerAdd({ onCustomerSelected, trigger }: QuickCustomerAddProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchPhone, setSearchPhone] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [searchResult, setSearchResult] = useState<Customer | null>(null);
  const [searchNotFound, setSearchNotFound] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // بحث عن عميل برقم الهاتف
  const searchMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await fetch(`/api/customers/search/phone/${phone}`);
      if (response.status === 404) {
        throw new Error("NOT_FOUND");
      }
      if (!response.ok) {
        throw new Error("SEARCH_ERROR");
      }
      return response.json();
    },
    onSuccess: (customer) => {
      setSearchResult(customer);
      setSearchNotFound(false);
    },
    onError: (error: Error) => {
      if (error.message === "NOT_FOUND") {
        setSearchResult(null);
        setSearchNotFound(true);
      } else {
        toast({
          title: "خطأ في البحث",
          description: "فشل في البحث عن العميل",
          variant: "destructive",
        });
      }
    },
  });

  // إنشاء عميل ضيف
  const createGuestMutation = useMutation({
    mutationFn: async (data: { name?: string; phone?: string }) => {
      return await apiRequest("/api/customers/guest", "POST", data);
    },
    onSuccess: (customer: Customer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      onCustomerSelected(customer);
      setIsOpen(false);
      resetForm();
      toast({
        title: "تم إنشاء حساب زائر",
        description: `رقم الزائر: ${customer.customerNumber}`,
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء العميل",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (searchPhone.trim()) {
      searchMutation.mutate(searchPhone.trim());
    }
  };

  const handleCreateGuest = () => {
    createGuestMutation.mutate({
      name: guestName.trim() || undefined,
      phone: guestPhone.trim() || undefined,
    });
  };

  const handleSelectExisting = (customer: Customer) => {
    onCustomerSelected(customer);
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSearchPhone("");
    setGuestName("");
    setGuestPhone("");
    setSearchResult(null);
    setSearchNotFound(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4 ml-2" />
            إضافة عميل
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            إضافة عميل جديد
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* البحث عن عميل موجود */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Label>البحث برقم الهاتف</Label>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="أدخل رقم الهاتف"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button 
                onClick={handleSearch}
                disabled={searchMutation.isPending}
                size="sm"
              >
                {searchMutation.isPending ? "جاري البحث..." : "بحث"}
              </Button>
            </div>

            {/* نتيجة البحث */}
            {searchResult && (
              <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{searchResult.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {searchResult.customerNumber} • {searchResult.phone}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSelectExisting(searchResult)}
                  >
                    اختيار
                  </Button>
                </div>
              </div>
            )}

            {/* عدم وجود نتائج */}
            {searchNotFound && (
              <div className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <p className="text-sm">لم يتم العثور على عميل بهذا الرقم</p>
              </div>
            )}
          </div>

          <Separator />

          {/* إنشاء عميل ضيف جديد */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <Label>إنشاء حساب زائر جديد</Label>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="guestName">اسم العميل (اختياري)</Label>
                <Input
                  id="guestName"
                  placeholder="اسم العميل"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="guestPhone">رقم الهاتف (اختياري)</Label>
                <Input
                  id="guestPhone"
                  placeholder="رقم الهاتف"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>

              <Button
                onClick={handleCreateGuest}
                disabled={createGuestMutation.isPending}
                className="w-full"
              >
                {createGuestMutation.isPending ? "جاري الإنشاء..." : "إنشاء عميل ضيف"}
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            سيتم إنشاء رقم عميل تلقائياً للعميل الجديد
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}