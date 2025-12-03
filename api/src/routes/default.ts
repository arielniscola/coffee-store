import { IRoute } from ".";

export const CONFIG_MENU: IRoute[] = [];
export const BUSINESS_MENU: IRoute[] = [];

/** Asociacion entre tipo de menu y sus rutas */
export const MENU_TYPES_ROUTES: { [key: string]: IRoute[] } = {
  config: CONFIG_MENU,
  business: BUSINESS_MENU,
};
