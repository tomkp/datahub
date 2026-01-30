import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobQueue } from './queue';

describe('JobQueue', () => {
  let queue: JobQueue;

  beforeEach(() => {
    queue = new JobQueue({ concurrency: 2 });
  });

  it('executes jobs', async () => {
    const job = vi.fn().mockResolvedValue('result');

    const result = await queue.add(job);

    expect(job).toHaveBeenCalled();
    expect(result).toBe('result');
  });

  it('executes jobs concurrently up to concurrency limit', async () => {
    const executing: number[] = [];
    let maxConcurrent = 0;

    const createJob = (id: number) => async () => {
      executing.push(id);
      maxConcurrent = Math.max(maxConcurrent, executing.length);
      await new Promise((resolve) => setTimeout(resolve, 50));
      executing.splice(executing.indexOf(id), 1);
      return id;
    };

    const promises = [
      queue.add(createJob(1)),
      queue.add(createJob(2)),
      queue.add(createJob(3)),
      queue.add(createJob(4)),
    ];

    await Promise.all(promises);

    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });

  it('handles job errors', async () => {
    const job = vi.fn().mockRejectedValue(new Error('Job failed'));

    await expect(queue.add(job)).rejects.toThrow('Job failed');
  });

  it('tracks pending jobs count', async () => {
    const queue = new JobQueue({ concurrency: 1 });
    let resolveJob: () => void;
    const blockingJob = () =>
      new Promise<void>((resolve) => {
        resolveJob = resolve;
      });

    queue.add(blockingJob);
    queue.add(() => Promise.resolve());

    expect(queue.pending).toBeGreaterThanOrEqual(1);

    resolveJob!();
  });

  it('can be paused and resumed', async () => {
    queue.pause();

    let executed = false;
    const jobPromise = queue.add(async () => {
      executed = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(executed).toBe(false);

    queue.start();
    await jobPromise;
    expect(executed).toBe(true);
  });
});
