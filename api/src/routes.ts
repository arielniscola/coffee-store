import { defineRoutes } from "./routes/index";
import { PaymentMethodController } from "./controllers/paymentMethod";
import { CompanyController } from "./controllers/company";
import { ShiftController } from "./controllers/shift";
import { UnitBusinessController } from "./controllers/unitBusiness";
import UserController from "./controllers/user";
import { AuthenticationController } from "./controllers/authentication";
import { TableController } from "./controllers/tables";
import { ConfigController } from "./controllers/config";

/**
 * Declaracion de Rutas.
 * Cada ruta pertenece a una agrupacion.
 * Cada agrupacion conformara un menu principal, y cada ruta, un sub-menu.
 *
 * Las rutas son un array donde cada objeto es un menu.
 * Cada menu tiene las propiedades:
 *  - label: Etiqueta del menu
 *  - icon: Icono a mostrar
 *  - routes: Un array de las rutas del menu (sub-menu)
 * Cada objeto en routes (sub-menu) tiene las propiedades:
 *  - path: Ruta absoluta al controlador
 *  - label: Etiqueta del sub-menu
 *  - method: Metodo HTTP
 *  - controller: Controlador para la ruta
 *  - auth: Define si requiere autenticacion. Por defecto true.
 *
 * Para ver todas las definiciones disponibles, ver la interfaz IRoute.
 */
const routes = defineRoutes([
  /** Negocio */
  {
    label: "Negocio",
    icon: "fa-store",
    type: "business",
    routes: [
      /** Menu Principal */
      // Metodos de pago
      {
        path: "/paymentMethod",
        label: "Metodo de pago",
        method: "get",
        controller: PaymentMethodController.find,
        auth: true,
      },
      {
        path: "/paymentMethod",
        label: "Crear Metodo de pago",
        method: "post",
        controller: PaymentMethodController.create,
        auth: true,
      },
      {
        path: "/paymentMethod",
        label: "Actualizar Metodo de pago",
        method: "put",
        controller: PaymentMethodController.update,
        auth: true,
      },
      {
        path: "/paymentMethod/:id",
        label: "Eliminar Metodo de pago",
        method: "delete",
        controller: PaymentMethodController.delete,
        auth: true,
      },
      // Compañias
      {
        path: "/company",
        label: "Compañia",
        method: "post",
        controller: CompanyController.create,
        auth: true,
      },
      {
        path: "/company",
        label: "Compañia",
        method: "get",
        controller: CompanyController.find,
        auth: true,
      },
      {
        path: "/company",
        label: "Compañia",
        method: "put",
        controller: CompanyController.update,
        auth: true,
      },
      // Turnos
      {
        path: "/shifts",
        label: "Turnos",
        method: "post",
        controller: ShiftController.create,
        auth: true,
      },
      {
        path: "/shifts",
        label: "Turnos",
        method: "get",
        controller: ShiftController.find,
        auth: true,
      },
      {
        path: "/shifts",
        label: "Turnos",
        method: "put",
        controller: ShiftController.update,
        auth: true,
      },
      {
        path: "/shifts/:id",
        label: "Turnos",
        method: "delete",
        controller: ShiftController.delete,
        auth: true,
      },
      {
        path: "/shifts/statistics",
        label: "Turnos",
        method: "get",
        controller: ShiftController.statistics,
        auth: true,
      },
      {
        path: "/shifts/availables",
        label: "Turnos",
        method: "get",
        controller: ShiftController.getAvaliableShifts,
        auth: true,
      },
      // Unidad de negocios
      {
        path: "/unitBusiness",
        label: "Turnos",
        method: "post",
        controller: UnitBusinessController.create,
        auth: true,
      },
      {
        path: "/unitBusiness",
        label: "Unidad de Negocio",
        method: "get",
        controller: UnitBusinessController.find,
        auth: true,
      },
      {
        path: "/unitBusiness",
        label: "Unidad de Negocio",
        method: "put",
        controller: UnitBusinessController.update,
        auth: true,
      },
      {
        path: "/unitBusiness/:id",
        label: "Unidad de Negocio",
        method: "delete",
        controller: UnitBusinessController.delete,
        auth: true,
      },
      // Users
      {
        path: "/users",
        label: "Usuarios",
        method: "post",
        controller: UserController.create,
        auth: false,
      },
      // Authentication
      {
        path: "/users/login",
        label: "Usuarios",
        method: "post",
        controller: AuthenticationController.login,
        auth: false,
      },
      // Mesas
      {
        path: "/tables",
        label: "Mesas",
        method: "post",
        controller: TableController.create,
        auth: true,
      },
      {
        path: "/tables",
        label: "Mesas",
        method: "get",
        controller: TableController.find,
        auth: true,
      },
      {
        path: "/tables",
        label: "Mesas",
        method: "put",
        controller: TableController.update,
        auth: true,
      },
      {
        path: "/tables/:id",
        label: "Mesas",
        method: "delete",
        controller: TableController.delete,
        auth: true,
      },

      //Configuraciones
      {
        path: "/configs",
        label: "Configuraciones",
        method: "get",
        controller: ConfigController.find,
        auth: true,
      },
      {
        path: "/configs",
        label: "Configuraciones",
        method: "put",
        controller: ConfigController.update,
        auth: true,
      },
    ],
  },
]);

export default routes;
