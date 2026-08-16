import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  if (!label || label.length > 100) {
    return NextResponse.json(
      { error: "Recipient label must be between 1 and 100 characters." },
      { status: 400 },
    );
  }

  const document = await prisma.document.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true },
  });
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const link = await prisma.shareLink.create({
    data: {
      documentId: document.id,
      label,
      token: `dr_${randomBytes(12).toString("base64url")}`,
    },
    select: { token: true },
  });

  return NextResponse.json({ token: link.token }, { status: 201 });
}