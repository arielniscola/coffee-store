export interface IShift {
  _id?: string;
  timeStart: string;
  timeEnd: string;
  status: string;
  client: string;
  unitBusiness: string;
  notificated?: boolean;
  companyCode?: string;
  date: string;
  description?: string;
  tableNumber: number;
  phoneNumber: string;
  email: string;
}
