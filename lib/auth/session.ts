import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type { SessionDocument } from "@/lib/types";

const SESSION_COOKIE = "nkt_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: ObjectId) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const db = await getDatabase();

  await db.collection<SessionDocument>("sessions").insertOne({
    tokenHash: hashToken(token),
    userId,
    createdAt: new Date(),
    expiresAt,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function readSessionUserId(): Promise<ObjectId | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await getDatabase();
  const session = await db
    .collection<SessionDocument>("sessions")
    .findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });

  if (!session) return null;
  return session.userId instanceof ObjectId ? session.userId : new ObjectId(String(session.userId));
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    const db = await getDatabase();
    await db.collection<SessionDocument>("sessions").deleteOne({ tokenHash: hashToken(token) });
  }

  store.delete(SESSION_COOKIE);
}
