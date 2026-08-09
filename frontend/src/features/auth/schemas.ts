import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  display_name: z.string().min(1).max(100),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
export type RegisterValues = z.infer<typeof registerSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8).max(128),
    confirm: z.string().min(8).max(128),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const otpRequestSchema = z.object({ email: z.string().email() });
export type OtpRequestValues = z.infer<typeof otpRequestSchema>;

/** Single password field (e.g. confirming an action). */
export const passwordSchema = z.object({ password: z.string().min(1) });
export type PasswordValues = z.infer<typeof passwordSchema>;

export const codeSchema = z.object({
  code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});
export type CodeValues = z.infer<typeof codeSchema>;

export const profileSchema = z.object({
  display_name: z.string().min(1).max(100),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
  avatar_url: z.string().url("Must be a valid URL").max(512).or(z.literal("")).optional(),
  bio: z.string().max(500).optional(),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1),
    new_password: z.string().min(8).max(128),
    confirm: z.string().min(8).max(128),
  })
  .refine((v) => v.new_password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const setPasswordSchema = z
  .object({
    new_password: z.string().min(8).max(128),
    confirm: z.string().min(8).max(128),
  })
  .refine((v) => v.new_password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
export type SetPasswordValues = z.infer<typeof setPasswordSchema>;
