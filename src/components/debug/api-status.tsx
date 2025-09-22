import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function ApiStatus() {
  const { data: status, isLoading, error, refetch } = useQuery({
    queryKey: ['/status'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: health } = useQuery({
    queryKey: ['/health'],
    refetchInterval: 60000, // Refetch every minute
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'ok':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'disconnected':
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'ok':
        return <CheckCircle className="h-4 w-4" />;
      case 'disconnected':
      case 'error':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <Card className="mb-6 border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">حالة الاتصال</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">الواجهة الخلفية</span>
            <Badge className={getStatusColor(health?.status || 'unknown')}>
              {getStatusIcon(health?.status || 'unknown')}
              <span className="ml-1">{health?.status || 'غير معروف'}</span>
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">قاعدة البيانات</span>
            <Badge className={getStatusColor(status?.database || 'unknown')}>
              {getStatusIcon(status?.database || 'unknown')}
              <span className="ml-1">{status?.database || 'غير معروف'}</span>
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">المصادقة</span>
            <Badge className={getStatusColor(status?.user?.authenticated ? 'connected' : 'disconnected')}>
              {getStatusIcon(status?.user?.authenticated ? 'connected' : 'disconnected')}
              <span className="ml-1">{status?.user?.authenticated ? 'متصل' : 'غير متصل'}</span>
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">معرف المستخدم</span>
            <span className="text-xs font-mono text-muted-foreground">
              {status?.user?.id ? `...${status.user.id.slice(-8)}` : 'غير متاح'}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
            <span className="text-red-600 dark:text-red-400">خطأ: {error.message}</span>
          </div>
        )}

        {status?.timestamp && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            آخر تحديث: {new Date(status.timestamp).toLocaleTimeString('ar-SA')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}