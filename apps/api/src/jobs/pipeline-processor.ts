import { eq, and } from 'drizzle-orm';
import { nowISO } from '@datahub/shared';
import type { AppDatabase } from '../db';
import { pipelines, pipelineRuns, pipelineRunSteps } from '../db/schema';
import { JobQueue } from './queue';

export type StepHandler = (
  runId: string,
  step: string,
  context: { fileVersionId: string; pipelineId: string }
) => Promise<void>;

export class PipelineProcessor {
  private stepHandlers: Map<string, StepHandler> = new Map();

  constructor(
    private db: AppDatabase,
    private queue: JobQueue
  ) {
    // Register default handlers
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers(): void {
    // Default handlers that simulate processing
    const defaultSteps = [
      'malware_scan',
      'pii_scan',
      'pii_review',
      'versioning',
      'data_validation',
      'ingestion',
      'control_checks',
    ];

    for (const step of defaultSteps) {
      this.stepHandlers.set(step, async () => {
        // Simulate some processing time
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
    }
  }

  setStepHandler(step: string, handler: StepHandler): void {
    this.stepHandlers.set(step, handler);
  }

  async startPipelineRun(pipelineId: string, fileVersionId: string): Promise<string> {
    const now = nowISO();
    const runId = crypto.randomUUID();

    // Create pipeline run record
    this.db.insert(pipelineRuns).values({
      id: runId,
      pipelineId,
      fileVersionId,
      status: 'processing',
      createdAt: now,
      updatedAt: now,
    }).run();

    // Get pipeline steps
    const pipeline = this.db.select().from(pipelines).where(eq(pipelines.id, pipelineId)).get();
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    // Handle both JSON string and parsed array (depends on how table was created)
    const steps = typeof pipeline.steps === 'string'
      ? JSON.parse(pipeline.steps) as string[]
      : pipeline.steps as string[];

    // Create step records
    for (const step of steps) {
      const stepId = crypto.randomUUID();
      this.db.insert(pipelineRunSteps).values({
        id: stepId,
        pipelineRunId: runId,
        step,
        status: 'processing',
        createdAt: now,
        updatedAt: now,
      }).run();
    }

    // Queue the processing job
    this.queue.add(() => this.processPipelineRun(runId, pipelineId, fileVersionId, steps));

    return runId;
  }

  private async processPipelineRun(
    runId: string,
    pipelineId: string,
    fileVersionId: string,
    steps: string[]
  ): Promise<void> {
    const context = { fileVersionId, pipelineId };
    let hasError = false;

    for (const step of steps) {
      if (hasError) break;

      const handler = this.stepHandlers.get(step);
      if (!handler) {
        this.updateStepStatus(runId, step, 'errored', `No handler for step: ${step}`);
        hasError = true;
        continue;
      }

      try {
        await handler(runId, step, context);
        this.updateStepStatus(runId, step, 'processed');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.updateStepStatus(runId, step, 'errored', message);
        hasError = true;
      }
    }

    // Update run status
    const now = nowISO();
    this.db.update(pipelineRuns)
      .set({
        status: hasError ? 'errored' : 'processed',
        updatedAt: now,
      })
      .where(eq(pipelineRuns.id, runId))
      .run();
  }

  private updateStepStatus(
    runId: string,
    step: string,
    status: 'processing' | 'processed' | 'errored' | 'warned',
    errorMessage?: string
  ): void {
    const now = nowISO();
    this.db.update(pipelineRunSteps)
      .set({
        status,
        errorMessage: errorMessage ?? null,
        updatedAt: now,
      })
      .where(and(
        eq(pipelineRunSteps.pipelineRunId, runId),
        eq(pipelineRunSteps.step, step)
      ))
      .run();
  }

  async retryPipelineRun(runId: string): Promise<void> {
    const run = this.db.select().from(pipelineRuns).where(eq(pipelineRuns.id, runId)).get();
    if (!run) {
      throw new Error(`Pipeline run ${runId} not found`);
    }

    const pipeline = this.db.select().from(pipelines).where(eq(pipelines.id, run.pipelineId)).get();
    if (!pipeline) {
      throw new Error(`Pipeline ${run.pipelineId} not found`);
    }

    const now = nowISO();
    // Handle both JSON string and parsed array (depends on how table was created)
    const steps = typeof pipeline.steps === 'string'
      ? JSON.parse(pipeline.steps) as string[]
      : pipeline.steps as string[];

    // Reset run status
    this.db.update(pipelineRuns)
      .set({
        status: 'processing',
        updatedAt: now,
      })
      .where(eq(pipelineRuns.id, runId))
      .run();

    // Reset step statuses
    for (const step of steps) {
      this.updateStepStatus(runId, step, 'processing');
    }

    // Queue the processing job
    this.queue.add(() => this.processPipelineRun(runId, run.pipelineId, run.fileVersionId, steps));
  }

  async getPipelineRun(runId: string) {
    const run = this.db.select().from(pipelineRuns).where(eq(pipelineRuns.id, runId)).get();
    if (!run) return null;

    const steps = this.db.select()
      .from(pipelineRunSteps)
      .where(eq(pipelineRunSteps.pipelineRunId, runId))
      .all();

    return { ...run, steps };
  }
}
