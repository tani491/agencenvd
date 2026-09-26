"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type MobileNavLink = {
  label: string;
  href: string;
};

type MobileNavProps = {
  links: ReadonlyArray<MobileNavLink>;
};

export function MobileNav({ links }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = "nvd-mobile-navigation";

  return (
    <div className="relative lg:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-controls={menuId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="border-nvd-blue-dark/15 bg-white text-nvd-blue-dark shadow-sm hover:bg-cyan-50"
      >
        {isOpen ? <X /> : <Menu />}
        <span className="sr-only">Menu</span>
      </Button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            className="fixed inset-x-0 bottom-0 top-20 z-40 cursor-default bg-nvd-blue-dark/10 backdrop-blur-[1px]"
            onClick={() => setIsOpen(false)}
          />
          <nav
            id={menuId}
            className="absolute right-0 top-[calc(100%+0.75rem)] z-50 grid w-[min(calc(100vw-2rem),20rem)] gap-1 rounded-lg border border-slate-200 bg-white p-2 text-nvd-blue-dark shadow-xl"
            aria-label="Navigation mobile"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-4 py-3 text-sm font-black transition-colors hover:bg-cyan-50 hover:text-nvd-blue-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nvd-blue-primary"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
