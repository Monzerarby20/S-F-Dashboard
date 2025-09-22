import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import { apiRequest } from "@/lib/queryClient";

interface UploadResult {
  success: number;
  errors: Array<{ row: number; message: string }>;
  detectedColumns: Record<string, string>;
  totalRows: number;
}

export default function ExcelUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/products/excel-upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (result: UploadResult) => {
      setUploadResult(result);
      setSelectedFile(null);
      
      if (result.success > 0) {
        toast({
          title: "نجح الرفع!",
          description: `تم رفع ${result.success} منتج بنجاح.`,
        });
      }
      
      if (result.errors.length > 0) {
        toast({
          title: "تحذير",
          description: `فشل في رفع ${result.errors.length} صف. يرجى مراجعة التفاصيل.`,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الرفع",
        description: error.message || "حدث خطأ أثناء رفع الملف",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "نوع ملف غير صحيح",
          description: "يرجى اختيار ملف Excel (.xlsx أو .xls)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "حجم الملف كبير",
          description: "يجب أن يكون حجم الملف أقل من 10 ميجابايت",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['اسم المنتج', 'الباركود', 'السعر', 'الكمية', 'القسم', 'الفرع', 'الوصف', 'تاريخ الانتهاء', 'الصورة'],
      ['مثال: شامبو الأطفال', '123456789012', '25.50', '100', 'العناية الشخصية', 'الفرع الرئيسي', 'شامبو لطيف للأطفال', '2025-12-31', 'https://example.com/image.jpg'],
      ['مثال: معجون أسنان', '123456789013', '15.75', '50', 'العناية الشخصية', 'الفرع الرئيسي', 'معجون أسنان بالفلورايد', '', '']
    ];

    const csvContent = templateData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'قالب_المنتجات.csv';
    link.click();
  };

  return (
    <PageLayout>
      <PageHeader
        title="رفع ملف Excel للمنتجات"
        subtitle="قم برفع ملف Excel لإضافة منتجات متعددة دفعة واحدة"
        backPath="/products"
        backLabel="العودة للمنتجات"
      />

      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Template Download Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                تحميل القالب
              </CardTitle>
              <CardDescription>
                قم بتحميل قالب Excel لمعرفة الصيغة المطلوبة للبيانات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadTemplate} variant="outline" className="w-full">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                تحميل قالب CSV
              </Button>
            </CardContent>
          </Card>

          {/* File Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                رفع الملف
              </CardTitle>
              <CardDescription>
                اختر ملف Excel (.xlsx أو .xls) لرفع البيانات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="excel-file">ملف Excel</Label>
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={uploadMutation.isPending}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    الملف المحدد: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? "جاري الرفع..." : "رفع الملف"}
              </Button>
              
              {uploadMutation.isPending && (
                <div className="space-y-2">
                  <Progress value={50} />
                  <p className="text-sm text-center text-muted-foreground">
                    جاري معالجة الملف...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upload Results */}
        {uploadResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {uploadResult.success > 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                نتائج الرفع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{uploadResult.success}</p>
                  <p className="text-sm text-gray-600">تم بنجاح</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{uploadResult.errors.length}</p>
                  <p className="text-sm text-gray-600">أخطاء</p>
                </div>
              </div>

              {/* Detected Columns */}
              <div className="space-y-2">
                <h4 className="font-medium">الأعمدة المكتشفة:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(uploadResult.detectedColumns).map(([key, value]) => (
                    <div key={key} className="flex justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                      <span className="font-medium">{key}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Success Message */}
              {uploadResult.success > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>نجح الرفع!</AlertTitle>
                  <AlertDescription>
                    تم رفع {uploadResult.success} منتج من أصل {uploadResult.totalRows} صف بنجاح.
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Details */}
              {uploadResult.errors.length > 0 && (
                <div className="space-y-2">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>تحذير</AlertTitle>
                    <AlertDescription>
                      فشل في رفع {uploadResult.errors.length} صف. يرجى مراجعة الأخطاء أدناه.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-4 max-h-60 overflow-y-auto">
                    <h4 className="font-medium mb-2">تفاصيل الأخطاء:</h4>
                    <div className="space-y-2">
                      {uploadResult.errors.map((error, index) => (
                        <div 
                          key={index}
                          className="p-2 bg-red-50 border border-red-200 rounded text-sm"
                        >
                          <span className="font-medium">الصف {error.row}:</span> {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setUploadResult(null)}
                >
                  إخفاء النتائج
                </Button>
                {uploadResult.success > 0 && (
                  <Button 
                    onClick={() => window.location.href = '/products'}
                  >
                    عرض المنتجات
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}