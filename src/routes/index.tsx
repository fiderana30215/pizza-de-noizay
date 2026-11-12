import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, CreditCard, MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";

import background from "@/assets/pizzafond1.png";
import quatreFromagesImage from "@/assets/pizzamiel.png";


import reginaImage from "@/assets/pizzaregina.png";
import whatsappImageOne from "@/assets/WhatsApp Image 2026-11-11 at 09.27.32.jpeg";
import whatsappImageTwo from "@/assets/WhatsApp Image 2026-11-11 at 09.27.33.jpeg";
import { PageBackground } from "@/components/page-background";
import { Reveal } from "@/components/reveal";
import { EVENT, PIZZAS, formatEuros } from "@/lib/event";

const PIZZA_IMAGES: Record<string, { src: string; webp?: string }> = {
  "quatre-fromages": { src: quatreFromagesImage },

  regina: { src: reginaImage },
};

const MENU_GALLERY = [whatsappImageOne, whatsappImageTwo] as const;

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
  const [selectedPhoto, setSelectedPhoto] = useState<{
    src: string;
    alt: string;
    caption: string;
  } | null>(null);

  useEffect(() => {
    if (!selectedPhoto) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedPhoto(null);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPhoto]);

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
        <section className="w-full px-3 py-6 sm:px-6 lg:px-5 lg:py-8">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal className="rounded-3xl bg-card p-4 shadow-md sm:p-5">
              <p className="font-script text-xl text-accent">Le menu</p>
              <h2 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">Pizzas à 12 € et 13 €</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Deux pizzas au choix, préparées par la boulangerie. Commande en ligne, retrait sur
                place.
              </p>

              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {PIZZAS.map((pizza, index) => {
                  const image = PIZZA_IMAGES[pizza.id];

                  return (
                    <Reveal
                      as="li"
                      key={pizza.id}
                      delay={index * 100}
                      className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
                    >
                      {image && (
                        <picture className="block">
                          {image.webp && <source srcSet={image.webp} type="image/webp" />}
                          <img
                            src={image.src}
                            alt={`Pizza ${pizza.name}`}
                            className="aspect-square w-full object-cover object-center contrast-[1.08] saturate-[1.2] brightness-[1.05]"
                            style={{ objectPosition: "center 18%" }}
                            loading="lazy"
                            decoding="async"
                          />
                        </picture>
                      )}

                      <div className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-bold text-primary">{pizza.name}</h3>
                          <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
                            {formatEuros(pizza.priceCents)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{pizza.description}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </ul>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  to="/reserver"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow transition hover:scale-105"
                >
                  Commander
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-xs text-muted-foreground">
                  Réservation possible jusqu'au {EVENT.orderDeadlineLabel}.
                </p>
              </div>
            </Reveal>

            <Reveal className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(195,126,77,0.18),transparent_55%),linear-gradient(145deg,#17211f,#101715_68%,#0b1110)] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.32)] sm:p-5">
              <div className="flex items-start justify-between gap-3 px-1">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">
                    Souvenirs de la soirée
                  </p>
                  <h2 className="mt-1 font-script text-2xl text-accent sm:text-3xl">
                    Nos moments
                  </h2>
                </div>
                <span className="mt-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75">
                  Noizay · 2025
                </span>
              </div>

              <div className="relative mt-3 min-h-[390px] overflow-hidden rounded-2xl bg-white/[0.025] sm:min-h-[500px] lg:min-h-[580px]">
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(255,255,255,0.07),transparent_65%)]"
                />

                <button
                  type="button"
                  aria-label="Agrandir la photo : Un beau moment"
                  onClick={() =>
                    setSelectedPhoto({
                      src: MENU_GALLERY[0],
                      alt: "Un moment partagé pendant la soirée pizza",
                      caption: "Un beau moment",
                    })
                  }
                  className="absolute left-[2%] top-[18%] z-10 w-[62%] rotate-[-7deg] bg-[#fffdf8] p-2 pb-9 text-left shadow-[0_18px_34px_rgba(0,0,0,0.42)] transition-transform duration-300 hover:z-30 hover:rotate-[-3deg] hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:left-[4%] sm:top-[14%] sm:w-[60%] sm:p-3 sm:pb-12"
                >
                  <img
                    src={MENU_GALLERY[0]}
                    alt="Un moment partagé pendant la soirée pizza"
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="absolute inset-x-2 bottom-2 text-center font-script text-base text-[#30352f] sm:bottom-3 sm:text-xl">
                    Un beau moment
                  </span>
                </button>

                <button
                  type="button"
                  aria-label="Agrandir la photo : Pizza et convivialité"
                  onClick={() =>
                    setSelectedPhoto({
                      src: MENU_GALLERY[1],
                      alt: "Les invités réunis autour d'une pizza",
                      caption: "Pizza & convivialité",
                    })
                  }
                  className="absolute right-[2%] top-[8%] z-20 w-[62%] rotate-[6deg] bg-[#fffdf8] p-2 pb-9 text-left shadow-[0_20px_38px_rgba(0,0,0,0.48)] transition-transform duration-300 hover:rotate-[2deg] hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:right-[4%] sm:top-[7%] sm:w-[60%] sm:p-3 sm:pb-12"
                >
                  <img
                    src={MENU_GALLERY[1]}
                    alt="Les invités réunis autour d'une pizza"
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="absolute inset-x-2 bottom-2 text-center font-script text-base text-[#30352f] sm:bottom-3 sm:text-xl">
                    Pizza & convivialité
                  </span>
                </button>
              </div>

            </Reveal>
          </div>
        </section>
      </PageBackground>

      {selectedPhoto && (
        <div
          className="photo-lightbox-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={selectedPhoto.caption}
        >
          <button
            type="button"
            aria-label="Fermer la photo agrandie"
            onClick={() => setSelectedPhoto(null)}
            className="absolute inset-0 cursor-zoom-out"
          />
          <div className="photo-lightbox-image relative z-10 max-h-[92vh] max-w-[94vw] bg-[#fffdf8] p-3 pb-12 shadow-2xl sm:p-4 sm:pb-14">
            <img
              src={selectedPhoto.src}
              alt={selectedPhoto.alt}
              className="max-h-[78vh] max-w-[88vw] object-contain"
            />
            <p className="absolute inset-x-2 bottom-2 text-center font-script text-xl text-[#30352f] sm:bottom-3 sm:text-2xl">
              {selectedPhoto.caption}
            </p>
          </div>
          <button
            type="button"
            aria-label="Fermer la photo agrandie"
            onClick={() => setSelectedPhoto(null)}
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white transition hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-6 sm:top-6"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </main>
  );
}
