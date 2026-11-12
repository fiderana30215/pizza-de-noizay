import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildReservation, reservationsToCsv } from "@/lib/reservation-core";
import { createStripeCheckoutSessionRequest } from "@/lib/reservations.functions";
import {
  createReservation,
  deleteReservation,
  listReservations,
  updateReservationStatus,
} from "@/lib/reservations";

const BASE_INPUT = {
  customerName: "Camille Martin",
  phone: "06 12 34 56 78",
  email: "camille@exemple.fr",
  pickupSlot: "18:30",
  quantities: { "chevre-miel": 2, regina: 1 },
};

describe("réservations (mode démo local)", () => {
  beforeEach(() => {
    // Force le stockage local même quand un .env de développement définit VITE_SUPABASE_URL.
    vi.stubEnv("VITE_SUPABASE_URL", "");
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("enregistre une réservation et calcule le total", async () => {
    const { reservation, emailSent } = await createReservation(BASE_INPUT);

    expect(reservation.reference).toMatch(/^PN-[A-Z2-9]{5}$/);
    expect(reservation.items).toHaveLength(2);
    expect(reservation.totalCents).toBe(3 * 1200);
    expect(reservation.email).toBe("camille@exemple.fr");
    expect(emailSent).toBe(false);

    const stored = await listReservations("noizay");
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

  it("exige une adresse e-mail valide", async () => {
    await expect(createReservation({ ...BASE_INPUT, email: "" })).rejects.toThrow("e-mail");
    await expect(createReservation({ ...BASE_INPUT, email: "pas-un-email" })).rejects.toThrow(
      "e-mail",
    );
  });

  it("met à jour le statut puis supprime la réservation", async () => {
    const { reservation } = await createReservation(BASE_INPUT);

    const { reservation: updated } = await updateReservationStatus(
      "noizay",
      reservation.id,
      "paid",
    );
    expect(updated.status).toBe("paid");
    expect((await listReservations("noizay"))[0]?.status).toBe("paid");

    await deleteReservation("noizay", reservation.id);
    expect(await listReservations("noizay")).toEqual([]);
  });

  it("envoie un e-mail au passage à payé puis à récupéré", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("RESERVATION_EMAIL_FROM", "Soirée Pizza <test@exemple.fr>");

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ id: "email_1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { reservation } = await createReservation(BASE_INPUT);
    const { sendReservationEmail } = await import("@/lib/email.server");

    expect(await sendReservationEmail(reservation, "paid")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const paidPayload = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      subject: string;
      to: string[];
    };
    expect(paidPayload.subject).toContain("Paiement confirmé");
    expect(paidPayload.to).toEqual(["camille@exemple.fr"]);

    fetchMock.mockClear();
    expect(await sendReservationEmail(reservation, "picked_up")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const pickedUpPayload = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      subject: string;
    };
    expect(pickedUpPayload.subject).toContain("Commande récupérée");
  });

  it("utilise Google Apps Script en priorité sur Resend", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("GOOGLE_SCRIPT_EMAIL_URL", "https://script.google.com/macros/s/test/exec");
    vi.stubEnv("GOOGLE_SCRIPT_EMAIL_SECRET", "test-shared-secret");

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { sendReservationEmail } = await import("@/lib/email.server");
    const sent = await sendReservationEmail(buildReservation(BASE_INPUT));

    expect(sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://script.google.com/macros/s/test/exec");
    const payload = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      secret: string;
      to: string;
    };
    expect(payload.secret).toBe("test-shared-secret");
    expect(payload.to).toBe("camille@exemple.fr");
  });

  it("indique un échec si Google Apps Script ne répond pas avec ok", async () => {
    vi.stubEnv("GOOGLE_SCRIPT_EMAIL_URL", "https://script.google.com/macros/s/test/exec");
    vi.stubEnv("GOOGLE_SCRIPT_EMAIL_SECRET", "test-shared-secret");
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(new Response("unauthorized")));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { sendReservationEmail } = await import("@/lib/email.server");
    await expect(sendReservationEmail(buildReservation(BASE_INPUT))).resolves.toBe(false);
  });

  it("exige une clé Stripe de test avant de lancer un paiement", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("VITE_STRIPE_PUBLISHABLE_KEY", "");

    await expect(
      createStripeCheckoutSessionRequest({
        reservation: {
          id: "checkout-test-id",
          reference: "PN-TEST1",
          customerName: "Camille Martin",
          phone: "06 12 34 56 78",
          email: "camille@exemple.fr",
          childClass: null,
          pickupSlot: "18:30",
          notes: null,
          items: [
            {
              pizzaId: "chevre-miel",
              name: "Chèvre-miel",
              quantity: 1,
              unitPriceCents: 1200,
            },
          ],
          totalCents: 1200,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        origin: "https://example.com",
      }),
    ).rejects.toThrow("Stripe");
  });

  it("exporte un CSV lisible", async () => {
    const { reservation } = await createReservation(BASE_INPUT);
    const csv = reservationsToCsv([reservation]);

    expect(csv).toContain('"Numéro";"Créée le"');
    expect(csv).toContain(reservation.reference);
    expect(csv).toContain("Camille Martin");
    expect(csv).toContain("2× Chèvre-miel");
  });
});
