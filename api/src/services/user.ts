import { InsertManyOptions } from "mongoose";
import { Service } from ".";
import { IUser, UserModel } from "../models/user";
import bcrypt from "bcrypt";

export class UserService extends Service<IUser> {
  constructor() {
    super(UserModel);
  }

  private async encryptPassword(password: string) {
    const salt = bcrypt.genSaltSync(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  }

  comparePassword = (password: string, hash: string) => {
    return bcrypt.compare(password, hash);
  };

  async insertOne(data: Partial<IUser>, options?: InsertManyOptions) {
    data.password = await this.encryptPassword(data.password);
    const result = await super.insertOne(data, options);
    return result;
  }

  async changePassword(
    companyCode: string,
    username: string,
    newPassword: string
  ) {
    const hash = await this.encryptPassword(newPassword);
    const result = await this.updateOne(
      { companyCode, username },
      { password: hash }
    );
    return result;
  }
}

export const userService = new UserService();
