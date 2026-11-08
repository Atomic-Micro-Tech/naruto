import { test } from "node:test";
import assert from "node:assert/strict";
import { api } from "../src/api.js";

test("OpenAPI nested login errors retain their code and show a credential error", async t => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({
    error: { code: "INVALID_CREDENTIALS", message: "invalid credentials", requestId: "test-request" },
  }), { status: 401 }));
  await assert.rejects(api("/auth/login", { method: "POST", body: {} }), e => {
    assert.equal(e.status, 401);
    assert.equal(e.code, "INVALID_CREDENTIALS");
    assert.equal(e.requestId, "test-request");
    assert.match(e.message, /Email atau kata sandi salah/);
    assert.doesNotMatch(e.message, /Layanan/);
    return true;
  });
});

test("non-auth API errors preserve the server message and genuine outages remain distinct", async t => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({
    error: { code: "ROOM_FULL", message: "room capacity reached" },
  }), { status: 409 }));
  await assert.rejects(api("/rooms/test/join", { method: "POST" }), { code: "ROOM_FULL", message: "room capacity reached", status: 409 });
  globalThis.fetch.mock.mockImplementation(async () => new Response(JSON.stringify({
    error: { code: "UNAVAILABLE", message: "service temporarily unavailable" },
  }), { status: 503 }));
  await assert.rejects(api("/auth/login", { method: "POST" }), e => e.status === 503 && /Layanan sementara/.test(e.message));
});
