import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import {
    addToCartApi,
    updateCartItem,
    removeProduct,
    emptyCart,
} from "@/services/cashier";

import type { CartItem } from "@/types/cart"


export const useCartOperations = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [cart, setCart] = useState<CartItem[]>([]);

    const addToCartMutation = useMutation({
        mutationFn: addToCartApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cartApi"] });
            queryClient.invalidateQueries({ queryKey: ["cartSummary"] });

            toast({
                title: "تمت الإضافة",
                description: "تمت إضافة المنتج إلى السلة بنجاح",
            });
        },
        onError: () => {
            toast({
                title: "خطأ في الإضافة",
                description: "فشل في إضافة المنتج إلى السلة",
                variant: "destructive",
            });
        },
    });


    const removeProductMutation = useMutation({
        mutationFn: removeProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cartApi"] });
            queryClient.invalidateQueries({ queryKey: ["cartSummary"] });

            toast({
                title: "تم حذف المنتج",
                description: "تم حذف المنتج من السلة بنجاح",
            });
        },
        onError: () => {
            toast({
                title: "خطأ في الحذف",
                description: "لم يتم حذف المنتج من السلة",
                variant: "destructive",
            });
        },
    });


    const updateCartMutation = useMutation({
        mutationFn: ({
            cartItemId,
            editedData,
        }: {
            cartItemId: number;
            editedData: any;
        }) => updateCartItem(cartItemId, editedData),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cartApi"] });
            queryClient.invalidateQueries({ queryKey: ["cartSummary"] });

            toast({
                title: "تم التحديث",
                description: "تم تعديل المنتج في السلة بنجاح",
            });
        },
        onError: () => {
            toast({
                title: "خطأ في التحديث",
                description: "فشل تعديل المنتج في السلة",
                variant: "destructive",
            });
        },
    });


    const emptyCartMutation = useMutation({
        mutationFn: emptyCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cartApi"] });
            queryClient.invalidateQueries({ queryKey: ["cartSummary"] });

            toast({
                title: "تم مسح السلة",
                description: "تم تفريغ جميع المنتجات من السلة",
            });
        },
        onError: () => {
            toast({
                title: "خطأ في التفريغ",
                description: "لم يتم مسح السلة بنجاح",
                variant: "destructive",
            });
        },
    });


    const addToCart = (product: any, payload: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);

            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [
                ...prev,
                {
                    id: product.id,
                    name: product.name,
                    price: parseFloat(product.pricing.final_price),
                    quantity: 1,
                    barcode: product.barcode,
                    image_url: product.image_url || "",
                    loyalty_points: product.loyalty_points || 0,
                    weight: product.weight || "",
                },
            ];
        });

        addToCartMutation.mutate(payload);
    };


    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(item => item.id !== id));
        removeProductMutation.mutate(id);
    };

    const clearCart = () => {
        emptyCartMutation.mutate();
        setCart([]);
    };


    const updateQuantity = (
        cartItemId: number,
        productId: number,
        newQuantity: number
    ) => {
        if (newQuantity <= 0) {
            removeFromCart(cartItemId);
            return;
        }

        updateCartMutation.mutate({
            cartItemId,
            editedData: {
                product_id: productId,
                quantity: newQuantity,
            },
        });

        setCart(prev =>
            prev.map(item =>
                item.cart_item_id === cartItemId
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );
    };

    

    return {
        cart,
        setCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
    };
};
