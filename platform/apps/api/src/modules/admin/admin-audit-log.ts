import type { Prisma } from "../../generated/prisma/client";

export type AdminAuditEntityType = "EVENT" | "FIGHT" | "ORGANIZATION";

interface AdminAuditEntry {
  actorSubject: string;
  action: "CREATE";
  entityType: AdminAuditEntityType;
  entityId: string;
}

export async function recordAdminAuditLog(
  transaction: Prisma.TransactionClient,
  entry: AdminAuditEntry,
): Promise<void> {
  await transaction.adminAuditLog.create({ data: entry });
}
