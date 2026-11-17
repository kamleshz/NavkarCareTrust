import { cache } from "react";
import { redirect } from "next/navigation";
import type { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { readSessionUserId } from "@/lib/auth/session";
import type { SessionUser, UserDocument } from "@/lib/types";

export function toSessionUser(user: UserDocument & { _id: ObjectId }): SessionUser {
  return {
    id: user._id.toHexString(),
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    accountTypes: user.accountTypes ?? [],
    isPlatformAdmin: Boolean(user.isPlatformAdmin),
  };
}

/**
 * Data Access Layer: resolves the signed-in user on the server. Memoised per
 * request so repeated calls do not hit the database again.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const userId = await readSessionUserId();
    if (!userId) return null;
    const db = await getDatabase();
    const user = await db.collection<UserDocument>("users").findOne({ _id: userId });
    if (!user?._id) return null;
    return toSessionUser(user as UserDocument & { _id: ObjectId });
  } catch {
    return null;
  }
});

/** Returns the user's ObjectId for server actions, or null when signed out. */
export async function getCurrentUserId(): Promise<ObjectId | null> {
  try {
    return await readSessionUserId();
  } catch {
    return null;
  }
}

export async function requireUser(returnTo = "/"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function requirePatient(returnTo = "/account"): Promise<SessionUser> {
  const user = await requireUser(returnTo);
  if (!user.accountTypes.includes("patient")) redirect("/account/organisations");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (!user.isPlatformAdmin) redirect("/");
  return user;
}
