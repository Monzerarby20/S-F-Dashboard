import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, Trash2, AlertCircle, ShoppingCart, Package, TrendingDown, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";
import { normalizeArray } from "@/services/normalize";
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'stock' | 'promotion' | 'system' | 'alert';
  isRead: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'order':
      return <ShoppingCart className="h-5 w-5 text-blue-600" />;
    case 'stock':
      return <Package className="h-5 w-5 text-orange-600" />;
    case 'promotion':
      return <Gift className="h-5 w-5 text-green-600" />;
    case 'alert':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Bell className="h-5 w-5 text-gray-600" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");

  // Fetch notifications
  const { data: notification = [], isLoading } = useQuery({
    queryKey: ['/notifications'],
  });

  //Normalize to array
  const notifications = normalizeArray(notification);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
      if (!response.ok) {
        throw new Error('فشل في تحديث حالة التنبيه');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/notifications'] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PUT', '/notifications/mark-all-read');
      if (!response.ok) {
        throw new Error('فشل في تحديث حالة التنبيهات');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/notifications'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديد جميع التنبيهات كمقروءة",
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

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest('DELETE', `/api/notifications/${notificationId}`);
      if (!response.ok) {
        throw new Error('فشل في حذف التنبيه');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/notifications'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف التنبيه بنجاح",
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

  // Filter notifications
  const filteredNotifications = notifications.filter((notification: Notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.isRead;
    return notification.type === activeTab;
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <PageLayout>
      <PageHeader
        title="التنبيهات"
        description={`لديك ${unreadCount} تنبيه غير مقروء`}
        icon={<Bell className="h-8 w-8" />}
        actions={
          unreadCount > 0 && (
            <Button 
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              تحديد الكل كمقروء
            </Button>
          )
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات التنبيهات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
                <div className="text-sm text-muted-foreground">إجمالي التنبيهات</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
                <div className="text-sm text-muted-foreground">غير مقروء</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {notifications.filter((n: Notification) => n.type === 'stock').length}
                </div>
                <div className="text-sm text-muted-foreground">تنبيهات المخزون</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {notifications.filter((n: Notification) => n.type === 'order').length}
                </div>
                <div className="text-sm text-muted-foreground">تنبيهات الطلبات</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">الكل</TabsTrigger>
            <TabsTrigger value="unread">غير مقروء</TabsTrigger>
            <TabsTrigger value="order">الطلبات</TabsTrigger>
            <TabsTrigger value="stock">المخزون</TabsTrigger>
            <TabsTrigger value="promotion">العروض</TabsTrigger>
            <TabsTrigger value="alert">تنبيهات</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-12 w-12" />}
                title="لا توجد تنبيهات"
                description={
                  activeTab === "unread" 
                    ? "لا توجد تنبيهات غير مقروءة" 
                    : "لا توجد تنبيهات في هذه الفئة"
                }
              />
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification: Notification) => (
                  <Card 
                    key={notification.id} 
                    className={`transition-all hover:shadow-md ${
                      !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className={`font-medium ${!notification.isRead ? 'font-bold' : ''}`}>
                                {notification.title}
                              </h3>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                              <Badge 
                                variant="outline" 
                                className={getPriorityColor(notification.priority)}
                              >
                                {notification.priority === 'high' ? 'عالي' : 
                                 notification.priority === 'medium' ? 'متوسط' : 'منخفض'}
                              </Badge>
                            </div>
                            
                            <p className={`text-sm ${
                              !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {notification.message}
                            </p>
                            
                            <div className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleString('ar-SA')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNotification(notification.id)}
                            disabled={deleteNotificationMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}