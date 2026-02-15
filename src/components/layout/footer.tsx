import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative min-h-[400px] overflow-hidden">
      <Image
        src="/road-bike-dark.jpg"
        alt=""
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <Link href="/" className="inline-block">
              <Image src="/logo.svg" alt="pyoratori.com" width={140} height={20} />
            </Link>
            <p className="mt-1 text-sm text-white/70">
              Polkupyörien kirpputori
            </p>
          </div>
          <div className="flex gap-6 text-sm text-white/70">
            <Link href="/" className="hover:text-white">
              Etusivu
            </Link>
            <Link href="/tietopankki" className="hover:text-white">
              Tietopankki
            </Link>
          </div>
        </div>
        <div className="mt-6 border-t border-white/20 pt-4 text-center text-xs text-white/70">
          &copy; {new Date().getFullYear()} pyoratori.com
        </div>
      </div>
    </footer>
  );
}
