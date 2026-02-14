"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MapPin,
  Calendar,
  Edit,
  Trash2,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import { deletePosting, markAsSold } from "@/server/actions/postings";
import { startConversation } from "@/server/actions/messages";
import { getAttributesForCategory } from "@/lib/categories";
import { POSTING_STATUS } from "@/lib/constants";
import type { PostingWithDetails } from "@/types";
import { useRouter } from "next/navigation";

type PostingDetailProps = {
  posting: PostingWithDetails;
};

export function PostingDetail({ posting }: PostingDetailProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [messageContent, setMessageContent] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isOwner = session?.user?.id === posting.authorId;
  const attrs = JSON.parse(posting.attributes) as Record<string, unknown>;
  const attrDefs = getAttributesForCategory(posting.categoryId);

  async function handleSendMessage() {
    if (!messageContent.trim()) return;
    setMessageSending(true);

    const result = await startConversation(posting.id, messageContent);
    if (result.conversationId) {
      router.push(`/viestit/${result.conversationId}`);
    }

    setMessageSending(false);
    setMessageDialogOpen(false);
  }

  async function handleDelete() {
    await deletePosting(posting.id);
  }

  async function handleMarkAsSold() {
    await markAsSold(posting.id);
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            {posting.images.length > 0 ? (
              <Image
                src={`/api/uploads/${posting.images[selectedImage].filename}`}
                alt={posting.title}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Ei kuvia
              </div>
            )}
          </div>

          {posting.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {posting.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 ${
                    selectedImage === i
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    src={`/api/uploads/${img.filename.replace(".webp", "-thumb.webp")}`}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold">{posting.title}</h1>
              {posting.status !== POSTING_STATUS.ACTIVE && (
                <Badge
                  variant={
                    posting.status === POSTING_STATUS.SOLD
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {posting.status === POSTING_STATUS.SOLD
                    ? "Myyty"
                    : "Vanhentunut"}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-3xl font-bold">
              {(posting.price / 100).toLocaleString("fi-FI", {
                style: "currency",
                currency: "EUR",
              })}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {posting.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {posting.createdAt.toLocaleDateString("fi-FI")}
            </span>
          </div>

          <Badge variant="outline">{posting.category.name}</Badge>

          <Separator />

          {/* Attributes */}
          {attrDefs.length > 0 && Object.keys(attrs).length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {attrDefs.map((def) => {
                  const val = attrs[def.key];
                  if (val === undefined || val === "" || val === null)
                    return null;
                  return (
                    <div key={def.key}>
                      <span className="text-muted-foreground">
                        {def.label}:
                      </span>{" "}
                      <span className="font-medium">
                        {String(val)}
                        {def.unit ? ` ${def.unit}` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Separator />
            </>
          )}

          {/* Description */}
          <div>
            <h2 className="mb-2 font-semibold">Kuvaus</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {posting.description}
            </p>
          </div>

          <Separator />

          {/* Seller info */}
          <div className="text-sm">
            <span className="text-muted-foreground">Myyjä: </span>
            <span className="font-medium">
              {posting.author.name || "Tuntematon"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {isOwner ? (
              <>
                <Button asChild variant="outline">
                  <Link href={`/ilmoitus/${posting.id}/muokkaa`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Muokkaa
                  </Link>
                </Button>
                {posting.status === POSTING_STATUS.ACTIVE && (
                  <Button variant="outline" onClick={handleMarkAsSold}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Merkitse myydyksi
                  </Button>
                )}
                <Dialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Poista
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Poista ilmoitus</DialogTitle>
                      <DialogDescription>
                        Haluatko varmasti poistaa tämän ilmoituksen? Tätä
                        toimintoa ei voi peruuttaa.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(false)}
                      >
                        Peruuta
                      </Button>
                      <Button variant="destructive" onClick={handleDelete}>
                        Poista
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              session?.user && (
                <Dialog
                  open={messageDialogOpen}
                  onOpenChange={setMessageDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Lähetä viesti myyjälle
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Lähetä viesti</DialogTitle>
                      <DialogDescription>
                        Viesti koskien ilmoitusta: {posting.title}
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Kirjoita viestisi..."
                      rows={4}
                    />
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setMessageDialogOpen(false)}
                      >
                        Peruuta
                      </Button>
                      <Button
                        onClick={handleSendMessage}
                        disabled={messageSending || !messageContent.trim()}
                      >
                        {messageSending ? "Lähetetään..." : "Lähetä"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )
            )}
          </div>

          {!session?.user && !isOwner && (
            <p className="text-sm text-muted-foreground">
              <Link href="/kirjaudu" className="underline">
                Kirjaudu sisään
              </Link>{" "}
              lähettääksesi viestin myyjälle.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
