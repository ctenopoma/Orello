import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type { NextApiRequest } from "next";
import type { OpenApiMeta } from "trpc-to-openapi";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import type { dbClient } from "@orello/db/client";
import { initAuth } from "@orello/auth/server";
import { initializeDatabase } from "@orello/db/client";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null | undefined;
  stripeCustomerId?: string | null | undefined;
}

const createAuthWithHeaders = (
  auth: ReturnType<typeof initAuth>,
  _headers: Headers,
) => {
  return {
    api: {
      getSession: () => auth.api.getSession(),
      signInMagicLink: (_input: { email: string; callbackURL: string }) =>
        auth.api.signInMagicLink(),
      listActiveSubscriptions: (_input: { workspacePublicId: string }) =>
        auth.api.listActiveSubscriptions(),
    },
  };
};

interface CreateContextOptions {
  user: User | null | undefined;
  db: dbClient;
  auth: ReturnType<typeof createAuthWithHeaders>;
}

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    user: opts.user,
    db: opts.db,
    auth: opts.auth,
  };
};

export const createTRPCContext = async ({ req }: CreateNextContextOptions) => {
  const logToFile = (message: string) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const logDir = process.env.PGLITE_DATA_DIR ? path.dirname(process.env.PGLITE_DATA_DIR) : '.';
      const logFile = path.join(logDir, 'trpc-error.log');
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
    } catch (e) {
      console.error('Failed to write log:', e);
    }
  };

  try {
    logToFile("Starting TRPC context creation...");
    logToFile(`process.cwd(): ${process.cwd()}`);
    logToFile(`PGLITE_DATA_DIR: ${process.env.PGLITE_DATA_DIR}`);
    logToFile(`MIGRATIONS_DIR: ${process.env.MIGRATIONS_DIR}`);

    console.log("Initializing database...");
    const db = await initializeDatabase();
    console.log("Database initialized successfully");

    console.log("Initializing auth...");
    const baseAuth = initAuth(db);
    const headers = new Headers(req.headers as Record<string, string>);
    const auth = createAuthWithHeaders(baseAuth, headers);
    console.log("Auth initialized successfully");

    console.log("Getting session...");
    const session = await auth.api.getSession();
    console.log("Session retrieved:", session?.user?.email);

    logToFile("TRPC context created successfully");
    return createInnerTRPCContext({ db, user: session?.user, auth });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.stack || error.message : String(error);
    logToFile(`Error creating TRPC context: ${errorMsg}`);
    console.error("Error creating TRPC context:", error);
    throw error;
  }
};

export const createNextApiContext = async (req: NextApiRequest) => {
  const db = await initializeDatabase();
  const baseAuth = initAuth(db);
  const headers = new Headers(req.headers as Record<string, string>);
  const auth = createAuthWithHeaders(baseAuth, headers);

  const session = await auth.api.getSession();

  return createInnerTRPCContext({ db, user: session?.user, auth });
};

export const createRESTContext = async ({ req }: CreateNextContextOptions) => {
  const db = await initializeDatabase();
  const baseAuth = initAuth(db);
  const headers = new Headers(req.headers as Record<string, string>);
  const auth = createAuthWithHeaders(baseAuth, headers);

  let session;
  try {
    session = await auth.api.getSession();
  } catch (error) {
    console.error("Error getting session, ", error);
    throw error;
  }

  return createInnerTRPCContext({ db, user: session?.user, auth });
};

const t = initTRPC
  .context<typeof createTRPCContext>()
  .meta<OpenApiMeta>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

export const createTRPCRouter = t.router;

export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure.meta({
  openapi: { method: "GET", path: "/public" },
});

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx,
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed).meta({
  openapi: {
    method: "GET",
    path: "/protected",
  },
});
