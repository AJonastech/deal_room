import Image from "next/image";
import type { DashboardDocumentType } from "@/lib/dashboard-types";
import { cn } from "@/lib/utils";

const ICON_BY_TYPE: Record<DashboardDocumentType, string> = {
  pitch_deck: "/document_icons/pdf.png",
  financials: "/document_icons/xls.png",
  term_sheet: "/document_icons/doc.png",
  data_room: "/document_icons/doc.png",
};

const ICON_BY_EXTENSION: Record<string, string> = {
  pdf: "/document_icons/pdf.png",
  doc: "/document_icons/doc.png",
  docx: "/document_icons/doc.png",
  xls: "/document_icons/xls.png",
  xlsx: "/document_icons/xls.png",
  zip: "/document_icons/doc.png",
};

function iconForFilename(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  return ICON_BY_EXTENSION[extension] ?? ICON_BY_TYPE.data_room;
}

interface DocumentIconProps {
  alt?: string;
  className?: string;
  filename?: string;
  size?: number;
  type?: DashboardDocumentType;
}

export function DocumentIcon({
  alt = "",
  className,
  filename,
  size = 32,
  type,
}: DocumentIconProps) {
  const src = filename ? iconForFilename(filename) : ICON_BY_TYPE[type ?? "data_room"];

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}