import { TRPCError } from "@trpc/server";

import type { dbClient } from "@orello/db/client";
import * as workspaceRepo from "@orello/db/repository/workspace.repo";

export async function assertUserInWorkspace(
  db: dbClient,
  userId: string,
  workspaceId: number,
  role?: "admin" | "member",
) {
  const isMember = await workspaceRepo.isUserInWorkspace(
    db,
    userId,
    workspaceId,
    role,
  );

  if (!isMember)
    throw new TRPCError({
      message: `You do not have access to this workspace`,
      code: "FORBIDDEN",
    });
}
