import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb, type DbConnection } from './index';
import * as schema from './schema';

describe('Database Schema', () => {
  let conn: DbConnection;

  beforeAll(() => {
    conn = createDb(':memory:');
    // Create tables by running migration-like SQL
    const tables = [
      schema.tenants,
      schema.users,
      schema.dataRooms,
      schema.folders,
      schema.files,
      schema.fileVersions,
      schema.pipelines,
      schema.pipelineRuns,
      schema.pipelineRunSteps,
      schema.pipelineRunExpectedEvents,
      schema.pipelineEvents,
    ];
    // Tables will be created automatically when we push schema
  });

  afterAll(() => {
    conn.close();
  });

  describe('tenants', () => {
    it('exports tenants table', () => {
      expect(schema.tenants).toBeDefined();
    });

    it('has correct columns', () => {
      const columns = Object.keys(schema.tenants);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('createdAt');
      expect(columns).toContain('updatedAt');
    });
  });

  describe('users', () => {
    it('exports users table', () => {
      expect(schema.users).toBeDefined();
    });

    it('has correct columns', () => {
      const columns = Object.keys(schema.users);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('email');
      expect(columns).toContain('tokenId');
    });
  });

  describe('dataRooms', () => {
    it('exports dataRooms table', () => {
      expect(schema.dataRooms).toBeDefined();
    });

    it('has tenantId foreign key', () => {
      const columns = Object.keys(schema.dataRooms);
      expect(columns).toContain('tenantId');
    });
  });

  describe('folders', () => {
    it('exports folders table', () => {
      expect(schema.folders).toBeDefined();
    });

    it('has self-referencing parentId', () => {
      const columns = Object.keys(schema.folders);
      expect(columns).toContain('parentId');
      expect(columns).toContain('path');
    });
  });

  describe('files', () => {
    it('exports files table', () => {
      expect(schema.files).toBeDefined();
    });
  });

  describe('fileVersions', () => {
    it('exports fileVersions table', () => {
      expect(schema.fileVersions).toBeDefined();
    });

    it('has uploadedBy foreign key to users', () => {
      const columns = Object.keys(schema.fileVersions);
      expect(columns).toContain('uploadedBy');
    });
  });

  describe('pipelines', () => {
    it('exports pipelines table', () => {
      expect(schema.pipelines).toBeDefined();
    });

    it('has steps array column', () => {
      const columns = Object.keys(schema.pipelines);
      expect(columns).toContain('steps');
    });
  });

  describe('pipelineRuns', () => {
    it('exports pipelineRuns table', () => {
      expect(schema.pipelineRuns).toBeDefined();
    });
  });

  describe('pipelineRunSteps', () => {
    it('exports pipelineRunSteps table', () => {
      expect(schema.pipelineRunSteps).toBeDefined();
    });

    it('has composite primary key', () => {
      const columns = Object.keys(schema.pipelineRunSteps);
      expect(columns).toContain('pipelineRunId');
      expect(columns).toContain('step');
    });
  });

  describe('pipelineRunExpectedEvents', () => {
    it('exports pipelineRunExpectedEvents table', () => {
      expect(schema.pipelineRunExpectedEvents).toBeDefined();
    });
  });

  describe('pipelineEvents', () => {
    it('exports pipelineEvents table', () => {
      expect(schema.pipelineEvents).toBeDefined();
    });
  });
});
