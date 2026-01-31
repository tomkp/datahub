/**
 * Maps folder name slugs to their corresponding dataset kinds.
 * Used to match files in specific folders to the appropriate pipeline.
 */
const FOLDER_TO_DATASET_KIND: Record<string, string> = {
  // Quarterly data types
  'premium-bordereaux': 'premium_bordereau',
  'claims-bordereaux': 'claims_bordereau',
  'exposure-data': 'exposure_data',
  'loss-runs': 'loss_run',
  'treaty-statements': 'treaty_statement',
  // Daily data types
  'cat-event-notifications': 'cat_event',
  'market-rates': 'market_rates',
  'claims-alerts': 'claims_alert',
  // Weekly data types
  'claims-summary': 'claims_summary',
  'exposure-updates': 'exposure_update',
  'loss-development': 'loss_development',
  // Monthly data types
  'monthly-bordereaux': 'monthly_bordereau',
  'account-statements': 'account_statement',
  reconciliations: 'reconciliation',
  // Annual data types
  'treaty-renewal': 'treaty_renewal',
  'annual-statement': 'annual_statement',
  'reserve-certificate': 'reserve_certificate',
  'audit-report': 'audit_report',
};

export function folderNameToDatasetKind(folderSlug: string): string | null {
  return FOLDER_TO_DATASET_KIND[folderSlug] ?? null;
}

interface PipelineMatch {
  id: string;
  dataRoomId: string;
  datasetKind: string;
}

export function findMatchingPipeline<T extends PipelineMatch>(
  pipelines: T[],
  dataRoomId: string,
  datasetKind: string | null
): T | undefined {
  if (!datasetKind) return undefined;
  return pipelines.find((p) => p.dataRoomId === dataRoomId && p.datasetKind === datasetKind);
}
