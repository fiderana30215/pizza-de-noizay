import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

/**
 * Client Supabase côté serveur uniquement.
 * La clé service role ne doit jamais être exposée au navigateur : toutes les
 * lectures/écritures passent par les server functions de ce projet.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL");
  const serviceRoleKey =
    readEnv("SUPABASE_SERVICE_ROLE_KEY") ??
    readEnv("SUPABASE_SERVICE_KEY") ??
    readEnv("SUPABASE_SECRET_KEY");

  if (!url || !serviceRoleKey) return null;

  if (!adminClient) {
    adminClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return adminClient;
}

export function requireCaisseCode(code: string | undefined): void {
  const expected = readEnv("CAISSE_CODE") ?? "noisette";
  if (!code || code.trim() !== expected) {
    throw new Error("Code d'accès invalide.");
  }
}
