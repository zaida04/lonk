import { Elysia, t } from "elysia";
import { staticPlugin } from '@elysiajs/static'
import { generateId } from "./nanoid.ts";
import { db } from "./db.ts";
import { links } from "./db_schema.ts";
import { eq, or } from "drizzle-orm";

const port = process.env.PORT ?? 4500;
const app = new Elysia();
app.use(staticPlugin());

app.get("/", () => {
    return Bun.file("public/index.html");
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
    async ({ body }) => {
        const { short_link, destination_link } = body;
        const id = generateId();

        await db.insert(links).values({
            id,
            short_link,
            destination_link,
        });

        return { id, short_link };
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
            .set({ is_active: is_active })
            .where(eq(links.id, link_identifier));

        set.status = 200;
    },
    edit_link_body,
);

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

    if(!link) {
        set.status = 404;
        return "not found";
    }

    set.redirect = link.destination_link;
    return;
});

app.listen(port, () => {
    console.log("Web server running.");
});
