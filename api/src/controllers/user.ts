import { DEFAULT_SUSER } from "../constants/defaults";
import Log from "../libs/logger";
import { IUser } from "../models/user";
import { IRouteController } from "../routes/index";
import { authenticationService } from "../services/authentication";
import { userService } from "../services/user";

export default class UserController {
  /** Buscador de usuarios */
  static find: IRouteController<
    {},
    {},
    {},
    { [key: string]: string; name?: string; email?: string; role?: string }
  > = async (req, res) => {
    const log = new Log(res.locals.requestId, "UserController.find");
    try {
      const companyCode = res.locals.companyCode;
      const params = req.query;
      /** Generamos consulta en base a los filtros (con expresion regular) */
      let filter: { [key: string]: string | object } = {
        companyCode,
      };
      if (params) {
        for (const key of Object.keys(params)) {
          filter[key] = { $regex: params[key], $options: "i" };
        }
      }
      let data: Array<IUser> = await userService.find(filter, { password: 0 });

      res.json({ data });
    } catch (e) {
      log.error(e);
      return res.status(400).json({ message: e.message });
    }
  };

  static create: IRouteController = async (req, res) => {
    const log = new Log(res.locals.requestId, "UserController.save");
    try {
      let data = req.body;
      // Verificamos que no sea un super usuario
      if (data.username === DEFAULT_SUSER.username)
        throw new Error("Nombre usuario no es válido");
      /** Validar datos */
      const errors = await userService.validate(data);
      if (!errors) {
        /** Guardar datos */

        /** Verificar que no exista una compania con este code  */
        const existsUsername = await userService.findOne({
          companyCode: data.companyCode,
          username: data.username,
        });
        if (existsUsername) throw new Error("Nombre de usuario ya existe");

        const created = await userService.insertOne(data);
        if (!created) throw new Error("No se pudo crear el usuario");
        /** Enviar confirmacion */
        return res.json({
          ack: 0,
          message: `El usuario se ha creado correctamente`,
        });
      }
      const { message } = errors;
      return res.status(400).json({ ack: 1, message });
    } catch (e) {
      log.error(e);
      return res.status(400).json({ message: e.message });
    }
  };

  static setPassword: IRouteController = async (req, res) => {
    const entity = "Contraseña";
    const log = new Log(res.locals.requestId, "UserController.setPassword");
    try {
      const data = req.body;
      const companyCode = res.locals.companyCode;
      const _id = req.params.id;
      const isOwnPassword = _id === "me";
      let username = res.locals.username;
      if (!isOwnPassword) {
        /** Validar que el _id sea valido */
        if (!userService.validateId(_id)) throw new Error("ID no válido");
        const user = await userService.findOne({ companyCode, _id });
        /** Si no existe el usuario, devolver a la grilla */
        if (!user) throw new Error("Usuario no encontrado");
        username = user.username;
      }
      /** Validar datos */
      const { password, password_repeat } = data;
      if (!password || !password_repeat)
        return res.status(400).json({ message: "Debe ingresar la contraseña" });
      if (password !== password_repeat)
        return res
          .status(400)
          .json({ message: "Las contraseñas no coinciden" });
      /** Actualizar password */
      await userService.changePassword(companyCode, username, password);
      res.json({ ack: 0, message: `${entity} actualizada correctamente` });
    } catch (e) {
      log.error(e);
      return res.status(400).json({ message: e.message });
    }
  };
}
