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
