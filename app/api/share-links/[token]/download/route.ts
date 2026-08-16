import { prisma } from "@/lib/prisma";
import { cookies, headers } from "next/headers";
import { registerView, requestFingerprint } from "@/lib/view-tracking";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const link = await prisma.shareLink.findUnique({
    where: { token },
    select: {
      revokedAt: true,
      id: true,
      document: { select: { content: true, mimeType: true, storageKey: true } },
    },
  });
  if (!link || link.revokedAt) return new Response("Link unavailable", { status: 404 });

  const requestHeaders = await headers();
  const cookieStore = await cookies();
  const cookieName = `dr_view_${token}`;
  const existingSession = cookieStore.get(cookieName)?.value;
  const ipAddress = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = requestHeaders.get("user-agent");
  const clientSession = existingSession
    ?? requestHeaders.get("x-dealroom-session")
    ?? requestFingerprint(ipAddress, userAgent);
  await registerView({
    db: prisma,
    shareLinkId: link.id,
    clientSession,
    ipAddress,
    userAgent,
  });

  const filename = (link.document.storageKey.split("/").pop() ?? "document").replace(/["\\]/g, "_");
  const inline = new URL(request.url).searchParams.get("inline") === "1";
  const response = new Response(Buffer.from(link.document.content), {
    headers: {
      "Content-Type": link.document.mimeType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
  if (!existingSession) response.headers.append("Set-Cookie", `${cookieName}=${clientSession}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return response;
}