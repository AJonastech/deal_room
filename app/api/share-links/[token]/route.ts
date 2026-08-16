import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { newClientSession } from "@/lib/view-tracking";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const link = await prisma.shareLink.findUnique({
    where: { token },
    select: {
      id: true,
      label: true,
      revokedAt: true,
      document: { select: { id: true, name: true, type: true, mimeType: true } },
    },
  });
  if (!link || link.revokedAt) {
    return NextResponse.json({ error: "Link unavailable." }, { status: 404 });
  }

  const requestHeaders = await headers();
  const cookieStore = await cookies();
  const cookieName = `dr_view_${token}`;
  let sessionKey = cookieStore.get(cookieName)?.value ?? requestHeaders.get("x-dealroom-session");
  if (!sessionKey) {
    sessionKey = newClientSession();
  }

  const response = NextResponse.json({
    label: link.label,
    documentId: link.document.id,
    documentName: link.document.name,
    documentType: link.document.type,
    mimeType: link.document.mimeType,
  });
  if (!cookieStore.get(cookieName)) {
    response.cookies.set(cookieName, sessionKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return response;
}