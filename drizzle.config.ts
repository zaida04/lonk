import type { Config } from 'drizzle-kit';
 
export default {
	schema: './src/db_schema.ts',
	out: './drizzle',
	driver: "better-sqlite",
} satisfies Config;