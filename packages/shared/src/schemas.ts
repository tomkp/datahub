import { z } from 'zod';

// Enums
export const PIPELINE_STEPS = [
  'malware_scan',
  'pii_scan',
  'pii_review',
  'versioning',
  'data_validation',
  'ingestion',
  'control_checks',
] as const;

export const PIPELINE_RUN_STATUS = [
  'processing',
  'processed',
  'errored',
] as const;

export const PIPELINE_RUN_STEP_STATUS = [
  'processing',
  'processed',
  'errored',
  'warned',
] as const;

export const DATASET_KINDS = [
  'file_sharing',
  'pgim_ppa_investment_data',
  'plaz_myga',
  'pica_ssa_stat',
] as const;

// Zod enums
export const pipelineStepSchema = z.enum(PIPELINE_STEPS);
export const pipelineRunStatusSchema = z.enum(PIPELINE_RUN_STATUS);
export const pipelineRunStepStatusSchema = z.enum(PIPELINE_RUN_STEP_STATUS);
export const datasetKindSchema = z.enum(DATASET_KINDS);

// Base schemas
export const tenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  tokenId: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export const dataRoomSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1),
  storageUrl: z.string(),
  publicUrl: z.string().optional(),
  description: z.string().optional(),
  featureFlags: z.record(z.boolean()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const folderSchema = z.object({
  id: z.string().uuid(),
  dataRoomId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  name: z.string().min(1),
  path: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const fileSchema = z.object({
  id: z.string().uuid(),
  dataRoomId: z.string().uuid(),
  folderId: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const fileVersionSchema = z.object({
  id: z.string().uuid(),
  fileId: z.string().uuid(),
  storageUrl: z.string(),
  uploadedBy: z.string().uuid(),
  uploadedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const pipelineSchema = z.object({
  id: z.string().uuid(),
  dataRoomId: z.string().uuid(),
  datasetKind: datasetKindSchema,
  steps: z.array(pipelineStepSchema),
  createdAt: z.string().datetime(),
});

export const pipelineRunSchema = z.object({
  id: z.string().uuid(),
  pipelineId: z.string().uuid(),
  fileVersionId: z.string().uuid(),
  status: pipelineRunStatusSchema,
  steps: z.array(pipelineStepSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const pipelineRunStepSchema = z.object({
  pipelineRunId: z.string().uuid(),
  step: pipelineStepSchema,
  status: pipelineRunStepStatusSchema,
  messages: z.any().optional(),
  storageUrl: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const pipelineRunExpectedEventSchema = z.object({
  pipelineRunId: z.string().uuid(),
  eventType: z.string(),
  eventRef: z.string(),
  eventReceivedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const pipelineEventSchema = z.object({
  data: z.any(),
  handlingError: z.string().optional(),
  createdAt: z.string().datetime(),
});

// Types inferred from schemas
export type Tenant = z.infer<typeof tenantSchema>;
export type User = z.infer<typeof userSchema>;
export type DataRoom = z.infer<typeof dataRoomSchema>;
export type Folder = z.infer<typeof folderSchema>;
export type File = z.infer<typeof fileSchema>;
export type FileVersion = z.infer<typeof fileVersionSchema>;
export type Pipeline = z.infer<typeof pipelineSchema>;
export type PipelineRun = z.infer<typeof pipelineRunSchema>;
export type PipelineRunStep = z.infer<typeof pipelineRunStepSchema>;
export type PipelineRunExpectedEvent = z.infer<typeof pipelineRunExpectedEventSchema>;
export type PipelineEvent = z.infer<typeof pipelineEventSchema>;
export type PipelineStep = z.infer<typeof pipelineStepSchema>;
export type PipelineRunStatus = z.infer<typeof pipelineRunStatusSchema>;
export type PipelineRunStepStatus = z.infer<typeof pipelineRunStepStatusSchema>;
export type DatasetKind = z.infer<typeof datasetKindSchema>;
