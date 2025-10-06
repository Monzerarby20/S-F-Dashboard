import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function ApiTestPage() {
  const [responses, setResponses] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  const testEndpoint = async (endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any) => {
    setLoading(prev => ({ ...prev, [endpoint]: true }));
    
    try {
      let result;
      if (method === 'GET') {
        const response = await fetch(`${import.meta.env.VITE_APP_API_BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('mock-token') || 'test-token'}`,
            'ngrok-skip-browser-warning': 'true',
          },
        });
        result = await response.json();
      } else {
        result = await apiRequest(endpoint, {
          method,
          body: data ? JSON.stringify(data) : undefined,
        });
      }
      
      setResponses(prev => ({ 
        ...prev, 
        [endpoint]: { 
          success: true, 
          data: result,
          timestamp: new Date().toLocaleString('ar-SA')
        }
      }));
      
      toast({
        title: "نجح الاختبار",
        description: `تم الاتصال بـ ${endpoint} بنجاح`,
      });
    } catch (error: any) {
      setResponses(prev => ({ 
        ...prev, 
        [endpoint]: { 
          success: false, 
          error: error.message || 'خطأ في الاتصال',
          timestamp: new Date().toLocaleString('ar-SA')
        }
      }));
      
      toast({
        variant: "destructive",
        title: "فشل الاختبار",
        description: `خطأ في الاتصال بـ ${endpoint}`,
      });
    } finally {
      setLoading(prev => ({ ...prev, [endpoint]: false }));
    }
  };

  const endpoints = [
    { 
      path: '/protected-data', 
      name: 'البيانات المحمية',
      description: 'اختبار الوصول للبيانات المحمية',
      method: 'GET' as const
    },
    { 
      path: '/user-info', 
      name: 'معلومات المستخدم',
      description: 'جلب معلومات المستخدم الحالي',
      method: 'GET' as const
    },
    { 
      path: '/products?branchId=1', 
      name: 'قائمة المنتجات',
      description: 'جلب المنتجات للفرع الأول',
      method: 'GET' as const
    },
    { 
      path: '/departments', 
      name: 'الأقسام',
      description: 'جلب قائمة الأقسام',
      method: 'GET' as const
    },
    { 
      path: '/branches', 
      name: 'الفروع',
      description: 'جلب قائمة الفروع',
      method: 'GET' as const
    },
    { 
      path: '/analytics/top-products', 
      name: 'أهم المنتجات',
      description: 'إحصائيات أهم المنتجات مبيعاً',
      method: 'GET' as const
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          اختبار API Endpoints
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          اختبر الاتصال مع خادم API والتحقق من عمل التوكنات
        </p>
        <div className="flex justify-center">
          <Badge variant="outline" className="text-sm">
            API Base: {import.meta.env.VITE_APP_API_BASE_URL}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {endpoints.map((endpoint) => (
          <Card key={endpoint.path} className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{endpoint.name}</span>
                <Badge variant={endpoint.method === 'GET' ? 'default' : 'secondary'}>
                  {endpoint.method}
                </Badge>
              </CardTitle>
              <CardDescription>{endpoint.description}</CardDescription>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {endpoint.method} {endpoint.path}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => testEndpoint(endpoint.path, endpoint.method)}
                disabled={loading[endpoint.path]}
                className="w-full"
                variant="outline"
              >
                {loading[endpoint.path] ? 'جاري الاختبار...' : 'اختبار الآن'}
              </Button>

              {responses[endpoint.path] && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={responses[endpoint.path].success ? 'default' : 'destructive'}
                    >
                      {responses[endpoint.path].success ? 'نجح' : 'فشل'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {responses[endpoint.path].timestamp}
                    </span>
                  </div>
                  
                  <Textarea
                    value={JSON.stringify(
                      responses[endpoint.path].success 
                        ? responses[endpoint.path].data 
                        : responses[endpoint.path].error, 
                      null, 
                      2
                    )}
                    readOnly
                    className="font-mono text-sm min-h-[150px] max-h-[300px]"
                    placeholder="النتيجة ستظهر هنا..."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>ملاحظات الاختبار</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>• يتم إرسال Mock token تلقائياً مع كل طلب</p>
          <p>• النجاح يعني أن API يعمل والتوكن صالح</p>
          <p>• الفشل قد يعني مشكلة في الشبكة أو انتهاء صلاحية التوكن</p>
          <p>• تحقق من console logs في المتصفح للمزيد من التفاصيل</p>
        </CardContent>
      </Card>
    </div>
  );
}