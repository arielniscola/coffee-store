import {
  Sparkles,
  Instagram,
  Facebook,
  Twitter,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import Gallery from "../../components/Gallery";
import ReservationButton from "../../components/ReservationButton";
import ReservationModal from "../../components/ReservationModal";
import FloorPlan from "../../components/FloorPlan";
import { useEffect, useState } from "react";
import InformationModal from "../../components/InformationModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import { IShift } from "../../interfaces/shift";
import { ICompany } from "../../interfaces/company";
import { getCompany } from "../../services/company";

function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmShift, setConfirmShift] = useState<IShift | undefined>();
  const [company, setCompany] = useState<ICompany | undefined>();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = (await getCompany()) as ICompany;
      if (data) {
        setCompany(data);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-gradient-to-r from-pink-300 to-blue-300 text-white shadow-lg">
        <nav className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img className="w-20 h-20" src={"/public/images/logo3.png"}></img>
              <h1 className="text-3xl font-bold tracking-tight">
                Wichi Wi Cafe Kids
              </h1>
            </div>
            <ReservationButton onClick={() => setIsModalOpen(true)} />
          </div>
        </nav>
      </header>

      <main>
        <section
          className="relative h-[700px] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/public/images/fondo3.png')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/10 flex items-center justify-center">
            <div className="text-center text-white px-6">
              <h2 className="text-6xl font-bold mb-4 tracking-tight">
                Bienvenido a Wichi Wi
              </h2>
              <p className="text-2xl mb-8 font-light">
                Un café especial para la familia
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-pink-400 hover:bg-pink-300 text-white px-10 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-xl"
              >
                Reservar Turno
              </button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-10">
            <h2 className="text-5xl font-bold text-pink-400 mb-4">
              Nuestra Historia
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-blue-300 mx-auto mb-8"></div>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              WichiWi es un café especial diseñado para familias con niños.
              Ofrecemos un espacio acogedor y seguro donde los pequeños pueden
              disfrutar de deliciosas bebidas y comidas mientras los padres se
              relajan. ¡Cada visita es una nueva aventura!
            </p>
          </div>
        </section>

        <section className="bg-gradient-to-b from-blue-50 to-pink-50 py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-5xl font-bold text-blue-400 mb-4">Galería</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-blue-300 mx-auto mb-8"></div>
              <p className="text-xl text-gray-700">Descubre nuestro espacio</p>
            </div>
            <Gallery />
          </div>
        </section>

        <section className="bg-gradient-to-b from-pink-50 to-white py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-pink-400 mb-4">
                Plano del Café
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-blue-300 mx-auto mb-4"></div>
              <p className="text-xl text-gray-700">
                Consulta la disponibilidad de mesas para familias
              </p>
            </div>
            <FloorPlan />
          </div>
        </section>

        <section className="bg-gradient-to-b from-blue-50 to-pink-50 py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-blue-400 mb-4">
                Visítanos
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-blue-300 mx-auto mb-8"></div>
            </div>
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="bg-gradient-to-r from-pink-300 to-pink-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-pink-400 mb-3">
                  Ubicación
                </h3>
                <p className="text-gray-700">{company?.address}</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-yellow-300 to-orange-300 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-orange-400 mb-3">
                  Teléfono
                </h3>
                <p className="text-gray-700">{company?.cellphone}</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-blue-300 to-blue-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-400 mb-3">Email</h3>
                <p className="text-gray-700">{company?.email}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gradient-to-r from-pink-300 to-blue-300 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-3 mb-3">
                <Sparkles className="w-8 h-8" />
                <span className="text-2xl font-bold">Wichi Wi Cafe Kids</span>
              </div>
              <p className="text-white/90">Un café para toda la familia</p>
            </div>
            <div>
              <p className="text-white/90 mb-4 text-center md:text-left">
                Síguenos en redes sociales
              </p>
              <div className="flex space-x-6">
                <a
                  href={company?.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-yellow-200 transition-colors transform hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="w-7 h-7" />
                </a>
                <a
                  href={company?.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-yellow-200 transition-colors transform hover:scale-110"
                  aria-label="Facebook"
                >
                  <Facebook className="w-7 h-7" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-yellow-200 transition-colors transform hover:scale-110"
                  aria-label="Twitter"
                >
                  <Twitter className="w-7 h-7" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/30 mt-8 pt-8 text-center text-white/90">
            <p>&copy; 2025 WichiWi Cafe Kids. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      <InformationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        setFormOpen={setIsFormOpen}
      />

      <ReservationModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        setConfirmOpen={setIsConfirmOpen}
        confirmShift={setConfirmShift}
      />
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        shift={confirmShift}
      />
    </div>
  );
}

export default LandingPage;
