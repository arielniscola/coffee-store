import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import Login from "../pages/login/login";
import ProtectedRoute from "./ProtectedRoutes";
import Dashboard from "../pages/Dashboard";
import PaymentMethod from "../pages/PaymentMethod/PaymentMethod";
import UnitBusiness from "../pages/unitBusiness/unitBusiness";
import ShiftStatistics from "../pages/statistics/ShiftStatistics";
import Unauthorized from "../pages/unauthorized";
import { ShiftView } from "../pages/shift";
import LandingPage from "../pages/landingPage/LandingPage";
import Tables from "../pages/tables";
import CompanyConfig from "../pages/company";
import ClosedDates from "../pages/closedDates/ClosedDates";
import Workshops from "../pages/workshops/Workshops";
import PaymentResult from "../pages/PaymentResult";
import MpPayments from "../pages/payments/MpPayments";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "reservas", element: <LandingPage /> },
      { path: "payment-result", element: <PaymentResult /> },
      { path: "login", element: <Login /> },
      {
        path: "",
        element: <Navigate to="/reservas" replace />,
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
        path: "/settings/tables",
        element: (
          <ProtectedRoute>
            <Tables />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/companies",
        element: (
          <ProtectedRoute>
            <CompanyConfig />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/closed-dates",
        element: (
          <ProtectedRoute>
            <ClosedDates />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/workshops",
        element: (
          <ProtectedRoute>
            <Workshops />
          </ProtectedRoute>
        ),
      },
      {
        path: "/payments/mercadopago",
        element: (
          <ProtectedRoute>
            <MpPayments />
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
