import { describe, it, expect } from 'vitest';
import {
  tenantSchema,
  userSchema,
  dataRoomSchema,
  folderSchema,
  fileSchema,
  fileVersionSchema,
  pipelineSchema,
  pipelineRunSchema,
  PIPELINE_STEPS,
  PIPELINE_RUN_STATUS,
  PIPELINE_RUN_STEP_STATUS,
  DATASET_KINDS,
} from './schemas';

describe('Schemas', () => {
  describe('tenantSchema', () => {
    it('validates a valid tenant', () => {
      const tenant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Acme Corp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => tenantSchema.parse(tenant)).not.toThrow();
    });

    it('rejects tenant without name', () => {
      const tenant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => tenantSchema.parse(tenant)).toThrow();
    });
  });

  describe('userSchema', () => {
    it('validates a valid user', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        tokenId: '123e4567-e89b-12d3-a456-426614174001',
        createdAt: new Date().toISOString(),
      };
      expect(() => userSchema.parse(user)).not.toThrow();
    });

    it('rejects user with invalid email', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'invalid-email',
        tokenId: '123e4567-e89b-12d3-a456-426614174001',
        createdAt: new Date().toISOString(),
      };
      expect(() => userSchema.parse(user)).toThrow();
    });
  });

  describe('dataRoomSchema', () => {
    it('validates a valid data room', () => {
      const dataRoom = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Q4 Reports',
        storageUrl: '/data/uploads/room1',
        description: 'Quarterly financial reports',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => dataRoomSchema.parse(dataRoom)).not.toThrow();
    });
  });

  describe('pipelineSchema', () => {
    it('validates a pipeline with valid steps', () => {
      const pipeline = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        dataRoomId: '123e4567-e89b-12d3-a456-426614174001',
        datasetKind: 'file_sharing',
        steps: ['malware_scan', 'pii_scan', 'ingestion'],
        createdAt: new Date().toISOString(),
      };
      expect(() => pipelineSchema.parse(pipeline)).not.toThrow();
    });

    it('rejects pipeline with invalid step', () => {
      const pipeline = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        dataRoomId: '123e4567-e89b-12d3-a456-426614174001',
        datasetKind: 'file_sharing',
        steps: ['invalid_step'],
        createdAt: new Date().toISOString(),
      };
      expect(() => pipelineSchema.parse(pipeline)).toThrow();
    });
  });

  describe('enums', () => {
    it('has correct pipeline steps', () => {
      expect(PIPELINE_STEPS).toContain('malware_scan');
      expect(PIPELINE_STEPS).toContain('pii_scan');
      expect(PIPELINE_STEPS).toContain('ingestion');
    });

    it('has correct pipeline run statuses', () => {
      expect(PIPELINE_RUN_STATUS).toContain('processing');
      expect(PIPELINE_RUN_STATUS).toContain('processed');
      expect(PIPELINE_RUN_STATUS).toContain('errored');
    });

    it('has correct pipeline run step statuses', () => {
      expect(PIPELINE_RUN_STEP_STATUS).toContain('warned');
    });

    it('has correct dataset kinds', () => {
      expect(DATASET_KINDS).toContain('file_sharing');
    });
  });
});
