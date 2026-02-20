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
import { Menu, Plus, MessageSquare, Bell, User, LogOut, KeyRound, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { MobileNav } from "./mobile-nav";
import { useUnreadCount } from "@/components/messages/unread-badge";
import { useUnreadNotificationCount } from "@/components/notifications/unread-notification-badge";
import { NotificationPopover } from "@/components/notifications/notification-popover";

export function Header() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const unreadCount = useUnreadCount();
  const { unreadCount: notificationCount, refetch: refetchNotifications } = useUnreadNotificationCount();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-black text-white">
      <div className="container mx-auto flex h-20 items-center px-6">
        <Link href="/" className="mr-6 flex items-center">
          <Image src="/logo.svg" alt="pyoratori.com" width={260} height={42} priority />
        </Link>

        <nav className="hidden md:flex md:flex-1 md:items-center md:gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Etusivu
          </Link>
          <Link
            href="/haku"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Pyörät
          </Link>
          <Link
            href="/tietopankki"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Tietopankki
          </Link>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          {session?.user ? (
            <>
              <Button asChild size="sm" className="hidden md:flex rounded-full bg-white text-black hover:bg-white/90">
                <Link href="/ilmoitus/uusi">
                  <Plus className="mr-1 h-4 w-4" />
                  Uusi ilmoitus
                </Link>
              </Button>

              <Button asChild variant="ghost" size="icon" className="relative hidden md:inline-flex text-white hover:bg-white/10 hover:text-white">
                <Link href="/viestit">
                  <MessageSquare className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-destructive" />
                  )}
                </Link>
              </Button>

              <div className="hidden md:block">
                <NotificationPopover
                  unreadCount={notificationCount}
                  onMarkRead={refetchNotifications}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:inline-flex text-white hover:bg-white/10 hover:text-white">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-white/20 text-white">
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
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Omat tuotteet
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
                  <DropdownMenuItem asChild>
                    <Link href="/hakuvahdit">
                      <Bell className="mr-2 h-4 w-4" />
                      Hakuvahdit
                      {notificationCount > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {notificationCount}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/vaihda-salasana">
                      <KeyRound className="mr-2 h-4 w-4" />
                      Vaihda salasana
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
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex text-white hover:bg-white/10 hover:text-white">
                <Link href="/kirjaudu">Kirjaudu</Link>
              </Button>
              <Button asChild size="sm" className="hidden md:inline-flex bg-white text-black hover:bg-white/90">
                <Link href="/rekisteroidy">Rekisteröidy</Link>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            className="md:hidden h-14 w-14 p-0 text-white hover:bg-white/10 hover:text-white"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-12 w-12" />
          </Button>
        </div>
      </div>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isLoggedIn={!!session?.user}
        unreadCount={unreadCount}
        notificationCount={notificationCount}
      />
    </header>
  );
}
