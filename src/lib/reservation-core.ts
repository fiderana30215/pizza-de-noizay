import { EVENT, PICKUP_SLOTS, PIZZAS, type PickupSlot } from "./event";

export type ReservationStatus = "pending" | "paid" | "picked_up" | "cancelled";

export type ReservationItem = {
  pizzaId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
};

export type Reservation = {
  id: string;
  reference: string;
  customerName: string;
  phone: string;
  email: string | null;
  childClass: string | null;
  pickupSlot: string;
  notes: string | null;
  items: ReservationItem[];
  totalCents: number;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
};

export type NewReservationInput = {
  customerName: string;
  phone: string;
  email: string;
  childClass?: string;
  pickupSlot: string;
  notes?: string;
  quantities: Record<string, number>;
};

export type ReservationRow = {
  id: string;
  reference: string;
  customer_name: string;
  phone: string;
  email: string | null;
  child_class: string | null;
  pickup_slot: string;
  notes: string | null;
  items: ReservationItem[] | null;
  total_cents: number;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
};

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "À régler",
  paid: "Payée",
  picked_up: "Récupérée",
  cancelled: "Annulée",
};

export const STATUS_ORDER: ReservationStatus[] = ["pending", "paid", "picked_up", "cancelled"];

export class ReservationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationError";
  }
}

function clean(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Repli compatible avec la colonne uuid de Supabase sur les navigateurs anciens.
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function makeReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(5);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      code += alphabet.charAt(byte % alphabet.length);
    }
  } else {
    for (let index = 0; index < 5; index += 1) {
      code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
  }

  return `PN-${code}`;
}

function buildItems(quantities: Record<string, number>): ReservationItem[] {
  const items: ReservationItem[] = [];

  for (const pizza of PIZZAS) {
    const rawQuantity = quantities[pizza.id] ?? 0;
    if (!Number.isFinite(rawQuantity) || rawQuantity <= 0) continue;

    const quantity = Math.floor(rawQuantity);
    if (quantity > 10) {
      throw new ReservationError(`Maximum 10 pizzas « ${pizza.name} » par commande.`);
    }

    items.push({
      pizzaId: pizza.id,
      name: pizza.name,
      quantity,
      unitPriceCents: pizza.priceCents,
    });
  }

  if (items.length === 0) {
    throw new ReservationError("Choisissez au moins une pizza.");
  }

  const totalPizzas = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalPizzas > EVENT.maxPizzasPerOrder) {
    throw new ReservationError(`${EVENT.maxPizzasPerOrder} pizzas maximum par commande.`);
  }

  return items;
}

function validatePhone(phone: string): void {
  const digits = phone.replace(/[\s.()-]/g, "");
  if (!/^(?:\+33\d{9}|0\d{9})$/.test(digits)) {
    throw new ReservationError("Indiquez un numéro de téléphone valide (ex. 06 12 34 56 78).");
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

/**
 * Valide les données et construit la réservation. Utilisé côté navigateur
 * (mode démo) et côté serveur (avant l'écriture dans Supabase).
 */
export function buildReservation(input: NewReservationInput): Reservation {
  if (!input || typeof input !== "object") {
    throw new ReservationError("Données de réservation invalides.");
  }

  const customerName = (input.customerName ?? "").trim();
  const phone = (input.phone ?? "").trim();
  const email = (input.email ?? "").trim();
  const pickupSlot = (input.pickupSlot ?? "").trim();

  if (customerName.length < 2) {
    throw new ReservationError("Indiquez votre nom et prénom.");
  }

  validatePhone(phone);

  if (!isValidEmail(email)) {
    throw new ReservationError("Indiquez une adresse e-mail valide.");
  }

  if (!PICKUP_SLOTS.includes(pickupSlot as PickupSlot)) {
    throw new ReservationError("Choisissez un créneau de retrait.");
  }

  const items = buildItems(input.quantities ?? {});
  const now = new Date().toISOString();

  return {
    id: makeId(),
    reference: makeReference(),
    customerName,
    phone,
    email,
    childClass: clean(input.childClass),
    pickupSlot,
    notes: clean(input.notes),
    items,
    totalCents: items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
}

export function toRow(reservation: Reservation): ReservationRow {
  return {
    id: reservation.id,
    reference: reservation.reference,
    customer_name: reservation.customerName,
    phone: reservation.phone,
    email: reservation.email,
    child_class: reservation.childClass,
    pickup_slot: reservation.pickupSlot,
    notes: reservation.notes,
    items: reservation.items,
    total_cents: reservation.totalCents,
    status: reservation.status,
    created_at: reservation.createdAt,
    updated_at: reservation.updatedAt,
  };
}

export function fromRow(row: ReservationRow): Reservation {
  return {
    id: row.id,
    reference: row.reference,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    childClass: row.child_class,
    pickupSlot: row.pickup_slot,
    notes: row.notes,
    items: Array.isArray(row.items) ? row.items : [],
    totalCents: row.total_cents,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function reservationItemCount(reservation: Reservation): number {
  return reservation.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function itemsSummary(reservation: Reservation): string {
  return reservation.items.map((item) => `${item.quantity}× ${item.name}`).join(", ");
}

function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function reservationsToCsv(reservations: Reservation[]): string {
  const header = [
    "Numéro",
    "Créée le",
    "Nom",
    "Téléphone",
    "Email",
    "Classe",
    "Créneau",
    "Pizzas",
    "Total (€)",
    "Statut",
    "Remarques",
  ];

  const rows = reservations.map((reservation) => [
    reservation.reference,
    new Date(reservation.createdAt).toLocaleString("fr-FR"),
    reservation.customerName,
    reservation.phone,
    reservation.email ?? "",
    reservation.childClass ?? "",
    reservation.pickupSlot,
    itemsSummary(reservation),
    (reservation.totalCents / 100).toFixed(2).replace(".", ","),
    STATUS_LABELS[reservation.status],
    reservation.notes ?? "",
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
}
