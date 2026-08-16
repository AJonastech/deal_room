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

/** Dealroom wordmark set in the shared display face with an accent dot. */
export function Logo({ size = "md", className }: LogoProps) {
  return (
    <span
      aria-label="Dealroom"
      className={cn(
        "font-logo font-bold tracking-tight leading-none select-none",
        sizeMap[size],
        className
      )}
      style={{ color: "var(--text-primary)" }}
    >
      Dealroom<span style={{ color: "var(--accent)" }}>.</span>
    </span>
  );
}
