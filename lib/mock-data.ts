// ─── Mock data for UI demonstration ──────────────────────────────────────

export interface Document {
  id: string;
  name: string;
  uploadedAt: string;
  storageKey: string;
  size: string;
  type: "pitch_deck" | "financials" | "term_sheet" | "data_room";
  viewCount: number;
  linkCount: number;
  lastViewedAt: string | null;
}

export interface ShareLink {
  id: string;
  documentId: string;
  token: string;
  createdAt: string;
  revokedAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  label: string;
}

export interface ViewEvent {
  id: string;
  shareLinkId: string;
  openedAt: string;
  ipAddress: string;
  userAgent: string;
  sessionDuration: number | null; // seconds
  isBot: boolean;
}

export const mockDocuments: Document[] = [
  {
    id: "doc_01",
    name: "Series A Pitch Deck",
    uploadedAt: "2025-08-10T09:30:00Z",
    storageKey: "uploads/doc_01_pitch_deck_v3.pdf",
    size: "4.2 MB",
    type: "pitch_deck",
    viewCount: 24,
    linkCount: 3,
    lastViewedAt: "2025-08-14T15:22:00Z",
  },
  {
    id: "doc_02",
    name: "Financial Model — FY2025",
    uploadedAt: "2025-08-08T14:10:00Z",
    storageKey: "uploads/doc_02_financial_model.xlsx",
    size: "1.8 MB",
    type: "financials",
    viewCount: 11,
    linkCount: 2,
    lastViewedAt: "2025-08-13T10:45:00Z",
  },
  {
    id: "doc_03",
    name: "Term Sheet Draft v2",
    uploadedAt: "2025-08-05T11:00:00Z",
    storageKey: "uploads/doc_03_term_sheet.pdf",
    size: "0.3 MB",
    type: "term_sheet",
    viewCount: 6,
    linkCount: 1,
    lastViewedAt: "2025-08-12T08:20:00Z",
  },
  {
    id: "doc_04",
    name: "Data Room — Q2 2025",
    uploadedAt: "2025-08-01T16:00:00Z",
    storageKey: "uploads/doc_04_data_room.zip",
    size: "18.4 MB",
    type: "data_room",
    viewCount: 3,
    linkCount: 1,
    lastViewedAt: "2025-08-09T17:05:00Z",
  },
];

export const mockShareLinks: Record<string, ShareLink[]> = {
  doc_01: [
    {
      id: "lnk_01",
      documentId: "doc_01",
      token: "dr_Ks8xQp2mNvYw4jZR",
      createdAt: "2025-08-10T10:00:00Z",
      revokedAt: null,
      viewCount: 14,
      lastViewedAt: "2025-08-14T15:22:00Z",
      label: "Sequoia Capital",
    },
    {
      id: "lnk_02",
      documentId: "doc_01",
      token: "dr_Tz3bWe7nFpXc1gLM",
      createdAt: "2025-08-11T09:00:00Z",
      revokedAt: null,
      viewCount: 7,
      lastViewedAt: "2025-08-13T14:10:00Z",
      label: "a16z — General",
    },
    {
      id: "lnk_03",
      documentId: "doc_01",
      token: "dr_Yh6dAi9oGqUr5kNP",
      createdAt: "2025-08-09T08:00:00Z",
      revokedAt: "2025-08-10T08:00:00Z",
      viewCount: 3,
      lastViewedAt: "2025-08-09T17:30:00Z",
      label: "Wrong Recipient (revoked)",
    },
  ],
  doc_02: [
    {
      id: "lnk_04",
      documentId: "doc_02",
      token: "dr_Rn4cVf8mJsXb2wEQ",
      createdAt: "2025-08-08T15:00:00Z",
      revokedAt: null,
      viewCount: 8,
      lastViewedAt: "2025-08-13T10:45:00Z",
      label: "Benchmark",
    },
    {
      id: "lnk_05",
      documentId: "doc_02",
      token: "dr_Lp7eHo3nMtWz6xDK",
      createdAt: "2025-08-09T11:00:00Z",
      revokedAt: null,
      viewCount: 3,
      lastViewedAt: "2025-08-12T09:00:00Z",
      label: "Lightspeed",
    },
  ],
  doc_03: [
    {
      id: "lnk_06",
      documentId: "doc_03",
      token: "dr_Qg5iSj1rKuPd4vBN",
      createdAt: "2025-08-05T12:00:00Z",
      revokedAt: null,
      viewCount: 6,
      lastViewedAt: "2025-08-12T08:20:00Z",
      label: "Legal Review",
    },
  ],
  doc_04: [
    {
      id: "lnk_07",
      documentId: "doc_04",
      token: "dr_Wm2bXk8qFoLc3nRV",
      createdAt: "2025-08-01T17:00:00Z",
      revokedAt: null,
      viewCount: 3,
      lastViewedAt: "2025-08-09T17:05:00Z",
      label: "GV Portfolio Team",
    },
  ],
};

export const mockViewEvents: Record<string, ViewEvent[]> = {
  lnk_01: [
    { id: "evt_001", shareLinkId: "lnk_01", openedAt: "2025-08-14T15:22:00Z", ipAddress: "104.18.x.x", userAgent: "Chrome/126 macOS", sessionDuration: 312, isBot: false },
    { id: "evt_002", shareLinkId: "lnk_01", openedAt: "2025-08-13T11:05:00Z", ipAddress: "142.250.x.x", userAgent: "Safari/17 iPhone", sessionDuration: 87, isBot: false },
    { id: "evt_003", shareLinkId: "lnk_01", openedAt: "2025-08-12T09:40:00Z", ipAddress: "104.18.x.x", userAgent: "Chrome/126 macOS", sessionDuration: 540, isBot: false },
    { id: "evt_004", shareLinkId: "lnk_01", openedAt: "2025-08-11T16:30:00Z", ipAddress: "172.68.x.x", userAgent: "Firefox/127 Windows", sessionDuration: 210, isBot: false },
    { id: "evt_005", shareLinkId: "lnk_01", openedAt: "2025-08-10T10:01:00Z", ipAddress: "157.90.x.x", userAgent: "Slackbot-LinkExpanding 1.0", sessionDuration: null, isBot: true },
  ],
};

export const mockViewStats = [
  { date: "Aug 1", views: 1 },
  { date: "Aug 3", views: 0 },
  { date: "Aug 5", views: 2 },
  { date: "Aug 7", views: 4 },
  { date: "Aug 9", views: 3 },
  { date: "Aug 11", views: 7 },
  { date: "Aug 13", views: 5 },
  { date: "Aug 14", views: 3 },
];

export const founderMock = {
  name: "Jonas Agujonas",
  company: "DealRoom",
  email: "jonas@dealroom.co",
  avatarInitials: "JA",
};
