import {
  buildReservation,
  reservationsToCsv,
  type NewReservationInput,
  type Reservation,
  type ReservationStatus,
} from "./reservation-core";
import {
  createReservationFn,
  createStripeCheckoutSessionFn,
  deleteReservationFn,
  listReservationsFn,
  sendReservationEmailFn,
  updateReservationStatusFn,
  verifyCaisseCodeFn,
} from "./reservations.functions";

export type {
  Reservation,
  ReservationItem,
  ReservationStatus,
  NewReservationInput,
} from "./reservation-core";
export {
  ReservationError,
  STATUS_LABELS,
  STATUS_ORDER,
  isValidEmail,
  itemsSummary,
  reservationItemCount,
} from "./reservation-core";

const LOCAL_STORAGE_KEY = "noisette-pizza-reservations-v1";
const LOCAL_CAISSE_CODE =
  (import.meta.env["VITE_CAISSE_CODE"] as string | undefined)?.trim() || "noizay";

export type ReservationBackend = "supabase" | "local";

export type CreateReservationResult = {
  reservation: Reservation;
  emailSent: boolean;
};

/** Code d'accès effectif en mode démo local (affiché sur la page admin). */
export function getLocalCaisseCode(): string {
  return LOCAL_CAISSE_CODE;
}

/**
 * Supabase est utilisé dès que VITE_SUPABASE_URL est défini (côté navigateur).
 * Sans clé, l'application bascule sur un stockage local pour rester utilisable
 * en démonstration.
 */
export function getBackendMode(): ReservationBackend {
  return (import.meta.env["VITE_SUPABASE_URL"] as string | undefined)?.trim()
    ? "supabase"
    : "local";
}

function readLocalReservations(): Reservation[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Reservation[]) : [];
  } catch {
    return [];
  }
}

function writeLocalReservations(reservations: Reservation[]): void {
  if (typeof window === "undefined") {
    throw new Error("Le stockage local n'est pas disponible.");
  }
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reservations));
}

export async function createReservation(
  input: NewReservationInput,
): Promise<CreateReservationResult> {
  if (getBackendMode() === "supabase") {
    return createReservationFn({ data: input });
  }

  const reservation = buildReservation(input);
  const reservations = readLocalReservations();
  reservations.unshift(reservation);
  writeLocalReservations(reservations);

  // En mode démo, la réservation reste dans le navigateur : on demande au
  // serveur d'envoyer l'e-mail de confirmation s'il est configuré.
  let emailSent = false;
  try {
    emailSent = await sendReservationEmailFn({ data: { reservation, kind: "confirmation" } });
  } catch {
    emailSent = false;
  }

  return { reservation, emailSent };
}

export function isStripeEnabled(): boolean {
  return Boolean((import.meta.env["VITE_STRIPE_PUBLISHABLE_KEY"] as string | undefined)?.trim());
}

export async function createStripeCheckoutSession(input: {
  reservation: Reservation;
  origin: string;
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  return createStripeCheckoutSessionFn({ data: input });
}

export async function verifyCaisseCode(code: string): Promise<boolean> {
  if (getBackendMode() === "supabase") {
    await verifyCaisseCodeFn({ data: { code } });
    return true;
  }

  return code.trim() === LOCAL_CAISSE_CODE;
}

export async function listReservations(code: string): Promise<Reservation[]> {
  if (getBackendMode() === "supabase") {
    return listReservationsFn({ data: { code } });
  }

  return readLocalReservations().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type UpdateStatusResult = {
  reservation: Reservation;
  emailSent: boolean | null;
};

export async function updateReservationStatus(
  code: string,
  id: string,
  status: ReservationStatus,
): Promise<UpdateStatusResult> {
  if (getBackendMode() === "supabase") {
    return updateReservationStatusFn({ data: { code, id, status } });
  }

  const reservations = readLocalReservations();
  const now = new Date().toISOString();
  const index = reservations.findIndex((reservation) => reservation.id === id);

  if (index === -1) {
    throw new Error("Réservation introuvable.");
  }

  const previous = reservations[index]!;
  const updated: Reservation = { ...previous, status, updatedAt: now };
  reservations[index] = updated;
  writeLocalReservations(reservations);

  // Comme en mode Supabase, on prévient le client au passage à « payé » ou
  // « récupéré ». L'échec d'envoi ne bloque pas la mise à jour.
  let emailSent: boolean | null = null;
  if (previous.status !== status && (status === "paid" || status === "picked_up")) {
    try {
      emailSent = await sendReservationEmailFn({ data: { reservation: updated, kind: status } });
    } catch {
      emailSent = false;
    }
  }

  return { reservation: updated, emailSent };
}

export async function deleteReservation(code: string, id: string): Promise<void> {
  if (getBackendMode() === "supabase") {
    await deleteReservationFn({ data: { code, id } });
    return;
  }

  writeLocalReservations(readLocalReservations().filter((reservation) => reservation.id !== id));
}

export function downloadReservationsCsv(reservations: Reservation[]): void {
  if (typeof window === "undefined") return;

  const csv = reservationsToCsv(reservations);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `reservations-pizza-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
