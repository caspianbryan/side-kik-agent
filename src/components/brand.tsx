import { cn } from "@/lib/utils";

/**
 * Zola mark: a chat bubble carrying a single-stroke "Z" — a conversation that
 * turns into a completed task. Bubble uses the brass accent; the Z is cut in the
 * background colour so it reads in both themes.
 */
export function ZolaMark({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7 shrink-0", className)}>
      <path
        d="M10 4h12a7 7 0 0 1 7 7v6a7 7 0 0 1-7 7h-8.6l-5.3 3.9c-.7.5-1.6 0-1.6-.8v-3.9A7 7 0 0 1 3 17v-6a7 7 0 0 1 7-7Z"
        className={cn("fill-primary", animated && "zola-bubble")}
      />
      <path
        d="M11 9.5h10l-10 9h10"
        fill="none"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("stroke-primary-foreground", animated && "zola-stroke")}
        pathLength={1}
      />
    </svg>
  );
}

export function ZolaLogo({ collapsed = false, animated = false, className }: { collapsed?: boolean; animated?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <ZolaMark animated={animated} />
      <span
        className={cn(
          "font-display text-[1.375rem] leading-none tracking-[-0.01em] transition-opacity duration-150",
          collapsed && "sr-only",
        )}
      >
        Zola
      </span>
    </span>
  );
}
