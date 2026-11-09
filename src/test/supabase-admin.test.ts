import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getSupabaseAdmin", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-role-key");
    vi.stubGlobal("WebSocket", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("crée le client REST sans WebSocket natif (Node.js < 22)", async () => {
    const { getSupabaseAdmin } = await import("../lib/supabase-admin.server");

    const client = getSupabaseAdmin();

    expect(client).not.toBeNull();
    expect(client?.getChannels()).toHaveLength(0);
  });
});
