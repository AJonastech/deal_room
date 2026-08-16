import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> },
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, linkId } = await params;
  const link = await prisma.shareLink.findFirst({
    where: { id: linkId, document: { id, ownerId: user.id } },
    select: { id: true, revokedAt: true },
  });
  if (!link) return NextResponse.json({ error: "Share link not found." }, { status: 404 });
  if (link.revokedAt) return NextResponse.json({ revokedAt: link.revokedAt.toISOString() });

  const revoked = await prisma.shareLink.update({
    where: { id: link.id },
    data: { revokedAt: new Date() },
    select: { revokedAt: true },
  });
  return NextResponse.json({ revokedAt: revoked.revokedAt?.toISOString() ?? null });
}