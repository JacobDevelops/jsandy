import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const posts = pgTable(
	"posts",
	{
		createdAt: timestamp("createdAt").defaultNow().notNull(),
		id: serial("id").primaryKey(),
		name: text("name").notNull(),
		updatedAt: timestamp("updatedAt").defaultNow().notNull(),
	},
	(table) => [index("Post_name_idx").on(table.name)],
);
