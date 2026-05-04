import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        neutral:
          "bg-[rgba(237,224,212,0.55)] text-[var(--muted-foreground)] border border-[rgba(127,85,57,0.12)]",
        primary:
          "bg-[rgba(237,224,212,0.55)] text-[var(--primary)] border border-[rgba(127,85,57,0.12)]",
        success:
          "bg-[rgba(237,224,212,0.55)] text-[var(--success)] border border-[rgba(127,85,57,0.12)]",
        warning:
          "bg-[rgba(237,224,212,0.55)] text-[var(--warning)] border border-[rgba(127,85,57,0.12)]",
        danger:
          "bg-[rgba(237,224,212,0.55)] text-[var(--danger)] border border-[rgba(127,85,57,0.12)]",
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
