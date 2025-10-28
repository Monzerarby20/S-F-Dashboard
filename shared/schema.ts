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
  description: z.string().optional(),
  phone: z.string().min(1, "رقم الهاتف مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  address: z.string().min(1, "العنوان مطلوب"),
  city: z.string().min(1, "المدينة مطلوبة"),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  is_main_branch: z.boolean().default(false),
  opening_hours: z.object({
    saturday: z.object({ open: z.string().optional(), close: z.string().optional() }).optional(),
    sunday: z.object({ open: z.string().optional(), close: z.string().optional() }).optional(),
    monday: z.string().optional(),
    tuesday: z.string().optional(),
    wednesday: z.string().optional(),
    thursday: z.object({ open: z.string().optional(), close: z.string().optional() }).optional(),
    friday: z.object({ open: z.string().optional(), close: z.string().optional() }).optional(),
  }).optional(),
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
