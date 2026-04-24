import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        neutral: "bg-white/80 text-[var(--foreground)]",
        success: "bg-[rgba(47,143,98,0.14)] text-[var(--success)]",
        warning: "bg-[rgba(210,138,30,0.14)] text-[var(--warning)]",
        danger: "bg-[rgba(186,74,69,0.14)] text-[var(--danger)]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
