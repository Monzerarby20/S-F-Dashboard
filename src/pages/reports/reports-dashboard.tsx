import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Calendar as CalendarIcon, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
import { ar, da } from "date-fns/locale";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import Loading from "@/components/common/loading";
import { normalizeArray } from "@/services/normalize";
import {mockApi, mockBraches, type mockBrache} from  "@/services/mockData"
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export default function ReportsDashboard() {
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  // Fetch sales analytics
  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['/analytics/sales', selectedBranch, dateRange],
  });
  const salesData = normalizeArray(sales) 

  // Fetch top products
  const { data: topProduct = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/analytics/top-products', selectedBranch, dateRange],
  });


  const topProducts = normalizeArray(topProduct)
  // Fetch customer analytics
  const { data: customerAnalytic = {}, isLoading: customersLoading } = useQuery({
    queryKey: ['/analytics/customers', selectedBranch, dateRange],
  });

  const customerAnalytics = normalizeArray(customerAnalytic)

  // Fetch inventory analytics
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['/analytics/inventory', selectedBranch],
  });

  const  inventoryData = normalizeArray(inventory)

  // Fetch branches for filter
  const [branches,setBranches] = useState<mockBrache[]>([])
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    const fetchBranches = async() =>{
      const data = await mockApi.getBranches()
      if(data){
        setBranches(data)
      }
      setLoading(false)
    }
    fetchBranches();
  },[])

  // const branches = mockApi.getBranches()
  console.log(branches)
  console.log(branches[1])

  const isLoading = salesLoading || productsLoading || customersLoading || inventoryLoading;

  if (isLoading) {
    return <Loading />;
  }

  // Sample data for charts (replace with real data)
  const monthlySales = [
    { month: 'يناير', sales: 12000, orders: 45 },
    { month: 'فبراير', sales: 15000, orders: 52 },
    { month: 'مارس', sales: 18000, orders: 68 },
    { month: 'أبريل', sales: 22000, orders: 78 },
    { month: 'مايو', sales: 25000, orders: 85 },
    { month: 'يونيو', sales: 28000, orders: 92 }
  ];

  const categoryData = [
    { name: 'الإلكترونيات', value: 35, sales: 45000 },
    { name: 'الملابس', value: 25, sales: 32000 },
    { name: 'المنزل والحديقة', value: 20, sales: 28000 },
    { name: 'الكتب', value: 12, sales: 15000 },
    { name: 'أخرى', value: 8, sales: 10000 }
  ];

  const paymentMethods = [
    { method: 'نقدي', percentage: 45, amount: 85000 },
    { method: 'بطاقة ائتمان', percentage: 35, amount: 66000 },
    { method: 'مدى', percentage: 15, amount: 28000 },
    { method: 'نقاط ولاء', percentage: 5, amount: 9000 }
  ];

  const exportReport = (type: string) => {
    // Implement export functionality
    console.log(`Exporting ${type} report`);
  };

  return (
    <PageLayout>
      <PageHeader
        title="تقارير المبيعات والتحليلات"
        description="تحليل شامل لأداء المتجر والمبيعات"
        icon={<BarChart3 className="h-8 w-8" />}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportReport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              تصدير PDF
            </Button>
            <Button variant="outline" onClick={() => exportReport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              تصدير Excel
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>الفلاتر والتحديد</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">الفرع</label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفروع</SelectItem>
                  {branches.map((branch: any) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">من تاريخ</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "dd/MM/yyyy", { locale: ar })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">إلى تاريخ</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.to, "dd/MM/yyyy", { locale: ar })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المبيعات</p>
                  <p className="text-3xl font-bold">188,000 ر.س</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12.5% من الشهر الماضي
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">عدد الطلبات</p>
                  <p className="text-3xl font-bold">420</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +8.2% من الشهر الماضي
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">عدد العملاء</p>
                  <p className="text-3xl font-bold">156</p>
                  <p className="text-xs text-red-600 flex items-center mt-1">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    -2.1% من الشهر الماضي
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">متوسط قيمة الطلب</p>
                  <p className="text-3xl font-bold">447 ر.س</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +4.1% من الشهر الماضي
                  </p>
                </div>
                <Package className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sales">المبيعات</TabsTrigger>
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="customers">العملاء</TabsTrigger>
            <TabsTrigger value="inventory">المخزون</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>اتجاه المبيعات الشهرية</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlySales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="sales" stroke="#8884d8" name="المبيعات (ر.س)" />
                      <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="عدد الطلبات" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>طرق الدفع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paymentMethods.map((method, index) => (
                      <div key={method.method} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{method.method}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{method.percentage}%</p>
                          <p className="text-sm text-muted-foreground">{method.amount.toLocaleString('ar-SA')} ر.س</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>المبيعات حسب الفئة</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>أفضل المنتجات مبيعاً</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "لابتوب ديل XPS 13", sales: 45, revenue: 67500 },
                      { name: "سماعة آبل AirPods Pro", sales: 38, revenue: 19000 },
                      { name: "شاشة سامسونغ 27 بوصة", sales: 32, revenue: 24000 },
                      { name: "ماوس لوجيتيك MX Master", sales: 28, revenue: 8400 },
                      { name: "كيبورد ميكانيكية", sales: 25, revenue: 7500 }
                    ].map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.sales} مبيعة</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{product.revenue.toLocaleString('ar-SA')} ر.س</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات العملاء</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>عملاء جدد هذا الشهر</span>
                    <Badge variant="default">42</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>عملاء متكررون</span>
                    <Badge variant="secondary">78%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>معدل رضا العملاء</span>
                    <Badge variant="default" className="bg-green-600">4.6/5</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>عملاء VIP</span>
                    <Badge variant="default" className="bg-yellow-600">23</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>أفضل العملاء</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "أحمد المحمد", orders: 15, spent: 18500 },
                      { name: "فاطمة الأحمد", orders: 12, spent: 14200 },
                      { name: "محمد العلي", orders: 10, spent: 12800 },
                      { name: "نورا السالم", orders: 9, spent: 11500 },
                      { name: "خالد الحربي", orders: 8, spent: 9800 }
                    ].map((customer, index) => (
                      <div key={customer.name} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span className="font-medium">{customer.name}</span>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">{customer.spent.toLocaleString('ar-SA')} ر.س</p>
                          <p className="text-muted-foreground">{customer.orders} طلب</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>حالة المخزون</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>منتجات منخفضة المخزون</span>
                    <Badge variant="destructive">15</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>منتجات نافدة</span>
                    <Badge variant="destructive">3</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>منتجات قاربت على الانتهاء</span>
                    <Badge variant="secondary">8</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>إجمالي قيمة المخزون</span>
                    <Badge variant="default">475,000 ر.س</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>المنتجات التي تحتاج إعادة تموين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "سماعة بلوتوث", current: 2, minimum: 10, status: "نافد تقريباً" },
                      { name: "كابل USB-C", current: 5, minimum: 20, status: "منخفض" },
                      { name: "حافظة هاتف", current: 8, minimum: 15, status: "منخفض" },
                      { name: "شاحن لاسلكي", current: 12, minimum: 25, status: "منخفض" },
                      { name: "حامل لابتوب", current: 3, minimum: 10, status: "منخفض" }
                    ].map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            متوفر: {item.current} | الحد الأدنى: {item.minimum}
                          </p>
                        </div>
                        <Badge 
                          variant={item.current <= 5 ? "destructive" : "secondary"}
                        >
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}