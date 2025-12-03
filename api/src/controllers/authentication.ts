import Log from "../libs/logger";
import { IRouteController } from "../routes/index";
import { authenticationService } from "../services/authentication";

export class AuthenticationController {
  static login: IRouteController<
    {},
    {},
    { companyCode: string; username: string; password: string },
    {}
  > = async (req, res) => {
    const logger = new Log(
      res.locals.requestId,
      "AuthenticationController.login"
    );
    try {
      const companyCode = req.body.companyCode;
      const username = req.body.username;
      const password = req.body.password;
      // Validaciones de los datos
      if (!companyCode || !username || !password)
        throw new Error("Datos incompletos");

      let sessionToken;
      try {
        /** Autenticar */
        const { token } = await authenticationService.authenticate(
          username,
          password,
          companyCode
        );
        sessionToken = token;
      } catch (error) {
        throw error;
      }
      /** Configuramos la sesion con los datos */
      req.session.companyCode = companyCode;
      req.session.username = username;
      req.session.token = sessionToken;
      /** Renovamos el identificador de sesion (id) para evitar ataques de sesion  */
      const sessionData = Object.assign({}, req.session!);
      await new Promise<void>((resolve, reject) =>
        req.session.regenerate((err) => {
          if (err) reject(err);
          Object.assign(req.session!, sessionData);
          resolve();
        })
      );

      res.json({ ack: 0, token: sessionToken });
    } catch (error) {
      res.json({ ack: 1, error: error.message });
    }
  };

  logout: IRouteController = async (req, res) => {
    const log = new Log(
      res.locals.requestId,
      "AuthenticationController.logout"
    );
    try {
      if (!req.session) return res.redirect("/login");
      // Destruir la session
      req.session.destroy((err) => {
        if (err) log.error(err, `Error al destruir la session: ${err.message}`);
        res.json({ ack: 0, message: "Session cerrada" });
      });
    } catch (e) {
      log.error(e);
      return res.status(400).json({ message: e.message });
    }
  };
}
