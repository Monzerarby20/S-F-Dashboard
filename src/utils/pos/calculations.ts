import { VAT_RATE, TOTAL_MULTIPLIER } from "@/constants/cashier";

type CartSummaryItem = {
  unit_price: number;
  quantity: number;
};

/**
 * Subtotal (before VAT)
 */
export const calculateSubtotal = (items: CartSummaryItem[]): number => {
  return items.reduce(
    (total, item) => total + item.unit_price * item.quantity,
    0
  );
};

/**
 * VAT amount
 */
export const calculateVAT = (subtotal: number): number => {
  return subtotal * VAT_RATE;
};

/**
 * Grand total (subtotal + VAT)
 */
export const calculateGrandTotal = (subtotal: number): number => {
  return subtotal * TOTAL_MULTIPLIER;
};
