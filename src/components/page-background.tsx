import type { ReactNode } from "react";

import backgroundPng from "@/assets/pizzafond2.png";
import backgroundWebp from "@/assets/pizzafond2.webp";

/**
 * Fond commun aux pages réservation et admin : photo + dégradé noir.
 */
export function PageBackground({ children }: { children: ReactNode }) {
  return (
    <div className="grain relative min-h-[calc(100dvh-4rem)] bg-black">
      <picture className="absolute inset-0 block">
        <source srcSet={backgroundWebp} type="image/webp" />
        <img
          src={backgroundPng}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
          decoding="async"
        />
      </picture>
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
