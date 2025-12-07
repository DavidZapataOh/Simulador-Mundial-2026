import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainNav } from "@/components/layout/MainNav";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mundial 2026 Simulador | Crea tu predicción",
    template: "%s | Mundial 2026 Simulador",
  },
  description:
    "Predice el Mundial 2026. Elige tus ganadores desde la fase de grupos hasta la final y comparte tu predicción con el mundo.",
  keywords: [
    "Mundial 2026",
    "World Cup 2026",
    "FIFA",
    "predicción",
    "simulador",
    "bracket",
    "fútbol",
  ],
  authors: [{ name: "Mundial 2026 Simulator" }],
  openGraph: {
    type: "website",
    locale: "es_LA",
    siteName: "Mundial 2026 Simulador",
    title: "Mundial 2026 Simulador | Crea tu predicción",
    description:
      "Predice el Mundial 2026. Elige tus ganadores desde la fase de grupos hasta la final.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mundial 2026 Simulador",
    description: "Crea y comparte tu predicción del Mundial 2026",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <MainNav />
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
