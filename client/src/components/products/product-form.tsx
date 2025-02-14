import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { insertProductSchema, type Product, type ProductGroup } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Scan } from "lucide-react";

interface ProductFormProps {
  product?: Product;
  groups: ProductGroup[];
}

export function ProductForm({ product, groups }: ProductFormProps) {
  const { toast } = useToast();
  const [isNewGroup, setIsNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: product || {
      name: "",
      barcode: "",
      type: "piece",
      quantity: 0,
      costPrice: 0,
      sellingPrice: 0,
      groupId: groups[0]?.id,
      isWeighted: false,
    },
  });

  const productMutation = useMutation({
    mutationFn: async (data: typeof form.getValues) => {
      if (product) {
        const res = await apiRequest("PATCH", `/api/products/${product.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/products", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: product ? "تم تحديث المنتج" : "تم إضافة المنتج",
        description: product ? "تم تحديث المنتج بنجاح" : "تم إضافة المنتج بنجاح",
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

  const groupMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/product-groups", {
        name,
        description: "",
      });
      return res.json();
    },
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-groups"] });
      form.setValue("groupId", newGroup.id);
      setIsNewGroup(false);
      setNewGroupName("");
      toast({
        title: "تم إنشاء المجموعة",
        description: "تم إنشاء المجموعة الجديدة بنجاح",
      });
    },
  });

  async function onSubmit(data: typeof form.getValues) {
    if (isNewGroup && newGroupName) {
      const newGroup = await groupMutation.mutateAsync(newGroupName);
      data.groupId = newGroup.id;
    }
    productMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم المنتج</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
          <FormField
            control={form.control}
            name="barcode"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>الباركود</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input {...field} />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline">
                          <Scan className="h-4 w-4 ml-2" />
                          مسح
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>مسح الباركود</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                          {/* هنا يمكن إضافة مكتبة مسح الباركود */}
                          <p className="text-muted-foreground">جاري تطوير ميزة مسح الباركود...</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </FormControl>
                <FormDescription>اختياري - أدخل الباركود يدوياً أو استخدم الماسح</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع المنتج</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع المنتج" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="piece">قطعة</SelectItem>
                    <SelectItem value="weight">وزن</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isWeighted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">منتج وزني</FormLabel>
                  <FormDescription>
                    تفعيل القراءة المباشرة للوزن عند المسح
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الكمية</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>سعر التكلفة</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>سعر البيع</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          {!isNewGroup ? (
            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المجموعة</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر مجموعة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="flex items-center gap-2">
                    لا توجد المجموعة المطلوبة؟
                    <Button type="button" variant="link" className="p-0 h-auto" onClick={() => setIsNewGroup(true)}>
                      إنشاء مجموعة جديدة
                    </Button>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormItem>
              <FormLabel>اسم المجموعة الجديدة</FormLabel>
              <div className="flex gap-2">
                <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                <Button type="button" variant="outline" onClick={() => setIsNewGroup(false)}>
                  إلغاء
                </Button>
              </div>
            </FormItem>
          )}
        </div>

        <Button type="submit" disabled={productMutation.isPending || groupMutation.isPending}>
          {productMutation.isPending || groupMutation.isPending ? "جاري الحفظ..." : product ? "تحديث المنتج" : "إضافة المنتج"}
        </Button>
      </form>
    </Form>
  );
}
