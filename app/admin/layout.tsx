import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin NVD",
  description: "Espace d'administration sécurisé NVD."
};

export default function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
