import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '../db';
import { pipelines, pipelineRuns, pipelineRunSteps } from '../db/schema';
import { PIPELINE_STEPS, DATASET_KINDS } from '@datahub/shared';

const createPipelineSchema = z.object({
  datasetKind: z.enum(DATASET_KINDS),
  steps: z.array(z.enum(PIPELINE_STEPS)),
});

const updatePipelineSchema = z.object({
  datasetKind: z.enum(DATASET_KINDS).optional(),
  steps: z.array(z.enum(PIPELINE_STEPS)).optional(),
});

export function pipelinesRoutes(db: AppDatabase) {
  const app = new Hono();

  // List pipelines for a data room
  app.get('/data-rooms/:roomId/pipelines', (c) => {
    const roomId = c.req.param('roomId');
    const result = db.select().from(pipelines).where(eq(pipelines.dataRoomId, roomId)).all();
    return c.json(result);
  });

  // Create pipeline in data room
  app.post('/data-rooms/:roomId/pipelines', async (c) => {
    const roomId = c.req.param('roomId');
    const body = await c.req.json();
    const parsed = createPipelineSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid input', details: parsed.error.issues }, 400);
    }

    const id = crypto.randomUUID();

    const pipeline = {
      id,
      dataRoomId: roomId,
      datasetKind: parsed.data.datasetKind,
      steps: parsed.data.steps,
      createdAt: new Date().toISOString(),
    };

    db.insert(pipelines).values(pipeline).run();

    return c.json(pipeline, 201);
  });

  // Get pipeline by ID
  app.get('/pipelines/:id', (c) => {
    const id = c.req.param('id');
    const pipeline = db.select().from(pipelines).where(eq(pipelines.id, id)).get();

    if (!pipeline) {
      return c.json({ error: 'Pipeline not found' }, 404);
    }

    return c.json(pipeline);
  });

  // Update pipeline
  app.patch('/pipelines/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = updatePipelineSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid input', details: parsed.error.issues }, 400);
    }

    const existing = db.select().from(pipelines).where(eq(pipelines.id, id)).get();
    if (!existing) {
      return c.json({ error: 'Pipeline not found' }, 404);
    }

    const updated = { ...existing, ...parsed.data };
    db.update(pipelines).set(updated).where(eq(pipelines.id, id)).run();

    return c.json(updated);
  });

  // Delete pipeline
  app.delete('/pipelines/:id', (c) => {
    const id = c.req.param('id');
    db.delete(pipelines).where(eq(pipelines.id, id)).run();
    return c.body(null, 204);
  });

  // List pipeline runs
  app.get('/pipelines/:pipelineId/runs', (c) => {
    const pipelineId = c.req.param('pipelineId');
    const runs = db.select().from(pipelineRuns).where(eq(pipelineRuns.pipelineId, pipelineId)).all();
    return c.json(runs);
  });

  // Get pipeline run by file version ID (with steps)
  app.get('/file-versions/:versionId/pipeline-run', (c) => {
    const versionId = c.req.param('versionId');
    const run = db.select().from(pipelineRuns).where(eq(pipelineRuns.fileVersionId, versionId)).get();

    if (!run) {
      return c.json(null);
    }

    const steps = db.select().from(pipelineRunSteps).where(eq(pipelineRunSteps.pipelineRunId, run.id)).all();

    return c.json({ ...run, runSteps: steps });
  });

  // Get pipeline run by ID (with steps)
  app.get('/pipeline-runs/:id', (c) => {
    const id = c.req.param('id');
    const run = db.select().from(pipelineRuns).where(eq(pipelineRuns.id, id)).get();

    if (!run) {
      return c.json({ error: 'Pipeline run not found' }, 404);
    }

    const steps = db.select().from(pipelineRunSteps).where(eq(pipelineRunSteps.pipelineRunId, id)).all();

    return c.json({ ...run, runSteps: steps });
  });

  // Create pipeline run
  app.post('/pipeline-runs', async (c) => {
    const body = await c.req.json();
    const { pipelineId, fileVersionId } = body;

    if (!pipelineId || !fileVersionId) {
      return c.json({ error: 'pipelineId and fileVersionId are required' }, 400);
    }

    const pipeline = db.select().from(pipelines).where(eq(pipelines.id, pipelineId)).get();
    if (!pipeline) {
      return c.json({ error: 'Pipeline not found' }, 404);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const run = {
      id,
      pipelineId,
      fileVersionId,
      status: 'processing' as const,
      steps: pipeline.steps,
      createdAt: now,
      updatedAt: now,
    };

    db.insert(pipelineRuns).values(run).run();

    // Create initial step records
    for (const step of pipeline.steps as string[]) {
      db.insert(pipelineRunSteps).values({
        pipelineRunId: id,
        step,
        status: 'processing',
        createdAt: now,
        updatedAt: now,
      }).run();
    }

    return c.json(run, 201);
  });

  return app;
}
