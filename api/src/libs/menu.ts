import { IRoute, IRoutes } from "../routes/index";
import { MENU_TYPES_ROUTES } from "../routes/default";
import { IPermission, Permission } from "./permitions";

export interface IMenu {
  label: string;
  icon: string;
  routes: {
    label: string;
    path: string;
    onlyAdmin?: boolean;
    onlyDefaultCompany?: boolean;
    permission?: Permission[];
  }[];
}

class Menu {
  private static _instance: Menu;
  private _menu: IMenu[] = [];

  async build(routes: IRoutes) {
    const { menu, permissions } = this.generate(routes);
    // this.save(menu, Array(...permissions.values()));
    return menu;
  }

  read(permissions?: string[], isDefaultCompany?: boolean) {
    if (!permissions && isDefaultCompany) return this._menu;
    /**
     * Filtrar del menu aquellos menues que el usuario tenga permiso de ver
     * Vamos a excluir las rutas de Administrador (suponemos que si permissions viene indefinido, es un usuario de la compania napse)
     * Si se tiene permisos para /masterdata, se va a mostrar el menu de Datos Maestros
     **/
    return this._menu
      .map((menu) => ({
        ...menu,
        routes: menu.routes
          .filter((p) => isDefaultCompany || !p.onlyDefaultCompany)
          .filter((route) =>
            permissions
              ? route.permission &&
                route.permission.some((permission) =>
                  permissions.includes(permission.code)
                ) &&
                !route.onlyAdmin
              : !route.onlyAdmin
          ),
      }))
      .filter((menu) => menu.routes.length > 0);
  }

  /**
   * Obtener instancia de Menu
   * @returns Instancia de Menu
   */
  static getInstance() {
    if (!Menu._instance) {
      Menu._instance = new Menu();
    }
    return Menu._instance;
  }

  /**
   * Generar menu
   * @returns Menu generado
   */
  private generate(routes: IRoutes) {
    const permissions = new Map<String, IPermission>();
    const menu = routes.map((route) => {
      const routes = this.process(route.type, route.routes);
      routes.forEach((r) => {
        if (r.permission) {
          let { permission: permissionsArray } = r;
          // El path sera la concatenacion del metodo con la ruta
          const path = String(`${r.method} ${r.path}`).toUpperCase();
          // Iterar cada permiso
          for (const permission of permissionsArray) {
            // Si no existe el permiso en el map, lo creamos
            if (!permissions.has(permission.code)) {
              permissions.set(permission.code, {
                ...permission,
                routes: [path],
              });
            } else {
              // Si existe, agregamos la ruta
              const p = permissions.get(permission.code);
              permissions.set(permission.code, {
                ...p,
                routes: [...p.routes, path],
              });
            }
          }
        }
      });
      return {
        label: route.label,
        icon: route.icon,
        routes: routes.filter((r) => !r.hide),
      };
    });
    // // Agregar permiso para ver Datos Maestros
    // permissions.set(MasterDataViewPermission.code, {
    //     ...MasterDataViewPermission,
    //     routes: ["GET /masterdata/:name", ...this.generateMasterDataMenu().map(r => `GET ${r.path}`)]
    // });
    return { menu, permissions };
  }

  /**
   * Generar menu de Datos Maestros
   */
  // private generateMasterDataMenu(): IRoute[] {
  //     return MasterData.getDataList().map(([name, title]) => {
  //         return {
  //             path: `/masterdata/${name}`,
  //             label: title,
  //             method: 'get',
  //             controller: MasterDataController.index,
  //             permission: [MasterDataViewPermission]
  //         }
  //     })
  // }

  /**
   * Concatenar las rutas del tipo
   * de menu principal, y filtrar las rutas ocultas (hide) y de API del menu
   * @param routes Rutas a concatenar
   * @param menu Rutas del menu
   * @returns Rutas filtradas y concatenadas con el menu
   *
   */
  private filter(menu: IRoute[], routes: IRoute[]) {
    return routes.concat(menu);
  }

  /** Procesar tipo especial de menu */
  private process(type: string, routes: IRoute[]) {
    return this.filter(MENU_TYPES_ROUTES[type] || [], routes);
  }

  /**
   * Guardar menu en cache
   * Generar permisos y guardar en cache
   * @param menu Menu a guardar
   * @returns Menu guardado
   */
  // private async save(menu: IMenu[], permissions: IPermission[]) {
  //     const cache = Cache.getClient()
  //     this._menu = menu;
  //     await permissionCoreService.generate(permissions)
  //     cache.set("menu", JSON.stringify(menu))
  // }
}

export default Menu.getInstance();
