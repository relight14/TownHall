import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";
import ws from 'ws';
import { config } from 'dotenv';
import { resolve } from 'path';

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

if (process.env.ENVIRONMENT != 'production') {
  // Load environment variables from root .env file
  config({ path: resolve(process.cwd(), '.env') });
}


if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
