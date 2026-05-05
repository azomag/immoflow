import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/shared/SmoothScroll";
import { I18nProvider } from "@/lib/i18n";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Immoflow | Rental management and public listings platform",
  description:
    "Immoflow helps agencies, tenants, and administrations manage listings, rental workflows, and public housing visibility from one platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${dmSans.variable} ${playfair.variable} ${spaceMono.variable} font-sans antialiased bg-background text-foreground selection:bg-primary selection:text-white`}
      >
        <I18nProvider>
          <SmoothScroll>
            {children}
          </SmoothScroll>
        </I18nProvider>
      </body>
    </html>
  );
}
