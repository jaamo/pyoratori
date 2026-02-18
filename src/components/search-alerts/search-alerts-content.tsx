"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Trash2, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { deleteSearchAlert } from "@/server/actions/search-alerts";
import { toast } from "sonner";
import type { SearchAlertWithNotifications } from "@/types";

type SearchAlertsContentProps = {
  alerts: SearchAlertWithNotifications[];
};

function buildSearchUrl(alert: SearchAlertWithNotifications): string {
  const params = new URLSearchParams();

  if (alert.query) params.set("q", alert.query);
  if (alert.categoryId) params.set("kategoria", alert.categoryId);

  try {
    const filters = JSON.parse(alert.filters) as Record<string, string>;
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue;
      if (key === "minPrice") params.set("minHinta", value);
      else if (key === "maxPrice") params.set("maxHinta", value);
      else if (key === "location") params.set("sijainti", value);
      else params.set(key, value);
    }
  } catch {
    // ignore invalid JSON
  }

  const qs = params.toString();
  return qs ? `/haku?${qs}` : "/haku";
}

function formatFilters(alert: SearchAlertWithNotifications): string[] {
  const parts: string[] = [];

  if (alert.query) parts.push(`Haku: "${alert.query}"`);
  if (alert.categoryId) parts.push(`Kategoria: ${alert.categoryId}`);

  try {
    const filters = JSON.parse(alert.filters) as Record<string, string>;
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue;
      if (key === "minPrice") parts.push(`Min hinta: ${value}€`);
      else if (key === "maxPrice") parts.push(`Max hinta: ${value}€`);
      else if (key === "location") parts.push(`Sijainti: ${value}`);
      else parts.push(`${key}: ${value}`);
    }
  } catch {
    // ignore
  }

  return parts;
}

export function SearchAlertsContent({ alerts: initialAlerts }: SearchAlertsContentProps) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(alertId: string) {
    setDeleting(alertId);
    try {
      const result = await deleteSearchAlert(alertId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        toast.success("Hakuvahti poistettu");
      }
    } catch {
      toast.error("Jokin meni pieleen");
    } finally {
      setDeleting(null);
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Ei hakuvahteja</h2>
        <p className="text-muted-foreground mb-4">
          Tallenna hakuvahti hakusivulta saadaksesi ilmoituksia uusista ilmoituksista.
        </p>
        <Button asChild>
          <Link href="/haku">
            <Search className="mr-2 h-4 w-4" />
            Siirry hakuun
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => {
        const filterParts = formatFilters(alert);
        const unreadNotifications = alert.notifications.filter((n) => !n.readAt);

        return (
          <Card key={alert.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{alert.name}</h3>
                  {unreadNotifications.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {unreadNotifications.length} uutta
                    </Badge>
                  )}
                  {!alert.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Pois käytöstä
                    </Badge>
                  )}
                </div>

                {filterParts.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {filterParts.map((part, i) => (
                      <span
                        key={i}
                        className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Luotu{" "}
                  {new Date(alert.createdAt).toLocaleDateString("fi-FI")}
                  {alert.lastCheckedAt && (
                    <>
                      {" "}
                      — Viimeksi tarkistettu{" "}
                      {new Date(alert.lastCheckedAt).toLocaleDateString(
                        "fi-FI"
                      )}
                    </>
                  )}
                </p>

                {/* Recent notifications */}
                {alert.notifications.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Viimeisimmät ilmoitukset:
                    </p>
                    {alert.notifications.slice(0, 3).map((notif) => (
                      <div
                        key={notif.id}
                        className={`text-xs rounded-md px-2 py-1 ${
                          notif.readAt
                            ? "text-muted-foreground"
                            : "bg-primary/5 font-medium"
                        }`}
                      >
                        {notif.message} —{" "}
                        {new Date(notif.createdAt).toLocaleDateString("fi-FI")}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                <Button asChild variant="outline" size="sm">
                  <Link href={buildSearchUrl(alert)}>
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Avaa haku
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(alert.id)}
                  disabled={deleting === alert.id}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  {deleting === alert.id ? "Poistetaan..." : "Poista"}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
