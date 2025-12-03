export interface IUser {
  _id?: string;
  username: string;
  password?: string;
  companyCode: string;
  active?: boolean;
}

export interface IAuthResponse {
  ack: number;
  user: IUser;
  token?: string;
  error?: string;
}
