import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-3xl",
} as const;

interface LogoProps {
  /** Controls the wordmark font size. */
  size?: keyof typeof sizeMap;
  className?: string;
}

/**
 * DealRoom wordmark — a typographic logo set in Clash Display, with the
 * second half ("Room.") in the theme accent colour. Use anywhere the brand
 * needs to appear.
 */
export function Logo({ size = "md", className }: LogoProps) {
  return (
    <span
      aria-label="DealRoom"
      className={cn(
        "font-logo font-bold tracking-tight leading-none select-none",
        sizeMap[size],
        className
      )}
      style={{ color: "var(--text-primary)" }}
    >
      Deal
      <span style={{ color: "var(--accent)" }}>Room.</span>
    </span>
  );
}
