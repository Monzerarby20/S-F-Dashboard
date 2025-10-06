import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCheck, Users, Calendar, Phone, Search, Eye } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface GuestCustomer {
  id: number;
  customerNumber: string;
  name: string;
  phone: string | null;
  email: string | null;
  isGuest: boolean;
  loyaltyPoints: number;
  totalSpent: string;
  lastVisit: Date | null;
  createdAt: Date;
}

interface GuestStats {
  totalGuests: number;
  todayGuests: number;
}

export default function GuestCustomers() {
  const [searchTerm, setSearchTerm] = useState("");

  // جلب العملاء الزائرين
  const { data: guestCustomers = [], isLoading: customersLoading } = useQuery<GuestCustomer[]>({
    queryKey: ['/customers/guests'],
  });

  // جلب إحصائيات العملاء الزائرين
  const { data: guestStats, isLoading: statsLoading } = useQuery<GuestStats>({
    queryKey: ['/customers/guests/stats'],
  });

  // تصفية العملاء حسب البحث
  const filteredCustomers = guestCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm))
  );

  if (customersLoading || statsLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>جاري تحميل بيانات العملاء الزائرين...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">العملاء الزائرين</h1>
            <p className="text-muted-foreground">
              إدارة ومراقبة الحسابات المؤقتة للعملاء الزائرين
            </p>
          </div>
        </div>

        {/* إحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي العملاء الزائرين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{guestStats?.totalGuests || 0}</div>
              <p className="text-xs text-muted-foreground">
                جميع الحسابات الزائرة المسجلة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">زائرين اليوم</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{guestStats?.todayGuests || 0}</div>
              <p className="text-xs text-muted-foreground">
                حسابات جديدة تم إنشاؤها اليوم
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط الإنفاق</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {guestCustomers.length > 0 
                  ? (guestCustomers.reduce((sum, customer) => sum + parseFloat(customer.totalSpent || '0'), 0) / guestCustomers.length).toFixed(2)
                  : '0.00'
                } ر.س
              </div>
              <p className="text-xs text-muted-foreground">
                متوسط إنفاق العملاء الزائرين
              </p>
            </CardContent>
          </Card>
        </div>

        {/* شريط البحث */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              البحث في العملاء الزائرين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="البحث برقم الزائر، الاسم، أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* قائمة العملاء الزائرين */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>قائمة العملاء الزائرين ({filteredCustomers.length})</span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                حسابات مؤقتة
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "لا توجد نتائج للبحث المحدد" : "لا توجد حسابات زائرة حتى الآن"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                          <UserCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{customer.name}</p>
                          <Badge variant="outline" className="text-xs bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300">
                            VISITOR
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="font-mono">{customer.customerNumber}</span>
                          {customer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </span>
                          )}
                          <span>
                            تم الإنشاء: {format(new Date(customer.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar })}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>إجمالي الإنفاق: {parseFloat(customer.totalSpent || '0').toFixed(2)} ر.س</span>
                          {customer.lastVisit && (
                            <span>
                              آخر زيارة: {format(new Date(customer.lastVisit), 'dd/MM/yyyy', { locale: ar })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                        عرض
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ملاحظة حول الحسابات الزائرة */}
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <UserCheck className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                  حول الحسابات الزائرة
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  هذه حسابات مؤقتة يتم إنشاؤها تلقائياً للعملاء الذين لا يرغبون في التسجيل الكامل. 
                  يبدأ رقم كل حساب زائر بـ "VISITOR-" متبوعاً بتاريخ الإنشاء ورقم تسلسلي. 
                  يمكن تحويل هذه الحسابات لاحقاً إلى حسابات عملاء مسجلين.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}