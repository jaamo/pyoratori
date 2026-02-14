import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <Link href="/" className="text-lg font-bold">
              pyoratori.com
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Polkupyörien kirpputori
            </p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Etusivu
            </Link>
          </div>
        </div>
        <div className="mt-6 border-t pt-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} pyoratori.com
        </div>
      </div>
    </footer>
  );
}
