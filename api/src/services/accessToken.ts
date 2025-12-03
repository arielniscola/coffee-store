import { Service } from ".";
import FiscalFlowCore, { Coffeshop } from "..";
import configService from "./config";
import jwt from "jsonwebtoken";
import moment from "moment";
import configCoreService from "./config";
import AccessTokenModel, { IAccessToken } from "../models/accessToken";

export class AccessTokenService extends Service<IAccessToken> {
  constructor() {
    super(AccessTokenModel);
  }

  /**
   * Metodo para generar el token de autenticacion
   * @param {IUser} user Usuario
   * @returns Token de autenticacion
   */
  async generateToken(user: { username: string; companyCode: string }) {
    const { companyCode, username } = user;
    // Si el usuario ya tiene un token valido, devolverlo
    const existsValidToken = await this.findOne({
      username,
      companyCode,
      expDate: { $gt: Date.now() },
    });
    if (existsValidToken) {
      const expDate = moment(existsValidToken.expDate).toDate().getTime();
      const expUnit = "s";
      const expiresIn = moment(expDate).diff(Date.now(), expUnit);
      return { token: existsValidToken.token, expiresIn, expUnit, expDate };
    }
    // Obtenemos el valor del parametro de configuracion de tiempo de expiracion
    // Segun sea o no un usuario API
    const sessionTimeConfig = "sessionExpiresIn";
    let sessionExpiresIn = 36000;
    //   ((await configService.getValue(
    //     sessionTimeConfig,
    //     companyCode
    //   )) as number) || 3600;
    // // Obtenemos el valor de la clave secreta del jwt
    const secret = Coffeshop.get("server.secret");
    // Generamos el token de autenticacion
    const token = jwt.sign(
      {
        username,
        companyCode,
      },
      secret,
      {
        // Configuramos el tiempo de expiracion del token en segundos
        expiresIn: sessionExpiresIn,
      }
    );
    // Calculamos fecha de expiracion
    const expDate = moment()
      .add(sessionExpiresIn, "seconds")
      .toDate()
      .getTime();
    const expUnit = "s";
    const expiresIn = moment(expDate).diff(Date.now(), expUnit);

    // Pisamos el token existente (si existe), o creamos uno nuevo
    await this.updateOne(
      { username, companyCode },
      { token, expDate },
      { upsert: true }
    );
    // Devolvemos el token
    return { token, expiresIn, expUnit, expDate };
  }

  /**
   * Metodo para validar si un token es valido
   * @param {string} token Token de autenticacion
   * @returns Payload del token
   */
  async validateToken(token: string) {
    // Obtenemos el valor de la clave secreta del jwt
    const secret = FiscalFlowCore.get("server.secret");
    // Verificamos si el token es valido
    try {
      const payload = jwt.verify(token, secret) as {
        username: string;
        companyCode: string;
      };
      return payload;
    } catch (error) {
      // Si el token esta expirado, verificamos si no lo tenemos en la db (solo aplica al API User)
      const tokenDecoded = jwt.decode(token) as {
        username: string;
        companyCode: string;
      };
      if (!tokenDecoded) return null;
      const { username, companyCode } = tokenDecoded;
      if (error.name === "TokenExpiredError") {
        const existsToken = await this.findOne({
          username,
          companyCode,
          token,
        });
        // Si existe el token, verificamos que no haya expirado hace menos de MaxTimeInMinutes
        if (existsToken) {
          // Obtenemos los parametros de config.
          // const maxAcumulatedQty = (await configCoreService.getValue(
          //   "tokenExpirationMaxAcumulatedQty",
          //   companyCode
          // )) as number;
          // const tokenExpirationTimeInMinutes =
          //   (await configCoreService.getValue(
          //     "tokenExpirationTimeInMinutes",
          //     companyCode
          //   )) as number;
          // Calcular el rango de tiempo en que se aceptaran tokens expirados segun los parametros de configuracion MaxAcumulatedQty (descuenta uno) y TimeInMinutes
          const maxTimeInMinutes = 60; //         (maxAcumulatedQty - 1) * tokenExpirationTimeInMinutes;
          // Si el token expiro hace menos de MaxTimeInMinutes, devolverlo
          const expiresIn = moment().diff(existsToken.expDate, "minutes");
          // Si el token expiro hace menos de MaxTimeInMinutes, devolverlo
          if (expiresIn <= maxTimeInMinutes) {
            // Devolver el payload
            return { username, companyCode };
          }
        }
      }
      return null;
    }
  }
}

const accessTokenService = new AccessTokenService();
export default accessTokenService;
