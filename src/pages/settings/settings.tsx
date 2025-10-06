import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Bell, Shield, Save, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useKeyboardNavigation, useScreenReaderAnnouncement } from "@/hooks/useKeyboardNavigation";
import { AccessibleSwitch } from "@/components/ui/accessible-switch";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import Loading from "@/components/common/loading";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  language: string;
  timezone: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  orderAlerts: boolean;
  stockAlerts: boolean;
  promotionAlerts: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordChangeRequired: boolean;
}

interface AppSettings {
  sidebarStyle: string;
  themeMode: string;
  dashboardLayout: string;
  itemsPerPage: number;
  showProductImages: boolean;
  autoRefresh: boolean;
  showTips: boolean;
  compactMode: boolean;
  soundEffects: boolean;
  autoPrint: boolean;
  defaultPayment: string;
  scannerType: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // Accessibility refs
  const skipLinkRef = useRef<HTMLAnchorElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  
  const { announce } = useScreenReaderAnnouncement();
  
  // Focus management
  useEffect(() => {
    // Focus main content when tab changes
    if (mainContentRef.current) {
      mainContentRef.current.focus();
    }
    // Announce tab change to screen readers
    const tabNames = {
      profile: "الملف الشخصي",
      app: "إعدادات التطبيق", 
      notifications: "التنبيهات",
      security: "الأمان"
    };
    announce(`تم التبديل إلى تبويب ${tabNames[activeTab as keyof typeof tabNames]}`);
  }, [activeTab, announce]);

  // Keyboard navigation
  useKeyboardNavigation({
    onEscape: () => {
      if (activeTab !== "profile") {
        setActiveTab("profile");
      }
    }
  });

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['/auth/user'],
  });

  // Fetch notification settings
  const { data: notifications = {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderAlerts: true,
    stockAlerts: true,
    promotionAlerts: false
  }, isLoading: notificationsLoading } = useQuery({
    queryKey: ['/user/notifications'],
  });

  // Fetch security settings
  const { data: security = {
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordChangeRequired: false
  }, isLoading: securityLoading } = useQuery({
    queryKey: ['/user/security'],
  });

  // Fetch app settings
  const { data: appSettings = {
    sidebarStyle: 'expanded',
    themeMode: 'light',
    dashboardLayout: 'grid',
    itemsPerPage: 20,
    showProductImages: true,
    autoRefresh: true,
    showTips: true,
    compactMode: false,
    soundEffects: true,
    autoPrint: false,
    defaultPayment: 'cash',
    scannerType: 'camera'
  }, isLoading: appSettingsLoading } = useQuery({
    queryKey: ['/user/app-settings'],
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await apiRequest('PUT', '/auth/user', data);
      if (!response.ok) {
        throw new Error('فشل في تحديث الملف الشخصي');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/auth/user'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث الملف الشخصي بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update notifications mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationSettings) => {
      const response = await apiRequest('PUT', '/user/notifications', data);
      if (!response.ok) {
        throw new Error('فشل في تحديث إعدادات التنبيهات');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/user/notifications'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث إعدادات التنبيهات بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update app settings mutation
  const updateAppSettingsMutation = useMutation({
    mutationFn: async (data: AppSettings) => {
      const response = await apiRequest('PUT', '/user/app-settings', data);
      if (!response.ok) {
        throw new Error('فشل في تحديث إعدادات التطبيق');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/user/app-settings'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث إعدادات التطبيق بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      const response = await apiRequest('PUT', '/auth/change-password', data);
      if (!response.ok) {
        throw new Error('فشل في تغيير كلمة المرور');
      }
      return response.json();
    },
    onSuccess: () => {
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({
        title: "تم التحديث",
        description: "تم تغيير كلمة المرور بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = (field: string, value: any) => {
    updateProfileMutation.mutate({ [field]: value });
  };

  const handleNotificationToggle = (field: keyof NotificationSettings) => {
    const updatedNotifications = { ...notifications, [field]: !notifications[field] };
    updateNotificationsMutation.mutate(updatedNotifications);
    
    // Announce change to screen readers
    const fieldNames = {
      emailNotifications: "تنبيهات البريد الإلكتروني",
      smsNotifications: "تنبيهات الرسائل النصية", 
      pushNotifications: "التنبيهات الفورية",
      orderAlerts: "تنبيهات الطلبات",
      stockAlerts: "تنبيهات المخزون",
      promotionAlerts: "تنبيهات العروض"
    };
    const status = updatedNotifications[field] ? "مفعل" : "غير مفعل";
    announce(`${fieldNames[field]} الآن ${status}`);
  };

  const handleAppSettingChange = (field: keyof AppSettings, value: any) => {
    const updatedSettings = { ...appSettings, [field]: value };
    updateAppSettingsMutation.mutate(updatedSettings);
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمة المرور الجديدة غير متطابقة",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate(passwordData);
  };

  if (profileLoading || notificationsLoading || securityLoading || appSettingsLoading) {
    return <Loading />;
  }

  return (
    <PageLayout>
      {/* Skip Link for keyboard navigation */}
      <a
        ref={skipLinkRef}
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50 transition-all duration-200"
        onFocus={() => skipLinkRef.current?.scrollIntoView()}
      >
        تخطي إلى المحتوى الرئيسي
      </a>
      
      <PageHeader
        title="الإعدادات الشخصية"
        description="إدارة إعدادات حسابك وتفضيلاتك"
        icon={<Settings className="h-8 w-8" aria-hidden="true" />}
      />

      <div 
        id="main-content"
        ref={mainContentRef}
        className="space-y-6"
        tabIndex={-1}
        role="main"
        aria-label="محتوى الإعدادات الشخصية"
      >
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-4"
          aria-label="إعدادات المستخدم"
        >
          <TabsList 
            className="grid w-full grid-cols-4" 
            role="tablist"
            aria-label="أقسام الإعدادات"
          >
            <TabsTrigger 
              value="profile"
              role="tab"
              aria-selected={activeTab === "profile"}
              aria-controls="profile-panel"
            >
              <User className="h-4 w-4 mr-2" aria-hidden="true" />
              الملف الشخصي
            </TabsTrigger>
            <TabsTrigger 
              value="app"
              role="tab"
              aria-selected={activeTab === "app"}
              aria-controls="app-panel"
            >
              <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
              إعدادات التطبيق
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              role="tab"
              aria-selected={activeTab === "notifications"}
              aria-controls="notifications-panel"
            >
              <Bell className="h-4 w-4 mr-2" aria-hidden="true" />
              التنبيهات
            </TabsTrigger>
            <TabsTrigger 
              value="security"
              role="tab"
              aria-selected={activeTab === "security"}
              aria-controls="security-panel"
            >
              <Shield className="h-4 w-4 mr-2" aria-hidden="true" />
              الأمان
            </TabsTrigger>
          </TabsList>

          <TabsContent 
            value="profile"
            id="profile-panel"
            role="tabpanel"
            aria-labelledby="profile-tab"
            tabIndex={0}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" aria-hidden="true" />
                  معلومات الملف الشخصي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم الكامل</Label>
                    <Input
                      id="name"
                      defaultValue={profile?.name || ""}
                      onBlur={(e) => handleProfileUpdate('name', e.target.value)}
                      aria-describedby="name-help"
                      autoComplete="name"
                    />
                    <div id="name-help" className="sr-only">
                      أدخل اسمك الكامل كما تريد أن يظهر في النظام
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={profile?.email || ""}
                      onBlur={(e) => handleProfileUpdate('email', e.target.value)}
                      aria-describedby="email-help"
                      autoComplete="email"
                    />
                    <div id="email-help" className="sr-only">
                      أدخل بريدك الإلكتروني للتواصل والتنبيهات
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      defaultValue={profile?.phone || ""}
                      onBlur={(e) => handleProfileUpdate('phone', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">الدور</Label>
                    <Input
                      id="role"
                      value={profile?.role || ""}
                      disabled
                      className="bg-gray-100 dark:bg-gray-800"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">اللغة</Label>
                    <select 
                      id="language"
                      className="w-full p-2 border rounded-md bg-background"
                      defaultValue={profile?.language || "ar"}
                      onChange={(e) => handleProfileUpdate('language', e.target.value)}
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">المنطقة الزمنية</Label>
                    <select 
                      id="timezone"
                      className="w-full p-2 border rounded-md bg-background"
                      defaultValue={profile?.timezone || "Asia/Riyadh"}
                      onChange={(e) => handleProfileUpdate('timezone', e.target.value)}
                    >
                      <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                      <option value="Asia/Dubai">دبي (GMT+4)</option>
                      <option value="UTC">UTC (GMT+0)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="app">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    إعدادات واجهة التطبيق
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="sidebar-style">نمط القائمة الجانبية</Label>
                      <select 
                        id="sidebar-style"
                        className="w-full p-2 border rounded-md bg-background"
                        value={appSettings.sidebarStyle}
                        onChange={(e) => handleAppSettingChange('sidebarStyle', e.target.value)}
                      >
                        <option value="expanded">مفتوحة</option>
                        <option value="collapsed">مطوية</option>
                        <option value="mini">أيقونات فقط</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="theme-mode">نمط المظهر</Label>
                      <select 
                        id="theme-mode"
                        className="w-full p-2 border rounded-md bg-background"
                        defaultValue="light"
                      >
                        <option value="light">فاتح</option>
                        <option value="dark">داكن</option>
                        <option value="auto">تلقائي حسب النظام</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dashboard-layout">تخطيط لوحة التحكم</Label>
                      <select 
                        id="dashboard-layout"
                        className="w-full p-2 border rounded-md bg-background"
                        defaultValue="grid"
                      >
                        <option value="grid">شبكة</option>
                        <option value="list">قائمة</option>
                        <option value="cards">بطاقات</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="items-per-page">عدد العناصر في الصفحة</Label>
                      <select 
                        id="items-per-page"
                        className="w-full p-2 border rounded-md bg-background"
                        defaultValue="20"
                      >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">إعدادات العرض</h4>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-product-images">عرض صور المنتجات</Label>
                        <p className="text-sm text-muted-foreground">إظهار صور المنتجات في القوائم</p>
                      </div>
                      <Switch
                        id="show-product-images"
                        defaultChecked={true}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-refresh">التحديث التلقائي</Label>
                        <p className="text-sm text-muted-foreground">تحديث البيانات تلقائياً كل دقيقة</p>
                      </div>
                      <Switch
                        id="auto-refresh"
                        defaultChecked={true}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-tips">إظهار النصائح</Label>
                        <p className="text-sm text-muted-foreground">عرض نصائح الاستخدام والمساعدة</p>
                      </div>
                      <Switch
                        id="show-tips"
                        defaultChecked={true}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="compact-mode">الوضع المضغوط</Label>
                        <p className="text-sm text-muted-foreground">عرض أكثر كثافة للبيانات</p>
                      </div>
                      <Switch
                        id="compact-mode"
                        defaultChecked={false}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">إعدادات نقطة البيع</h4>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sound-effects">تأثيرات صوتية</Label>
                        <p className="text-sm text-muted-foreground">تشغيل أصوات عند مسح المنتجات</p>
                      </div>
                      <Switch
                        id="sound-effects"
                        defaultChecked={true}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-print">طباعة تلقائية</Label>
                        <p className="text-sm text-muted-foreground">طباعة الفواتير تلقائياً بعد إتمام البيع</p>
                      </div>
                      <Switch
                        id="auto-print"
                        defaultChecked={false}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="default-payment">طريقة الدفع الافتراضية</Label>
                      <select 
                        id="default-payment"
                        className="w-full p-2 border rounded-md bg-background"
                        defaultValue="cash"
                      >
                        <option value="cash">نقدي</option>
                        <option value="card">بطاقة</option>
                        <option value="digital">محفظة رقمية</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scanner-type">نوع الماسح الضوئي</Label>
                      <select 
                        id="scanner-type"
                        className="w-full p-2 border rounded-md bg-background"
                        defaultValue="camera"
                      >
                        <option value="camera">كاميرا الجهاز</option>
                        <option value="usb">ماسح USB</option>
                        <option value="bluetooth">ماسح بلوتوث</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      className="w-32"
                      disabled={updateAppSettingsMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateAppSettingsMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  إعدادات التنبيهات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">تنبيهات البريد الإلكتروني</Label>
                      <p className="text-sm text-muted-foreground">استقبال التنبيهات عبر البريد الإلكتروني</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notifications.emailNotifications}
                      onCheckedChange={() => handleNotificationToggle('emailNotifications')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">تنبيهات الرسائل النصية</Label>
                      <p className="text-sm text-muted-foreground">استقبال التنبيهات عبر الرسائل النصية</p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={notifications.smsNotifications}
                      onCheckedChange={() => handleNotificationToggle('smsNotifications')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">التنبيهات الفورية</Label>
                      <p className="text-sm text-muted-foreground">التنبيهات المباشرة في المتصفح</p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={notifications.pushNotifications}
                      onCheckedChange={() => handleNotificationToggle('pushNotifications')}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="order-alerts">تنبيهات الطلبات</Label>
                      <p className="text-sm text-muted-foreground">إشعارات عند استلام طلبات جديدة</p>
                    </div>
                    <Switch
                      id="order-alerts"
                      checked={notifications.orderAlerts}
                      onCheckedChange={() => handleNotificationToggle('orderAlerts')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="stock-alerts">تنبيهات المخزون</Label>
                      <p className="text-sm text-muted-foreground">إشعارات عند نفاد أو انخفاض المخزون</p>
                    </div>
                    <Switch
                      id="stock-alerts"
                      checked={notifications.stockAlerts}
                      onCheckedChange={() => handleNotificationToggle('stockAlerts')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="promotion-alerts">تنبيهات العروض</Label>
                      <p className="text-sm text-muted-foreground">إشعارات العروض والتخفيضات الجديدة</p>
                    </div>
                    <Switch
                      id="promotion-alerts"
                      checked={notifications.promotionAlerts}
                      onCheckedChange={() => handleNotificationToggle('promotionAlerts')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    إعدادات الأمان
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="two-factor">المصادقة الثنائية</Label>
                      <p className="text-sm text-muted-foreground">حماية إضافية لحسابك</p>
                    </div>
                    <Switch
                      id="two-factor"
                      checked={security.twoFactorEnabled}
                      onCheckedChange={() => {/* Handle 2FA toggle */}}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">مهلة انتهاء الجلسة (بالدقائق)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      defaultValue={security.sessionTimeout}
                      min="5"
                      max="480"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>تغيير كلمة المرور</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">كلمة المرور الحالية</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        autoComplete="current-password"
                        aria-describedby="current-password-help"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                      </Button>
                    </div>
                    <div id="current-password-help" className="sr-only">
                      أدخل كلمة المرور الحالية للتأكد من هويتك
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                  </div>

                  <Button 
                    onClick={handlePasswordChange}
                    disabled={changePasswordMutation.isPending}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {changePasswordMutation.isPending ? "جاري التحديث..." : "تغيير كلمة المرور"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}