import React, { createContext, useEffect, useState } from "react";
import { IAuthResponse, IUser } from "../interfaces/user";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authenticatinService";
import toast, { Toaster } from "react-hot-toast";

const notify = (msg: string) => toast.success(msg);
const notifyError = (msg: string) => toast.error(msg);

type UserContextType = {
  user: IUser | null;
  loginUser: (data: IUser) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
};

type Props = { children: React.ReactNode };

const UserContext = createContext<UserContextType>({} as UserContextType);

export const UserProvider = ({ children }: Props) => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (user && token) {
      setUser(JSON.parse(user));
      setToken(token);
    }
    setIsReady(true);
  }, []);

  const loginUser = async (data: IUser) => {
    await login(data)
      .then((res: IAuthResponse) => {
        if (res.ack !== 1) {
          if (res.token) {
            localStorage.setItem("token", res.token);
            delete data.password;
            localStorage.setItem("user", JSON.stringify(data));
            setToken(res.token);
            setUser(data);
          }
          notify(res.token ? "Inicio sesion correctamente" : "ok");
          setTimeout(() => {
            navigate("/dashboard");
          }, 1000);
        } else {
          notifyError(res.error ? res.error : "Error");
        }
      })
      .catch((error) => {
        notifyError(error.message ? error.message : error);
      });
  };

  const isLoogedIn = () => {
    return !!token;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  return (
    <UserContext.Provider
      value={{ user, loginUser: loginUser, logout, isLoggedIn: isLoogedIn }}
    >
      {isReady ? children : null}
      <Toaster position="bottom-right" />
    </UserContext.Provider>
  );
};

export const useAuth = () => React.useContext(UserContext);
