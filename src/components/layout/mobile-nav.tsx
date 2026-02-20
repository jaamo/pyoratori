"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, MessageSquare, Bell } from "lucide-react";
import { useEffect } from "react";

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  unreadCount: number;
  notificationCount: number;
};

export function MobileNav({
  open,
  onClose,
  isLoggedIn,
  unreadCount,
  notificationCount,
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
      <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-background p-6 shadow-lg flex flex-col">
        {/* Top bar: notification icons + close button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <>
                <Link
                  href="/viestit"
                  className="relative rounded-md p-2 text-black hover:bg-accent"
                  onClick={onClose}
                >
                  <MessageSquare className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/hakuvahdit"
                  className="relative rounded-md p-2 text-black hover:bg-accent"
                  onClick={onClose}
                >
                  <Bell className="h-6 w-6" />
                  {notificationCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                      {notificationCount}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-black hover:bg-accent"
          >
            <X className="h-10 w-10" />
          </button>
        </div>

        <Separator className="my-4" />

        {/* Main navigation items - bigger and bold */}
        <nav className="flex flex-col gap-1">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-bold text-black hover:bg-accent"
            onClick={onClose}
          >
            Etusivu
          </Link>
          <Link
            href="/haku"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-bold text-black hover:bg-accent"
            onClick={onClose}
          >
            Pyörät
          </Link>
          <Link
            href="/tietopankki"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-bold text-black hover:bg-accent"
            onClick={onClose}
          >
            Tietopankki
          </Link>

          {isLoggedIn && (
            <>
              <Separator className="my-2" />

              {/* Profile links - smaller, normal weight */}
              <Link
                href="/ilmoitus/uusi"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-accent"
                onClick={onClose}
              >
                Uusi ilmoitus
              </Link>
              <Link
                href="/hakuvahdit"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-accent"
                onClick={onClose}
              >
                Hakuvahdit
              </Link>
              <Link
                href="/profiili"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-accent"
                onClick={onClose}
              >
                Omat tuotteet
              </Link>
              <Link
                href="/vaihda-salasana"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-accent"
                onClick={onClose}
              >
                Vaihda salasana
              </Link>
            </>
          )}
        </nav>

        {/* Bottom section pushed to bottom */}
        <div className="mt-auto flex flex-col gap-3">
          {isLoggedIn ? (
            <Button
              variant="outline"
              className="w-full border-black text-black hover:bg-black/5"
              onClick={() => {
                onClose();
                signOut({ callbackUrl: "/" });
              }}
            >
              Kirjaudu ulos
            </Button>
          ) : (
            <>
              <Button asChild className="w-full bg-black text-white hover:bg-black/90">
                <Link href="/kirjaudu" onClick={onClose}>
                  Kirjaudu
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-black text-black hover:bg-black/5">
                <Link href="/rekisteroidy" onClick={onClose}>
                  Rekisteröidy
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
