import { defineConfig } from "drizzle-kit";
import "dotenv/config";

const databaseUrl = process.env.POSTGRES_URL;
if (!databaseUrl) {
	throw new Error("Missing required env var: POSTGRES_URL");
}

export default defineConfig({
	dbCredentials: {
		url: databaseUrl,
	},
	dialect: "postgresql",
	out: "./drizzle",
	schema: "./src/server/db/schema.ts",
});
