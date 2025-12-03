export interface IPermission {
  code: string;
  menu: string;
  subMenu: string;
  description: string;
  routes: string[];
}

export class Permission implements IPermission {
  menu: string;
  subMenu: string;
  description: string;
  code: string;
  routes: string[];

  constructor(
    code: string,
    menu: string,
    subMenu: string,
    description: string
  ) {
    this.code = code;
    this.menu = menu;
    this.subMenu = subMenu;
    this.description = description;
  }
}
