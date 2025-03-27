import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Create Postgres client
const client = postgres(databaseUrl, { ssl: 'require' });

// Create Drizzle instance with our schema
export const db = drizzle(client, { schema });