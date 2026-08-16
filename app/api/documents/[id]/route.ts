import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await prisma.document.deleteMany({
    where: { id, ownerId: user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}