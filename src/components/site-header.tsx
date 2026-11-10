import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

const navLink =
  "rounded-full px-2.5 py-1.5 text-[13px] font-bold text-foreground/70 transition hover:bg-card hover:text-primary sm:px-3 sm:py-2 sm:text-sm";
const navLinkActive = `${navLink} bg-card text-primary shadow-sm`;

const overlayNavLink =
  "rounded-full px-2.5 py-1.5 text-[13px] font-bold text-white/85 transition hover:bg-white/15 hover:text-white sm:px-3 sm:py-2 sm:text-sm";
const overlayNavLinkActive = `${overlayNavLink} bg-white/20 text-white shadow-sm`;

export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isHome = pathname === "/";
  // Les pages avec photo de fond utilisent un en-tête sombre pour rester lisibles.
  const isOverlay = isHome || pathname.startsWith("/reserver") || pathname.startsWith("/caisse");

  return (
    <header
      className={cn(
        "z-40 border-b backdrop-blur",
        isHome
          ? "absolute inset-x-0 top-0 border-white/10 bg-black/70 shadow-lg shadow-black/30"
          : "sticky top-0",
        isOverlay ? "border-white/10 bg-black/80" : "border-border/70 bg-background/90",
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 sm:px-6 sm:py-3">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-2 font-slab text-base font-extrabold tracking-tight sm:text-lg",
            isOverlay ? "text-white" : "text-primary",
          )}
        >
          <span aria-hidden className="text-2xl">
            🍕
          </span>
          <span>
            Pizza Night <span className="text-accent">Noizay</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <nav aria-label="Navigation principale" className="flex items-center gap-1">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              className={isOverlay ? overlayNavLink : navLink}
              activeProps={{ className: isOverlay ? overlayNavLinkActive : navLinkActive }}
            >
              Accueil
            </Link>
            <Link
              to="/reserver"
              className={isOverlay ? overlayNavLink : navLink}
              activeProps={{ className: isOverlay ? overlayNavLinkActive : navLinkActive }}
            >
              Réserver
            </Link>
          </nav>

          <span
            aria-hidden
            className={cn("mx-1 h-5 w-px", isOverlay ? "bg-white/30" : "bg-border")}
          />

          <Link
            to="/caisse"
            className={isOverlay ? overlayNavLink : navLink}
            activeProps={{ className: isOverlay ? overlayNavLinkActive : navLinkActive }}
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
