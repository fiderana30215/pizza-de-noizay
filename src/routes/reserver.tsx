import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Minus,
  Plus,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EVENT, PICKUP_SLOTS, PIZZAS, formatEuros, formatSlot } from "@/lib/event";
import { createReservation, type Reservation } from "@/lib/reservations";

export const Route = createFileRoute("/reserver")({
  head: () => ({
    meta: [
      { title: "Réserver mes pizzas · Soirée Pizza Noisette" },
      {
        name: "description",
        content:
          "Composez votre commande de pizzas pour la soirée solidaire de l'école. Réservation en ligne, paiement sur place.",
      },
      { property: "og:title", content: "Réserver mes pizzas · Soirée Pizza Noisette" },
      {
        property: "og:description",
        content:
          "Composez votre commande de pizzas pour la soirée solidaire de l'école. Réservation en ligne, paiement sur place.",
      },
    ],
  }),
  component: ReserverPage,
});

type FormState = {
  customerName: string;
  phone: string;
  email: string;
  childClass: string;
  pickupSlot: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  customerName: "",
  phone: "",
  email: "",
  childClass: "",
  pickupSlot: "",
  notes: "",
};

function ReserverPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Reservation | null>(null);

  const totalPizzas = PIZZAS.reduce((sum, pizza) => sum + (quantities[pizza.id] ?? 0), 0);
  const totalCents = PIZZAS.reduce(
    (sum, pizza) => sum + (quantities[pizza.id] ?? 0) * pizza.priceCents,
    0,
  );

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }

  function changeQuantity(pizzaId: string, delta: number) {
    setQuantities((previous) => {
      const current = previous[pizzaId] ?? 0;
      const next = Math.max(0, Math.min(10, current + delta));
      return { ...previous, [pizzaId]: next };
    });
    setErrors((previous) => {
      const next = { ...previous };
      delete next["pizzas"];
      return next;
    });
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setQuantities({});
    setErrors({});
    setSubmitError(null);
    setConfirmation(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors: Record<string, string> = {};
    const phoneDigits = form.phone.replace(/[\s.()-]/g, "");

    if (form.customerName.trim().length < 2) {
      nextErrors["customerName"] = "Indiquez votre nom et prénom.";
    }
    if (!/^(?:\+33\d{9}|0\d{9})$/.test(phoneDigits)) {
      nextErrors["phone"] = "Indiquez un numéro valide (ex. 06 12 34 56 78).";
    }
    if (!form.pickupSlot) {
      nextErrors["pickupSlot"] = "Choisissez un créneau de retrait.";
    }
    if (totalPizzas === 0) {
      nextErrors["pizzas"] = "Choisissez au moins une pizza.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstError = Object.keys(nextErrors)[0];
      if (firstError) document.getElementById(firstError)?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const reservation = await createReservation({ ...form, quantities });
      setConfirmation(reservation);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Une erreur est survenue. Merci de réessayer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmation) {
    return <Confirmation reservation={confirmation} onNew={resetForm} />;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <p className="font-bold uppercase tracking-widest text-accent">Réservation</p>
        <h1 className="mt-2 text-4xl font-bold text-primary md:text-5xl">
          Commandez vos pizzas 🍕
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Remplissez le formulaire ci-dessous. Aucun paiement en ligne : vous réglerez sur place le
          soir de la soirée.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 shadow-sm">
            <CalendarDays className="h-4 w-4 text-accent" />
            {EVENT.dateLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 shadow-sm">
            <Clock className="h-4 w-4 text-accent" />
            {EVENT.timeLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 shadow-sm">
            <MapPin className="h-4 w-4 text-accent" />
            {EVENT.locationName}
          </span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_360px]"
      >
        <div className="space-y-6">
          <section className="rounded-3xl bg-card p-6 shadow-md sm:p-8">
            <h2 className="text-2xl font-bold text-primary">1. Vos coordonnées</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Elles nous servent uniquement à préparer et retrouver votre commande. Les données sont
              supprimées après la soirée.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="customerName">Nom et prénom *</Label>
                <Input
                  id="customerName"
                  value={form.customerName}
                  onChange={(event) => updateField("customerName", event.target.value)}
                  placeholder="Camille Martin"
                  autoComplete="name"
                  className="mt-1.5 h-11 bg-background"
                  aria-invalid={Boolean(errors["customerName"])}
                />
                {errors["customerName"] && (
                  <p role="alert" className="mt-1 text-sm font-bold text-destructive">
                    {errors["customerName"]}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="06 12 34 56 78"
                  type="tel"
                  autoComplete="tel"
                  className="mt-1.5 h-11 bg-background"
                  aria-invalid={Boolean(errors["phone"])}
                />
                {errors["phone"] && (
                  <p role="alert" className="mt-1 text-sm font-bold text-destructive">
                    {errors["phone"]}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email (facultatif)</Label>
                <Input
                  id="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="camille@exemple.fr"
                  type="email"
                  autoComplete="email"
                  className="mt-1.5 h-11 bg-background"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="childClass">Classe de votre enfant (facultatif)</Label>
                <Input
                  id="childClass"
                  value={form.childClass}
                  onChange={(event) => updateField("childClass", event.target.value)}
                  placeholder="Ex. CE1, CM2…"
                  className="mt-1.5 h-11 bg-background"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-card p-6 shadow-md sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold text-primary">2. Vos pizzas</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choisissez vos pizzas. Maximum {EVENT.maxPizzasPerOrder} pizzas par commande.
                </p>
              </div>
              <p className="rounded-full bg-accent/10 px-3 py-1 text-sm font-bold text-accent">
                {totalPizzas} pizza{totalPizzas > 1 ? "s" : ""}
              </p>
            </div>

            {errors["pizzas"] && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive"
              >
                {errors["pizzas"]}
              </p>
            )}

            <div className="mt-4 divide-y divide-border">
              {PIZZAS.map((pizza) => {
                const quantity = quantities[pizza.id] ?? 0;

                return (
                  <div key={pizza.id} className="flex items-center gap-3 py-4 sm:gap-4">
                    <span aria-hidden className="text-3xl sm:text-4xl">
                      {pizza.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold">{pizza.name}</h3>
                        {pizza.vegetarian && (
                          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                            Végé
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{pizza.description}</p>
                      <p className="mt-0.5 text-sm font-bold text-primary">
                        {formatEuros(pizza.priceCents)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => changeQuantity(pizza.id, -1)}
                        disabled={quantity === 0}
                        aria-label={`Retirer une pizza ${pizza.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-input bg-background transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span aria-live="polite" className="w-7 text-center text-lg font-bold">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(pizza.id, 1)}
                        disabled={quantity >= 10}
                        aria-label={`Ajouter une pizza ${pizza.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl bg-card p-6 shadow-md sm:p-8">
            <h2 className="text-2xl font-bold text-primary">3. Retrait</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choisissez l'heure à laquelle vous passerez récupérer votre commande.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="pickupSlot">Créneau de retrait *</Label>
                <Select
                  value={form.pickupSlot}
                  onValueChange={(value) => updateField("pickupSlot", value)}
                >
                  <SelectTrigger
                    id="pickupSlot"
                    className="mt-1.5 h-11 bg-background"
                    aria-invalid={Boolean(errors["pickupSlot"])}
                  >
                    <SelectValue placeholder="Choisir un créneau" />
                  </SelectTrigger>
                  <SelectContent>
                    {PICKUP_SLOTS.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {formatSlot(slot)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors["pickupSlot"] && (
                  <p role="alert" className="mt-1 text-sm font-bold text-destructive">
                    {errors["pickupSlot"]}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="notes">Allergies ou remarques (facultatif)</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  placeholder="Ex. allergie aux fruits à coque, commande pour deux familles…"
                  className="mt-1.5 bg-background"
                  rows={3}
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-primary">Votre commande</h2>

            {totalPizzas === 0 ? (
              <p className="mt-3 rounded-2xl bg-background p-4 text-sm text-muted-foreground">
                Ajoutez des pizzas pour voir le récapitulatif et le total.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {PIZZAS.filter((pizza) => (quantities[pizza.id] ?? 0) > 0).map((pizza) => (
                  <li key={pizza.id} className="flex items-start justify-between gap-3 text-sm">
                    <span>
                      <strong>{quantities[pizza.id]}×</strong> {pizza.name}
                    </span>
                    <span className="font-bold">
                      {formatEuros((quantities[pizza.id] ?? 0) * pizza.priceCents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
              <span className="font-bold">Total</span>
              <span className="font-display text-3xl font-bold text-primary">
                {formatEuros(totalCents)}
              </span>
            </div>

            <p className="mt-3 flex items-start gap-2 rounded-xl bg-accent/10 p-3 text-xs text-accent-foreground/90">
              <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>
                Aucun paiement en ligne. Vous réglerez sur place, en espèces ou par chèque, au
                moment du retrait.
              </span>
            </p>

            {submitError && (
              <p
                role="alert"
                className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive"
              >
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 w-full rounded-full bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Enregistrement…" : "Valider ma réservation"}
            </button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Réservation possible jusqu'au {EVENT.orderDeadlineLabel}.
            </p>
          </div>
        </aside>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link
          to="/"
          className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>
      </p>
    </main>
  );
}

function Confirmation({ reservation, onNew }: { reservation: Reservation; onNew: () => void }) {
  const firstName = reservation.customerName.split(" ")[0] ?? reservation.customerName;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl bg-card p-6 text-center shadow-xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="mt-4 text-3xl font-bold text-primary">Réservation enregistrée !</h1>
        <p className="mt-2 text-muted-foreground">
          Merci {firstName} ! Votre commande est bien notée. Présentez ce numéro le soir de la
          soirée.
        </p>

        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Votre numéro de réservation
        </p>
        <p className="font-display text-4xl font-bold tracking-wider text-primary">
          {reservation.reference}
        </p>

        <div className="mt-6 rounded-2xl bg-background p-4 text-left">
          <h2 className="font-bold">Récapitulatif</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {reservation.items.map((item) => (
              <li key={item.pizzaId} className="flex justify-between gap-3">
                <span>
                  <strong>{item.quantity}×</strong> {item.name}
                </span>
                <span className="font-bold">
                  {formatEuros(item.quantity * item.unitPriceCents)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-border pt-3 font-bold">
            <span>Total à régler sur place</span>
            <span className="text-primary">{formatEuros(reservation.totalCents)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-1 rounded-2xl bg-accent/10 p-4 text-left text-sm">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-accent" />
            <span>
              <strong>Date :</strong> {EVENT.dateLabel}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" />
            <span>
              <strong>Retrait :</strong> {formatSlot(reservation.pickupSlot)}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" />
            <span>
              <strong>Lieu :</strong> {EVENT.locationName}
            </span>
          </p>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Le paiement se fait sur place, en espèces ou par chèque. Aucune somme n'a été débitée.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary/20 px-6 py-3 font-bold text-primary transition hover:border-primary/40"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow transition hover:scale-[1.02]"
          >
            Faire une autre réservation
          </button>
        </div>
      </div>
    </main>
  );
}
