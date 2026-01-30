import { describe, it, expect } from 'vitest';
import { folderNameToDatasetKind, findMatchingPipeline } from './seed-helpers';

describe('seed-helpers', () => {
  describe('folderNameToDatasetKind', () => {
    it('maps Premium Bordereaux folder to premium_bordereau', () => {
      expect(folderNameToDatasetKind('premium-bordereaux')).toBe('premium_bordereau');
    });

    it('maps Claims Bordereaux folder to claims_bordereau', () => {
      expect(folderNameToDatasetKind('claims-bordereaux')).toBe('claims_bordereau');
    });

    it('maps Exposure Data folder to exposure_data', () => {
      expect(folderNameToDatasetKind('exposure-data')).toBe('exposure_data');
    });

    it('maps Loss Runs folder to loss_run', () => {
      expect(folderNameToDatasetKind('loss-runs')).toBe('loss_run');
    });

    it('maps Treaty Statements folder to treaty_statement', () => {
      expect(folderNameToDatasetKind('treaty-statements')).toBe('treaty_statement');
    });

    it('returns null for unknown folder types', () => {
      expect(folderNameToDatasetKind('unknown-folder')).toBeNull();
      expect(folderNameToDatasetKind('some-other-folder')).toBeNull();
    });
  });

  describe('findMatchingPipeline', () => {
    const pipelines = [
      { id: 'room1-premium', dataRoomId: 'room1', datasetKind: 'premium_bordereau' },
      { id: 'room1-claims', dataRoomId: 'room1', datasetKind: 'claims_bordereau' },
      { id: 'room1-exposure', dataRoomId: 'room1', datasetKind: 'exposure_data' },
      { id: 'room2-premium', dataRoomId: 'room2', datasetKind: 'premium_bordereau' },
      { id: 'room2-claims', dataRoomId: 'room2', datasetKind: 'claims_bordereau' },
    ];

    it('finds pipeline matching both dataRoomId and datasetKind', () => {
      const result = findMatchingPipeline(pipelines, 'room1', 'claims_bordereau');
      expect(result).toEqual({ id: 'room1-claims', dataRoomId: 'room1', datasetKind: 'claims_bordereau' });
    });

    it('returns correct pipeline for room2 premium', () => {
      const result = findMatchingPipeline(pipelines, 'room2', 'premium_bordereau');
      expect(result).toEqual({ id: 'room2-premium', dataRoomId: 'room2', datasetKind: 'premium_bordereau' });
    });

    it('returns undefined when no matching pipeline exists', () => {
      const result = findMatchingPipeline(pipelines, 'room1', 'unknown_kind');
      expect(result).toBeUndefined();
    });

    it('returns undefined when dataRoomId does not match', () => {
      const result = findMatchingPipeline(pipelines, 'room3', 'premium_bordereau');
      expect(result).toBeUndefined();
    });

    it('returns undefined for null datasetKind', () => {
      const result = findMatchingPipeline(pipelines, 'room1', null);
      expect(result).toBeUndefined();
    });
  });
});
