import {
  Sparkles,
  Instagram,
  Facebook,
  Twitter,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  MessageCircle,
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
import { getConfigs } from "../../services/config";
import { getWeeklySchedule } from "../../services/weeklyScheduleService";
import { getPublicScheduleExceptions } from "../../services/scheduleExceptionService";
import { IScheduleException } from "../../interfaces/scheduleException";
import { formatDateRange } from "../../utils/dates";
import { IConfig } from "../../interfaces/config";
import {
  IWeeklySchedule,
  ITimeRange,
  WEEKDAYS,
  emptyWeeklySchedule,
} from "../../interfaces/weeklySchedule";
import { getUpcomingWorkshops } from "../../services/workshopService";
import { IWorkshop } from "../../interfaces/workshop";
import WorkshopGallery from "../../components/WorkshopGallery";

// Franjas de un día -> "09:00 - 18:00 · 20:00 - 23:00". Vacío -> "Cerrado".
function formatRanges(ranges: ITimeRange[]): string {
  if (!ranges?.length) return "Cerrado";
  return ranges.map((r) => `${r.start} - ${r.end}`).join(" · ");
}

interface ScheduleGroup {
  label: string;
  hours: string;
}

// Agrupa días consecutivos con el mismo horario para mostrar rangos como
// "Lunes a Viernes" en lugar de listar cada día por separado.
function buildScheduleGroups(schedule: IWeeklySchedule): ScheduleGroup[] {
  const groups: { days: string[]; hours: string }[] = [];
  for (const { key, label } of WEEKDAYS) {
    const hours = formatRanges(schedule[key]);
    const last = groups[groups.length - 1];
    if (last && last.hours === hours) last.days.push(label);
    else groups.push({ days: [label], hours });
  }
  return groups.map(({ days, hours }) => ({
    hours,
    label:
      days.length === 1 ? days[0] : `${days[0]} a ${days[days.length - 1]}`,
  }));
}

function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmShift, setConfirmShift] = useState<IShift | undefined>();
  const [company, setCompany] = useState<ICompany | undefined>();
  const [priceChild, setPriceChild] = useState<number>(0);
  const [scheduleGroups, setScheduleGroups] = useState<ScheduleGroup[]>([]);
  const [workshops, setWorkshops] = useState<IWorkshop[]>([]);
  const [specialDates, setSpecialDates] = useState<IScheduleException[]>([]);

  useEffect(() => {
    loadProfile();
    loadPrices();
    loadWorkshops();
    loadSpecialDates();
  }, []);

  async function loadWorkshops() {
    setWorkshops(await getUpcomingWorkshops());
  }

  async function loadSpecialDates() {
    setSpecialDates(await getPublicScheduleExceptions());
  }

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

  async function loadPrices() {
    try {
      const configs = (await getConfigs()) as IConfig[];
      const c = Number(
        configs?.find((c) => c.code === "priceChild")?.value || 0,
      );
      setPriceChild(c);
      const schedule = await getWeeklySchedule();
      setScheduleGroups(
        buildScheduleGroups(schedule || emptyWeeklySchedule()),
      );
    } catch (error) {
      console.error("Error loading prices:", error);
    }
  }

  const whatsappLink = company?.cellphone
    ? `https://wa.me/${company.cellphone.replace(/\D/g, "")}`
    : undefined;

  // Fechas especiales = aperturas con horarios especiales en un rango de fechas.
  // Los días cerrados no se listan: ya se ven bloqueados en el calendario.
  const hasSpecialDates = specialDates.length > 0;

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-pink-300 to-blue-300 text-white shadow-lg backdrop-blur supports-[backdrop-filter]:bg-opacity-90">
        <nav className="container mx-auto px-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                className="w-[90px] h-[85px] md:w-[115px] md:h-[110px]"
                src={"/images/logo3.png"}
                alt="Wichi Wi Cafe Kids"
              />
            </div>
            <ReservationButton onClick={() => setIsModalOpen(true)} />
          </div>
        </nav>
      </header>

      <main>
        <section
          className="relative min-h-[80vh] md:h-[700px] bg-cover bg-center bg-no-repeat lg:bg-[length:95%]"
          style={{ backgroundImage: "url('/images/fondooo.png')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/10 flex items-center justify-center">
            <div className="text-center text-white px-6">
              <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
                Bienvenido a Wichi Wi
              </h2>
              <p className="text-lg md:text-2xl mb-8 font-light">
                Un café especial para la familia
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-pink-400 hover:bg-pink-300 text-white px-8 md:px-10 py-3 md:py-4 rounded-full text-base md:text-lg font-semibold transition-all transform hover:scale-105 shadow-xl"
              >
                <Calendar className="w-5 h-5" />
                Reservar Turno
              </button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-16 md:py-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-bold text-pink-400 mb-4">
              ¿Quiénes Somos?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-blue-300 mx-auto mb-8"></div>
            <div className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              <p>
                Wichi Wi Café Kids es una cafetería, creado para que las
                familias puedan compartir tiempo de calidad, mientras los niños
                juegan, aprenden y se divierten en un entorno seguro y diseñado
                especialmente para ellos. Contamos con juegos para niños de 0 a
                6 años y juegos de mesas para los más grandes.
              </p>
              <p className="mt-6 font-semibold tracking-wide">
                * TU PAUSA, SU DIVERSIÓN *
              </p>
            </div>
          </div>
        </section>

        <WorkshopGallery />

        <section className="bg-gradient-to-b from-blue-50 to-pink-50 py-16 md:py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-5xl font-bold text-blue-400 mb-4">
                Galería
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-blue-300 mx-auto mb-8"></div>
              <p className="text-lg md:text-xl text-gray-700">
                Descubre nuestro espacio
              </p>
            </div>
            <Gallery />
          </div>
        </section>

        <section className="bg-gradient-to-b from-blue-50 to-pink-50 py-16 md:py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-5xl font-bold text-blue-400 mb-4">
                Nuestra Historia
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-blue-300 mx-auto mb-8"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
              <div className="px-4">
                <p className="text-base md:text-lg mb-4 text-justify">
                  El presente proyecto surge de la iniciativa de dos familias
                  amigas —Ludmila y Carlos, padres de Lupe y Paz; y Yamila y
                  Alberto, padres de Roma y Alma— quienes detectamos la
                  necesidad de contar en la provincia de Mendoza con un espacio
                  donde niños y adultos puedan disfrutar simultáneamente.
                </p>
              </div>
              <div className="w-full h-80 md:h-[34rem] bg-gray-300 rounded-lg shadow-lg overflow-hidden">
                <img
                  src="/images/historia1.jpeg"
                  alt="Familias compartiendo en Wichi Wi"
                  loading="lazy"
                  className="w-full h-full object-cover object-[center_25%]"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="w-full h-80 md:h-[34rem] bg-gray-300 rounded-lg shadow-lg overflow-hidden md:order-first order-last">
                <img
                  src="/images/historia2.jpeg"
                  alt="Espacio de juegos para niños"
                  loading="lazy"
                  className="w-full h-full object-cover object-[center_30%]"
                />
              </div>
              <div className="px-4">
                <p className="text-base md:text-lg mb-4 text-justify">
                  La idea nació a partir de nuestra experiencia como padres, al
                  buscar un lugar que combinara un entorno seguro y estimulante
                  para los niños con un ambiente cómodo y relajado para los
                  adultos.
                </p>
                <p className="text-base md:text-lg text-justify">
                  Observamos que la oferta local de este tipo de espacios es
                  limitada, lo que nos motivó a desarrollar una propuesta
                  innovadora: la creación del primer Café Kids de la provincia,
                  integrando juegos didácticos y recreativos con un área de
                  cafetería, en un mismo espacio diseñado para el disfrute de
                  toda la familia.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 md:py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-5xl font-bold text-pink-400 mb-4">
                Horarios
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-blue-300 mx-auto mb-8"></div>
            </div>
            {scheduleGroups.length > 0 && (
              <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                {scheduleGroups.map((group, index) => {
                  const even = index % 2 === 0;
                  return (
                    <div
                      key={`${group.label}-${index}`}
                      className={`bg-gradient-to-br ${
                        even ? "from-pink-50" : "from-blue-50"
                      } to-white rounded-xl p-6 shadow-md flex items-center gap-4`}
                    >
                      <Clock
                        className={`w-8 h-8 flex-shrink-0 ${
                          even ? "text-pink-400" : "text-blue-400"
                        }`}
                      />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {group.label}
                        </p>
                        <p className="text-gray-600">{group.hours}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {hasSpecialDates && (
              <div className="max-w-2xl mx-auto mt-10">
                <div className="flex items-center justify-center gap-2 mb-5">
                  <Clock className="w-5 h-5 text-pink-400" />
                  <h3 className="text-xl font-bold text-gray-800">
                    Fechas especiales
                  </h3>
                </div>

                {specialDates.length > 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                    <p className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Aperturas con horarios especiales
                    </p>
                    <ul className="space-y-1.5">
                      {specialDates.map((e) => (
                        <li
                          key={e._id}
                          className="text-sm text-green-800 flex flex-wrap items-baseline gap-x-2"
                        >
                          <span className="font-medium">
                            {formatDateRange(e.dateFrom, e.dateTo)}
                          </span>
                          <span className="text-green-600 font-semibold">
                            {e.timeStart} - {e.timeEnd} hs
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="bg-gradient-to-b from-pink-50 to-white py-16 md:py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-pink-400 mb-4">
                Plano del Café
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-blue-300 mx-auto mb-4"></div>
              <p className="text-lg md:text-xl text-gray-700">
                Consulta la disponibilidad de mesas para familias
              </p>
            </div>
            <FloorPlan />
          </div>
        </section>

        <section className="bg-white py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-5xl font-bold text-blue-400 mb-4">
                Visitanos
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-blue-300 mx-auto mb-8"></div>
            </div>

            <div className="text-center mb-8 space-y-3">
              <div className="text-base md:text-lg flex items-center justify-center gap-3">
                <span className="bg-gradient-to-r from-pink-300 to-pink-400 w-8 h-8 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                  <MapPin className="w-4 h-4 text-white" />
                </span>
                <span>{company?.address || "—"}</span>
              </div>
              {company?.cellphone && (
                <div className="text-base md:text-lg flex items-center justify-center gap-3">
                  <span className="bg-gradient-to-r from-yellow-300 to-orange-300 w-8 h-8 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <Phone className="w-4 h-4 text-white" />
                  </span>
                  <a
                    href={`tel:${company.cellphone}`}
                    className="hover:text-pink-500 transition-colors"
                  >
                    {company.cellphone}
                  </a>
                </div>
              )}
              {company?.email && (
                <div className="text-base md:text-lg flex items-center justify-center gap-3">
                  <span className="bg-gradient-to-r from-blue-300 to-blue-400 w-8 h-8 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <Mail className="w-4 h-4 text-white" />
                  </span>
                  <a
                    href={`mailto:${company.email}`}
                    className="hover:text-blue-500 transition-colors break-all"
                  >
                    {company.email}
                  </a>
                </div>
              )}
              {whatsappLink && (
                <div className="pt-2">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg transition-transform hover:scale-105"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Escribinos por WhatsApp
                  </a>
                </div>
              )}
            </div>
            <div className="max-w-4xl mx-auto h-80 md:h-96 rounded-lg shadow-lg overflow-hidden">
              <iframe
                title="Ubicación de Wichi Wi"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d837.0296991716068!2d-68.79748722231801!3d-32.9478728312124!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x967e0d346ad73d79%3A0xe2071bf4f9de845a!2zV2ljaMOtIHdp!5e0!3m2!1ses-419!2sar!4v1766065204856!5m2!1ses-419!2sar"
                className="w-full h-full border-0"
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
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
                {company?.instagram && (
                  <a
                    href={company.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-yellow-200 transition-colors transform hover:scale-110"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-7 h-7" />
                  </a>
                )}
                {company?.facebook && (
                  <a
                    href={company.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-yellow-200 transition-colors transform hover:scale-110"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-7 h-7" />
                  </a>
                )}
                {company?.twitter && (
                  <a
                    href={company.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-yellow-200 transition-colors transform hover:scale-110"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-7 h-7" />
                  </a>
                )}
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
        priceChild={priceChild}
        workshopPrices={workshops.map((w) => w.priceChild)}
        scheduleGroups={scheduleGroups}
        specialDates={specialDates}
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
        company={company}
        priceChild={priceChild}
      />
    </div>
  );
}

export default LandingPage;
