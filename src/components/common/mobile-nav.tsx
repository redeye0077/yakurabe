"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type NavLink = {
  href: string;
  label: string;
};

type MobileNavProps = {
  navLinks: NavLink[];
};

export function MobileNav({ navLinks }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            aria-label="メニューを開く"
            className="-mr-2 p-2 text-brand-cream md:hidden"
          />
        }
      >
        <Menu className="size-6" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="border-brand-cream/10 bg-brand-green text-brand-cream [&_[data-slot=sheet-close]]:text-brand-cream"
      >
        <SheetHeader>
          <SheetTitle className="sr-only">メニュー</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-6 px-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "text-base transition-colors",
                  isActive
                    ? "font-bold text-brand-cream"
                    : "text-brand-cream/70 hover:text-brand-cream",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
