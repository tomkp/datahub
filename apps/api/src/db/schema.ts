import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Helper for timestamps
const timestamps = {
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
};

// Tenants table
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ...timestamps,
});

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  tokenId: text('token_id').notNull().unique(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// Data Rooms table
export const dataRooms = sqliteTable('data_rooms', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  storageUrl: text('storage_url').notNull(),
  publicUrl: text('public_url'),
  description: text('description'),
  featureFlags: text('feature_flags', { mode: 'json' }).$type<Record<string, boolean>>(),
  ...timestamps,
});

// Folders table (hierarchical via parentId)
export const folders = sqliteTable('folders', {
  id: text('id').primaryKey(),
  dataRoomId: text('data_room_id').notNull().references(() => dataRooms.id),
  parentId: text('parent_id'), // Self-reference handled at application level
  name: text('name').notNull(),
  path: text('path').notNull(), // ltree-style path for efficient queries
  ...timestamps,
});

// Files table
export const files = sqliteTable('files', {
  id: text('id').primaryKey(),
  dataRoomId: text('data_room_id').notNull().references(() => dataRooms.id),
  folderId: text('folder_id').notNull().references(() => folders.id),
  name: text('name').notNull(),
  ...timestamps,
});

// File Versions table
export const fileVersions = sqliteTable('file_versions', {
  id: text('id').primaryKey(),
  fileId: text('file_id').notNull().references(() => files.id),
  storageUrl: text('storage_url').notNull(),
  uploadedBy: text('uploaded_by').notNull().references(() => users.id),
  uploadedAt: text('uploaded_at').notNull().$defaultFn(() => new Date().toISOString()),
  ...timestamps,
});

// Pipelines table
export const pipelines = sqliteTable('pipelines', {
  id: text('id').primaryKey(),
  dataRoomId: text('data_room_id').notNull().references(() => dataRooms.id),
  name: text('name').notNull(),
  datasetKind: text('dataset_kind'),
  steps: text('steps', { mode: 'json' }).$type<string[]>().notNull(),
  ...timestamps,
});

// Pipeline Runs table
export const pipelineRuns = sqliteTable('pipeline_runs', {
  id: text('id').primaryKey(),
  pipelineId: text('pipeline_id').notNull().references(() => pipelines.id),
  fileVersionId: text('file_version_id').notNull().references(() => fileVersions.id),
  status: text('status').notNull().$type<'processing' | 'processed' | 'errored'>(),
  ...timestamps,
});

// Pipeline Run Steps table
export const pipelineRunSteps = sqliteTable('pipeline_run_steps', {
  id: text('id').primaryKey(),
  pipelineRunId: text('pipeline_run_id').notNull().references(() => pipelineRuns.id),
  step: text('step').notNull(),
  status: text('status').notNull().$type<'processing' | 'processed' | 'errored' | 'warned'>(),
  errorMessage: text('error_message'),
  ...timestamps,
});

// Pipeline Run Expected Events table
export const pipelineRunExpectedEvents = sqliteTable('pipeline_run_expected_events', {
  pipelineRunId: text('pipeline_run_id').notNull().references(() => pipelineRuns.id),
  eventType: text('event_type').notNull(),
  eventRef: text('event_ref').notNull(),
  eventReceivedAt: text('event_received_at'),
  ...timestamps,
});

// Pipeline Events table (independent log)
export const pipelineEvents = sqliteTable('pipeline_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  data: text('data', { mode: 'json' }),
  handlingError: text('handling_error'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});
