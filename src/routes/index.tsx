import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  HeartHandshake,
  Leaf,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";

import hero from "@/assets/pizza-hero.jpg";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EVENT, PIZZAS, formatEuros } from "@/lib/event";

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

const steps = [
  {
    icon: "📝",
    title: "Je réserve",
    description:
      "Je choisis mes pizzas et mon créneau de retrait en ligne. Aucun paiement demandé.",
  },
  {
    icon: "🍕",
    title: "On prépare",
    description: "Les bénévoles préparent les pizzas le soir même, avec les bons ingrédients.",
  },
  {
    icon: "🏫",
    title: "L'école gagne",
    description: "Tous les bénéfices de la soirée sont reversés aux projets de l'école.",
  },
];

const faqs = [
  {
    question: "Dois-je payer en ligne ?",
    answer:
      "Non. La réservation est gratuite et le paiement se fait sur place, le soir de la soirée, en espèces ou par chèque. Votre commande est simplement mise de côté.",
  },
  {
    question: "Comment récupérer ma commande ?",
    answer:
      "Choisissez un créneau de retrait lors de la réservation. Le soir venu, présentez votre numéro de réservation à l'accueil : votre commande sera prête.",
  },
  {
    question: "Puis-je commander pour plusieurs familles ?",
    answer:
      "Oui, vous pouvez regrouper plusieurs familles dans une même commande. Indiquez simplement les quantités souhaitées. Une commande par famille est plus simple pour le suivi.",
  },
  {
    question: "Et les allergies ou régimes particuliers ?",
    answer:
      "Précisez-les dans le champ « Remarques » du formulaire. Les pizzas végétariennes sont indiquées dans le menu. Pour une allergie sévère, contactez un parent bénévole avant la soirée.",
  },
  {
    question: "Puis-je annuler ou modifier ma commande ?",
    answer:
      "Jusqu'à la date limite de réservation, contactez un parent bénévole avec votre numéro de réservation. Après cette date, les commandes sont transmises au fournisseur.",
  },
];

function Index() {
  return (
    <main>
      <div className="checker h-6" />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 md:grid-cols-2">
        <div>
          <p className="font-bold uppercase tracking-widest text-accent">
            École · Soirée solidaire
          </p>
          <h1 className="mt-3 text-5xl font-bold leading-tight text-primary md:text-7xl">
            Soirée Pizza <span className="wobble inline-block">🍕</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Venez partager une bonne pizza en famille ! Chaque part aide à financer les projets de
            l'école. Réservez en ligne, payez sur place.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold">
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-sm">
              <CalendarDays className="h-4 w-4 text-accent" />
              {EVENT.dateLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-sm">
              <MapPin className="h-4 w-4 text-accent" />
              {EVENT.locationName}
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/reserver"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-lg transition hover:scale-105"
            >
              Réserver mes pizzas
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#menu"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary/20 bg-card px-6 py-4 font-bold text-primary transition hover:border-primary/40"
            >
              Voir le menu
            </a>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            Réservation sans paiement en ligne.
          </p>
        </div>

        <img
          src={hero}
          alt="Pizzas pour la soirée de l'école"
          className="w-full rotate-2 rounded-3xl border-8 border-card shadow-2xl"
        />
      </section>

      <section className="border-y border-border/60 bg-card/70 py-8">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 sm:grid-cols-3">
          <InfoCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="La date"
            value={EVENT.dateLabel}
          />
          <InfoCard
            icon={<Clock className="h-5 w-5" />}
            label="Les retraits"
            value={EVENT.timeLabel}
          />
          <InfoCard
            icon={<MapPin className="h-5 w-5" />}
            label="Le lieu"
            value={`${EVENT.locationName} · ${EVENT.locationDetail}`}
          />
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-bold uppercase tracking-widest text-accent">Le menu</p>
          <h2 className="mt-2 text-4xl font-bold md:text-5xl">Des pizzas pour toute la famille</h2>
          <p className="mt-3 text-muted-foreground">
            Toutes les pizzas sont préparées sur place par les bénévoles. Prix par pizza, à régler
            sur place le soir de la soirée.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PIZZAS.map((pizza) => (
            <article
              key={pizza.id}
              className="flex flex-col rounded-3xl bg-card p-6 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <span aria-hidden className="text-5xl">
                  {pizza.emoji}
                </span>
                {pizza.vegetarian && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                    <Leaf className="h-3 w-3" />
                    Végé
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-2xl font-bold text-primary">{pizza.name}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{pizza.description}</p>
              <p className="mt-4 text-xl font-bold">{formatEuros(pizza.priceCents)}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/reserver"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-lg transition hover:scale-105"
          >
            Composer ma commande
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-center text-4xl font-bold">Comment ça marche ?</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="rounded-3xl bg-card p-8 text-center shadow-md">
              <div aria-hidden className="text-5xl">
                {step.icon}
              </div>
              <h3 className="mt-3 text-2xl font-bold text-primary">{step.title}</h3>
              <p className="mt-2 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-accent px-6 py-14 text-accent-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="flex items-center gap-2 font-bold uppercase tracking-widest">
              <HeartHandshake className="h-5 w-5" />
              Une soirée qui a du sens
            </p>
            <h2 className="mt-3 text-4xl font-bold md:text-5xl">
              On mange bien, l'école en profite.
            </h2>
            <p className="mt-4 max-w-xl text-accent-foreground/90">
              L'objectif est simple : passer un bon moment ensemble et financer les projets des
              enfants. Le prix des pizzas couvre les ingrédients, et chaque bénéfice est reversé à
              l'école.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SolidarityStat
              icon={<Users className="h-5 w-5" />}
              value="Toutes les familles"
              label="sont les bienvenues"
            />
            <SolidarityStat
              icon={<Sparkles className="h-5 w-5" />}
              value="100 %"
              label="des bénéfices pour l'école"
            />
            <SolidarityStat
              icon={<CheckCircle2 className="h-5 w-5" />}
              value="Zéro"
              label="paiement en ligne"
            />
            <SolidarityStat
              icon={<Clock className="h-5 w-5" />}
              value="6 créneaux"
              label="de retrait au choix"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center">
          <p className="font-bold uppercase tracking-widest text-accent">Questions fréquentes</p>
          <h2 className="mt-2 text-4xl font-bold">Tout ce qu'il faut savoir</h2>
        </div>
        <Accordion type="single" collapsible className="mt-8 rounded-3xl bg-card px-6 shadow-md">
          {faqs.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger className="text-base font-bold">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section id="reserver" className="bg-primary px-6 py-16 text-center text-primary-foreground">
        <h2 className="text-4xl font-bold md:text-5xl">On vous attend !</h2>
        <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
          Réservez avant le {EVENT.orderDeadlineLabel} pour être sûr d'avoir vos pizzas. Les
          commandes sont limitées pour que tout le monde soit servi.
        </p>
        <Link
          to="/reserver"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground px-8 py-4 font-bold text-primary shadow-lg transition hover:scale-105"
        >
          Réserver maintenant
          <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

      <div className="checker h-6" />
    </main>
  );
}

function InfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-background/70 p-4">
      <span className="mt-0.5 text-accent">{icon}</span>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-bold">{value}</p>
      </div>
    </div>
  );
}

function SolidarityStat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-accent-foreground/10 p-4 backdrop-blur">
      <span className="text-accent-foreground">{icon}</span>
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="text-sm text-accent-foreground/80">{label}</p>
    </div>
  );
}
