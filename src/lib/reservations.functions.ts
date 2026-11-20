import { createServerFn } from "@tanstack/react-start";

import {
  buildReservation,
  fromRow,
  MAX_RESERVATIONS_PER_PICKUP_SLOT,
  ReservationError,
  toRow,
  type NewReservationInput,
  type Reservation,
  type ReservationRow,
  type ReservationStatus,
} from "./reservation-core";

const VALID_STATUSES: ReservationStatus[] = ["pending", "paid", "picked_up", "cancelled"];
const HELLOASSO_ORGANIZATION_SLUG = "association-des-parents-d-eleves-de-noizay";

type HelloAssoTokenResponse = {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
};

type HelloAssoCheckoutResponse = {
  id?: unknown;
  redirectUrl?: unknown;
};

type HelloAssoCheckoutVerification = {
  metadata?: { reservationId?: unknown };
  order?: {
    amount?: { total?: unknown };
    payments?: Array<{ state?: unknown; amount?: unknown }>;
  };
};

let helloAssoAccessToken = "";
let helloAssoRefreshToken = "";
let helloAssoTokenExpiresAt = 0;
let helloAssoTokenRequest: Promise<string> | null = null;

async function getAdmin() {
  const { getSupabaseAdmin } = await import("./supabase-admin.server");
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error(
      "Supabase n'est pas configuré sur le serveur. Ajoutez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return supabase;
}

async function checkCode(code: string) {
  const { requireCaisseCode } = await import("./supabase-admin.server");
  requireCaisseCode(code);
}

export const createReservationFn = createServerFn({ method: "POST" })
  .validator((data: NewReservationInput) => data)
  .handler(async ({ data }) => {
    // On revalide côté serveur : les données venant du navigateur ne sont jamais fiables.
    const reservation = buildReservation(data);
    const supabase = await getAdmin();

    const { count, error: countError } = await supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("pickup_slot", reservation.pickupSlot)
      .neq("status", "cancelled");

    if (countError) {
      throw new Error(`Impossible de vérifier le créneau de retrait : ${countError.message}`);
    }
    if (count === null) {
      throw new Error("Impossible de vérifier le nombre de commandes sur ce créneau.");
    }
    if (count >= MAX_RESERVATIONS_PER_PICKUP_SLOT) {
      throw new ReservationError(
        "Ce créneau de retrait est complet (4 commandes maximum). Choisissez-en un autre.",
      );
    }

    const { error } = await supabase.from("reservations").insert(toRow(reservation));

    if (error) {
      throw new Error(`Impossible d'enregistrer la réservation : ${error.message}`);
    }

    const { sendReservationEmail } = await import("./email.server");
    const emailSent = await sendReservationEmail(reservation, "confirmation");

    return { reservation, emailSent };
  });

async function getHelloAssoAccessToken(): Promise<string> {
  if (helloAssoAccessToken && helloAssoTokenExpiresAt > Date.now() + 60_000) {
    return helloAssoAccessToken;
  }
  if (helloAssoTokenRequest) return helloAssoTokenRequest;

  const clientId = process.env["HELLOASSO_CLIENT_ID"]?.trim();
  const clientSecret = process.env["HELLOASSO_CLIENT_SECRET"]?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "HelloAsso n'est pas configuré. Ajoutez HELLOASSO_CLIENT_ID et HELLOASSO_CLIENT_SECRET côté serveur.",
    );
  }

  helloAssoTokenRequest = (async () => {
    const body = new URLSearchParams(
      helloAssoRefreshToken
        ? { grant_type: "refresh_token", refresh_token: helloAssoRefreshToken }
        : {
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
          },
    );
    const response = await fetch("https://api.helloasso.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      throw new Error(`L'authentification HelloAsso a échoué (HTTP ${response.status}).`);
    }

    const result = (await response.json()) as HelloAssoTokenResponse;
    if (
      typeof result.access_token !== "string" ||
      typeof result.refresh_token !== "string" ||
      typeof result.expires_in !== "number"
    ) {
      throw new Error("La réponse d'authentification HelloAsso est invalide.");
    }

    helloAssoAccessToken = result.access_token;
    helloAssoRefreshToken = result.refresh_token;
    helloAssoTokenExpiresAt = Date.now() + result.expires_in * 1000;
    return helloAssoAccessToken;
  })();

  try {
    return await helloAssoTokenRequest;
  } finally {
    helloAssoTokenRequest = null;
  }
}

function getPublicSiteUrl(): URL {
  const value = process.env["PUBLIC_SITE_URL"]?.trim();
  if (!value) {
    throw new Error("Ajoutez PUBLIC_SITE_URL avec l'adresse HTTPS publique du site.");
  }

  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error("PUBLIC_SITE_URL doit utiliser HTTPS pour HelloAsso.");
  }
  return url;
}

export async function createHelloAssoCheckoutIntentRequest(input: {
  reservation: Reservation;
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  const accessToken = await getHelloAssoAccessToken();
  const siteUrl = getPublicSiteUrl();
  const returnUrl = new URL("/reserver?payment=return", siteUrl);
  returnUrl.searchParams.set("reservationId", input.reservation.id);
  const backUrl = new URL("/reserver?payment=cancelled", siteUrl);
  backUrl.searchParams.set("reservationId", input.reservation.id);
  const errorUrl = new URL("/reserver?payment=error", siteUrl);
  errorUrl.searchParams.set("reservationId", input.reservation.id);
  const response = await fetch(
    `https://api.helloasso.com/v5/organizations/${HELLOASSO_ORGANIZATION_SLUG}/checkout-intents`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        totalAmount: input.reservation.totalCents,
        initialAmount: input.reservation.totalCents,
        itemName: `Commande pizzas ${input.reservation.reference}`,
        backUrl: backUrl.toString(),
        errorUrl: errorUrl.toString(),
        returnUrl: returnUrl.toString(),
        containsDonation: false,
        payer: { email: input.reservation.email },
        metadata: {
          reservationId: input.reservation.id,
          reservationReference: input.reservation.reference,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`La création du paiement HelloAsso a échoué (HTTP ${response.status}).`);
  }

  const result = (await response.json()) as HelloAssoCheckoutResponse;
  if (typeof result.id !== "number" || typeof result.redirectUrl !== "string") {
    throw new Error("HelloAsso n'a pas renvoyé d'URL de paiement valide.");
  }
  return { checkoutUrl: result.redirectUrl, sessionId: String(result.id) };
}

export const createHelloAssoCheckoutSessionFn = createServerFn({ method: "POST" })
  .validator((data: { reservationId: string }) => {
    if (!data?.reservationId || typeof data.reservationId !== "string") {
      throw new Error("Réservation invalide pour le paiement.");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const supabase = await getAdmin();
    const { data: row, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", data.reservationId)
      .single();

    if (error) {
      throw new Error(`Réservation introuvable pour le paiement : ${error.message}`);
    }
    const reservation = fromRow(row as ReservationRow);
    if (reservation.status !== "pending") {
      throw new Error("Cette réservation n'est plus en attente de paiement.");
    }
    return createHelloAssoCheckoutIntentRequest({ reservation });
  });

export const verifyHelloAssoPaymentFn = createServerFn({ method: "POST" })
  .validator((data: { reservationId: string; checkoutIntentId: string }) => {
    if (
      !data?.reservationId ||
      typeof data.reservationId !== "string" ||
      !/^\d+$/.test(data.checkoutIntentId)
    ) {
      throw new Error("Données de vérification HelloAsso invalides.");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const reservationAdmin = await getAdmin();
    const { data: row, error: readError } = await reservationAdmin
      .from("reservations")
      .select("*")
      .eq("id", data.reservationId)
      .single();
    if (readError) {
      throw new Error(`Réservation introuvable : ${readError.message}`);
    }
    const currentReservation = fromRow(row as ReservationRow);

    const accessToken = await getHelloAssoAccessToken();
    const response = await fetch(
      `https://api.helloasso.com/v5/organizations/${HELLOASSO_ORGANIZATION_SLUG}/checkout-intents/${data.checkoutIntentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) {
      throw new Error(`La vérification HelloAsso a échoué (HTTP ${response.status}).`);
    }

    const checkout = (await response.json()) as HelloAssoCheckoutVerification;
    const order = checkout.order;
    const paidAmount = typeof order?.amount?.total === "number" ? order.amount.total : Number.NaN;
    const authorizedPayments =
      order?.payments?.filter(
        (payment) => payment.state === "Authorized" && typeof payment.amount === "number",
      ) ?? [];
    const authorizedAmount = authorizedPayments.reduce(
      (total, payment) => total + (payment.amount as number),
      0,
    );

    if (
      checkout.metadata?.reservationId !== currentReservation.id ||
      paidAmount !== currentReservation.totalCents ||
      authorizedAmount < currentReservation.totalCents
    ) {
      throw new Error("HelloAsso ne confirme pas le paiement de cette réservation.");
    }

    if (currentReservation.status === "paid") {
      return { reservation: currentReservation, emailSent: null };
    }
    if (currentReservation.status !== "pending") {
      throw new Error("Cette réservation n'est plus en attente de paiement.");
    }

    const { data: updatedRow, error: updateError } = await reservationAdmin
      .from("reservations")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("id", currentReservation.id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();
    if (updateError) {
      throw new Error(`Impossible de confirmer la réservation : ${updateError.message}`);
    }
    if (!updatedRow) {
      const { data: latestRow, error: latestError } = await reservationAdmin
        .from("reservations")
        .select("*")
        .eq("id", currentReservation.id)
        .single();
      if (latestError) {
        throw new Error(`Impossible de relire la réservation : ${latestError.message}`);
      }
      const latestReservation = fromRow(latestRow as ReservationRow);
      if (latestReservation.status === "paid") {
        return { reservation: latestReservation, emailSent: null };
      }
      throw new Error(
        "Le statut de cette réservation a changé pendant la vérification du paiement.",
      );
    }

    const reservation = fromRow(updatedRow as ReservationRow);
    const { sendReservationEmail } = await import("./email.server");
    const emailSent = await sendReservationEmail(reservation, "paid");
    return { reservation, emailSent };
  });

const EMAIL_KINDS = ["confirmation", "paid", "picked_up"] as const;
type EmailKind = (typeof EMAIL_KINDS)[number];

type SendReservationEmailInput = {
  reservation: Reservation;
  kind: EmailKind;
};

/**
 * Envoi d'un e-mail lié à une réservation pour le mode démo local, où la
 * réservation n'est pas enregistrée côté serveur. L'envoi est ignoré si aucun
 * transport d'e-mail n'est configuré.
 */
export const sendReservationEmailFn = createServerFn({ method: "POST" })
  .validator((data: SendReservationEmailInput) => {
    const reservation = data?.reservation;
    if (
      !reservation ||
      typeof reservation.email !== "string" ||
      !reservation.email.includes("@") ||
      !Array.isArray(reservation.items) ||
      typeof reservation.reference !== "string" ||
      !EMAIL_KINDS.includes(data.kind)
    ) {
      throw new Error("Données d'e-mail invalides.");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { sendReservationEmail } = await import("./email.server");
    return sendReservationEmail(data.reservation, data.kind);
  });

export const verifyCaisseCodeFn = createServerFn({ method: "POST" })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    await checkCode(data.code);
    return true;
  });

export const listReservationsFn = createServerFn({ method: "POST" })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    await checkCode(data.code);
    const supabase = await getAdmin();

    const { data: rows, error } = await supabase
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Impossible de charger les réservations : ${error.message}`);
    }

    return ((rows ?? []) as ReservationRow[]).map(fromRow);
  });

export const updateReservationStatusFn = createServerFn({ method: "POST" })
  .validator((data: { code: string; id: string; status: ReservationStatus }) => data)
  .handler(async ({ data }) => {
    await checkCode(data.code);

    if (!VALID_STATUSES.includes(data.status)) {
      throw new Error("Statut de réservation invalide.");
    }

    const supabase = await getAdmin();

    const { data: current, error: readError } = await supabase
      .from("reservations")
      .select("status")
      .eq("id", data.id)
      .single();

    if (readError) {
      throw new Error(`Réservation introuvable : ${readError.message}`);
    }

    const { data: row, error } = await supabase
      .from("reservations")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Impossible de mettre à jour la réservation : ${error.message}`);
    }

    const reservation = fromRow(row as ReservationRow);
    const previousStatus = (current as { status: ReservationStatus }).status;

    // On prévient le client uniquement lors d'un vrai passage à « payé » ou
    // « récupéré », pas si l'admin réenregistre le même statut.
    let emailSent: boolean | null = null;
    if (previousStatus !== data.status && (data.status === "paid" || data.status === "picked_up")) {
      const { sendReservationEmail } = await import("./email.server");
      emailSent = await sendReservationEmail(reservation, data.status);
    }

    return { reservation, emailSent };
  });

export const deleteReservationFn = createServerFn({ method: "POST" })
  .validator((data: { code: string; id: string }) => data)
  .handler(async ({ data }) => {
    await checkCode(data.code);
    const supabase = await getAdmin();

    const { error } = await supabase.from("reservations").delete().eq("id", data.id);

    if (error) {
      throw new Error(`Impossible de supprimer la réservation : ${error.message}`);
    }

    return true;
  });
