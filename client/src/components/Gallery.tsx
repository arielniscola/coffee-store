const images = [
  {
    url: "public/images/galeria1.jpeg",
    alt: "",
  },
  {
    url: "public/images/galeria2.jpeg",
    alt: "",
  },
  {
    url: "public/images/galeria3.jpeg",
    alt: "",
  },
  {
    url: "public/images/galeria4.jpeg",
    alt: "",
  },
  {
    url: "public/images/galeria5.jpeg",
    alt: "",
  },
  {
    url: "public/images/galeria6.jpeg",
    alt: "",
  },
];

export default function Gallery() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((image, index) => (
        <div
          key={index}
          className="group relative overflow-hidden rounded-xl shadow-lg aspect-square cursor-pointer"
        >
          <img
            src={image.url}
            alt={image.alt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
            <p className="text-white p-6 font-medium text-lg">{image.alt}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
