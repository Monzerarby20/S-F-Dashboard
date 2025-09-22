import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Save, Upload, Phone, Mail, MapPin, Calendar, Building, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  bio?: string;
  address?: string;
  joinDate: string;
  lastLogin: string;
  department?: string;
  permissions: string[];
}

export default function ProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Accessibility refs
  const skipLinkRef = useRef<HTMLAnchorElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Focus management
  useEffect(() => {
    if (isEditing && formRef.current) {
      const firstInput = formRef.current.querySelector('input');
      firstInput?.focus();
    } else if (!isEditing && editButtonRef.current) {
      editButtonRef.current.focus();
    }
  }, [isEditing]);

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['/auth/user'],
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
      setIsEditing(false);
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

  const validateForm = (data: Record<string, string>) => {
    const errors: Record<string, string> = {};
    
    if (!data.name || data.name.trim().length < 2) {
      errors.name = "الاسم يجب أن يحتوي على حرفين على الأقل";
    }
    
    if (data.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(data.phone)) {
      errors.phone = "رقم الهاتف غير صالح";
    }
    
    return errors;
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      bio: formData.get('bio') as string,
      address: formData.get('address') as string,
    };
    
    const errors = validateForm(data);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Focus first error field
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.getElementById(firstErrorField);
      errorElement?.focus();
      return;
    }
    
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <PageLayout>
      {/* Skip Link */}
      <a
        ref={skipLinkRef}
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        تخطي إلى المحتوى الرئيسي
      </a>
      
      <PageHeader
        title="الملف الشخصي"
        description="عرض وتحديث معلوماتك الشخصية"
        icon={<User className="h-8 w-8" aria-hidden="true" />}
        actions={
          !isEditing ? (
            <Button 
              ref={editButtonRef}
              onClick={() => setIsEditing(true)}
              aria-describedby="edit-profile-help"
            >
              تعديل الملف الشخصي
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setFormErrors({});
              }}
            >
              إلغاء التعديل
            </Button>
          )
        }
      />
      
      <div id="edit-profile-help" className="sr-only">
        انقر لتعديل معلوماتك الشخصية
      </div>

      <div 
        id="main-content"
        className="space-y-6"
        role="main"
        aria-label="محتوى الملف الشخصي"
      >
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile?.avatar} />
                  <AvatarFallback className="text-lg">
                    {profile?.name?.charAt(0) || 'م'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-2xl font-bold">{profile?.name || 'غير محدد'}</h2>
                  <p className="text-muted-foreground">{profile?.email}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {profile?.role === 'store_owner' ? 'مالك المتجر' : 
                     profile?.role === 'branch_manager' ? 'مدير الفرع' : 
                     profile?.role === 'cashier' ? 'أمين الصندوق' : 'موظف'}
                  </Badge>
                  
                  {profile?.department && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {profile.department}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الشخصية</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form 
                  ref={formRef}
                  onSubmit={handleSave} 
                  className="space-y-4"
                  noValidate
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم الكامل <span className="text-red-500" aria-label="مطلوب">*</span></Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={profile?.name || ""}
                      autoComplete="name"
                      aria-describedby="name-help name-error"
                      aria-invalid={!!formErrors.name}
                      className={formErrors.name ? "border-red-500 focus:border-red-500" : ""}
                    />
                    <div id="name-help" className="text-sm text-muted-foreground">
                      أدخل اسمك الكامل كما تريد أن يظهر في النظام
                    </div>
                    {formErrors.name && (
                      <div 
                        id="name-error"
                        className="flex items-center gap-2 text-sm text-red-600"
                        role="alert"
                        aria-live="polite"
                      >
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                        {formErrors.name}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={profile?.phone || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">نبذة شخصية</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      placeholder="اكتب نبذة مختصرة عنك..."
                      defaultValue={profile?.bio || ""}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">العنوان</Label>
                    <Textarea
                      id="address"
                      name="address"
                      placeholder="العنوان الكامل"
                      defaultValue={profile?.address || ""}
                      rows={2}
                    />
                  </div>

                  <Button 
                    ref={saveButtonRef}
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="w-full"
                    aria-describedby="save-help"
                  >
                    <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                    {updateProfileMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </Button>
                  <div id="save-help" className="sr-only">
                    سيتم حفظ جميع التغييرات في ملفك الشخصي
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                      <p className="font-medium">{profile?.email || 'غير محدد'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                      <p className="font-medium">{profile?.phone || 'غير محدد'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">العنوان</p>
                      <p className="font-medium">{profile?.address || 'غير محدد'}</p>
                    </div>
                  </div>

                  {profile?.bio && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">نبذة شخصية</p>
                      <p className="text-sm">{profile.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات الحساب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ الانضمام</p>
                  <p className="font-medium">
                    {profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString('ar-SA') : 'غير محدد'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">آخر تسجيل دخول</p>
                  <p className="font-medium">
                    {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString('ar-SA') : 'غير محدد'}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">الصلاحيات</p>
                <div className="flex flex-wrap gap-2">
                  {profile?.permissions?.map((permission: string) => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission}
                    </Badge>
                  )) || <p className="text-sm text-muted-foreground">لا توجد صلاحيات محددة</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle>الأمان والخصوصية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start">
                <Shield className="h-4 w-4 mr-2" />
                تغيير كلمة المرور
              </Button>
              
              <Button variant="outline" className="justify-start">
                <User className="h-4 w-4 mr-2" />
                إعدادات الخصوصية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}