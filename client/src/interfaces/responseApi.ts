export interface ResponseApi<T> {
  ack: number;
  data: T[] | T;
  total: number;
  message?: string;
}
