import accessTokenService from "./accessToken";
import { companyService } from "./company";
import { userService } from "./user";

export class AuthenticationService {
  constructor() {}

  public async authenticate(
    username: string,
    password: string,
    companyCode: string
  ) {
    let user = await userService.findOne({ username, companyCode });
    if (!user) throw new Error("Credenciales invalidas");
    const existsCompany = await companyService.exists({
      code: companyCode,
      active: true,
    });
    //if (!existsCompany) throw new Error("Credenciales invalidas");
    user.companyCode = companyCode;
    const validPassword = userService.comparePassword(password, user.password);
    if (!validPassword) throw new Error("Credenciales invalidas");
    // Generamos el token de autenticacion
    const token = await accessTokenService.generateToken(user);
    return token;
  }
}

export const authenticationService = new AuthenticationService();
