import { useEffect, useState } from "react";
import { getWorkshopGallery } from "../services/workshopGalleryService";

/**
 * Galería informativa de talleres para la landing pública. Muestra las
 * imágenes generales cargadas desde el dashboard. Si no hay imágenes, no
 * renderiza nada (el componente se oculta por completo).
 */
export default function WorkshopGallery() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    getWorkshopGallery().then((imgs) => {
      if (mounted) setImages(imgs);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (images.length === 0) return null;

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-bold text-pink-400 mb-4">
            Información sobre Talleres
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-blue-300 mx-auto mb-8"></div>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
            En días especiales hacemos talleres con juegos y actividades para
            los niños. Mirá algunos momentos.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {images.map((img, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl shadow-lg aspect-square"
            >
              <img
                src={img}
                alt={`Taller ${index + 1}`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
