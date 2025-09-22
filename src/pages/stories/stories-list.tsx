import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageLayout from "@/components/layout/page-layout";
import PageHeader from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Play, Plus, Edit, Trash2, Eye, Upload, Video, Image, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/common/loading";
import EmptyState from "@/components/common/empty-state";
import {mockApi} from "@/services/mockData"
import {normalizeArray} from "@/services/normalize"


const storySchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  content: z.string().optional(),
  mediaType: z.enum(['image', 'video']),
  duration: z.number().min(5).max(30),
  isActive: z.boolean().default(true),
  branchId: z.number().optional(),
});

type StoryFormData = z.infer<typeof storySchema>;

export default function StoriesList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { data: storie = []} = useQuery<any[]>({
    queryKey: ['/stories'],
  });
  const stories = normalizeArray(storie)

  // const { data: branches = [] } = useQuery<any[]>({
  //   queryKey: ['/branches'],
  // });
  useEffect(() => {
    // Fetch branches from mock API
    const fetchBranches = async () => {
      const data = await mockApi.getBranches();
      setBranches(data);
    };
    fetchBranches();
  }, []);


  const form = useForm<StoryFormData>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      title: "",
      content: "",
      mediaType: "image",
      duration: 10,
      isActive: true,
      branchId: undefined,
    },
  });

  const resetForm = () => {
    form.reset();
    setSelectedMedia(null);
    setMediaPreview("");
    setEditingStory(null);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const createStoryMutation = useMutation({
    mutationFn: async (data: StoryFormData) => {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.content) formData.append('content', data.content);
      formData.append('mediaType', data.mediaType);
      formData.append('duration', data.duration.toString());
      formData.append('isActive', data.isActive.toString());
      if (data.branchId) formData.append('branchId', data.branchId.toString());
      
      if (selectedMedia) {
        formData.append('media', selectedMedia);
      }

      const response = await fetch('/stories', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('فشل في إنشاء المقطع');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/stories'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "تم الإنشاء",
        description: "تم إنشاء المقطع بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء المقطع",
        variant: "destructive",
      });
    },
  });

  const updateStoryMutation = useMutation({
    mutationFn: async (data: StoryFormData) => {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.content) formData.append('content', data.content);
      formData.append('mediaType', data.mediaType);
      formData.append('duration', data.duration.toString());
      formData.append('isActive', data.isActive.toString());
      if (data.branchId) formData.append('branchId', data.branchId.toString());
      
      if (selectedMedia) {
        formData.append('media', selectedMedia);
      }

      const response = await fetch(`/api/stories/${editingStory.id}`, {
        method: 'PUT',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحديث المقطع');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/stories'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "تم التحديث",
        description: "تم تحديث المقطع بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث المقطع",
        variant: "destructive",
      });
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/stories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('فشل في حذف المقطع');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/stories'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المقطع بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف المقطع",
        variant: "destructive",
      });
    },
  });

  const recordViewMutation = useMutation({
    mutationFn: async (storyId: number) => {
      const response = await fetch(`/api/stories/${storyId}/view`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('فشل في تسجيل المشاهدة');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/stories'] });
    },
  });

  const onSubmit = (data: StoryFormData) => {
    if (editingStory) {
      updateStoryMutation.mutate(data);
    } else {
      createStoryMutation.mutate(data);
    }
  };

  const handleEdit = (story: any) => {
    setEditingStory(story);
    form.reset({
      title: story.title,
      content: story.content || "",
      mediaType: story.mediaType,
      duration: story.duration,
      isActive: story.isActive,
      branchId: story.branchId || undefined,
    });
    if (story.mediaUrl) {
      setMediaPreview(story.mediaUrl);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المقطع؟")) {
      deleteStoryMutation.mutate(id);
    }
  };

  const handleView = (story: any) => {
    recordViewMutation.mutate(story.id);
  };

  const getStatusBadge = (story: any) => {
    if (!story.isActive) {
      return <Badge variant="secondary">معطل</Badge>;
    }
    return <Badge variant="default">نشط</Badge>;
  };

  const getMediaTypeIcon = (type: string) => {
    return type === 'video' ? <Video className="h-4 w-4" /> : <Image className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <PageLayout>
        <Loading />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader 
        title="مقاطع الحالات" 
      />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المقاطع</p>
                  <p className="text-2xl font-bold">{stories.length}</p>
                </div>
                <Play className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">المقاطع النشطة</p>
                  <p className="text-2xl font-bold">{stories.filter((s: any) => s.isActive).length}</p>
                </div>
                <Eye className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المشاهدات</p>
                  <p className="text-2xl font-bold">{stories.reduce((total: number, s: any) => total + (s.viewCount || 0), 0)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">مقاطع فيديو</p>
                  <p className="text-2xl font-bold">{stories.filter((s: any) => s.mediaType === 'video').length}</p>
                </div>
                <Video className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Story Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">قائمة المقاطع</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة مقطع جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingStory ? "تعديل المقطع" : "إضافة مقطع جديد"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عنوان المقطع</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل عنوان المقطع" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المحتوى (اختياري)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="أدخل وصف المقطع"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mediaType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع الوسائط</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر النوع" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="image">صورة</SelectItem>
                              <SelectItem value="video">فيديو</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المدة (ثانية)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={5} 
                              max={30}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الفرع (اختياري)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === "all" ? undefined : parseInt(value))} defaultValue={field.value?.toString() || "all"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الفرع" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">جميع الفروع</SelectItem>
                            {branches.map((branch: any) => (
                              <SelectItem key={branch.id} value={branch.id.toString()}>
                                {branch.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <label className="text-sm font-medium">رفع الوسائط</label>
                    <div className="mt-1">
                      <Input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleMediaChange}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    {mediaPreview && (
                      <div className="mt-2">
                        {form.watch("mediaType") === "video" ? (
                          <video src={mediaPreview} className="w-full h-32 object-cover rounded" controls />
                        ) : (
                          <img src={mediaPreview} alt="Preview" className="w-full h-32 object-cover rounded" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 space-x-reverse">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createStoryMutation.isPending || updateStoryMutation.isPending}
                    >
                      {editingStory ? "تحديث" : "إنشاء"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stories Grid */}
        {stories.length === 0 ? (
          <EmptyState
            title="لا توجد مقاطع"
            description="ابدأ بإضافة أول مقطع حالة"
            action={
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة مقطع جديد
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story: any) => (
              <Card key={story.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-video bg-gray-100">
                  {story.mediaUrl ? (
                    story.mediaType === 'video' ? (
                      <video 
                        src={story.mediaUrl} 
                        className="w-full h-full object-cover" 
                        onClick={() => handleView(story)}
                        style={{ cursor: 'pointer' }}
                      />
                    ) : (
                      <img 
                        src={story.mediaUrl} 
                        alt={story.title}
                        className="w-full h-full object-cover cursor-pointer" 
                        onClick={() => handleView(story)}
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getMediaTypeIcon(story.mediaType)}
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(story)}
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                    {story.duration}ث
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{story.title}</h3>
                  {story.content && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {story.content}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{story.viewCount || 0} مشاهدة</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getMediaTypeIcon(story.mediaType)}
                      <span>{story.mediaType === 'video' ? 'فيديو' : 'صورة'}</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 space-x-reverse">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(story)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(story)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(story.id)}
                      disabled={deleteStoryMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}