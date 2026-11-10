/**
 * Toutes les informations de la soirée sont centralisées ici.
 * Modifiez ce fichier pour mettre à jour la date, le lieu, les prix ou le menu.
 */
export const EVENT = {
  school: "Caisse de Noizay",
  title: "Soirée Pizza solidaire",
  dateLabel: "Jeudi 26 novembre 2026",
  dateISO: "2026-11-26T18:00:00+01:00",
  timeLabel: "Retraits de 18h à 21h",
  locationName: "Boulangerie les pains de Cisse - Noizay",
  locationDetail: "Retrait des pizzas sur place",
  orderDeadlineLabel: "mercredi 25 novembre 2026",
  maxPizzasPerOrder: 20,
} as const;

export type Pizza = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  emoji: string;
  vegetarian: boolean;
};

export const PIZZAS: readonly Pizza[] = [
  {
    id: "chevre-miel",
    name: "Chèvre-miel",
    description: "Crème fraîche, mozzarella, fromage de chèvre, miel, noix",
    priceCents: 1200,
    emoji: "🍯",
    vegetarian: true,
  },
  {
    id: "regina",
    name: "Régina",
    description: "Tomate, fromage, mozzarella, champignons, jambon et olives",
    priceCents: 1200,
    emoji: "🍄",
    vegetarian: false,
  },
] as const;

export const PICKUP_SLOTS = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30"] as const;

export type PickupSlot = (typeof PICKUP_SLOTS)[number];

export function formatEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function formatSlot(slot: string): string {
  return slot.replace(":", "h");
}

export function getPizza(id: string): Pizza | undefined {
  return PIZZAS.find((pizza) => pizza.id === id);
}
