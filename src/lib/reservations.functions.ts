import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";

import {
  buildReservation,
  fromRow,
  toRow,
  type NewReservationInput,
  type Reservation,
  type ReservationRow,
  type ReservationStatus,
} from "./reservation-core";

const VALID_STATUSES: ReservationStatus[] = ["pending", "paid", "picked_up", "cancelled"];

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

    const { error } = await supabase.from("reservations").insert(toRow(reservation));

    if (error) {
      throw new Error(`Impossible d'enregistrer la réservation : ${error.message}`);
    }

    const { sendReservationEmail } = await import("./email.server");
    const emailSent = await sendReservationEmail(reservation, "confirmation");

    return { reservation, emailSent };
  });

export async function createStripeCheckoutSessionRequest(input: {
  reservation: Reservation;
  origin: string;
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const publishableKey = (process.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "").trim();

  if (!stripeSecretKey || !publishableKey) {
    throw new Error(
      "La clé Stripe de test est absente. Ajoutez STRIPE_SECRET_KEY et VITE_STRIPE_PUBLISHABLE_KEY.",
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.reservation.email ?? undefined,
    billing_address_collection: "required",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.max(0, input.reservation.totalCents),
          product_data: {
            name: `Commande ${input.reservation.reference}`,
            description: `Réservation ${input.reservation.reference} · ${input.reservation.items.length} article(s)`,
          },
        },
      },
    ],
    metadata: {
      reservationId: input.reservation.id,
      reservationReference: input.reservation.reference,
    },
    success_url: `${input.origin}/reserver?payment=success&reservationId=${encodeURIComponent(input.reservation.id)}&reference=${encodeURIComponent(input.reservation.reference)}`,
    cancel_url: `${input.origin}/reserver?payment=cancelled&reservationId=${encodeURIComponent(input.reservation.id)}`,
  });

  if (!session.url) {
    throw new Error("Stripe n'a pas renvoyé d'URL de paiement.");
  }

  return { checkoutUrl: session.url, sessionId: session.id };
}

export const createStripeCheckoutSessionFn = createServerFn({ method: "POST" })
  .validator((data: { reservation: Reservation; origin: string }) => {
    if (!data?.reservation || typeof data.origin !== "string" || !data.origin.trim()) {
      throw new Error("Données de paiement invalides.");
    }
    return data;
  })
  .handler(async ({ data }) => createStripeCheckoutSessionRequest(data));

const EMAIL_KINDS = ["confirmation", "paid", "picked_up"] as const;
type EmailKind = (typeof EMAIL_KINDS)[number];

type SendReservationEmailInput = {
  reservation: Reservation;
  kind: EmailKind;
};

/**
 * Envoi d'un e-mail lié à une réservation pour le mode démo local, où la
 * réservation n'est pas enregistrée côté serveur. L'envoi est ignoré si Resend
 * n'est pas configuré.
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
