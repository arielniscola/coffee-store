import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import "./css/style.css";
import { UserProvider } from "./context/useAuth";

function App() {
  const location = useLocation();

  useEffect(() => {
    const element = document.querySelector("html");
    if (element) element.style.scrollBehavior = "auto";
    window.scroll({ top: 0 });
    if (element) element.style.scrollBehavior = "";
  }, [location.pathname]); // triggered on route change

  return (
    <UserProvider>
      <Outlet />
    </UserProvider>
  );
}

export default App;
