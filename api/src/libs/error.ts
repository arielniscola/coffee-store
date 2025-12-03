interface IShippmentError {
  ack: number;
  message: string;
}
export class ShippmentError {
  ack: number;
  message: string;

  constructor(error: IShippmentError) {
    this.ack = error.ack;
    this.message = error.message;
  }

  public setMessage(message: string) {
    message = this.message.replace("${message}", message);
    return new ShippmentError({ ...this, message });
  }
}
