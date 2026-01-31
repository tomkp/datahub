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

  describe('folderSchema', () => {
    it('validates a valid folder', () => {
      const folder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        dataRoomId: '123e4567-e89b-12d3-a456-426614174001',
        parentId: null,
        name: 'Documents',
        path: 'documents',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => folderSchema.parse(folder)).not.toThrow();
    });
  });

  describe('fileSchema', () => {
    it('validates a valid file', () => {
      const file = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        dataRoomId: '123e4567-e89b-12d3-a456-426614174001',
        folderId: '123e4567-e89b-12d3-a456-426614174002',
        name: 'report.pdf',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => fileSchema.parse(file)).not.toThrow();
    });
  });

  describe('fileVersionSchema', () => {
    it('validates a valid file version', () => {
      const fileVersion = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fileId: '123e4567-e89b-12d3-a456-426614174001',
        storageUrl: '/data/uploads/room1/file1/v1/report.pdf',
        uploadedBy: '123e4567-e89b-12d3-a456-426614174002',
        uploadedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => fileVersionSchema.parse(fileVersion)).not.toThrow();
    });
  });

  describe('pipelineSchema', () => {
    it('validates a pipeline with valid steps', () => {
      const pipeline = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        dataRoomId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Premium Bordereau Pipeline',
        datasetKind: 'file_sharing',
        steps: ['malware_scan', 'pii_scan', 'ingestion'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(() => pipelineSchema.parse(pipeline)).not.toThrow();
    });

    it('validates a pipeline with optional name', () => {
      const pipeline = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        dataRoomId: '123e4567-e89b-12d3-a456-426614174001',
        datasetKind: 'file_sharing',
        steps: ['malware_scan', 'pii_scan', 'ingestion'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
      };
      expect(() => pipelineSchema.parse(pipeline)).toThrow();
    });
  });

  describe('enums', () => {
    it('has correct pipeline steps', () => {
      expect(PIPELINE_STEPS).toContain('malware_scan');
      expect(PIPELINE_STEPS).toContain('pii_scan');
      expect(PIPELINE_STEPS).toContain('pii_review');
      expect(PIPELINE_STEPS).toContain('versioning');
      expect(PIPELINE_STEPS).toContain('data_validation');
      expect(PIPELINE_STEPS).toContain('ingestion');
      expect(PIPELINE_STEPS).toContain('control_checks');
    });

    it('has all pipeline steps used in seed data', () => {
      // Additional steps used in seed data
      expect(PIPELINE_STEPS).toContain('alert_routing');
      expect(PIPELINE_STEPS).toContain('reconciliation');
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
      expect(DATASET_KINDS).toContain('premium_bordereau');
      expect(DATASET_KINDS).toContain('claims_bordereau');
      expect(DATASET_KINDS).toContain('loss_run');
      expect(DATASET_KINDS).toContain('exposure_data');
      expect(DATASET_KINDS).toContain('treaty_statement');
      expect(DATASET_KINDS).toContain('cat_model_output');
      expect(DATASET_KINDS).toContain('financial_statement');
      expect(DATASET_KINDS).toContain('reserve_analysis');
      expect(DATASET_KINDS).toContain('valuation_data');
    });

    it('has all dataset kinds used in seed data', () => {
      // Additional dataset kinds used in seed data for different cadences
      expect(DATASET_KINDS).toContain('cat_event');
      expect(DATASET_KINDS).toContain('market_rates');
      expect(DATASET_KINDS).toContain('claims_alert');
      expect(DATASET_KINDS).toContain('claims_summary');
      expect(DATASET_KINDS).toContain('exposure_update');
      expect(DATASET_KINDS).toContain('loss_development');
      expect(DATASET_KINDS).toContain('monthly_bordereau');
      expect(DATASET_KINDS).toContain('account_statement');
      expect(DATASET_KINDS).toContain('reconciliation');
      expect(DATASET_KINDS).toContain('treaty_renewal');
      expect(DATASET_KINDS).toContain('annual_statement');
      expect(DATASET_KINDS).toContain('reserve_certificate');
      expect(DATASET_KINDS).toContain('audit_report');
    });
  });
});
