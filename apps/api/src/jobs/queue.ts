import PQueue from 'p-queue';

export interface JobQueueOptions {
  concurrency?: number;
}

export class JobQueue {
  private queue: PQueue;

  constructor(options: JobQueueOptions = {}) {
    this.queue = new PQueue({
      concurrency: options.concurrency ?? 1,
    });
  }

  async add<T>(job: () => Promise<T>): Promise<T> {
    return this.queue.add(job) as Promise<T>;
  }

  get pending(): number {
    return this.queue.pending;
  }

  get size(): number {
    return this.queue.size;
  }

  pause(): void {
    this.queue.pause();
  }

  start(): void {
    this.queue.start();
  }

  clear(): void {
    this.queue.clear();
  }

  async onIdle(): Promise<void> {
    return this.queue.onIdle();
  }
}
