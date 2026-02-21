import Link from "next/link";
import Image from "next/image";
import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLatestProducts } from "@/server/queries/products";
import { getCityByPostalCode } from "@/lib/postal-codes";

export default async function HomePage() {
  const latestProducts = await getLatestProducts(4);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden text-white">
        {/* Background image */}
        <Image
          src="/hero-bg.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Floating images – positioned relative to section so overflow-hidden crops them */}
        <div className="hero-float-1 hidden lg:block absolute left-0 top-8 -translate-x-[15%] z-[1]">
          <Image
            src="/hero01.jpg"
            alt="Pyörä"
            width={520}
            height={390}
            className="rounded-2xl shadow-2xl object-cover"
            priority
          />
        </div>
        <div className="hero-float-2 hidden lg:block absolute right-0 bottom-8 translate-x-[15%] z-[1]">
          <Image
            src="/hero02.jpg"
            alt="Pyörä"
            width={520}
            height={390}
            className="rounded-2xl shadow-2xl object-cover"
            priority
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-32 md:py-48">
          {/* Center content */}
          <div className="relative z-10 text-center space-y-6 max-w-xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Käytetyt polkupyörät
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-md mx-auto">
              Suomen kattavin käytettyjen pyörien hakukone ja kauppapaikka
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white text-[#642ca9] hover:bg-white/90 font-semibold px-8"
              >
                <Link href="/haku?attr_electric=Kyllä">Sähköpyörät</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white text-[#642ca9] hover:bg-white/90 font-semibold px-8"
              >
                <Link href="/haku">Luomupyörät</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="rounded-full bg-[#642ca9] text-white hover:bg-[#642ca9]/90 font-semibold px-8"
              >
                <Link href="/ilmoitus/uusi">Myy pyöräsi</Link>
              </Button>
            </div>
          </div>

          {/* Mobile hero images */}
          <div className="relative z-10 flex lg:hidden gap-4 mt-10 justify-center">
            <Image
              src="/hero01.jpg"
              alt="Pyörä"
              width={200}
              height={150}
              className="rounded-xl shadow-lg object-cover"
            />
            <Image
              src="/hero02.jpg"
              alt="Pyörä"
              width={200}
              height={150}
              className="rounded-xl shadow-lg object-cover"
            />
          </div>
        </div>

        {/* CSS animations */}
        <style>{`
          .hero-float-1 {
            animation: heroFloat1 12s ease-in-out infinite;
          }
          .hero-float-2 {
            animation: heroFloat2 12s ease-in-out infinite;
          }
          @keyframes heroFloat1 {
            0%, 100% { transform: translateX(-15%) translateY(0px) rotate(0deg); }
            50% { transform: translateX(-15%) translateY(-16px) rotate(2deg); }
          }
          @keyframes heroFloat2 {
            0%, 100% { transform: translateX(15%) translateY(0px) rotate(0deg); }
            50% { transform: translateX(15%) translateY(16px) rotate(-2deg); }
          }
        `}</style>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-3 p-6">
            <div className="mx-auto flex h-24 w-24 items-center justify-center">
              <Image src="/icon-solar.svg" alt="" width={96} height={96} />
            </div>
            <h3 className="text-lg font-semibold">Tehokas haku</h3>
            <p className="text-muted-foreground text-sm">
              Hakukone, joka on suunniteltu pyörien etsimiseen. Ei enää
              ilmoitusten kahlailua ja foorumeilla päivystämistä.
            </p>
          </div>
          <div className="text-center space-y-3 p-6">
            <div className="mx-auto flex h-24 w-24 items-center justify-center">
              <Image src="/icon-bicycle.svg" alt="" width={96} height={96} />
            </div>
            <h3 className="text-lg font-semibold">Paras paikka myydä</h3>
            <p className="text-muted-foreground text-sm">
              Takaa paras näkyvyys pyörällesi jättämällä se myyntiin suoraan
              pyoratori.comiin. Näin se löytyy parhaiten ja pyörä löytää oikean
              ostajan nopeasti.
            </p>
          </div>
          <div className="text-center space-y-3 p-6">
            <div className="mx-auto flex h-24 w-24 items-center justify-center">
              <Image src="/icon-planet.svg" alt="" width={96} height={96} />
            </div>
            <h3 className="text-lg font-semibold">Kattava valikoima</h3>
            <p className="text-muted-foreground text-sm">
              Pyoratori.com listaa käytettyjä pyöriä myös muista kaupoista ja
              markkinapaikoista. Laaja valikoima yhdellä haulla.
            </p>
          </div>
        </div>
      </section>

      {/* Latest Bikes Section */}
      <section className="bg-[#CFDBD5]">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <h2 className="text-2xl font-bold mb-8">Uusimmat ilmoitukset</h2>

          {latestProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {latestProducts.map((product) => {
                const thumbnail = product.images[0];
                const thumbFilename = thumbnail
                  ? thumbnail.filename.replace(".webp", "-thumb.webp")
                  : null;

                const isExternal = !!product.externalUrl;
                const href = isExternal
                  ? product.externalUrl!
                  : `/ilmoitus/${product.id}`;
                const linkProps = isExternal
                  ? { target: "_blank" as const, rel: "noopener noreferrer" }
                  : {};

                return (
                  <Link
                    key={product.id}
                    href={href}
                    {...linkProps}
                    className="rounded-2xl border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                      {thumbFilename ? (
                        <Image
                          src={`/api/uploads/${thumbFilename}`}
                          alt={product.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          Ei kuvaa
                        </div>
                      )}
                      {product.externalUrl && (
                        <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground inline-flex items-center gap-1">
                          Fillaritori
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <h3 className="font-medium line-clamp-2">
                        {product.title}
                      </h3>
                      <p className="text-lg font-bold mt-1">
                        {(product.price / 100).toLocaleString("fi-FI", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {getCityByPostalCode(product.location) ||
                          product.location}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">Ei vielä ilmoituksia.</p>
          )}

          <div className="mt-8 text-center">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-8"
            >
              <Link href="/haku">Selaa kaikkia ilmoituksia</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Tietopankki Article Highlights */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <div>
            <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase mb-2">
              Tietopankki
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Näin ostat käytetyn pyörän
            </h2>
            <p className="text-muted-foreground mb-6">
              Käytetyn pyörän ostaminen on järkihomma, mutta kaupassa piilee
              riskejä. Tämä opas auttaa välttämään sudenkuopat.
            </p>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-8"
            >
              <Link href="/tietopankki/nain-ostat-kaytetyn-pyoran">
                Lue lisää
              </Link>
            </Button>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase mb-2">
              Tietopankki
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Miten tunnistan varastetun pyörän
            </h2>
            <p className="text-muted-foreground mb-6">
              Suomessa varastetaan kymmeniätuhansia pyöriä vuosittain. Näin
              tunnistat varastetun pyörän ja vältät kalliit seuraukset.
            </p>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-8"
            >
              <Link href="/tietopankki/miten-tunnistan-varastetun-pyoran">
                Lue lisää
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
