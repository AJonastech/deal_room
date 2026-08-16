import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

export const VIEW_SESSION_WINDOW_MS = 30 * 60 * 1000;

const BOT_USER_AGENT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /slack(?:bot)?/i,
  /whatsapp/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /skypeuripreview/i,
  /headlesschrome/i,
  /preview/i,
];

export function isKnownBot(userAgent: string | null | undefined) {
  return Boolean(userAgent && BOT_USER_AGENT_PATTERNS.some((pattern) => pattern.test(userAgent)));
}

export function sessionBucket(openedAt: Date) {
  return Math.floor(openedAt.getTime() / VIEW_SESSION_WINDOW_MS);
}

export function viewSessionKey(clientSession: string, openedAt: Date) {
  return `${clientSession}:${sessionBucket(openedAt)}`;
}

export function requestFingerprint(ipAddress: string | null, userAgent: string | null) {
  return createHash("sha256")
    .update(`${ipAddress ?? "unknown-ip"}\0${userAgent ?? "unknown-device"}`)
    .digest("base64url");
}

export function newClientSession() {
  return randomBytes(18).toString("base64url");
}

type ViewDatabase = Pick<PrismaClient, "viewEvent">;

export async function registerView({
  db,
  shareLinkId,
  clientSession,
  ipAddress,
  userAgent,
  openedAt = new Date(),
}: {
  db: ViewDatabase;
  shareLinkId: string;
  clientSession: string;
  ipAddress: string | null;
  userAgent: string | null;
  openedAt?: Date;
}) {
  if (isKnownBot(userAgent)) return { counted: false, reason: "bot" as const };

  const sessionKey = viewSessionKey(clientSession, openedAt);
  try {
    await db.viewEvent.create({
      data: { shareLinkId, sessionKey, ipAddress, userAgent, openedAt },
    });
    return { counted: true, reason: "new-session" as const };
  } catch (error) {
    // The compound unique index is the concurrency/idempotency boundary. Two
    // requests can race here; the loser is the same logical session, not an error.
    if (isUniqueConstraintError(error)) return { counted: false, reason: "duplicate-session" as const };
    throw error;
  }
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}