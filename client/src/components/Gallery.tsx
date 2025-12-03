const images = [
  {
    url: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Taza de café con arte latte",
  },
  {
    url: "https://images.pexels.com/photos/1884584/pexels-photo-1884584.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Interior acogedor del café",
  },
  {
    url: "https://images.pexels.com/photos/2788792/pexels-photo-2788792.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Granos de café frescos",
  },
  {
    url: "https://images.pexels.com/photos/851555/pexels-photo-851555.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Barista preparando café",
  },
  {
    url: "https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Pastelería y dulces",
  },
  {
    url: "https://images.pexels.com/photos/1549280/pexels-photo-1549280.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Espacio exterior del café",
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
