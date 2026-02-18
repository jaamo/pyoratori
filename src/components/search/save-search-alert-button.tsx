"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSearchAlert } from "@/server/actions/search-alerts";
import { toast } from "sonner";

type SaveSearchAlertButtonProps = {
  categoryId: string | null;
  query: string;
  filters: Record<string, string>;
  productIds: string[];
};

export function SaveSearchAlertButton({
  categoryId,
  query,
  filters,
  productIds,
}: SaveSearchAlertButtonProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  if (!session?.user) return null;

  async function handleSave() {
    setSaving(true);
    try {
      const formData = new FormData();
      if (name.trim()) formData.set("name", name.trim());
      if (categoryId) formData.set("categoryId", categoryId);
      if (query) formData.set("query", query);
      formData.set("filters", JSON.stringify(filters));
      formData.set("productIds", JSON.stringify(productIds));

      const result = await createSearchAlert(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Hakuvahti tallennettu!");
        setOpen(false);
        setName("");
      }
    } catch {
      toast.error("Jokin meni pieleen");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Bell className="mr-2 h-4 w-4" />
          Tallenna hakuvahdiksi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tallenna hakuvahti</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Saat ilmoituksen kun uusia hakuasi vastaavia ilmoituksia julkaistaan.
          </p>
          <div className="space-y-2">
            <Label htmlFor="alert-name">Nimi (valinnainen)</Label>
            <Input
              id="alert-name"
              placeholder="Esim. Maantiepyörät alle 500€"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="rounded-md bg-muted p-3 text-sm space-y-1">
            {query && (
              <p>
                <span className="font-medium">Haku:</span> {query}
              </p>
            )}
            {categoryId && (
              <p>
                <span className="font-medium">Kategoria:</span> {categoryId}
              </p>
            )}
            {Object.entries(filters).length > 0 && (
              <p>
                <span className="font-medium">Suodattimet:</span>{" "}
                {Object.entries(filters)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ")}
              </p>
            )}
            {!query && !categoryId && Object.keys(filters).length === 0 && (
              <p className="text-muted-foreground">Kaikki ilmoitukset</p>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Tallennetaan..." : "Tallenna hakuvahti"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
