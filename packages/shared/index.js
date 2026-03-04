import { z } from 'zod';

// This is the single source of truth for a User
export const UserSchema = z.object({
  username: z.string().min(3, "Too short!"),
  email: z.string().email("Invalid email"),
});