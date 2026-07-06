export interface IWorkshop {
  _id?: string;
  companyCode?: string;
  /** Fecha del taller (ISO o yyyy-MM-dd). */
  date: string;
  title: string;
  description?: string;
  /** Precio de la reserva por niño para ese día (reemplaza al config priceChild). */
  priceChild: number;
  /** Un taller inactivo no cambia precios ni se muestra en la landing. */
  active?: boolean;
}
