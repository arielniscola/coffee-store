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
  phoneNumber: string;
  email: string;
  peopleQty: number;
  adultsQty?: number;
  childrenQty?: number;
}
