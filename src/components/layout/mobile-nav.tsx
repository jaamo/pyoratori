"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, Plus, MessageSquare, User, LogOut, Home, Bike, BookOpen, KeyRound, ShoppingBag } from "lucide-react";
import { useEffect } from "react";

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  unreadCount: number;
};

export function MobileNav({
  open,
  onClose,
  isLoggedIn,
  unreadCount,
}: MobileNavProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
      <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Valikko</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Separator className="my-4" />

        <nav className="flex flex-col gap-2">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            onClick={onClose}
          >
            <Home className="h-4 w-4" />
            Etusivu
          </Link>
          <Link
            href="/haku"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            onClick={onClose}
          >
            <Bike className="h-4 w-4" />
            Pyörät
          </Link>
          <Link
            href="/tietopankki"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            onClick={onClose}
          >
            <BookOpen className="h-4 w-4" />
            Tietopankki
          </Link>

          {isLoggedIn ? (
            <>
              <Link
                href="/ilmoitus/uusi"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                onClick={onClose}
              >
                <Plus className="h-4 w-4" />
                Uusi ilmoitus
              </Link>
              <Link
                href="/viestit"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                onClick={onClose}
              >
                <MessageSquare className="h-4 w-4" />
                Viestit
                {unreadCount > 0 && (
                  <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profiili"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                onClick={onClose}
              >
                <ShoppingBag className="h-4 w-4" />
                Omat tuotteet
              </Link>
              <Link
                href="/vaihda-salasana"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                onClick={onClose}
              >
                <KeyRound className="h-4 w-4" />
                Vaihda salasana
              </Link>

              <Separator className="my-2" />

              <button
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                onClick={() => {
                  onClose();
                  signOut({ callbackUrl: "/" });
                }}
              >
                <LogOut className="h-4 w-4" />
                Kirjaudu ulos
              </button>
            </>
          ) : (
            <>
              <Link
                href="/kirjaudu"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                onClick={onClose}
              >
                Kirjaudu
              </Link>
              <Link
                href="/rekisteroidy"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                onClick={onClose}
              >
                Rekisteröidy
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
