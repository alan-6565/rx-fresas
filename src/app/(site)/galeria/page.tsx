import type { Metadata } from "next";
import { business } from "@/lib/data";
import { getSitePhotos } from "@/lib/site-photos";
import { Heading, PageTop, Photo } from "@/components/ui";

export const metadata: Metadata = { title: "Galería — R&X Fresas con Crema" };

export default async function GalleryPage() {
  const { gallery } = await getSitePhotos();
  return (
    <PageTop>
      <div className="text-center">
        <Heading as="h1" sub={`Un poquito de lo que preparamos. Más fotos en ${business.handle} ♥`}>
          Galería
        </Heading>
      </div>
      <div className="mt-12 columns-2 md:columns-3 gap-4 sm:gap-6 [&>*]:mb-4 sm:[&>*]:mb-6">
        {gallery.map((src, i) => (
          <Photo key={`${i}-${src}`} slot={`gallery:${i}`} src={src} alt="" className={`rounded-3xl break-inside-avoid ${i % 3 === 0 ? "aspect-[4/5]" : i % 3 === 1 ? "aspect-square" : "aspect-[3/4]"}`} sizes="33vw" />
        ))}
      </div>
    </PageTop>
  );
}
