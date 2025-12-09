import { useState, useEffect } from "react";
import { Settings, Save } from "lucide-react";
import { IConfig } from "../../interfaces/config";
import { getConfigs, updateConfig } from "../../services/config";
import toast, { Toaster } from "react-hot-toast";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

export function CompanySettings() {
  const [settings, setSettings] = useState<IConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<{
    [key: string]: string | boolean | number | object;
  }>({});
  const [filter, setFilter] = useState<"all" | "server" | "client">("all");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = (await getConfigs()) as IConfig[];
      setSettings(data || []);

      const initialValues: {
        [key: string]: string | number | object | boolean;
      } = {};
      data?.forEach((setting) => {
        initialValues[setting.code] = setting.value;
      });
      setEditedValues(initialValues);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      for (const setting of settings) {
        if (editedValues[setting.code] !== setting.value) {
          setting.value = editedValues[setting.code];
          const res = await updateConfig(setting);
          if (res.ack) {
            notifyError(res.message || "Error al actualizar config");
            throw new Error(res.message);
          }
        }
      }
      loadSettings();
      notify("Configuraciones modificadas correctamente");
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  }

  const filteredSettings =
    filter === "all" ? settings : settings.filter((s) => s.type === filter);

  const getInputType = (dataType: string) => {
    switch (dataType) {
      case "number":
        return "number";
      case "boolean":
        return "checkbox";
      default:
        return "text";
    }
  };

  const renderValue = (setting: IConfig, value: string) => {
    if (setting.dataType === "boolean") {
      return (
        <input
          type="checkbox"
          checked={value === "true"}
          onChange={(e) =>
            setEditedValues({
              ...editedValues,
              [setting.code]: e.target.checked ? "true" : "false",
            })
          }
          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      );
    }

    return (
      <input
        type={getInputType(setting.dataType)}
        value={value}
        onChange={(e) =>
          setEditedValues({
            ...editedValues,
            [setting.code]: e.target.value,
          })
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    );
  };

  const getTypeColor = (type: string) => {
    return type === "server"
      ? "bg-purple-100 text-purple-800 border-purple-300"
      : "bg-blue-100 text-blue-800 border-blue-300";
  };

  const getTypeText = (type: string) => {
    return type === "server" ? "Servidor" : "Cliente";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
          <Settings className="w-8 h-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-900">
            Configuración del Sistema
          </h2>
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
          {["all", "server", "client"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === type
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              {type === "all" ? "Todas" : getTypeText(type)}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredSettings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay configuraciones para mostrar
            </div>
          ) : (
            filteredSettings.map((setting) => (
              <div
                key={setting.code}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {setting.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {setting.description}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(
                      setting.type
                    )}`}
                  >
                    {getTypeText(setting.type)}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    {setting.dataType === "boolean" ? (
                      <div className="flex items-center gap-3">
                        {renderValue(
                          setting,
                          editedValues[setting.code] as string
                        )}
                        <span className="text-sm text-gray-700">
                          {editedValues[setting.code] === "true"
                            ? "Habilitado"
                            : "Deshabilitado"}
                        </span>
                      </div>
                    ) : (
                      <div>
                        {renderValue(
                          setting,
                          editedValues[setting.code] as string
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Tipo:{" "}
                          <span className="font-medium">
                            {setting.dataType}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredSettings.length > 0 && (
          <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? "Guardando..." : "Guardar Configuración"}
            </button>
          </div>
        )}
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
