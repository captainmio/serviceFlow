import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Username or email is required"),
  password: z.string().min(4, "Password must be at least 4 characters long")
});

export type LoginInput = z.infer<typeof loginSchema>;
