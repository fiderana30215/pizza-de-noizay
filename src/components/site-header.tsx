import { Link, useRouterState } from "@tanstack/react-router";

const navLink =
  "rounded-full px-3 py-2 text-sm font-bold text-foreground/70 transition hover:bg-card hover:text-primary";
const navLinkActive = `${navLink} bg-card text-primary shadow-sm`;

const overlayNavLink =
  "rounded-full px-3 py-2 text-sm font-bold text-white/85 transition hover:bg-white/15 hover:text-white";
const overlayNavLinkActive = `${overlayNavLink} bg-white/20 text-white shadow-sm`;

export function SiteHeader() {
  const isHome = useRouterState({ select: (state) => state.location.pathname === "/" });

  return (
    <header
      className={
        isHome
          ? "absolute inset-x-0 top-0 z-40 border-b border-white/10 bg-background/80 shadow-lg shadow-black/30 backdrop-blur-md"
          : "sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur"
      }
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className={
            isHome
              ? "flex items-center gap-2 font-slab text-lg font-extrabold tracking-tight text-white"
              : "flex items-center gap-2 font-slab text-lg font-extrabold tracking-tight text-primary"
          }
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
            className={isHome ? overlayNavLink : navLink}
            activeProps={{ className: isHome ? overlayNavLinkActive : navLinkActive }}
          >
            Accueil
          </Link>
          <Link
            to="/reserver"
            className={isHome ? overlayNavLink : navLink}
            activeProps={{ className: isHome ? overlayNavLinkActive : navLinkActive }}
          >
            Réserver
          </Link>
          <Link
            to="/caisse"
            className={isHome ? overlayNavLink : navLink}
            activeProps={{ className: isHome ? overlayNavLinkActive : navLinkActive }}
          >
            Caisse
          </Link>
        </nav>
      </div>
    </header>
  );
}
