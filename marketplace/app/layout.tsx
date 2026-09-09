import type { Metadata } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-public-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Registro Pet/Vet Chile",
    template: "%s | Registro Pet/Vet Chile",
  },
  description:
    "Registro curado de veterinarias, pet shops, grooming, nutrición y servicios para mascotas en Chile. Cada ficha revisada antes de publicarse.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" className={`${fraunces.variable} ${publicSans.variable}`}>
      <body className="min-h-screen flex flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:bg-tinta focus:px-4 focus:py-2 focus:text-papel"
        >
          Saltar al contenido
        </a>

        <header className="border-b-2 border-tinta bg-tinta text-papel">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Link href="/" className="group flex items-baseline gap-3">
              <span className="folio-type text-xl leading-none sm:text-2xl">
                Registro Pet<span className="text-sello-tenue">/</span>Vet
              </span>
              <span className="rotulo text-papel/70">Chile</span>
            </Link>

            <nav aria-label="Principal" className="flex items-center gap-1 text-sm">
              <Link
                href="/sumar-negocio"
                className="border border-papel/35 px-3 py-2 hover:bg-papel hover:text-tinta"
              >
                Sumar mi negocio
              </Link>
              <Link
                href="/admin/revision"
                className="px-3 py-2 text-papel/75 hover:text-papel hover:underline"
              >
                Revisión
              </Link>
            </nav>
          </div>
        </header>

        <main id="contenido" className="flex-1">
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}
