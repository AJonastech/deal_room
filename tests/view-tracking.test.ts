import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isKnownBot,
  registerView,
  requestFingerprint,
  VIEW_SESSION_WINDOW_MS,
  viewSessionKey,
} from "../lib/view-tracking.ts";
import { hashPassword, verifyPassword } from "../lib/password.ts";

describe("passwords", () => {
  it("verifies the original password and rejects a different password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    assert.equal(await verifyPassword("correct horse battery staple", hash), true);
    assert.equal(await verifyPassword("wrong password", hash), false);
    assert.equal(hash.includes("correct horse battery staple"), false);
  });

  it("rejects malformed stored hashes", async () => {
    assert.equal(await verifyPassword("password", "not-a-valid-hash"), false);
  });
});

describe("view tracking", () => {
  it("recognizes common preview crawlers without classifying a browser as a bot", () => {
    assert.equal(isKnownBot("Slackbot-LinkExpanding 1.0"), true);
    assert.equal(isKnownBot("WhatsApp/2.24"), true);
    assert.equal(isKnownBot("facebookexternalhit/1.1"), true);
    assert.equal(isKnownBot("Mozilla/5.0 Chrome/124 Safari/537.36"), false);
  });

  it("does not persist an event for a known bot", async () => {
    let writes = 0;
    const db = { viewEvent: { create: async () => { writes += 1; return {}; } } };
    const result = await registerView({
      db: db as never,
      shareLinkId: "link-1",
      clientSession: "session-1",
      ipAddress: null,
      userAgent: "Slackbot-LinkExpanding 1.0",
    });

    assert.deepEqual(result, { counted: false, reason: "bot" });
    assert.equal(writes, 0);
  });

  it("deduplicates inside a window and starts a new session at the boundary", () => {
    const boundary = new Date(VIEW_SESSION_WINDOW_MS);
    assert.equal(viewSessionKey("reader", new Date(boundary.getTime() - 1)), "reader:0");
    assert.equal(viewSessionKey("reader", boundary), "reader:1");
  });

  it("uses a server timestamp when none is supplied", async () => {
    let persistedAt: Date | undefined;
    const before = Date.now();
    const db = {
      viewEvent: {
        create: async ({ data }: { data: { openedAt: Date } }) => {
          persistedAt = data.openedAt;
          return {};
        },
      },
    };

    await registerView({
      db: db as never,
      shareLinkId: "link-1",
      clientSession: "session-1",
      ipAddress: null,
      userAgent: "Mozilla/5.0",
    });

    assert.ok(persistedAt);
    assert.ok(persistedAt.getTime() >= before && persistedAt.getTime() <= Date.now());
  });

  it("treats a unique-constraint race as a duplicate session", async () => {
    const db = { viewEvent: { create: async () => { throw { code: "P2002" }; } } };
    const result = await registerView({
      db: db as never,
      shareLinkId: "link-1",
      clientSession: "session-1",
      ipAddress: null,
      userAgent: "Mozilla/5.0",
    });
    assert.deepEqual(result, { counted: false, reason: "duplicate-session" });
  });

  it("does not swallow database failures unrelated to deduplication", async () => {
    const failure = Object.assign(new Error("database unavailable"), { code: "P1001" });
    const db = { viewEvent: { create: async () => { throw failure; } } };
    await assert.rejects(registerView({
      db: db as never,
      shareLinkId: "link-1",
      clientSession: "session-1",
      ipAddress: null,
      userAgent: "Mozilla/5.0",
    }), failure);
  });

  it("creates stable but distinct fallback fingerprints", () => {
    const first = requestFingerprint("203.0.113.1", "Browser A");
    assert.equal(first, requestFingerprint("203.0.113.1", "Browser A"));
    assert.notEqual(first, requestFingerprint("203.0.113.1", "Browser B"));
    assert.notEqual(first, requestFingerprint("203.0.113.2", "Browser A"));
    assert.equal(first.includes("203.0.113.1"), false);
  });
});