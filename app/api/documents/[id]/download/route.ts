import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function downloadFilename(storageKey: string) {
  return storageKey.split("/").pop() ?? "document";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const document = await prisma.document.findFirst({
    where: { id, ownerId: user.id },
    select: { content: true, mimeType: true, storageKey: true },
  });
  if (!document) return new Response("Document not found", { status: 404 });

  const filename = downloadFilename(document.storageKey).replace(/["\\]/g, "_");
  return new Response(Buffer.from(document.content), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}