import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type {
  DashboardActivity,
  DashboardData,
  DashboardDocument,
  DashboardDocumentType,
} from "@/lib/dashboard-types";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const TYPE_BY_EXTENSION: Record<string, DashboardDocumentType> = {
  pdf: "pitch_deck",
  doc: "term_sheet",
  docx: "term_sheet",
  xls: "financials",
  xlsx: "financials",
  zip: "data_room",
};

function formatBytes(bytes: bigint) {
  const value = Number(bytes);
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function extensionOf(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await prisma.document.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      shareLinks: {
        orderBy: { createdAt: "desc" },
        include: { viewEvents: { orderBy: { openedAt: "desc" } } },
      },
    },
  });

  const recentActivity: DashboardActivity[] = [];
  const documents: DashboardDocument[] = records.map((document) => {
    const shareLinks = document.shareLinks.map((link) => {
      const genuineEvents = link.viewEvents.filter((event) => !event.isBot);
      genuineEvents.forEach((event) => {
        recentActivity.push({
          id: event.id,
          documentName: document.name,
          documentType: document.type,
          linkLabel: link.label,
          openedAt: event.openedAt.toISOString(),
          sessionDuration: event.sessionDuration,
        });
      });

      return {
        id: link.id,
        documentId: document.id,
        token: link.token,
        createdAt: link.createdAt.toISOString(),
        revokedAt: link.revokedAt?.toISOString() ?? null,
        viewCount: genuineEvents.length,
        lastViewedAt: genuineEvents[0]?.openedAt.toISOString() ?? null,
        label: link.label,
        events: link.viewEvents.map((event) => ({
          id: event.id,
          shareLinkId: link.id,
          openedAt: event.openedAt.toISOString(),
          ipAddress: event.ipAddress ?? "Unknown IP",
          userAgent: event.userAgent ?? "Unknown device",
          sessionDuration: event.sessionDuration,
          isBot: event.isBot,
        })),
      };
    });
    const genuineEvents = shareLinks.flatMap((link) => link.events).filter((event) => !event.isBot);
    const lastViewedAt = genuineEvents.reduce<string | null>(
      (latest, event) => (!latest || event.openedAt > latest ? event.openedAt : latest),
      null,
    );

    return {
      id: document.id,
      name: document.name,
      uploadedAt: document.createdAt.toISOString(),
      storageKey: document.storageKey,
      size: formatBytes(document.sizeBytes),
      type: document.type,
      viewCount: genuineEvents.length,
      linkCount: shareLinks.filter((link) => !link.revokedAt).length,
      lastViewedAt,
      shareLinks,
    };
  });

  recentActivity.sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  const data: DashboardData = { documents, recentActivity: recentActivity.slice(0, 8) };
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const requestedName = formData.get("name");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }
  const extension = extensionOf(file.name);
  const type = TYPE_BY_EXTENSION[extension];
  if (!type) {
    return NextResponse.json({ error: "Only PDF, DOC, DOCX, XLS, XLSX, and ZIP files are supported." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "The file must be between 1 byte and 50 MB." }, { status: 400 });
  }

  const name = typeof requestedName === "string" ? requestedName.trim() : "";
  if (!name || name.length > 160) {
    return NextResponse.json({ error: "Document name must be between 1 and 160 characters." }, { status: 400 });
  }

  const id = randomUUID();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180);
  const content = Buffer.from(await file.arrayBuffer());
  await prisma.document.create({
    data: {
      id,
      ownerId: user.id,
      name,
      storageKey: `database/${user.id}/${id}/${safeFilename}`,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: BigInt(file.size),
      content,
      type,
    },
  });

  return NextResponse.json({ id }, { status: 201 });
}