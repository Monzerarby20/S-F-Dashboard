import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { deleteFlashSale, getAllOffers } from "@/services/offers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export default function PromotionsTable() {
  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["/promotions"],
    queryFn: getAllOffers,
  });

  const deletePromotionMutation = useMutation({
    mutationFn: (id: number) => deleteFlashSale(String(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/promotions"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف العرض بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف العرض",
        variant: "destructive",
      });
    },
  });

  const handleDeletePromotion = (id: number) => {
    deletePromotionMutation.mutate(id);
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              الاسم
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              الوصف
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              نوع العرض
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              تاريخ البداية
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              تاريخ النهاية
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              الحالة
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              الميزانية
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              تاريخ الإنشاء
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              الإجراءات
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {promotions.map((promotion: any) => (
            <tr
              key={promotion.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <td className="px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {promotion.name}
                  </p>
                  {promotion.is_featured && (
                    <Badge variant="default" className="mt-1">
                      مميز
                    </Badge>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-[200px] truncate">
                {promotion.description || "-"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {promotion.promotion_type || "-"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {promotion.start_date
                  ? new Date(promotion.start_date).toLocaleDateString("ar-SA")
                  : "-"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {promotion.end_date
                  ? new Date(promotion.end_date).toLocaleDateString("ar-SA")
                  : "-"}
              </td>
              <td className="px-4 py-3">
                {promotion.is_active ? (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  >
                    نشط
                  </Badge>
                ) : (
                  <Badge variant="secondary">معطل</Badge>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {promotion.budget
                  ? Number(promotion.budget).toLocaleString("ar-SA") + " ر.س"
                  : "-"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {promotion.created_at
                  ? new Date(promotion.created_at).toLocaleDateString("ar-SA")
                  : "-"}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link href={`/promotions/edit/${promotion.slug}`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف العرض</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من حذف العرض "{promotion.name}"؟ هذا
                          الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePromotion(promotion.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          حذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
