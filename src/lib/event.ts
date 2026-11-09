/**
 * Toutes les informations de la soirée sont centralisées ici.
 * Modifiez ce fichier pour mettre à jour la date, le lieu, les prix ou le menu.
 */
export const EVENT = {
  school: "Caisse de Noisette",
  title: "Soirée Pizza solidaire",
  dateLabel: "Samedi 5 décembre 2026",
  dateISO: "2026-12-05T18:00:00+01:00",
  timeLabel: "Retraits de 18h à 21h",
  locationName: "Salle polyvalente de Noisette",
  locationDetail: "Adresse communiquée par l'école",
  orderDeadlineLabel: "vendredi 27 novembre 2026",
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
    id: "margherita",
    name: "Margherita",
    description: "Tomate, mozzarella, basilic frais",
    priceCents: 900,
    emoji: "🍅",
    vegetarian: true,
  },
  {
    id: "reine",
    name: "La Reine",
    description: "Jambon, champignons, mozzarella",
    priceCents: 1000,
    emoji: "🍄",
    vegetarian: false,
  },
  {
    id: "quatre-fromages",
    name: "4 fromages",
    description: "Mozzarella, chèvre, emmental, gorgonzola",
    priceCents: 1000,
    emoji: "🧀",
    vegetarian: true,
  },
  {
    id: "vegetarienne",
    name: "Végétarienne",
    description: "Courgettes, poivrons, oignons, olives",
    priceCents: 1000,
    emoji: "🥦",
    vegetarian: true,
  },
  {
    id: "pepperoni",
    name: "Pepperoni",
    description: "Pepperoni, mozzarella, origan",
    priceCents: 1100,
    emoji: "🌶️",
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
