import { Elysia, t } from "elysia";
import { eq, or } from "drizzle-orm";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { join } from "path";
import { staticPlugin } from "@elysiajs/static";

import { generate_id } from "./util";
import { db } from "./db";
import { links } from "./db_schema";


const port = process.env.PORT ?? 4500;
const app = new Elysia();
app.use(staticPlugin());

app.get("/", () => {
    return Bun.file("public/index.html");
});

app.get("/manage", () => {
    return Bun.file("public/manage.html");
});

/**
 * Create a link
 */
const create_link_body = {
    body: t.Object({
        short_link: t.String(),
        destination_link: t.String(),
    }),
};
app.post(
    "/links",
    async ({ body, set }) => {
        const { short_link, destination_link } = body;
        const id = generate_id();

        const [existing_short_link] = await db
            .select()
            .from(links)
            .where(eq(links.short_link, short_link));

        if (existing_short_link) {
            set.status = 409;

            return {
                error: {
                    message:
                        "A link with this short identifier already exists.",
                },
            };
        }

        const [existing_destination_link] = await db
            .select()
            .from(links)
            .where(
                eq(
                    links.destination_link,
                    destination_link,
                ),
            );

        if (
            existing_destination_link &&
            existing_destination_link.short_link !==
                short_link
        ) {
            return {
                id: existing_destination_link.id,
                short_link:
                    existing_destination_link.short_link,
                existing: true,
            };
        }

        await db.insert(links).values({
            id,
            short_link,
            destination_link,
            is_active: true,
        });

        return {
            id,
            short_link,
        };
    },
    create_link_body,
);

/**
 * Manage existing link status
 */
const edit_link_body = {
    body: t.Object({
        is_active: t.Boolean(),
    }),
};
app.put(
    "/m/:link_identifier",
    async ({ body, params, set }) => {
        const { link_identifier } = params;
        const { is_active } = body;

        await db
            .update(links)
            .set({
                is_active: is_active,
            })
            .where(eq(links.id, link_identifier));

        set.status = 200;
    },
    edit_link_body,
);

app.get("/m/:link_identifier", async ({ params, set }) => {
    const { link_identifier } = params;

    const [link] = await db
        .select()
        .from(links)
        .where(eq(links.id, link_identifier));
    if (!link) {
        set.status = 404;
        return {
            error: {
                message: "link not found",
            },
        };
    }

    return {
        link,
    };
});

/**
 * Access link
 */
app.get("/:link_identifier", async ({ params, set }) => {
    const { link_identifier } = params;

    const [link] = await db
        .select()
        .from(links)
        .where(
            or(
                eq(links.short_link, link_identifier),
                eq(links.id, link_identifier),
            ),
        )
        .limit(1);

    if (!link) {
        set.status = 404;
        return "not found";
    }

    if (!link.is_active) {
        set.status = 403;
        return "link deactivated";
    }

    set.redirect = link.destination_link;
    return;
});

app.listen(port, async () => {
    console.log("Running migration");
    await migrate(db, {
        migrationsFolder: join(
            import.meta.dir,
            "..",
            "drizzle",
        ),
    });
    console.log("Migration success.");
    console.log("Web server running.");
});
