import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/tv/AppShell";
import { LibraryProvider } from "@/components/library/LibraryProvider";
import { SpatialNavigationProvider } from "@/components/tv/SpatialNavigation";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "VIVA — TV, esportes e cinema", template: "%s | VIVA" },
  description: "Uma experiência de streaming pensada para a sua sala. Canais ao vivo, esportes, cinema aberto e guia de TV.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#080b0c",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#080b0c] text-white antialiased">
        <SpatialNavigationProvider>
          <LibraryProvider>
            <AppShell>{children}</AppShell>
          </LibraryProvider>
        </SpatialNavigationProvider>
      </body>
    </html>
  );
}
