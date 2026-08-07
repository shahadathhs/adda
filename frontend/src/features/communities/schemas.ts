import { z } from "zod";

export const createCommunitySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  description: z.string().max(1000).optional().or(z.literal("")),
});
export type CreateCommunityValues = z.infer<typeof createCommunitySchema>;
