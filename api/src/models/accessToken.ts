import { createModel, createSchema } from ".";

export interface IAccessToken {
  /** Usuario asociado  */
  username: string;
  /** Compania asociada */
  companyCode: string;
  /** Token de autenticacion */
  token: string;
  /** Fecha de expiracion del token */
  expDate: number;
}

const AccessTokenSchema = createSchema<IAccessToken>({
  username: { type: String, required: true },
  companyCode: { type: String, required: true },
  token: { type: String, required: true },
  expDate: { type: Number, required: true },
});

const AccessTokenModel = createModel("AccessToken", AccessTokenSchema);

export default AccessTokenModel;
