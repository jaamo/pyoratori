import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Sivua ei löytynyt
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Takaisin etusivulle</Link>
      </Button>
    </div>
  );
}
