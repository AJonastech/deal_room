export type DashboardDocumentType =
  | "pitch_deck"
  | "financials"
  | "term_sheet"
  | "data_room";

export interface DashboardViewEvent {
  id: string;
  shareLinkId: string;
  openedAt: string;
  ipAddress: string;
  userAgent: string;
  sessionDuration: number | null;
  isBot: boolean;
}

export interface DashboardShareLink {
  id: string;
  documentId: string;
  token: string;
  createdAt: string;
  revokedAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  label: string;
  events: DashboardViewEvent[];
}

export interface DashboardDocument {
  id: string;
  name: string;
  uploadedAt: string;
  storageKey: string;
  size: string;
  type: DashboardDocumentType;
  viewCount: number;
  linkCount: number;
  lastViewedAt: string | null;
  shareLinks: DashboardShareLink[];
}

export interface DashboardActivity {
  id: string;
  documentName: string;
  documentType: DashboardDocumentType;
  linkLabel: string;
  openedAt: string;
  sessionDuration: number | null;
}

export interface DashboardData {
  documents: DashboardDocument[];
  recentActivity: DashboardActivity[];
}