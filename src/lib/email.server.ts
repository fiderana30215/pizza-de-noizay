import { EVENT, formatEuros, formatSlot } from "./event";
import type { Reservation } from "./reservation-core";

export type ReservationEmailKind = "confirmation" | "paid" | "picked_up";

const EMAIL_CONTENT: Record<
  ReservationEmailKind,
  {
    subject: (reference: string) => string;
    intro: string;
    totalLabel: string;
    note: string;
    signOff: string;
    accent: string;
    noteBackground: string;
    noteColor: string;
  }
> = {
  confirmation: {
    subject: (reference) => `Votre réservation ${reference} · Soirée Pizza ${EVENT.school}`,
    intro: "Votre réservation est bien enregistrée. Voici le récapitulatif de votre commande.",
    totalLabel: "Total à régler sur place",
    note: "Paiement : espèces ou carte bancaire, sur place au moment du retrait.",
    signOff: "Merci et à bientôt !",
    accent: "#c2703d",
    noteBackground: "#fdf3e5",
    noteColor: "#6b4b2a",
  },
  paid: {
    subject: (reference) => `Paiement confirmé · Réservation ${reference} · Soirée Pizza`,
    intro:
      "Nous confirmons la réception de votre paiement. Merci ! Voici le récapitulatif de votre commande.",
    totalLabel: "Total réglé",
    note: "Votre commande vous attendra au créneau de retrait choisi. À très vite !",
    signOff: "Merci pour votre soutien à l'école !",
    accent: "#2f7d4f",
    noteBackground: "#e8f5ec",
    noteColor: "#245f3d",
  },
  picked_up: {
    subject: (reference) => `Commande récupérée · Réservation ${reference} · Soirée Pizza`,
    intro: "Votre commande a bien été récupérée. Merci et à bientôt !",
    totalLabel: "Total réglé",
    note: "Nous espérons que la soirée vous a plu. Merci pour votre soutien à l'école !",
    signOff: "Merci encore et à bientôt !",
    accent: "#2f7d4f",
    noteBackground: "#e8f5ec",
    noteColor: "#245f3d",
  },
};

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmail(
  reservation: Reservation,
  kind: ReservationEmailKind,
): { subject: string; html: string; text: string } {
  const firstName = reservation.customerName.split(" ")[0] ?? reservation.customerName;
  const content = EMAIL_CONTENT[kind];
  const subject = content.subject(reservation.reference);

  const itemLines = reservation.items.map(
    (item) =>
      `${item.quantity}× ${item.name} — ${formatEuros(item.quantity * item.unitPriceCents)}`,
  );

  const itemRows = reservation.items
    .map(
      (item) => `
                <tr>
                  <td style="padding:6px 0;color:#333;">${item.quantity}× ${escapeHtml(item.name)}</td>
                  <td style="padding:6px 0;text-align:right;color:#333;font-weight:600;">${formatEuros(
                    item.quantity * item.unitPriceCents,
                  )}</td>
                </tr>`,
    )
    .join("");

  const text = [
    `Bonjour ${firstName},`,
    "",
    content.intro,
    "",
    `Réservation : ${reservation.reference}`,
    `Date : ${EVENT.dateLabel}`,
    `Lieu : ${EVENT.locationName}`,
    `Retrait : ${formatSlot(reservation.pickupSlot)}`,
    "",
    "Vos pizzas :",
    ...itemLines.map((line) => `- ${line}`),
    "",
    `${content.totalLabel} : ${formatEuros(reservation.totalCents)}`,
    content.note,
    "",
    content.signOff,
    `L'équipe de la ${EVENT.school}`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#f6f1e7;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <div style="background:#2b2b2b;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
        <p style="margin:0;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:#e9b872;">Soirée solidaire</p>
        <h1 style="margin:8px 0 0;font-size:28px;color:#ffffff;">Soirée Pizza</h1>
        <p style="margin:4px 0 0;font-size:16px;color:#e9b872;">${escapeHtml(EVENT.school)}</p>
      </div>

      <div style="background:#ffffff;padding:24px;border-radius:0 0 16px 16px;">
        <p style="margin:0 0 12px;font-size:16px;color:#333;">Bonjour ${escapeHtml(firstName)},</p>
        <p style="margin:0 0 16px;font-size:15px;color:#555;">
          ${escapeHtml(content.intro)}
        </p>

        <p style="margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#888;">Numéro de réservation</p>
        <p style="margin:4px 0 20px;font-size:26px;font-weight:700;color:${content.accent};">${escapeHtml(
          reservation.reference,
        )}</p>

        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr>
            <td style="padding:4px 0;color:#888;">Date</td>
            <td style="padding:4px 0;text-align:right;color:#333;font-weight:600;">${escapeHtml(
              EVENT.dateLabel,
            )}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#888;">Lieu</td>
            <td style="padding:4px 0;text-align:right;color:#333;font-weight:600;">${escapeHtml(
              EVENT.locationName,
            )}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#888;">Retrait</td>
            <td style="padding:4px 0;text-align:right;color:#333;font-weight:600;">${formatSlot(
              reservation.pickupSlot,
            )}</td>
          </tr>
        </table>

        <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />

        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          ${itemRows}
        </table>

        <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />

        <p style="margin:0;font-size:16px;color:#333;text-align:right;">
          ${content.totalLabel} :
          <strong style="color:${content.accent};">${formatEuros(reservation.totalCents)}</strong>
        </p>

        <p style="margin:20px 0 0;padding:12px 16px;background:${content.noteBackground};border-radius:10px;font-size:14px;color:${content.noteColor};">
          ${escapeHtml(content.note)}
        </p>

        <p style="margin:24px 0 0;font-size:15px;color:#333;">
          ${escapeHtml(content.signOff)}
        </p>
        <p style="margin:4px 0 0;font-size:14px;color:#888;">L'équipe de la ${escapeHtml(
          EVENT.school,
        )}</p>
      </div>
    </div>
  </body>
</html>`;

  return { subject, html, text };
}

/**
 * Envoie un e-mail lié à une réservation via Apps Script ou Resend :
 * confirmation, paiement reçu ou commande récupérée.
 * Retourne `false` si l'envoi n'est pas configuré ou a échoué : la réservation
 * reste enregistrée dans tous les cas.
 */
export async function sendReservationEmail(
  reservation: Reservation,
  kind: ReservationEmailKind = "confirmation",
): Promise<boolean> {
  const apiKey = readEnv("RESEND_API_KEY");
  const scriptUrl = readEnv("GOOGLE_SCRIPT_EMAIL_URL");
  const from = readEnv("RESERVATION_EMAIL_FROM") ?? "Pizza Night Noizay <onboarding@resend.dev>";

  if (!reservation.email || (!apiKey && !scriptUrl)) return false;

  const { subject, html, text } = buildEmail(reservation, kind);
  const replyTo = readEnv("RESERVATION_EMAIL_REPLY_TO");

  if (scriptUrl) {
    try {
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          secret: readEnv("GOOGLE_SCRIPT_EMAIL_SECRET") ?? "",
          to: reservation.email,
          subject,
          html,
          text,
          replyTo: replyTo ?? "",
        }),
        redirect: "follow",
      });
      const result = (await response.text()).trim();
      if (!response.ok || result !== "ok") {
        console.error(`Échec de l'envoi de l'e-mail (${kind}) :`, response.status, result);
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Échec de l'envoi de l'e-mail (${kind}) :`, error);
      return false;
    }
  }

  const payload: Record<string, unknown> = {
    from,
    to: [reservation.email],
    subject,
    html,
    text,
  };
  if (replyTo) payload["reply_to"] = replyTo;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error(`Échec de l'envoi de l'e-mail (${kind}) :`, response.status, details);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Échec de l'envoi de l'e-mail (${kind}) :`, error);
    return false;
  }
}
