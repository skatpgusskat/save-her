import WaitingQueue from "./WaitingQueue";

export default class Locker {
  private readonly waitingQueue: WaitingQueue = new WaitingQueue();

  public async lock<T>(asyncFunction: () => Promise<T>): Promise<T> {
    const jobDoneFunction = await this.waitingQueue.wait();

    const result = await asyncFunction();

    jobDoneFunction();

    return result;
  }
}
