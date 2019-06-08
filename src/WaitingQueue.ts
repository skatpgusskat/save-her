export type JobDoneFunction = () => void;

export default class WaitingQueue {
  private waitingFunctionQueue: (() => void)[] = [];
  private isJobOnProgress: boolean;

  public wait(): Promise<JobDoneFunction> {
    if (!this.isJobOnProgress) {
      return new Promise((resolve) => {
        this.isJobOnProgress = true;
        resolve(() => this.onJobDone());
      });
    }

    return new Promise((resolve) => {
      this.waitingFunctionQueue.push(() => {
        this.isJobOnProgress = true;
        resolve(() => this.onJobDone());
      });
    });
  }

  private onJobDone(): void {
    this.isJobOnProgress = false;

    if (!this.waitingFunctionQueue.length) {
      return;
    }

    const firstWaitingFunction = this.waitingFunctionQueue.pop();

    firstWaitingFunction();
  }
}
