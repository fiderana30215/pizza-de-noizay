import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildReservation, reservationsToCsv } from "@/lib/reservation-core";
import { createHelloAssoCheckoutIntentRequest } from "@/lib/reservations.functions";
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
  pickupSlot: "19:15",
  quantities: { "quatre-fromages": 2, regina: 1 },
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
    expect(reservation.totalCents).toBe(2 * 1300 + 1200);
    expect(reservation.email).toBe("camille@exemple.fr");
    expect(emailSent).toBe(false);

    const stored = await listReservations("noizay");
    expect(stored).toHaveLength(1);
    expect(stored[0]?.id).toBe(reservation.id);
  });

  it("refuse les créneaux retirés et les horaires hors plage", async () => {
    await expect(createReservation({ ...BASE_INPUT, pickupSlot: "19:15" })).resolves.toMatchObject({
      reservation: { pickupSlot: "19:15" },
    });
    await expect(createReservation({ ...BASE_INPUT, pickupSlot: "21:30" })).resolves.toMatchObject({
      reservation: { pickupSlot: "21:30" },
    });
    await expect(createReservation({ ...BASE_INPUT, pickupSlot: "18:45" })).rejects.toThrow(
      "créneau de retrait",
    );
    await expect(createReservation({ ...BASE_INPUT, pickupSlot: "19:00" })).rejects.toThrow(
      "créneau de retrait",
    );
    await expect(createReservation({ ...BASE_INPUT, pickupSlot: "18:30" })).rejects.toThrow(
      "créneau de retrait",
    );
    await expect(createReservation({ ...BASE_INPUT, pickupSlot: "21:45" })).rejects.toThrow(
      "créneau de retrait",
    );
    await expect(createReservation({ ...BASE_INPUT, pickupSlot: "18:20" })).rejects.toThrow(
      "créneau de retrait",
    );
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
    vi.stubEnv("GOOGLE_SCRIPT_EMAIL_URL", "");
    vi.stubEnv("RESERVATION_EMAIL_FROM", "Soirée Pizza <test@exemple.fr>");
    vi.stubEnv("PUBLIC_SITE_URL", "https://pizza.example");

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
      html: string;
    };
    expect(paidPayload.subject).toContain("Paiement confirmé");
    expect(paidPayload.to).toEqual(["camille@exemple.fr"]);
    expect(paidPayload.html).toContain('alt="Pizza 4 fromages"');
    expect(paidPayload.html).toContain("https://pizza.example/");
    expect(paidPayload.html).toContain("font-size:13px");

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

  it("exige les identifiants API HelloAsso avant de lancer un paiement", async () => {
    vi.stubEnv("HELLOASSO_CLIENT_ID", "");
    vi.stubEnv("HELLOASSO_CLIENT_SECRET", "");

    await expect(
      createHelloAssoCheckoutIntentRequest({
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
              pizzaId: "quatre-fromages",
              name: "4 fromages",
              quantity: 1,
              unitPriceCents: 1300,
            },
          ],
          totalCents: 1300,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
    ).rejects.toThrow("HelloAsso");
  });

  it("crée un checkout HelloAsso avec le montant et les métadonnées de réservation", async () => {
    vi.stubEnv("HELLOASSO_CLIENT_ID", "client-test");
    vi.stubEnv("HELLOASSO_CLIENT_SECRET", "secret-test");
    vi.stubEnv("PUBLIC_SITE_URL", "https://pizza.example");
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "access-test",
            refresh_token: "refresh-test",
            expires_in: 1799,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ id: 123, redirectUrl: "https://www.helloasso.com/checkout/123" }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const reservation = buildReservation(BASE_INPUT);

    await expect(createHelloAssoCheckoutIntentRequest({ reservation })).resolves.toEqual({
      checkoutUrl: "https://www.helloasso.com/checkout/123",
      sessionId: "123",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.helloasso.com/oauth2/token");
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://api.helloasso.com/v5/organizations/association-des-parents-d-eleves-de-noizay/checkout-intents",
    );
    const checkoutRequest = fetchMock.mock.calls[1]?.[1];
    const payload = JSON.parse(String(checkoutRequest?.body)) as {
      totalAmount: number;
      initialAmount: number;
      containsDonation: boolean;
      returnUrl: string;
      metadata: { reservationId: string; reservationReference: string };
    };
    expect(payload.totalAmount).toBe(reservation.totalCents);
    expect(payload.initialAmount).toBe(reservation.totalCents);
    expect(payload.containsDonation).toBe(false);
    expect(payload.returnUrl).toContain("payment=return");
    expect(payload.metadata.reservationId).toBe(reservation.id);
    expect(payload.metadata.reservationReference).toBe(reservation.reference);
  });

  it("exporte un CSV lisible", async () => {
    const { reservation } = await createReservation(BASE_INPUT);
    const csv = reservationsToCsv([reservation]);

    expect(csv).toContain('"Numéro";"Créée le"');
    expect(csv).toContain(reservation.reference);
    expect(csv).toContain("Camille Martin");
    expect(csv).toContain("2× 4 fromages");
  });
});
