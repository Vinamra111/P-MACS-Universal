/**
 * Validation schemas for admin API routes
 * Using Zod for runtime type safety and input sanitization
 */

import { z } from 'zod';

/**
 * Create User Schema
 * Validates input for POST /api/admin/users
 */
export const CreateUserSchema = z.object({
  empId: z
    .string()
    .min(3, 'Employee ID must be at least 3 characters')
    .max(10, 'Employee ID must be at most 10 characters')
    .regex(/^[A-Z][0-9]{3,}$/, 'Employee ID format: N001, P001, M001 (letter + numbers)')
    .trim(),

  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),

  role: z.enum(['Nurse', 'Pharmacist', 'Master'], {
    errorMap: () => ({ message: 'Role must be Nurse, Pharmacist, or Master' }),
  }),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

/**
 * Update User Status Schema
 * Validates input for PUT /api/admin/users
 */
export const UpdateUserStatusSchema = z.object({
  empId: z
    .string()
    .min(3, 'Employee ID must be at least 3 characters')
    .trim(),

  action: z.enum(['WHITELIST', 'BLACKLIST'], {
    errorMap: () => ({ message: 'Action must be WHITELIST or BLACKLIST' }),
  }),
});

/**
 * Delete User Schema
 * Validates query params for DELETE /api/admin/users
 */
export const DeleteUserSchema = z.object({
  empId: z
    .string()
    .min(3, 'Employee ID must be at least 3 characters')
    .trim(),
});

/**
 * Admin Chat Message Schema
 * Validates input for POST /api/admin/chat
 */
export const AdminChatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be at most 2000 characters')
    .trim(),
});

/**
 * Helper function to validate and return typed data or error response
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details: z.ZodError } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError.message,
        details: error,
      };
    }
    return {
      success: false,
      error: 'Validation failed',
      details: error as z.ZodError,
    };
  }
}
