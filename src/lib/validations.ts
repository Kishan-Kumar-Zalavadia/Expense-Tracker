import { z } from 'zod'

export const EXPENSE_TYPES = ['Need', 'Want', 'Saving'] as const

// Keep amounts as strings in forms — parse manually in submit handlers
export const expenseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  description: z.string().max(200).optional(),
  category_id: z.string().min(1, 'Select a category'),
  type: z.union([z.literal(''), z.enum(['Need', 'Want', 'Saving'])]).optional(),
  amount: z.string().min(1, 'Amount is required'),
  payment_mode_id: z.string().min(1, 'Select a payment mode'),
  subcategory_id: z.string().optional(),
  notes: z.string().max(500).optional(),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(60),
  type: z.enum(['Need', 'Want', 'Saving']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a hex color'),
})

export type CategoryFormValues = z.infer<typeof categorySchema>

export const paymentModeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(60),
})

export type PaymentModeFormValues = z.infer<typeof paymentModeSchema>

export const settingsSchema = z.object({
  currency: z.string().min(1).max(5),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>

export const incomeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  description: z.string().max(200).optional(),
  category_id: z.string().optional(),
  amount: z.string().min(1, 'Amount is required'),
  payment_mode_id: z.string().min(1, 'Select a payment mode'),
  budget_period_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  notes: z.string().max(500).optional(),
})

export type IncomeFormValues = z.infer<typeof incomeSchema>
