import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, CreditCard, MapPin } from "lucide-react";

import background from "@/assets/pizzafond1.png";
import chevreMielImage from "@/assets/pizzamiel.png";
import chevreMielWebp from "@/assets/pizzamiel.webp";
import reginaImage from "@/assets/pizzaregina.png";
import reginaWebp from "@/assets/pizzaregina.webp";
import { PageBackground } from "@/components/page-background";
import { Reveal } from "@/components/reveal";
import { EVENT, PIZZAS, formatEuros } from "@/lib/event";

const PIZZA_IMAGES: Record<string, { src: string; webp: string }> = {
  "chevre-miel": { src: chevreMielImage, webp: chevreMielWebp },
  regina: { src: reginaImage, webp: reginaWebp },
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soirée Pizza solidaire de l'école · Noizay" },
      {
        name: "description",
        content:
          "Réservez vos pizzas pour la soirée solidaire de l'école : tous les bénéfices sont reversés à l'école. Commande en ligne, paiement sur place.",
      },
      { property: "og:title", content: "Soirée Pizza solidaire de l'école · Noizay" },
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
    <main>
      <section
        className="grain relative flex min-h-dvh items-center bg-cover px-4 pb-16 pt-28 sm:px-6 lg:px-10"
        style={{ backgroundImage: `url(${background})`, backgroundPosition: "center 20%" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/80 to-black/60 sm:from-black/80 sm:via-black/40 sm:to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25"
        />

        <div className="relative z-10 w-full max-w-3xl text-left">
          <Reveal as="p" className="font-script text-xl text-accent drop-shadow sm:text-2xl">
            École · Soirée solidaire
          </Reveal>
          <Reveal as="h1" className="mt-2 drop-shadow-lg" delay={90}>
            <span className="block font-display text-4xl font-semibold italic leading-none text-white sm:text-5xl lg:text-6xl">
              Soirée
            </span>
            <span className="mt-1 block font-slab text-6xl font-black uppercase leading-[0.9] tracking-tight text-primary sm:text-7xl lg:text-8xl">
              Pizza
            </span>
          </Reveal>
          <Reveal
            as="p"
            className="mt-2 font-script text-2xl text-white drop-shadow sm:text-3xl"
            delay={180}
          >
            solidaire <span className="wobble inline-block">🍕</span>
          </Reveal>
          <Reveal
            as="p"
            className="mt-4 max-w-xl text-base text-white/95 drop-shadow sm:mt-5 sm:text-lg"
            delay={260}
          >
            Venez partager une bonne pizza en famille ! Chaque part aide à financer les projets de
            l'école. Réservez en ligne, payez sur place.
          </Reveal>

          <Reveal
            className="mt-5 flex flex-wrap justify-start gap-2 text-sm font-bold sm:mt-6"
            delay={340}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-sm">
              <CalendarDays className="h-4 w-4 text-accent" />
              {EVENT.dateLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-sm">
              <MapPin className="h-4 w-4 text-accent" />
              {EVENT.locationName}
            </span>
          </Reveal>

          <Reveal className="mt-6 flex flex-wrap justify-start gap-3 sm:mt-8" delay={420}>
            <Link
              to="/reserver"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-lg transition hover:scale-105 sm:px-8 sm:py-4 sm:text-lg"
            >
              Réserver mes pizzas
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Reveal>
          <Reveal
            as="p"
            className="mt-3 flex items-start gap-2 text-sm text-white/90 drop-shadow"
            delay={500}
          >
            <CreditCard className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Paiement : espèces ou carte bancaire, sur place au moment du retrait.</span>
          </Reveal>
        </div>
      </section>

      <PageBackground>
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <Reveal className="rounded-3xl bg-card p-6 shadow-md sm:p-8">
            <p className="font-script text-xl text-accent">Le menu</p>
            <h2 className="mt-1 text-3xl font-bold text-primary sm:text-4xl">Pizzas à 12 €</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Deux pizzas au choix, préparées par la boulangerie. Commande en ligne, retrait sur
              place.
            </p>

            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {PIZZAS.map((pizza, index) => {
                const image = PIZZA_IMAGES[pizza.id];

                return (
                  <Reveal
                    as="li"
                    key={pizza.id}
                    delay={index * 130}
                    className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
                  >
                    {image && (
                      <picture className="block">
                        <source srcSet={image.webp} type="image/webp" />
                        <img
                          src={image.src}
                          alt={`Pizza ${pizza.name}`}
                          className="aspect-square w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </picture>
                    )}

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xl font-bold text-primary">{pizza.name}</h3>
                        <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                          {formatEuros(pizza.priceCents)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{pizza.description}</p>
                    </div>
                  </Reveal>
                );
              })}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                to="/reserver"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow transition hover:scale-105"
              >
                Commander
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-sm text-muted-foreground">
                Réservation possible jusqu'au {EVENT.orderDeadlineLabel}.
              </p>
            </div>
          </Reveal>
        </section>
      </PageBackground>
    </main>
  );
}
