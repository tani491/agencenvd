"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ImagePlus, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

const adminLinks = [
  {
    href: "/admin/dashboard/quotes",
    label: "Devis",
    icon: Inbox
  },
  {
    href: "/admin/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3
  },
  {
    href: "/admin/dashboard/cms",
    label: "CMS médias",
    icon: ImagePlus
  }
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {adminLinks.map((link) => {
        const Icon = link.icon;
        const active = pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
              active
                ? "bg-nvd-blue-primary text-white"
                : "text-slate-700 hover:bg-slate-100 hover:text-nvd-blue-dark"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
