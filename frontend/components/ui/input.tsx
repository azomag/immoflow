import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-[var(--border)] bg-white/75 px-4 py-2 text-sm outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
