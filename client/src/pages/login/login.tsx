import React, { useState } from "react";
import { Lock, LogIn, Building2, User } from "lucide-react";
import { useAuth } from "../../context/useAuth";

const Login = () => {
  const { loginUser } = useAuth();
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
    companyCode: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await loginUser(loginData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url(/images/login-bg.jpeg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-8 space-y-6 relative z-10">
        <div className="text-center">
          <div className="flex justify-center">
            <LogIn className="h-12 w-12 text-pink-400" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            ¡Bienvenidos!
          </h1>
          <p className="mt-2 text-gray-600">
            Por favor inicie sesión con la cuenta
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="company"
              className="text-sm font-medium text-gray-700 block"
            >
              Compañia
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="company"
                type="text"
                value={loginData.companyCode}
                onChange={(e) =>
                  setLoginData({ ...loginData, companyCode: e.target.value })
                }
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                placeholder="Tu cod. de compañia"
                required
                autoComplete="organization"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-sm font-medium text-gray-700 block"
            >
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                type="text"
                value={loginData.username}
                onChange={(e) =>
                  setLoginData({ ...loginData, username: e.target.value })
                }
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                placeholder="Tu usuario"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700 block"
            >
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-pink-400 to-blue-400 hover:from-pink-300 hover:to-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Iniciando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
