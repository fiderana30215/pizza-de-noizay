import { Link } from "@tanstack/react-router";

import { EVENT } from "@/lib/event";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-card/60 px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-slab text-lg font-extrabold tracking-tight text-primary">
            🍕 Pizza Night Noisette
          </p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Une soirée organisée par les parents d'élèves de la {EVENT.school}. Tous les bénéfices
            sont reversés à l'école.
          </p>
          <Link
            to="/caisse"
            className="mt-3 inline-block text-xs font-bold text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Espace bénévoles (caisse)
          </Link>
        </div>

        <div className="text-sm text-muted-foreground sm:text-right">
          <p className="font-bold text-foreground">{EVENT.dateLabel}</p>
          <p>{EVENT.timeLabel}</p>
          <p>{EVENT.locationName}</p>
        </div>
      </div>
    </footer>
  );
}
