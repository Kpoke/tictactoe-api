import { z } from "zod";

/**
 * Username validation schema
 * - 3-20 characters
 * - Alphanumeric and underscore only
 * - No spaces
 */
export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
  .refine((val) => val.trim().length === val.length, "Username cannot have leading or trailing spaces");

/**
 * Password validation schema
 * - Minimum 7 characters
 * - At least one letter and one number
 */
export const passwordSchema = z
  .string()
  .min(7, "Password must be at least 7 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

/**
 * Signup request validation schema
 */
export const signupSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

/**
 * Login request validation schema
 */
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Socket play data validation schema
 */
export const socketPlaySchema = z.object({
  box: z.string().regex(/^[a-c][1-3]$/, "Invalid box format"),
  opponentId: z.string().min(1, "Opponent ID is required"),
});

/**
 * Socket winner data validation schema
 */
export const socketWinnerSchema = z.object({
  side: z.enum(["X", "O"]),
  opponentId: z.string().min(1, "Opponent ID is required"),
});
