import Log from "./logger";
import { IRoute, IRoutes, IRouteController } from "../routes/index";
import { IMenu } from "./menu";
import express from "express";
import { createHttpTerminator, HttpTerminator } from "http-terminator";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";
import https from "https";
import http from "http";
import validateToken from "../middlewares/validateToken";
import requestTrace from "../middlewares/requestId";
import expressSession from "express-session";
import ShifManagement from "..";

const log = new Log("Server");

/**
 * Parametros de configuración del servidor
 */
export interface IAppServerOptions {
  /** Rutas definidas */
  routes?: IRoutes;
}
/**
 * Interfaz que define los atributos en req.session
 */
export interface ISessionData {
  /** Usuario de la sesion activa */
  username: string;
  /** Token del usuario */
  token: string;
  /** Codigo de la compañia del usuario activo */
  companyCode: string;
  /** Permisos del usuario */
  permissions: string[];
  /** Menu del usuario */
  menu: IMenu[];
}
/** Definir aca los atributos disponibles en la session */
declare module "express-session" {
  interface SessionData extends ISessionData {}
}

/** Servidor HTTP para la aplicacion
 * @class Server
 * @param {number} port Puerto de escucha del server
 * @returns Instancia de servirod HTTP
 */
export class HttpServer {
  /** Servidor de Express */
  private _server: express.Application;
  /** Opciones del servidor */
  private _options: IAppServerOptions;
  /** Puerto de escucha del servidor */
  private _port: number;
  /** Instancia de Http Terminator */
  private _terminator: HttpTerminator;

  constructor() {
    this._server = express();
  }
  /**
   * Concatenar las rutas
   */
  private flattenRoutes(routes: IRoutes) {
    let flatRoutes: IRoute[] = [];
    for (const route of routes) {
      flatRoutes.push(...route.routes);
    }
    return flatRoutes;
  }
  /** Leer rutas de la aplicacion */
  private loadRouter(routes: IRoutes) {
    // Recorremos las rutas y concatenamos los hijos
    const flatRoutes = this.flattenRoutes(routes);
    // Creamos el enrutador
    const router = express.Router();
    // Cargamos las rutas por defecto
    for (const route of flatRoutes) {
      let handlers: IRouteController[] = [];
      /** Cargamos los middlewares necesarios */
      // Agregar el middleware para logging
      handlers.push(requestTrace);
      if (route.auth !== false) {
        handlers.push(validateToken);
      }
      /** Cargamos el handler de la ruta */
      handlers.push(route.controller);
      /** Cargamos la ruta al enrutador */
      router[route.method](route.path, handlers);
    }
    return router;
  }

  /** Configurar servidor de express */
  private async configure(port: number, options?: IAppServerOptions) {
    // Configurar puerto y opciones
    this._port = port;
    this._options = options;

    // Proteccion de encabezados HTTP
    this._server.use(
      helmet({
        contentSecurityPolicy: false,
      })
    );
    // Configurar parsers y cors
    this._server.use(bodyParser.json({ limit: "50mb" }));
    this._server.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
    this._server.use(cors());

    // Cargamos las rutas definidas por el usuario
    const customRouter = this.loadRouter(this._options.routes);

    const secret = ShifManagement.get("server.secret");
    const session = expressSession({
      secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Cookie segura solo en entorno productivo
      },
    });
    this._server.use(session);
    this._server.use(customRouter);
  }

  /** Iniciar servidor */
  public async start(port: number, options?: IAppServerOptions): Promise<void> {
    try {
      await this.configure(port, options);
      let server: http.Server | https.Server | null = null;
      server = http.createServer(this._server);

      const checkIfAlive: Promise<void> = new Promise((resolve, reject) => {
        if (!server) throw "No se pudo inicar el servidor";
        server.listen(this._port, () => {
          resolve();
        });
        server.on("error", (err) => {
          console.error(`server.start() error: ${err}`);
          reject(err);
        });
      });
      this._terminator = createHttpTerminator({ server });
      try {
        await checkIfAlive;
        log.info(`server.start() iniciado en puerto: ${this._port}`);
      } catch (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cerrar conexiones al servidor
   */
  public async stop(): Promise<void> {
    try {
      if (!this._terminator)
        throw new Error(
          "No se pudo detener el servidor: La instancia de httpTerminator no fue creada"
        );
      await this._terminator.terminate();
      log.info(`server.stop() servidor detenido en puerto: ${this._port}`);
    } catch (error) {
      log.error(error, `server.stop() error: ${error.message}`);
    }
  }

  /**
   * Obtener puerto de escucha del servidor
   * @returns Puerto de escucha del servidor
   */
  get port() {
    return this._port;
  }
}
/**
 * Funcion para interceptar el metodo JSON de la respuesta
 * De esta manera podemos obtener el body del request
 * y lo guardamos en res.locals para que se lo pueda acceder en cualquier parte
 * @param res Objeto Respuesta de Express
 * @param json Metodo .json del Objeto Respuesta de Express
 * @return Objeto Respuesta de Express con el metodo .json modificado
 */
export const resDotJsonInterceptor =
  (res: express.Response, json: express.Send) =>
  (content: string): express.Response => {
    res.json = json;
    res.locals.response = content;
    res.json(content);
    return res;
  };
export const AppServer = new HttpServer();
export default AppServer;
