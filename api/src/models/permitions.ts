import { createModel, createSchema } from ".";
import { IPermission } from "../libs/permitions";

const PermissionSchema = createSchema<IPermission>({
  code: { type: String, required: true },
  menu: { type: String, required: true },
  subMenu: { type: String, required: true },
  routes: { type: [String], required: true },
  description: { type: String, required: true },
});

PermissionSchema.index({ resource: 1 });

export const PermissionModel = createModel<IPermission>(
  "Permission",
  PermissionSchema
);

export default PermissionModel;
