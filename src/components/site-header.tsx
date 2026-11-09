import { Link } from "@tanstack/react-router";

const navLink =
  "rounded-full px-3 py-2 text-sm font-bold text-foreground/70 transition hover:bg-card hover:text-primary";
const navLinkActive = `${navLink} bg-card text-primary shadow-sm`;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-lg font-bold text-primary"
        >
          <span aria-hidden className="text-2xl">
            🍕
          </span>
          <span>
            Pizza Night <span className="text-accent">Noisette</span>
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="flex items-center gap-1">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className={navLink}
            activeProps={{ className: navLinkActive }}
          >
            Accueil
          </Link>
          <Link to="/reserver" className={navLink} activeProps={{ className: navLinkActive }}>
            Réserver
          </Link>
          <Link to="/caisse" className={navLink} activeProps={{ className: navLinkActive }}>
            Caisse
          </Link>
        </nav>
      </div>
    </header>
  );
}
