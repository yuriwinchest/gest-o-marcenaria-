import type { Metadata } from "next";
import "./globals.css";
import { AuthGuard } from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "Gestão de Marcenaria",
  description: "Sistema de gestão financeira para marcenaria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="gm-bg">
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}

