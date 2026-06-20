export interface ITable {
  _id?: string;
  number: number;
  capacity: number;
  adultCapacity: number;
  childrenCapacity: number;
  description?: string;
  unitBusiness: string;
  companyCode: string;
  active: boolean;
}
