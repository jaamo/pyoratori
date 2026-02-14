"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, Plus, MessageSquare, User, LogOut } from "lucide-react";
import { useState } from "react";
import { MobileNav } from "./mobile-nav";

export function Header({ unreadCount = 0 }: { unreadCount?: number }) {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="mr-6 flex items-center">
          <Image src="/logo.svg" alt="pyoratori.com" width={160} height={22} priority />
        </Link>

        <nav className="hidden md:flex md:flex-1 md:items-center md:gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Selaa ilmoituksia
          </Link>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          {session?.user ? (
            <>
              <Button asChild variant="default" size="sm" className="hidden md:flex">
                <Link href="/ilmoitus/uusi">
                  <Plus className="mr-1 h-4 w-4" />
                  Uusi ilmoitus
                </Link>
              </Button>

              <Button asChild variant="ghost" size="icon" className="relative">
                <Link href="/viestit">
                  <MessageSquare className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {session.user.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profiili">
                      <User className="mr-2 h-4 w-4" />
                      Profiili
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/viestit">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Viestit
                      {unreadCount > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Kirjaudu ulos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/kirjaudu">Kirjaudu</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/rekisteroidy">Rekisteröidy</Link>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isLoggedIn={!!session?.user}
        unreadCount={unreadCount}
      />
    </header>
  );
}
