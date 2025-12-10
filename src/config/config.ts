import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '.env' });

const envSchema = z.object({
  NODE_ENV: z
    .enum(['local', 'production'])
    .default('production')
    .describe('Environment of the service'),

  SERVICE_PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(3000)
    .describe('Port of the service'),
});

const parsedResult = envSchema.safeParse(process.env);

if (!parsedResult.success) {
  console.error(
    'Config: Invalid environment variables:',
    z.flattenError(parsedResult.error).fieldErrors,
  );

  process.exit(1);
}

const env = parsedResult.data;

export const config = {
  service: {
    env: env.NODE_ENV,
    port: env.SERVICE_PORT,
  },
};
