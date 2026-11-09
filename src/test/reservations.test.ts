import { beforeEach, describe, expect, it } from "vitest";

import { reservationsToCsv } from "@/lib/reservation-core";
import {
  createReservation,
  deleteReservation,
  listReservations,
  updateReservationStatus,
} from "@/lib/reservations";

const BASE_INPUT = {
  customerName: "Camille Martin",
  phone: "06 12 34 56 78",
  pickupSlot: "18:30",
  quantities: { margherita: 2, reine: 1 },
};

describe("réservations (mode démo local)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("enregistre une réservation et calcule le total", async () => {
    const reservation = await createReservation(BASE_INPUT);

    expect(reservation.reference).toMatch(/^PN-[A-Z2-9]{5}$/);
    expect(reservation.items).toHaveLength(2);
    expect(reservation.totalCents).toBe(2 * 900 + 1000);

    const stored = await listReservations("noisette");
    expect(stored).toHaveLength(1);
    expect(stored[0]?.id).toBe(reservation.id);
  });

  it("refuse une commande vide", async () => {
    await expect(createReservation({ ...BASE_INPUT, quantities: {} })).rejects.toThrow(
      "au moins une pizza",
    );
  });

  it("refuse un téléphone invalide", async () => {
    await expect(createReservation({ ...BASE_INPUT, phone: "123" })).rejects.toThrow("téléphone");
  });

  it("met à jour le statut puis supprime la réservation", async () => {
    const reservation = await createReservation(BASE_INPUT);

    const updated = await updateReservationStatus("noisette", reservation.id, "paid");
    expect(updated.status).toBe("paid");
    expect((await listReservations("noisette"))[0]?.status).toBe("paid");

    await deleteReservation("noisette", reservation.id);
    expect(await listReservations("noisette")).toEqual([]);
  });

  it("exporte un CSV lisible", async () => {
    const reservation = await createReservation(BASE_INPUT);
    const csv = reservationsToCsv([reservation]);

    expect(csv).toContain('"Numéro";"Créée le"');
    expect(csv).toContain(reservation.reference);
    expect(csv).toContain("Camille Martin");
    expect(csv).toContain("2× Margherita");
  });
});
