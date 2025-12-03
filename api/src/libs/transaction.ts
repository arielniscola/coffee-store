import { ClientSession, startSession } from "mongoose";

export type Session = ClientSession;
export type Callback<T> = (session: Session) => Promise<T>;

/**
 * Clase Transaccional
 */
export default class Transaction {
  static async execute<T = void>(callback: Callback<T>): Promise<T> {
    const session = await startSession();
    let result: T;
    await session.withTransaction(async () => {
      result = await callback(session);
      return result;
    });
    await session.endSession();
    return result;
  }
}
