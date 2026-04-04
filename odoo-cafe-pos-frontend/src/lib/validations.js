import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Product ─────────────────────────────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().positive("Price must be a positive number"),
  unit: z.string().min(1, "Unit is required"),
  tax_pct: z.coerce.number().min(0).max(100).default(5),
  description: z.string().optional(),
  send_to_kitchen: z.boolean().default(true),
});

export const productVariantSchema = z.object({
  attribute: z.string().min(1, "Attribute is required"),
  value: z.string().min(1, "Value is required"),
  extra_price: z.coerce.number().min(0).default(0),
});

// ─── Floor & Table ───────────────────────────────────────────────────────────

export const floorSchema = z.object({
  name: z.string().min(1, "Floor name is required"),
});

export const tableSchema = z.object({
  table_number: z.coerce.number().int().positive("Table number must be positive"),
  seats: z.coerce.number().int().min(1, "At least 1 seat required"),
});

// ─── Payment ─────────────────────────────────────────────────────────────────

export const upiConfigSchema = z.object({
  upi_id: z
    .string()
    .min(3, "UPI ID is required")
    .regex(/^[\w.-]+@[\w]+$/, "Enter a valid UPI ID (e.g. name@ybl)"),
});

export const paymentSchema = z.object({
  order_id: z.string().uuid(),
  method: z.enum(["CASH", "DIGITAL", "UPI"]),
  amount: z.coerce.number().positive("Amount must be positive"),
});

// ─── Session ─────────────────────────────────────────────────────────────────

export const closeSessionSchema = z.object({
  closing_amount: z.coerce.number().min(0, "Closing amount cannot be negative"),
});

// ─── Booking ─────────────────────────────────────────────────────────────────

export const bookingSchema = z.object({
  customer_name: z.string().min(1, "Guest name is required"),
  customer_phone: z
    .string()
    .regex(/^\+?[0-9\s-]{7,15}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  booked_at: z.string().min(1, "Date and time are required"),
  guests: z.coerce.number().int().min(1, "At least 1 guest required"),
  table_id: z.string().min(1, "Table is required"),
});