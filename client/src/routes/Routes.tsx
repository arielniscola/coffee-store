import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Login from "../pages/login/login";
import ProtectedRoute from "./ProtectedRoutes";
import ClientView from "../pages/client/clientsView";
import Dashboard from "../pages/Dashboard";
import PaymentMethod from "../pages/PaymentMethod/PaymentMethod";
import UnitBusiness from "../pages/unitBusiness/unitBusiness";
import ShiftStatistics from "../pages/statistics/ShiftStatistics";
import Unauthorized from "../pages/unauthorized";
import { ShiftView } from "../pages/shift";
import LandingPage from "../pages/landingPage/LandingPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "login", element: <Login /> },
      { path: "/coffeeshop", element: <LandingPage /> },
      {
        path: "",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "shift",
        element: (
          <ProtectedRoute>
            <ShiftView />
          </ProtectedRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "clients",
        element: (
          <ProtectedRoute>
            <ClientView />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/payment-methods",
        element: (
          <ProtectedRoute>
            <PaymentMethod />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/unit-business",
        element: (
          <ProtectedRoute>
            <UnitBusiness />
          </ProtectedRoute>
        ),
      },
      {
        path: "/statistics",
        element: (
          <ProtectedRoute>
            <ShiftStatistics />
          </ProtectedRoute>
        ),
      },
      {
        path: "access-denied",
        element: <Unauthorized />,
      },
    ],
  },
]);
