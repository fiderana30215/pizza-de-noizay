import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type CreateClientOptions = NonNullable<Parameters<typeof createClient>[2]>;
type RealtimeTransport = NonNullable<NonNullable<CreateClientOptions["realtime"]>["transport"]>;

/**
 * `@supabase/supabase-js` instancie toujours son client Realtime, même quand
 * seule l'API REST est utilisée. Sur les runtimes sans `WebSocket` global
 * (Node.js < 22, Cloudflare Workers), ce constructeur lève :
 * « Node.js detected but native WebSocket not found ».
 *
 * Le serveur n'utilise que PostgREST : un transport factice suffit à satisfaire
 * le constructeur et n'est jamais utilisé pour ouvrir une connexion.
 */
const SERVER_REALTIME_TRANSPORT = class {
  constructor() {
    throw new Error("Realtime n'est pas disponible dans cet environnement serveur.");
  }
} as unknown as RealtimeTransport;

function serverRealtimeTransport(): RealtimeTransport | undefined {
  if (typeof globalThis.WebSocket !== "undefined") return undefined;
  return SERVER_REALTIME_TRANSPORT;
}

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
    const transport = serverRealtimeTransport();
    adminClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      ...(transport ? { realtime: { transport } } : {}),
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
