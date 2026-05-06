"use client";

import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { SmoothScroll } from "@/components/shared/SmoothScroll";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>
        <TooltipProvider delayDuration={300}>
          <SmoothScroll>{children}</SmoothScroll>
        </TooltipProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
