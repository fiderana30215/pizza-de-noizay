import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type RevealVariant = "up" | "left" | "right" | "zoom";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Balise à rendre (div par défaut). */
  as?: ElementType;
  /** Délai en millisecondes, pour faire apparaître les éléments en cascade. */
  delay?: number;
  variant?: RevealVariant;
};

/**
 * Fait apparaître son contenu au défilement (fondu + léger glissement).
 * Le style initial n'est appliqué que si JavaScript est actif, grâce à la
 * classe `.js` posée sur <html> : le contenu reste donc lisible sans JS.
 */
export function Reveal({
  children,
  className,
  as: Component = "div",
  delay = 0,
  variant = "up",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Component
      ref={ref}
      data-variant={variant}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Component>
  );
}
