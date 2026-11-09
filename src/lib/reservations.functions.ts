import { createServerFn } from "@tanstack/react-start";

import {
  buildReservation,
  fromRow,
  toRow,
  type NewReservationInput,
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

    return reservation;
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
    const { data: row, error } = await supabase
      .from("reservations")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Impossible de mettre à jour la réservation : ${error.message}`);
    }

    return fromRow(row as ReservationRow);
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
