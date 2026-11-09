import { createFileRoute } from "@tanstack/react-router";
import hero from "@/assets/pizza-hero.jpg";

// Lien de réservation (Google Form, etc.) — à remplacer par le vrai lien
const RESERVATION_URL = "#reserver";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soirée Pizza solidaire de l'école" },
      { name: "description", content: "Réservez vos pizzas : tous les bénéfices sont reversés à l'école." },
      { property: "og:title", content: "Soirée Pizza solidaire de l'école" },
      { property: "og:description", content: "Réservez vos pizzas : tous les bénéfices sont reversés à l'école." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  { e: "📝", t: "Je réserve", d: "Je remplis le formulaire avec mes pizzas." },
  { e: "🍕", t: "On prépare", d: "Les pizzas sortent du four le soir même." },
  { e: "🏫", t: "L'école gagne", d: "Tout l'argent récolté est reversé à l'école." },
];

function Index() {
  return (
    <main className="min-h-screen">
      <div className="checker h-6" />
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 md:grid-cols-2">
        <div>
          <p className="font-bold uppercase tracking-widest text-accent">École · Soirée solidaire</p>
          <h1 className="mt-3 text-5xl font-bold leading-tight text-primary md:text-7xl">
            Soirée Pizza <span className="wobble inline-block">🍕</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Venez partager une bonne pizza en famille ! Chaque part aide à financer les projets de l'école.
          </p>
          <a href={RESERVATION_URL} className="mt-8 inline-block rounded-full bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-lg transition hover:scale-105">
            Réserver mes pizzas
          </a>
          <p className="mt-3 text-sm text-muted-foreground">Réservation sans paiement en ligne.</p>
        </div>
        <img src={hero} alt="Pizzas pour la soirée de l'école" className="w-full rotate-2 rounded-3xl border-8 border-card shadow-2xl" />
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-center text-4xl font-bold">Comment ça marche ?</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.t} className="rounded-3xl bg-card p-8 text-center shadow-md">
              <div className="text-5xl">{s.e}</div>
              <h3 className="mt-3 text-2xl font-bold text-primary">{s.t}</h3>
              <p className="mt-2 text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
      <section id="reserver" className="bg-accent px-6 py-16 text-center text-accent-foreground">
        <h2 className="text-4xl font-bold">On vous attend !</h2>
        <p className="mx-auto mt-3 max-w-xl">Date, lieu et menu des pizzas : bientôt annoncés.</p>
        <a href={RESERVATION_URL} className="mt-6 inline-block rounded-full bg-primary px-8 py-4 font-bold text-primary-foreground shadow-lg transition hover:scale-105">
          Réserver maintenant
        </a>
      </section>
      <div className="checker h-6" />
    </main>
  );
}
