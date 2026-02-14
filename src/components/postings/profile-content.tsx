"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostingCard } from "./posting-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { POSTING_STATUS } from "@/lib/constants";
import type { PostingWithImages } from "@/types";

type ProfileContentProps = {
  postings: PostingWithImages[];
};

export function ProfileContent({ postings }: ProfileContentProps) {
  const active = postings.filter((p) => p.status === POSTING_STATUS.ACTIVE);
  const sold = postings.filter((p) => p.status === POSTING_STATUS.SOLD);
  const expired = postings.filter((p) => p.status === POSTING_STATUS.EXPIRED);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Yhteensä {postings.length} ilmoitusta
        </p>
        <Button asChild>
          <Link href="/ilmoitus/uusi">
            <Plus className="mr-2 h-4 w-4" />
            Uusi ilmoitus
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Aktiiviset ({active.length})
          </TabsTrigger>
          <TabsTrigger value="sold">Myydyt ({sold.length})</TabsTrigger>
          <TabsTrigger value="expired">
            Vanhentuneet ({expired.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {active.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Ei aktiivisia ilmoituksia.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {active.map((posting) => (
                <PostingCard key={posting.id} posting={posting} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sold" className="mt-4">
          {sold.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Ei myytyjä ilmoituksia.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sold.map((posting) => (
                <PostingCard key={posting.id} posting={posting} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="mt-4">
          {expired.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Ei vanhentuneita ilmoituksia.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {expired.map((posting) => (
                <PostingCard key={posting.id} posting={posting} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
