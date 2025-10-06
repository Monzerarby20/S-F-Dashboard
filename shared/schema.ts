import { z } from "zod";

// Department schema
export const insertDepartmentSchema = z.object({
  name: z.string().min(1, "اسم القسم مطلوب"),
  description: z.string().optional(),
  branchId: z.number().positive("معرف الفرع مطلوب"),
});

// Branch schema
export const insertBranchSchema = z.object({
  name: z.string().min(1, "اسم الفرع مطلوب"),
  address: z.string().min(1, "العنوان مطلوب"),
  phone: z.string().min(1, "رقم الهاتف مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

// Product schema
export const insertProductSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  description: z.string().optional(),
  barcode: z.string().min(1, "الباركود مطلوب"),
  itemNumber: z.string().min(1, "رقم الصنف مطلوب"),
  departmentId: z.number().positive("القسم مطلوب"),
  branchId: z.number().positive("الفرع مطلوب"),
  originalPrice: z.string().min(1, "السعر مطلوب"),
  discountPercentage: z.string().default("0"),
  isFixedPriceOffer: z.boolean().default(false),
  fixedOfferPrice: z.string().default("0"),
  isMultiPieceOffer: z.boolean().default(false),
  multiPieceQuantity: z.number().default(2),
  multiPiecePrice: z.string().default("0"),
  multiPieceOfferType: z.enum(["fixed_price", "discount"]).default("fixed_price"),
  loyaltyPoints: z.number().default(0),
  imageUrl: z.string().optional(),
  stockQuantity: z.number().default(0),
  expiryDate: z.string().optional(),
});
