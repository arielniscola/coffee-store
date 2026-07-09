import { useState, useEffect, useMemo } from "react";
import {
  Settings,
  Save,
  AlertCircle,
  X,
  Search,
  RotateCcw,
  Eye,
  EyeOff,
  DollarSign,
  Clock,
  Globe,
  Shield,
  Mail,
  CheckCircle2,
  Users,
} from "lucide-react";
import { IConfig } from "../../interfaces/config";
import { getConfigs, updateConfig } from "../../services/config";
import WeeklyScheduleEditor from "./WeeklyScheduleEditor";
import toast from "react-hot-toast";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

export type Category =
  | "payments"
  | "capacity"
  | "schedule"
  | "public"
  | "email"
  | "system";

interface CategoryMeta {
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

const CATEGORIES: Record<Category, CategoryMeta> = {
  payments: {
    label: "Pagos",
    description: "Precios de reserva y credenciales de Mercado Pago",
    icon: <DollarSign className="w-5 h-5" />,
    gradient: "from-green-300 to-emerald-400",
  },
  capacity: {
    label: "Capacidad",
    description: "Modo de cálculo y máximos de adultos y niños por turno",
    icon: <Users className="w-5 h-5" />,
    gradient: "from-teal-300 to-cyan-400",
  },
  schedule: {
    label: "Horarios",
    description: "Duración del turno, franjas horarias y textos de horarios",
    icon: <Clock className="w-5 h-5" />,
    gradient: "from-pink-300 to-blue-300",
  },
  public: {
    label: "Sitio público",
    description: "URL pública y enlaces utilizados por Mercado Pago",
    icon: <Globe className="w-5 h-5" />,
    gradient: "from-blue-300 to-cyan-400",
  },
  email: {
    label: "Email (SMTP)",
    description: "Servidor SMTP para enviar los emails de confirmación",
    icon: <Mail className="w-5 h-5" />,
    gradient: "from-amber-300 to-orange-400",
  },
  system: {
    label: "Sistema",
    description: "Parámetros internos de la aplicación",
    icon: <Shield className="w-5 h-5" />,
    gradient: "from-purple-300 to-indigo-400",
  },
};

const CATEGORY_BY_CODE: Record<string, Category> = {
  priceAdult: "payments",
  priceChild: "payments",
  mpAccessToken: "payments",
  whatsappNumber: "payments",
  capacityMode: "capacity",
  maxAdults: "capacity",
  maxChildren: "capacity",
  publicBaseUrl: "public",
  publicApiBaseUrl: "public",
  smtpHost: "email",
  smtpPort: "email",
  smtpSecure: "email",
  smtpUser: "email",
  smtpPass: "email",
  emailFrom: "email",
  durationShift: "schedule",
  scheduleText: "schedule",
  scheduleSubtitle: "schedule",
  scheduleDayMonday: "schedule",
  scheduleDayTuesday: "schedule",
  scheduleDayWednesday: "schedule",
  scheduleDayThursday: "schedule",
  scheduleDayFriday: "schedule",
  scheduleDaySaturday: "schedule",
  scheduleDaySunday: "schedule",
  reservationMaxDays: "schedule",
  sessionExpiresIn: "system",
};

const getCategory = (code: string): Category =>
  CATEGORY_BY_CODE[code] || "system";

const isScheduleDay = (code: string) =>
  code.startsWith("scheduleDay");

const isValidRange = (input: string): boolean => {
  const rangeRegex = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;
  if (!input || typeof input !== "string") return false;
  const ranges = input
    .split(",")
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
  if (ranges.length === 0) return false;
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  for (const r of ranges) {
    if (!rangeRegex.test(r)) return false;
    const [start, end] = r.split("-");
    if (toMinutes(start) >= toMinutes(end)) return false;
  }
  return true;
};

const validateValue = (
  setting: IConfig,
  value: string | number | boolean | object,
): string | null => {
  if (isScheduleDay(setting.code)) {
    if (!isValidRange(String(value)))
      return "Formato inválido. Usar HH:mm-HH:mm (ej: 09:00-13:00, 18:00-23:00).";
  }
  if (setting.dataType === "number") {
    const n = Number(value);
    if (Number.isNaN(n) || n < 0) return "Debe ser un número positivo.";
  }
  return null;
};

interface FieldRowProps {
  setting: IConfig;
  value: string | number | boolean | object;
  onChange: (value: string | number | boolean) => void;
  customLabel?: string;
  hideName?: boolean;
}

const FieldRow = ({
  setting,
  value,
  onChange,
  customLabel,
  hideName,
}: FieldRowProps) => {
  const [showSecret, setShowSecret] = useState(false);
  const error = validateValue(setting, value);
  const isSecret =
    setting.code === "mpAccessToken" || setting.code === "smtpPass";
  const isUrl = setting.code === "publicBaseUrl";
  const isPrice =
    setting.code === "priceAdult" || setting.code === "priceChild";
  const isDuration = setting.code === "durationShift";

  const label = customLabel ?? setting.name;

  if (setting.dataType === "boolean") {
    const checked = String(value) === "true";
    return (
      <div className="flex items-start justify-between gap-4 py-3">
        <div className="flex-1 min-w-0">
          {!hideName && (
            <p className="font-medium text-gray-800">{label}</p>
          )}
          {setting.description && (
            <p className="text-xs text-gray-500 mt-0.5">
              {setting.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
            checked
              ? "bg-gradient-to-r from-pink-400 to-blue-400"
              : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
              checked ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    );
  }

  if (setting.code === "scheduleText") {
    return (
      <div className="py-3">
        {!hideName && (
          <label className="block text-sm font-medium text-gray-800">
            {label}
          </label>
        )}
        {setting.description && (
          <p className="text-xs text-gray-500 mt-0.5 mb-2">
            {setting.description}
          </p>
        )}
        <textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder={"Martes a Viernes: 17:00 - 21:00\nSábados y Domingos: 15:00 - 20:00"}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300 resize-y"
        />
      </div>
    );
  }

  if (setting.code === "capacityMode") {
    return (
      <div className="py-3">
        {!hideName && (
          <label className="block text-sm font-medium text-gray-800">
            {label}
          </label>
        )}
        {setting.description && (
          <p className="text-xs text-gray-500 mt-0.5 mb-2">
            {setting.description}
          </p>
        )}
        <select
          value={String(value || "tables")}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
        >
          <option value="tables">Por mesas (suma de capacidades)</option>
          <option value="manual">Manual (máximos configurados)</option>
        </select>
      </div>
    );
  }

  return (
    <div className="py-3">
      {!hideName && (
        <label className="block text-sm font-medium text-gray-800">
          {label}
        </label>
      )}
      {setting.description && !hideName && (
        <p className="text-xs text-gray-500 mt-0.5 mb-2">
          {setting.description}
        </p>
      )}
      <div className="relative">
        {isPrice && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <DollarSign className="w-4 h-4" />
          </span>
        )}
        {isSecret ? (
          <>
            <input
              type={showSecret ? "text" : "password"}
              value={String(value || "")}
              placeholder={
                setting.code === "smtpPass"
                  ? "Contraseña o app password"
                  : "TEST-... o APP_USR-..."
              }
              onChange={(e) => onChange(e.target.value)}
              className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowSecret((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              aria-label={
                showSecret ? "Ocultar valor" : "Mostrar valor"
              }
            >
              {showSecret ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </>
        ) : (
          <input
            type={
              setting.dataType === "number"
                ? "number"
                : isUrl
                  ? "url"
                  : "text"
            }
            value={String(value ?? "")}
            placeholder={
              isScheduleDay(setting.code)
                ? "09:00-13:00, 18:00-23:00"
                : isUrl
                  ? "https://tusitio.com"
                  : ""
            }
            onChange={(e) =>
              onChange(
                setting.dataType === "number"
                  ? e.target.value === ""
                    ? ""
                    : Number(e.target.value)
                  : e.target.value,
              )
            }
            className={`w-full ${isPrice ? "pl-9" : ""} ${
              isDuration ? "pr-20" : ""
            } px-3 py-2 border ${
              error ? "border-red-300" : "border-gray-300"
            } rounded-lg focus:ring-2 ${
              error
                ? "focus:ring-red-300 focus:border-red-300"
                : "focus:ring-pink-300 focus:border-pink-300"
            }`}
          />
        )}
        {isDuration && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
            minutos
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

interface CompanySettingsProps {
  /** Si se indica, solo se muestran/guardan configs de estas categorías. */
  categories?: Category[];
  title?: string;
  subtitle?: string;
}

export function CompanySettings({
  categories,
  title = "Configuración del Sistema",
  subtitle = "Parámetros de la compañía agrupados por categoría",
}: CompanySettingsProps = {}) {
  const [settings, setSettings] = useState<IConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<{
    [key: string]: string | boolean | number | object;
  }>({});
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "all">(
    "all",
  );

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = (await getConfigs()) as IConfig[];
      // closedDates se administra en "Días cerrados" y los horarios semanales
      // (scheduleDay*) en el editor estructurado de la sección Horarios.
      const visible = (data || []).filter(
        (s) =>
          s.code !== "closedDates" &&
          s.code !== "daysWeek" &&
          !s.code.startsWith("scheduleDay"),
      );
      // Si la página está scopeada, solo conservamos las categorías indicadas.
      const scoped = categories
        ? visible.filter((s) => categories.includes(getCategory(s.code)))
        : visible;
      setSettings(scoped);
      const initial: { [key: string]: string | number | object | boolean } = {};
      scoped.forEach((s) => (initial[s.code] = s.value));
      setEditedValues(initial);
    } catch (e) {
      console.error("Error loading settings:", e);
    } finally {
      setLoading(false);
    }
  }

  const dirtyKeys = useMemo(
    () =>
      settings
        .filter((s) => editedValues[s.code] !== s.value)
        .map((s) => s.code),
    [settings, editedValues],
  );

  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    for (const s of settings) {
      const v = editedValues[s.code];
      const err = validateValue(s, v);
      if (err && dirtyKeys.includes(s.code)) errs[s.code] = err;
    }
    return errs;
  }, [settings, editedValues, dirtyKeys]);

  async function handleSave() {
    if (Object.keys(validationErrors).length > 0) {
      setError(
        "Hay valores inválidos. Revisá los campos marcados en rojo antes de guardar.",
      );
      return;
    }
    setError(null);
    setSaving(true);
    try {
      let saved = 0;
      for (const setting of settings) {
        if (editedValues[setting.code] !== setting.value) {
          const res = await updateConfig({
            ...setting,
            value: editedValues[setting.code] as any,
          });
          if (res.ack) {
            notifyError(res.message || "Error al guardar");
            throw new Error(res.message);
          }
          saved++;
        }
      }
      await loadSettings();
      notify(`${saved} configuracion${saved !== 1 ? "es" : ""} actualizada${saved !== 1 ? "s" : ""}`);
    } catch (e) {
      console.error("Error saving settings:", e);
    } finally {
      setSaving(false);
    }
  }

  const handleReset = () => {
    const initial: { [key: string]: string | number | object | boolean } = {};
    settings.forEach((s) => (initial[s.code] = s.value));
    setEditedValues(initial);
    setError(null);
  };

  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    const groups: Record<Category, IConfig[]> = {
      payments: [],
      capacity: [],
      schedule: [],
      public: [],
      email: [],
      system: [],
    };
    for (const s of settings) {
      if (
        q &&
        !s.name.toLowerCase().includes(q) &&
        !s.code.toLowerCase().includes(q)
      )
        continue;
      groups[getCategory(s.code)].push(s);
    }
    return groups;
  }, [settings, search]);

  const visibleCategories = (
    Object.keys(CATEGORIES) as Category[]
  ).filter((c) =>
    activeCategory === "all" ? grouped[c].length > 0 : c === activeCategory,
  );

  // Categorías disponibles en esta vista (todas o el subconjunto scopeado).
  const availableCategories = (Object.keys(CATEGORIES) as Category[]).filter(
    (c) => !categories || categories.includes(c),
  );
  // Con una sola categoría no tiene sentido mostrar buscador ni tabs.
  const showFilters = availableCategories.length > 1;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  const onChangeValue = (
    code: string,
    value: string | number | boolean,
  ) => {
    setEditedValues((prev) => ({ ...prev, [code]: value }));
  };

  return (
    <div className="max-w-5xl pb-32">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-blue-300 flex items-center justify-center text-white">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>

      {showFilters && (
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar configuración..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeCategory === "all"
                ? "bg-gradient-to-r from-pink-400 to-blue-400 text-white shadow-md"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            Todas
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeCategory === cat
                  ? "bg-gradient-to-r from-pink-400 to-blue-400 text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {CATEGORIES[cat].icon}
              {CATEGORIES[cat].label}
              <span
                className={`text-xs px-1.5 rounded-full ${
                  activeCategory === cat ? "bg-white/30" : "bg-gray-200"
                }`}
              >
                {grouped[cat].length}
              </span>
            </button>
          ))}
        </div>
      </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3 mb-5">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-red-700">{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-5">
        {visibleCategories.map((cat) => {
          const meta = CATEGORIES[cat];
          const items = grouped[cat];
          if (!items.length) return null;

          // Schedule: otros configs (duración, textos) + editor de
          // franjas horarias estructurado.
          if (cat === "schedule") {
            const others = items.filter((s) => !isScheduleDay(s.code));
            return (
              <section
                key={cat}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <header
                  className={`bg-gradient-to-r ${meta.gradient} text-white p-4 flex items-center gap-3`}
                >
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                    {meta.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{meta.label}</h3>
                    <p className="text-xs text-white/80">
                      {meta.description}
                    </p>
                  </div>
                </header>
                <div className="p-5 space-y-4">
                  {others.map((s) => (
                    <FieldRow
                      key={s.code}
                      setting={s}
                      value={editedValues[s.code] ?? s.value}
                      onChange={(v) => onChangeValue(s.code, v)}
                    />
                  ))}
                  <div className="pt-2 border-t border-gray-100">
                    <WeeklyScheduleEditor />
                  </div>
                </div>
              </section>
            );
          }

          return (
            <section
              key={cat}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <header
                className={`bg-gradient-to-r ${meta.gradient} text-white p-4 flex items-center gap-3`}
              >
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  {meta.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{meta.label}</h3>
                  <p className="text-xs text-white/80">
                    {meta.description}
                  </p>
                </div>
              </header>
              <div className="p-5 divide-y divide-gray-100">
                {items.map((s) => (
                  <FieldRow
                    key={s.code}
                    setting={s}
                    value={editedValues[s.code] ?? s.value}
                    onChange={(v) => onChangeValue(s.code, v)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {visibleCategories.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-12 text-gray-500">
            <Settings className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            No hay configuraciones que coincidan con la búsqueda.
          </div>
        )}
      </div>

      {/* Sticky bottom bar with save / reset */}
      {dirtyKeys.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-white border border-gray-200 shadow-lg rounded-full pl-5 pr-2 py-2 flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm text-gray-700">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-400"></span>
            </span>
            {dirtyKeys.length} cambio{dirtyKeys.length !== 1 ? "s" : ""} sin
            guardar
          </span>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Descartar
          </button>
          <button
            onClick={handleSave}
            disabled={
              saving || Object.keys(validationErrors).length > 0
            }
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-pink-400 to-blue-400 text-white rounded-full text-sm font-semibold hover:from-pink-300 hover:to-blue-300 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              "Guardando..."
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar
              </>
            )}
          </button>
        </div>
      )}

      {dirtyKeys.length === 0 && !loading && (
        <div className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          Todas las configuraciones están guardadas
        </div>
      )}
    </div>
  );
}
