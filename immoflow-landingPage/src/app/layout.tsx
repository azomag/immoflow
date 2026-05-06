import type { Metadata } from "next";
import { Poppins, Tajawal } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/shared/SmoothScroll";
import { I18nProvider } from "@/lib/i18n";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const tajawal = Tajawal({
  weight: ["300", "400", "500", "700", "800"],
  subsets: ["arabic"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://immoflow-maroc.vercel.app"),
  title: "Immoflow | Rental management and public listings platform",
  description:
    "Immoflow helps agencies, tenants, and administrations manage listings, rental workflows, and public housing visibility from one platform.",
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body
        className={`${poppins.variable} ${tajawal.variable} font-sans antialiased bg-background text-foreground selection:bg-primary selection:text-white`}
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
