import type { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type { AuditLogDocument, PublicAuditEntry } from "@/lib/types";

export interface AuditInput {
  actorUserId?: ObjectId;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

/** Records an important administrative change for the audit trail. */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    const db = await getDatabase();
    await db.collection<AuditLogDocument>("auditLog").insertOne({
      ...input,
      createdAt: new Date(),
    });
  } catch (error) {
    // Auditing must never break the primary operation.
    console.error("Unable to write audit entry", error);
  }
}

/** Most recent administrative changes, newest first. */
export async function listAuditEntries(limit = 100): Promise<PublicAuditEntry[]> {
  const db = await getDatabase();
  const entries = await db
    .collection<AuditLogDocument>("auditLog")
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return entries.map((entry) => ({
    id: entry._id!.toHexString(),
    actorEmail: entry.actorEmail,
    action: entry.action,
    entityType: entry.entityType,
    summary: entry.summary,
    createdAt: entry.createdAt.toISOString(),
  }));
}
