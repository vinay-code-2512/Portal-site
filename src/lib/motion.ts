import type { Transition } from "framer-motion";

/** GPU-friendly scroll reveal: opacity + translateY */
export const hiddenReveal = { opacity: 0, y: 28 };
export const hiddenRevealUp = { opacity: 0, y: -22 };
export const hiddenRevealSubtle = { opacity: 0, y: 18 };
export const visibleReveal = { opacity: 1, y: 0 };

/** Triggers slightly before entering viewport; fires once for perf */
export const viewportReveal = {
  once: true as const,
  margin: "-64px 0px -40px 0px",
  amount: 0.18,
};

/** Smooth ease-out; avoids heavy spring chains on scroll */
export const transitionReveal: Transition = {
  duration: 0.52,
  ease: [0.22, 1, 0.36, 1],
};

/** Shorter reveal for smaller elements */
export const transitionRevealShort: Transition = {
  duration: 0.38,
  ease: [0.22, 1, 0.36, 1],
};

/** Premium smooth transition with slight overshoot feel */
export const transitionPremium: Transition = {
  duration: 0.45,
  ease: [0.34, 1.56, 0.64, 1],
};

/** Snappy tap feedback */
export const transitionTap: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 28,
};

/** Subtle scale for hover states */
export const transitionScale: Transition = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1],
};

/** Card hover: smooth lift with shadow */
export const cardHoverLift = {
  y: -6,
  boxShadow: "0 16px 48px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 240, 255, 0.08), 0 0 80px rgba(181, 0, 255, 0.04)",
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

/** Image zoom hover variant */
export const imageZoomHover = {
  scale: 1.04,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

export function staggerDelay(index: number, step = 0.08) {
  return index * step;
}
