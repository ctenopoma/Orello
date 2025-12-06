// Stub auth module for offline-only desktop app
// Uses a fixed local user ID and ensures the user exists in the database

const LOCAL_USER_ID = "00000000-0000-0000-0000-000000000001";
const LOCAL_USER_EMAIL = "local@orello.app";

let userEnsured = false;

const ensureLocalUser = async (db: any) => {
    if (userEnsured) return;

    try {
        // Check if user exists
        const existing = await db.execute({
            sql: `SELECT id FROM "user" WHERE id = $1`,
            params: [LOCAL_USER_ID]
        });

        if (!existing.rows || existing.rows.length === 0) {
            // Insert local user
            await db.execute({
                sql: `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") 
                      VALUES ($1, $2, $3, $4, $5, $6)
                      ON CONFLICT (id) DO NOTHING`,
                params: [LOCAL_USER_ID, "Local User", LOCAL_USER_EMAIL, true, new Date(), new Date()]
            });
            console.log("Local user created successfully");
        }
        userEnsured = true;
    } catch (error) {
        console.error("Error ensuring local user:", error);
        // Try alternative syntax for PGlite
        try {
            await db.execute(
                `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") 
                 VALUES ('${LOCAL_USER_ID}', 'Local User', '${LOCAL_USER_EMAIL}', true, NOW(), NOW())
                 ON CONFLICT (id) DO NOTHING`
            );
            userEnsured = true;
            console.log("Local user created with fallback method");
        } catch (e) {
            console.error("Fallback also failed:", e);
        }
    }
};

export const initAuth = (db: any) => ({
    api: {
        getSession: async () => {
            await ensureLocalUser(db);
            return {
                user: {
                    id: LOCAL_USER_ID,
                    name: "Local User",
                    email: LOCAL_USER_EMAIL,
                    emailVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            };
        },
        signInMagicLink: async () => ({ status: true }),
        listActiveSubscriptions: async () => [],
    },
});
