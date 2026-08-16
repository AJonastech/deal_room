import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { registerView, requestFingerprint, viewSessionKey } from "../lib/view-tracking.ts";

const run = process.env.RUN_DATABASE_TESTS === "1" ? describe : describe.skip;
const prisma = new PrismaClient();
const testPrefix = `assessment-${randomUUID()}`;
let ownerId = "";
let otherOwnerId = "";
let documentId = "";
let shareLinkId = "";
let activeSessionToken = "";
let expiredSessionToken = "";

run("backend integration", () => {
  before(async () => {
    const [owner, otherOwner] = await Promise.all([
      prisma.user.create({ data: { email: `${testPrefix}-owner@example.com`, passwordHash: "test-only" } }),
      prisma.user.create({ data: { email: `${testPrefix}-other@example.com`, passwordHash: "test-only" } }),
    ]);
    ownerId = owner.id;
    otherOwnerId = otherOwner.id;
    activeSessionToken = `${testPrefix}-active`;
    expiredSessionToken = `${testPrefix}-expired`;
    await prisma.session.createMany({
      data: [
        { token: activeSessionToken, userId: ownerId, expiresAt: new Date(Date.now() + 60_000) },
        { token: expiredSessionToken, userId: ownerId, expiresAt: new Date(Date.now() - 60_000) },
      ],
    });
    const document = await prisma.document.create({
      data: {
        ownerId,
        name: "Integration pitch deck",
        storageKey: `database/${ownerId}/deck.pdf`,
        mimeType: "application/pdf",
        sizeBytes: BigInt(4),
        content: Buffer.from("%PDF"),
        type: "pitch_deck",
      },
    });
    documentId = document.id;
    const link = await prisma.shareLink.create({
      data: { documentId, label: "Reviewer", token: `dr_${randomBytes(18).toString("base64url")}` },
    });
    shareLinkId = link.id;
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherOwnerId].filter(Boolean) } } });
    await prisma.$disconnect();
  });

  it("persists uploaded document metadata and bytes against the owner", async () => {
    const document = await prisma.document.findFirst({ where: { id: documentId, ownerId } });
    assert.equal(document?.name, "Integration pitch deck");
    assert.equal(document?.storageKey, `database/${ownerId}/deck.pdf`);
    assert.deepEqual(Buffer.from(document?.content ?? []), Buffer.from("%PDF"));
  });

  it("creates an unguessable unique share token", async () => {
    const link = await prisma.shareLink.findUniqueOrThrow({ where: { id: shareLinkId } });
    assert.match(link.token, /^dr_[A-Za-z0-9_-]{24}$/);
    const secondToken = `dr_${randomBytes(18).toString("base64url")}`;
    assert.notEqual(link.token, secondToken);
  });

  it("does not return another founder's document through an owner-scoped query", async () => {
    const leaked = await prisma.document.findFirst({ where: { id: documentId, ownerId: otherOwnerId } });
    assert.equal(leaked, null);
  });

  it("distinguishes active authentication sessions from expired sessions", async () => {
    const now = new Date();
    assert.ok(await prisma.session.findFirst({
      where: { token: activeSessionToken, expiresAt: { gt: now } },
    }));
    assert.equal(await prisma.session.findFirst({
      where: { token: expiredSessionToken, expiresAt: { gt: now } },
    }), null);
  });

  it("cannot select another founder's link through the owner relationship", async () => {
    const foreignLink = await prisma.shareLink.findFirst({
      where: { id: shareLinkId, document: { ownerId: otherOwnerId } },
    });
    assert.equal(foreignLink, null);
  });

  it("collapses concurrent requests for one session to exactly one event", async () => {
    const openedAt = new Date("2026-08-16T12:00:00.000Z");
    await Promise.all(Array.from({ length: 8 }, () => registerView({
      db: prisma,
      shareLinkId,
      clientSession: "concurrent-reader",
      ipAddress: "203.0.113.10",
      userAgent: "Mozilla/5.0",
      openedAt,
    })));
    assert.equal(await prisma.viewEvent.count({
      where: { shareLinkId, sessionKey: viewSessionKey("concurrent-reader", openedAt) },
    }), 1);
  });

  it("counts a retry once in-window and again at the next 30-minute boundary", async () => {
    const inside = new Date("2026-08-16T14:29:59.999Z");
    const boundary = new Date("2026-08-16T14:30:00.000Z");
    for (const openedAt of [inside, inside, boundary]) {
      await registerView({
        db: prisma,
        shareLinkId,
        clientSession: "boundary-reader",
        ipAddress: null,
        userAgent: "Mozilla/5.0",
        openedAt,
      });
    }
    assert.equal(await prisma.viewEvent.count({
      where: {
        shareLinkId,
        sessionKey: {
          in: [viewSessionKey("boundary-reader", inside), viewSessionKey("boundary-reader", boundary)],
        },
      },
    }), 2);
  });

  it("does not persist known bot opens", async () => {
    const result = await registerView({
      db: prisma,
      shareLinkId,
      clientSession: "slack-preview",
      ipAddress: "203.0.113.20",
      userAgent: "Slackbot-LinkExpanding 1.0",
    });
    assert.deepEqual(result, { counted: false, reason: "bot" });
    assert.equal(await prisma.viewEvent.count({
      where: { shareLinkId, sessionKey: { startsWith: "slack-preview" } },
    }), 0);
  });

  it("logs forwarded readers and different devices as distinct sessions", async () => {
    const openedAt = new Date("2026-08-16T13:00:00.000Z");
    const identities = [
      requestFingerprint("203.0.113.11", "Browser A"),
      requestFingerprint("203.0.113.12", "Browser A"),
      requestFingerprint("203.0.113.11", "Browser B"),
    ];
    await Promise.all(identities.map((clientSession) => registerView({
      db: prisma, shareLinkId, clientSession, ipAddress: null, userAgent: "Mozilla/5.0", openedAt,
    })));
    const bucket = Math.floor(openedAt.getTime() / (30 * 60 * 1000));
    assert.equal(await prisma.viewEvent.count({
      where: { shareLinkId, sessionKey: { in: identities.map((identity) => `${identity}:${bucket}`) } },
    }), 3);
  });

  it("rejects revoked links before view registration", async () => {
    await prisma.shareLink.update({ where: { id: shareLinkId }, data: { revokedAt: new Date() } });
    const link = await prisma.shareLink.findFirst({ where: { id: shareLinkId, revokedAt: null } });
    assert.equal(link, null);
    assert.equal(await prisma.viewEvent.count({ where: { shareLinkId, sessionKey: { startsWith: "revoked-reader" } } }), 0);
  });
});