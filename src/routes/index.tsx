import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, CreditCard, MapPin } from "lucide-react";

import background from "@/assets/pizzafond1.png";
import { EVENT } from "@/lib/event";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soirée Pizza solidaire de l'école · Caisse de Noisette" },
      {
        name: "description",
        content:
          "Réservez vos pizzas pour la soirée solidaire de l'école : tous les bénéfices sont reversés à l'école. Commande en ligne, paiement sur place.",
      },
      { property: "og:title", content: "Soirée Pizza solidaire de l'école" },
      {
        property: "og:description",
        content:
          "Réservez vos pizzas : tous les bénéfices sont reversés à l'école. Commande en ligne, paiement sur place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main
      className="grain relative flex min-h-dvh items-center bg-cover bg-center px-4 pb-16 pt-28 sm:px-6 lg:px-10"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/25"
      />

      <section className="relative z-10 w-full max-w-3xl text-left">
        <p className="font-script text-xl text-accent drop-shadow sm:text-2xl">
          École · Soirée solidaire
        </p>
        <h1 className="mt-2 drop-shadow-lg">
          <span className="block font-display text-4xl font-semibold italic leading-none text-white sm:text-5xl lg:text-6xl">
            Soirée
          </span>
          <span className="mt-1 block font-slab text-6xl font-black uppercase leading-[0.9] tracking-tight text-primary sm:text-7xl lg:text-8xl">
            Pizza
          </span>
        </h1>
        <p className="mt-2 font-script text-2xl text-white/90 drop-shadow sm:text-3xl">
          solidaire <span className="wobble inline-block">🍕</span>
        </p>
        <p className="mt-4 max-w-xl text-base text-white/85 drop-shadow sm:mt-5 sm:text-lg">
          Venez partager une bonne pizza en famille ! Chaque part aide à financer les projets de
          l'école. Réservez en ligne, payez sur place.
        </p>

        <div className="mt-5 flex flex-wrap justify-start gap-2 text-sm font-bold sm:mt-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-sm">
            <CalendarDays className="h-4 w-4 text-accent" />
            {EVENT.dateLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-sm">
            <MapPin className="h-4 w-4 text-accent" />
            {EVENT.locationName}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap justify-start gap-3 sm:mt-8">
          <Link
            to="/reserver"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-lg transition hover:scale-105 sm:px-8 sm:py-4 sm:text-lg"
          >
            Réserver mes pizzas
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        <p className="mt-3 flex items-center justify-start gap-2 text-sm text-white/75">
          <CreditCard className="h-4 w-4" />
          Réservation sans paiement en ligne.
        </p>
      </section>
    </main>
  );
}
