import { createModel, createSchema } from ".";

export interface IUser {
  username: string;
  password: string;
  companyCode: string;
  name: string;
  active: boolean;
}

const UserSchema = createSchema<IUser>({
  username: { type: String, required: true },
  password: { type: String, required: true },
  companyCode: { type: String, required: true },
  name: { type: String, required: true },
  active: { type: Boolean, required: true, default: true },
});

UserSchema.index({ username: 1, companyCode: 1 }, { unique: true });

export const UserModel = createModel<IUser>("users", UserSchema);
