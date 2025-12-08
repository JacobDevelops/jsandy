import { defineConfig } from "drizzle-kit";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("Missing required env var: DATABASE_URL");
}

export default defineConfig({
	dbCredentials: {
		url: databaseUrl,
	},
	dialect: "mysql",
	out: "./drizzle",
	schema: "./src/server/db/schema.ts",
});
