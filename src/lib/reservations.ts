import {
  buildReservation,
  reservationsToCsv,
  type NewReservationInput,
  type Reservation,
  type ReservationStatus,
} from "./reservation-core";
import {
  createReservationFn,
  deleteReservationFn,
  listReservationsFn,
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
  itemsSummary,
  reservationItemCount,
} from "./reservation-core";

const LOCAL_STORAGE_KEY = "noisette-pizza-reservations-v1";
const LOCAL_CAISSE_CODE =
  (import.meta.env["VITE_CAISSE_CODE"] as string | undefined)?.trim() || "noisette";

export type ReservationBackend = "supabase" | "local";

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

export async function createReservation(input: NewReservationInput): Promise<Reservation> {
  if (getBackendMode() === "supabase") {
    return createReservationFn({ data: input });
  }

  const reservation = buildReservation(input);
  const reservations = readLocalReservations();
  reservations.unshift(reservation);
  writeLocalReservations(reservations);
  return reservation;
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

export async function updateReservationStatus(
  code: string,
  id: string,
  status: ReservationStatus,
): Promise<Reservation> {
  if (getBackendMode() === "supabase") {
    return updateReservationStatusFn({ data: { code, id, status } });
  }

  const reservations = readLocalReservations();
  const now = new Date().toISOString();
  const index = reservations.findIndex((reservation) => reservation.id === id);

  if (index === -1) {
    throw new Error("Réservation introuvable.");
  }

  const updated: Reservation = { ...reservations[index]!, status, updatedAt: now };
  reservations[index] = updated;
  writeLocalReservations(reservations);
  return updated;
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
