import {
    text,
    sqliteTable,
    integer,
} from "drizzle-orm/sqlite-core";

export const links = sqliteTable("links", {
    id: text("id").notNull().primaryKey(),
    short_link: text("short_link")
        .notNull()
        .unique(),
    destination_link: text(
        "destination_link",
    ).notNull(),
    is_active: integer("is_active", {
        mode: "boolean",
    })
        .notNull()
        .default(true),
});
