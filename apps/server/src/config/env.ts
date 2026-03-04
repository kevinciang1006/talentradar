import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform(Number).pipe(z.number().int().positive()),
  MONGODB_URI: z.string().refine((val) => val.startsWith('mongodb'), {
    message: 'MONGODB_URI must start with "mongodb"',
  }),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().url('CORS_ORIGIN must be a valid URL'),
});

type EnvConfig = z.infer<typeof envSchema>;

const parseEnv = (): EnvConfig => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err) => {
        return `  - ${err.path.join('.')}: ${err.message}`;
      }).join('\n');

      console.error('❌ Invalid environment variables:\n' + missingVars);
      process.exit(1);
    }
    throw error;
  }
};

export const config = parseEnv();
