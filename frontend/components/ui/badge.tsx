import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        neutral:
          "bg-[rgba(1,58,99,0.06)] text-[var(--muted-foreground)] border border-[rgba(1,58,99,0.12)]",
        primary:
          "bg-[rgba(1,73,124,0.12)] text-[var(--primary)] border border-[rgba(1,73,124,0.22)]",
        success:
          "bg-[rgba(22,163,74,0.12)] text-[var(--success)] border border-[rgba(22,163,74,0.24)]",
        warning:
          "bg-[rgba(217,119,6,0.12)] text-[var(--warning)] border border-[rgba(217,119,6,0.24)]",
        danger:
          "bg-[rgba(220,38,38,0.12)] text-[var(--danger)] border border-[rgba(220,38,38,0.24)]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
