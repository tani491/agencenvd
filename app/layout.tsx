import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NVD - Nettoyage vapeur et désinfection au Sénégal",
  description:
    "NVD nettoie et désinfecte fauteuils, matelas, tapis, véhicules et locaux au Sénégal avec une méthode vapeur écologique."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
