import { createDb } from './index';
import { folderNameToDatasetKind, findMatchingPipeline } from './seed-helpers';

const dbUrl = process.env.DATABASE_URL || './data/datahub.db';

console.log(`Seeding database at ${dbUrl}...`);

const { db, close } = createDb(dbUrl);

// Helper to generate UUIDs
function uuid(): string {
  return crypto.randomUUID();
}

// Helper to escape SQL strings
function esc(str: string): string {
  return str.replace(/'/g, "''");
}

// Helper to generate dates
function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function hoursAgo(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

function minutesAgo(minutes: number): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
}

const now = new Date().toISOString();

// ============================================================================
// USERS
// ============================================================================
const users = [
  { id: 'dev-user', name: 'Dev User', email: 'dev@example.com', tokenId: 'dev-token' },
  { id: uuid(), name: 'Sarah Chen', email: 'sarah.chen@acmere.com', tokenId: uuid() },
  { id: uuid(), name: 'Michael Torres', email: 'michael.torres@acmere.com', tokenId: uuid() },
  { id: uuid(), name: 'Emily Watson', email: 'emily.watson@acmere.com', tokenId: uuid() },
  { id: uuid(), name: 'James Miller', email: 'james.miller@acmere.com', tokenId: uuid() },
  { id: uuid(), name: 'Lisa Park', email: 'lisa.park@acmere.com', tokenId: uuid() },
];

for (const user of users) {
  db.run(`
    INSERT OR REPLACE INTO users (id, name, email, token_id, created_at)
    VALUES ('${user.id}', '${user.name}', '${user.email}', '${user.tokenId}', '${daysAgo(365)}')
  `);
}

// ============================================================================
// TENANTS (Reinsurance Companies)
// ============================================================================
const tenants = [
  { id: 'acme-re', name: 'Acme Reinsurance Ltd.' },
  { id: 'global-re', name: 'Global Re Partners' },
  { id: 'atlantic-re', name: 'Atlantic Reinsurance Corp.' },
];

for (const tenant of tenants) {
  db.run(`
    INSERT OR REPLACE INTO tenants (id, name, created_at, updated_at)
    VALUES ('${tenant.id}', '${tenant.name}', '${daysAgo(730)}', '${now}')
  `);
}

// ============================================================================
// DATA ROOMS (Cedant Relationships & Internal)
// ============================================================================
interface DataRoom {
  id: string;
  tenantId: string;
  name: string;
  description: string;
}

const dataRooms: DataRoom[] = [
  // Cedant relationships
  {
    id: 'liberty-mutual',
    tenantId: 'acme-re',
    name: 'Liberty Mutual',
    description: 'Property & Casualty treaty reinsurance with Liberty Mutual Insurance.',
  },
  {
    id: 'hartford',
    tenantId: 'acme-re',
    name: 'The Hartford',
    description: 'Workers compensation and commercial auto quota share agreements.',
  },
  {
    id: 'chubb',
    tenantId: 'acme-re',
    name: 'Chubb Limited',
    description: 'Excess of loss and catastrophe reinsurance programs.',
  },
  {
    id: 'travelers',
    tenantId: 'acme-re',
    name: 'Travelers Insurance',
    description: 'Property catastrophe and casualty surplus treaties.',
  },
  {
    id: 'aig',
    tenantId: 'acme-re',
    name: 'AIG',
    description: 'Global property and specialty lines facultative reinsurance.',
  },
  {
    id: 'zurich',
    tenantId: 'acme-re',
    name: 'Zurich Insurance',
    description: 'International property and liability treaty arrangements.',
  },
  // Third-party service providers
  {
    id: 'milliman',
    tenantId: 'acme-re',
    name: 'Milliman',
    description: 'Third-party actuarial consulting and reserve analysis services.',
  },
  {
    id: 'air-worldwide',
    tenantId: 'acme-re',
    name: 'AIR Worldwide',
    description: 'Catastrophe modeling and risk analytics services.',
  },
  {
    id: 'rms',
    tenantId: 'acme-re',
    name: 'RMS',
    description: 'Risk modeling and analytics for natural catastrophe exposure.',
  },
  // Internal
  {
    id: 'internal-actuarial',
    tenantId: 'acme-re',
    name: 'Internal - Actuarial',
    description: 'Internal actuarial analysis, reserving, and pricing models.',
  },
  {
    id: 'internal-finance',
    tenantId: 'acme-re',
    name: 'Internal - Finance',
    description: 'Financial reporting, statutory filings, and audit materials.',
  },
];

for (const room of dataRooms) {
  db.run(`
    INSERT OR REPLACE INTO data_rooms (id, tenant_id, name, storage_url, description, created_at, updated_at)
    VALUES ('${room.id}', '${room.tenantId}', '${esc(room.name)}', '/storage/${room.id}', '${esc(room.description)}', '${daysAgo(365)}', '${now}')
  `);
}

// ============================================================================
// FOLDERS (Organized by year/quarter and data type)
// ============================================================================
interface Folder {
  id: string;
  dataRoomId: string;
  parentId: string | null;
  name: string;
  path: string;
}

const folders: Folder[] = [];

// Create folder structure for cedant data rooms
const cedantRooms = ['liberty-mutual', 'hartford', 'chubb', 'travelers', 'aig', 'zurich'];
const years = ['2023', '2024', '2025'];
const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const quarterlyDataTypes = ['Premium Bordereaux', 'Claims Bordereaux', 'Loss Runs', 'Exposure Data', 'Treaty Statements'];

// Cadence configuration per cedant
// Some cedants report daily (cat events), some weekly, some monthly, some quarterly
const cedantCadenceConfig: Record<string, { daily: boolean; weekly: boolean; monthly: boolean }> = {
  'liberty-mutual': { daily: true, weekly: true, monthly: true }, // High-touch cedant with all cadences
  hartford: { daily: false, weekly: true, monthly: true },
  chubb: { daily: true, weekly: false, monthly: true }, // Cat-focused, daily event tracking
  travelers: { daily: false, weekly: false, monthly: true }, // Monthly-only reporting
  aig: { daily: true, weekly: true, monthly: false }, // Daily and weekly but quarterly bordereaux
  zurich: { daily: false, weekly: true, monthly: true },
};

for (const roomId of cedantRooms) {
  const config = cedantCadenceConfig[roomId];
  // Root folder (named after the data room)
  const rootId = `${roomId}-root`;
  const room = dataRooms.find((r) => r.id === roomId)!;
  folders.push({ id: rootId, dataRoomId: roomId, parentId: null, name: room.name, path: '/' });

  for (const year of years) {
    const yearId = `${roomId}-${year}`;
    folders.push({ id: yearId, dataRoomId: roomId, parentId: rootId, name: year, path: `/${year}` });

    // Daily folder structure (for cat event notifications)
    if (config.daily && (year === '2024' || year === '2025')) {
      const dailyId = `${roomId}-${year}-daily`;
      folders.push({ id: dailyId, dataRoomId: roomId, parentId: yearId, name: 'Daily', path: `/${year}/Daily` });

      // Daily subfolders for specific data types
      const dailyTypes = ['Cat Event Notifications', 'Market Rates', 'Claims Alerts'];
      for (const dataType of dailyTypes) {
        const typeId = `${roomId}-${year}-daily-${dataType.toLowerCase().replace(/ /g, '-')}`;
        folders.push({
          id: typeId,
          dataRoomId: roomId,
          parentId: dailyId,
          name: dataType,
          path: `/${year}/Daily/${dataType}`,
        });
      }
    }

    // Weekly folder structure (for weekly summaries)
    if (config.weekly && (year === '2024' || year === '2025')) {
      const weeklyId = `${roomId}-${year}-weekly`;
      folders.push({ id: weeklyId, dataRoomId: roomId, parentId: yearId, name: 'Weekly', path: `/${year}/Weekly` });

      const weeklyTypes = ['Claims Summary', 'Exposure Updates', 'Loss Development'];
      for (const dataType of weeklyTypes) {
        const typeId = `${roomId}-${year}-weekly-${dataType.toLowerCase().replace(/ /g, '-')}`;
        folders.push({
          id: typeId,
          dataRoomId: roomId,
          parentId: weeklyId,
          name: dataType,
          path: `/${year}/Weekly/${dataType}`,
        });
      }
    }

    // Monthly folder structure (for monthly bordereaux and statements)
    if (config.monthly && (year === '2024' || year === '2025')) {
      const monthlyId = `${roomId}-${year}-monthly`;
      folders.push({ id: monthlyId, dataRoomId: roomId, parentId: yearId, name: 'Monthly', path: `/${year}/Monthly` });

      const monthlyTypes = ['Monthly Bordereaux', 'Account Statements', 'Reconciliations'];
      for (const dataType of monthlyTypes) {
        const typeId = `${roomId}-${year}-monthly-${dataType.toLowerCase().replace(/ /g, '-')}`;
        folders.push({
          id: typeId,
          dataRoomId: roomId,
          parentId: monthlyId,
          name: dataType,
          path: `/${year}/Monthly/${dataType}`,
        });
      }
    }

    // Quarterly folder structure (existing - keeps quarterly bordereaux)
    for (const quarter of quarters) {
      // Skip future quarters
      if (year === '2025' && (quarter === 'Q3' || quarter === 'Q4')) continue;
      if (year === '2025' && quarter === 'Q2') continue; // Assume we're in early Q2

      const quarterId = `${roomId}-${year}-${quarter}`;
      folders.push({ id: quarterId, dataRoomId: roomId, parentId: yearId, name: quarter, path: `/${year}/${quarter}` });

      for (const dataType of quarterlyDataTypes) {
        const typeId = `${roomId}-${year}-${quarter}-${dataType.toLowerCase().replace(/ /g, '-')}`;
        folders.push({
          id: typeId,
          dataRoomId: roomId,
          parentId: quarterId,
          name: dataType,
          path: `/${year}/${quarter}/${dataType}`,
        });
      }
    }

    // Annual folder structure (for year-end reports and treaty renewals)
    if (year === '2023' || year === '2024') {
      const annualId = `${roomId}-${year}-annual`;
      folders.push({ id: annualId, dataRoomId: roomId, parentId: yearId, name: 'Annual', path: `/${year}/Annual` });

      const annualTypes = ['Treaty Renewal', 'Annual Statement', 'Reserve Certificate', 'Audit Report'];
      for (const dataType of annualTypes) {
        const typeId = `${roomId}-${year}-annual-${dataType.toLowerCase().replace(/ /g, '-')}`;
        folders.push({
          id: typeId,
          dataRoomId: roomId,
          parentId: annualId,
          name: dataType,
          path: `/${year}/Annual/${dataType}`,
        });
      }
    }
  }
}

// Modeling service provider folders
const modelingRooms = ['air-worldwide', 'rms'];
const modelTypes = ['Hurricane Models', 'Earthquake Models', 'Flood Models', 'Wildfire Models', 'Aggregate Results'];

for (const roomId of modelingRooms) {
  const rootId = `${roomId}-root`;
  const room = dataRooms.find((r) => r.id === roomId)!;
  folders.push({ id: rootId, dataRoomId: roomId, parentId: null, name: room.name, path: '/' });

  for (const year of ['2024', '2025']) {
    const yearId = `${roomId}-${year}`;
    folders.push({ id: yearId, dataRoomId: roomId, parentId: rootId, name: year, path: `/${year}` });

    for (const modelType of modelTypes) {
      const typeId = `${roomId}-${year}-${modelType.toLowerCase().replace(/ /g, '-')}`;
      folders.push({
        id: typeId,
        dataRoomId: roomId,
        parentId: yearId,
        name: modelType,
        path: `/${year}/${modelType}`,
      });
    }
  }
}

// Milliman folders
const millimanRoot = 'milliman-root';
const millimanRoom = dataRooms.find((r) => r.id === 'milliman')!;
folders.push({ id: millimanRoot, dataRoomId: 'milliman', parentId: null, name: millimanRoom.name, path: '/' });
const millimanTypes = ['Reserve Studies', 'Pricing Analysis', 'Experience Studies', 'LDTI Valuations', 'Audit Support'];
for (const type of millimanTypes) {
  const typeId = `milliman-${type.toLowerCase().replace(/ /g, '-')}`;
  folders.push({ id: typeId, dataRoomId: 'milliman', parentId: millimanRoot, name: type, path: `/${type}` });
}

// Internal folders
const internalActuarialRoot = 'internal-actuarial-root';
const internalActuarialRoom = dataRooms.find((r) => r.id === 'internal-actuarial')!;
folders.push({ id: internalActuarialRoot, dataRoomId: 'internal-actuarial', parentId: null, name: internalActuarialRoom.name, path: '/' });
const actuarialTypes = ['Reserving', 'Pricing', 'Capital Modeling', 'Experience Analysis'];
for (const type of actuarialTypes) {
  const typeId = `internal-actuarial-${type.toLowerCase().replace(/ /g, '-')}`;
  folders.push({ id: typeId, dataRoomId: 'internal-actuarial', parentId: internalActuarialRoot, name: type, path: `/${type}` });
}

const internalFinanceRoot = 'internal-finance-root';
const internalFinanceRoom = dataRooms.find((r) => r.id === 'internal-finance')!;
folders.push({ id: internalFinanceRoot, dataRoomId: 'internal-finance', parentId: null, name: internalFinanceRoom.name, path: '/' });
const financeTypes = ['Statutory Filings', 'GAAP Reports', 'Tax Returns', 'Audit Materials', 'Board Materials'];
for (const type of financeTypes) {
  const typeId = `internal-finance-${type.toLowerCase().replace(/ /g, '-')}`;
  folders.push({ id: typeId, dataRoomId: 'internal-finance', parentId: internalFinanceRoot, name: type, path: `/${type}` });
}

for (const folder of folders) {
  db.run(`
    INSERT OR REPLACE INTO folders (id, data_room_id, parent_id, name, path, created_at, updated_at)
    VALUES ('${folder.id}', '${folder.dataRoomId}', ${folder.parentId ? `'${folder.parentId}'` : 'NULL'}, '${esc(folder.name)}', '${esc(folder.path)}', '${daysAgo(180)}', '${now}')
  `);
}

// ============================================================================
// FILES (Realistic reinsurance file names)
// ============================================================================
interface FileData {
  id: string;
  dataRoomId: string;
  folderId: string;
  name: string;
  uploadedBy: string;
  daysAgo: number;
}

const files: FileData[] = [];
const uploaders = users.slice(1); // Exclude dev user

// Generate files for cedant rooms
for (const roomId of cedantRooms) {
  const cedantName = roomId.replace(/-/g, '_').toUpperCase();

  // 2024 Q4 files
  const q4FolderId = `${roomId}-2024-Q4`;
  if (folders.find((f) => f.id === q4FolderId)) {
    files.push({
      id: uuid(),
      dataRoomId: roomId,
      folderId: `${roomId}-2024-Q4-premium-bordereaux`,
      name: `${cedantName}_Premium_Bordereau_2024_Q4_Final.xlsx`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 45,
    });
    files.push({
      id: uuid(),
      dataRoomId: roomId,
      folderId: `${roomId}-2024-Q4-claims-bordereaux`,
      name: `${cedantName}_Claims_Bordereau_2024_Q4_v2.xlsx`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 42,
    });
    files.push({
      id: uuid(),
      dataRoomId: roomId,
      folderId: `${roomId}-2024-Q4-loss-runs`,
      name: `${cedantName}_Loss_Run_12312024.csv`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 40,
    });
    files.push({
      id: uuid(),
      dataRoomId: roomId,
      folderId: `${roomId}-2024-Q4-treaty-statements`,
      name: `${cedantName}_Quarterly_Statement_Q4_2024.pdf`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 38,
    });
  }

  // 2025 Q1 files
  const q1FolderId = `${roomId}-2025-Q1`;
  if (folders.find((f) => f.id === q1FolderId)) {
    files.push({
      id: uuid(),
      dataRoomId: roomId,
      folderId: `${roomId}-2025-Q1-premium-bordereaux`,
      name: `${cedantName}_Premium_Bordereau_2025_Q1_Draft.xlsx`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 15,
    });
    files.push({
      id: uuid(),
      dataRoomId: roomId,
      folderId: `${roomId}-2025-Q1-claims-bordereaux`,
      name: `${cedantName}_Claims_Bordereau_2025_Q1.xlsx`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 12,
    });
    files.push({
      id: uuid(),
      dataRoomId: roomId,
      folderId: `${roomId}-2025-Q1-exposure-data`,
      name: `${cedantName}_TIV_Schedule_2025_Q1.csv`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 10,
    });
    files.push({
      id: uuid(),
      dataRoomId: roomId,
      folderId: `${roomId}-2025-Q1-loss-runs`,
      name: `${cedantName}_Loss_Triangle_03312025.xlsx`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 5,
    });
  }

  // ============================================================================
  // DAILY FILES (Cat event notifications - last 14 days for cedants with daily cadence)
  // ============================================================================
  const config = cedantCadenceConfig[roomId];
  if (config.daily) {
    const catEventFolderId = `${roomId}-2025-daily-cat-event-notifications`;
    if (folders.find((f) => f.id === catEventFolderId)) {
      // Generate daily cat event files for the past 14 days
      for (let day = 0; day < 14; day++) {
        const fileDate = new Date();
        fileDate.setDate(fileDate.getDate() - day);
        // Skip weekends for daily files (realistic business cadence)
        if (fileDate.getDay() === 0 || fileDate.getDay() === 6) continue;
        const dateStr = fileDate.toISOString().slice(0, 10).replace(/-/g, '');
        files.push({
          id: uuid(),
          dataRoomId: roomId,
          folderId: catEventFolderId,
          name: `${cedantName}_Cat_Event_Report_${dateStr}.csv`,
          uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
          daysAgo: day,
        });
      }
    }

    const marketRatesFolderId = `${roomId}-2025-daily-market-rates`;
    if (folders.find((f) => f.id === marketRatesFolderId)) {
      // Generate daily market rate files for the past 10 business days
      for (let day = 0; day < 14; day++) {
        const fileDate = new Date();
        fileDate.setDate(fileDate.getDate() - day);
        if (fileDate.getDay() === 0 || fileDate.getDay() === 6) continue;
        const dateStr = fileDate.toISOString().slice(0, 10).replace(/-/g, '');
        files.push({
          id: uuid(),
          dataRoomId: roomId,
          folderId: marketRatesFolderId,
          name: `${cedantName}_ILW_Rates_${dateStr}.xlsx`,
          uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
          daysAgo: day,
        });
      }
    }

    const claimsAlertsFolderId = `${roomId}-2025-daily-claims-alerts`;
    if (folders.find((f) => f.id === claimsAlertsFolderId)) {
      // Daily claims alerts (not every day - sporadic based on events)
      const alertDays = [1, 3, 4, 7, 9, 12]; // Simulate sporadic alerts
      for (const day of alertDays) {
        const fileDate = new Date();
        fileDate.setDate(fileDate.getDate() - day);
        const dateStr = fileDate.toISOString().slice(0, 10).replace(/-/g, '');
        files.push({
          id: uuid(),
          dataRoomId: roomId,
          folderId: claimsAlertsFolderId,
          name: `${cedantName}_Claims_Alert_${dateStr}.pdf`,
          uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
          daysAgo: day,
        });
      }
    }
  }

  // ============================================================================
  // WEEKLY FILES (Claims summaries, exposure updates - last 8 weeks)
  // ============================================================================
  if (config.weekly) {
    const claimsSummaryFolderId = `${roomId}-2025-weekly-claims-summary`;
    if (folders.find((f) => f.id === claimsSummaryFolderId)) {
      for (let week = 1; week <= 8; week++) {
        const weekNum = String(Math.max(1, 5 - week + 1)).padStart(2, '0'); // Weeks 01-05 for early 2025
        files.push({
          id: uuid(),
          dataRoomId: roomId,
          folderId: claimsSummaryFolderId,
          name: `${cedantName}_Weekly_Claims_Summary_2025_W${weekNum}.xlsx`,
          uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
          daysAgo: week * 7,
        });
      }
    }

    const exposureUpdatesFolderId = `${roomId}-2025-weekly-exposure-updates`;
    if (folders.find((f) => f.id === exposureUpdatesFolderId)) {
      for (let week = 1; week <= 6; week++) {
        const weekNum = String(Math.max(1, 5 - week + 1)).padStart(2, '0');
        files.push({
          id: uuid(),
          dataRoomId: roomId,
          folderId: exposureUpdatesFolderId,
          name: `${cedantName}_Exposure_Delta_2025_W${weekNum}.csv`,
          uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
          daysAgo: week * 7 + 2, // Slightly offset from claims summary
        });
      }
    }

    const lossDevelopmentFolderId = `${roomId}-2025-weekly-loss-development`;
    if (folders.find((f) => f.id === lossDevelopmentFolderId)) {
      for (let week = 1; week <= 4; week++) {
        const weekNum = String(Math.max(1, 5 - week + 1)).padStart(2, '0');
        files.push({
          id: uuid(),
          dataRoomId: roomId,
          folderId: lossDevelopmentFolderId,
          name: `${cedantName}_Loss_Development_Report_2025_W${weekNum}.xlsx`,
          uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
          daysAgo: week * 7 + 1,
        });
      }
    }
  }

  // ============================================================================
  // MONTHLY FILES (Monthly bordereaux, account statements - last 12 months)
  // ============================================================================
  if (config.monthly) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthlyBordereauFolderId = `${roomId}-2025-monthly-monthly-bordereaux`;
    if (folders.find((f) => f.id === monthlyBordereauFolderId)) {
      // 2025 monthly files (Jan only, assuming early in the year)
      files.push({
        id: uuid(),
        dataRoomId: roomId,
        folderId: monthlyBordereauFolderId,
        name: `${cedantName}_Monthly_Bordereau_2025_01_Jan.xlsx`,
        uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
        daysAgo: 15,
      });
    }

    const monthlyBordereauFolderId2024 = `${roomId}-2024-monthly-monthly-bordereaux`;
    if (folders.find((f) => f.id === monthlyBordereauFolderId2024)) {
      // 2024 monthly bordereaux (full year)
      for (let month = 0; month < 12; month++) {
        const monthStr = String(month + 1).padStart(2, '0');
        files.push({
          id: uuid(),
          dataRoomId: roomId,
          folderId: monthlyBordereauFolderId2024,
          name: `${cedantName}_Monthly_Bordereau_2024_${monthStr}_${monthNames[month]}.xlsx`,
          uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
          daysAgo: 30 + (11 - month) * 30, // Older months have higher daysAgo
        });
      }
    }

    const accountStatementsFolderId = `${roomId}-2025-monthly-account-statements`;
    if (folders.find((f) => f.id === accountStatementsFolderId)) {
      files.push({
        id: uuid(),
        dataRoomId: roomId,
        folderId: accountStatementsFolderId,
        name: `${cedantName}_Account_Statement_2025_01.pdf`,
        uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
        daysAgo: 10,
      });
    }

    const accountStatementsFolderId2024 = `${roomId}-2024-monthly-account-statements`;
    if (folders.find((f) => f.id === accountStatementsFolderId2024)) {
      for (let month = 0; month < 12; month++) {
        const monthStr = String(month + 1).padStart(2, '0');
        files.push({
          id: uuid(),
          dataRoomId: roomId,
          folderId: accountStatementsFolderId2024,
          name: `${cedantName}_Account_Statement_2024_${monthStr}.pdf`,
          uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
          daysAgo: 45 + (11 - month) * 30,
        });
      }
    }

    const reconciliationsFolderId = `${roomId}-2025-monthly-reconciliations`;
    if (folders.find((f) => f.id === reconciliationsFolderId)) {
      files.push({
        id: uuid(),
        dataRoomId: roomId,
        folderId: reconciliationsFolderId,
        name: `${cedantName}_Premium_Reconciliation_2025_01.xlsx`,
        uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
        daysAgo: 8,
      });
    }
  }

  // ============================================================================
  // ANNUAL FILES (Treaty renewals, annual statements)
  // ============================================================================
  const annualFolderId2024 = `${roomId}-2024-annual`;
  if (folders.find((f) => f.id === annualFolderId2024)) {
    files.push({
      id: uuid(),
      dataRoomId: roomId,
      folderId: `${roomId}-2024-annual-treaty-renewal`,
      name: `${cedantName}_Treaty_Renewal_2025_Signed.pdf`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 60,
    });
    files.push({
      id: uuid(),
      dataRoomId: roomId,
      folderId: `${roomId}-2024-annual-treaty-renewal`,
      name: `${cedantName}_Treaty_Terms_2025_Final.docx`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 75,
    });
    files.push({
      id: uuid(),
      dataRoomId: roomId,
      folderId: `${roomId}-2024-annual-annual-statement`,
      name: `${cedantName}_Annual_Statement_YE2024.pdf`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 35,
    });
    files.push({
      id: uuid(),
      dataRoomId: roomId,
      folderId: `${roomId}-2024-annual-reserve-certificate`,
      name: `${cedantName}_Reserve_Certificate_YE2024.pdf`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 40,
    });
    files.push({
      id: uuid(),
      dataRoomId: roomId,
      folderId: `${roomId}-2024-annual-audit-report`,
      name: `${cedantName}_External_Audit_Report_2024.pdf`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 25,
    });
  }

  const annualFolderId2023 = `${roomId}-2023-annual`;
  if (folders.find((f) => f.id === annualFolderId2023)) {
    files.push({
      id: uuid(),
      dataRoomId: roomId,
      folderId: `${roomId}-2023-annual-treaty-renewal`,
      name: `${cedantName}_Treaty_Renewal_2024_Signed.pdf`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 365 + 60,
    });
    files.push({
      id: uuid(),
      dataRoomId: roomId,
      folderId: `${roomId}-2023-annual-annual-statement`,
      name: `${cedantName}_Annual_Statement_YE2023.pdf`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 365 + 35,
    });
  }
}

// AIR Worldwide files
const airModelTypes = ['hurricane-models', 'earthquake-models', 'flood-models', 'aggregate-results'];
for (const modelType of airModelTypes) {
  const folderId = `air-worldwide-2025-${modelType}`;
  if (folders.find((f) => f.id === folderId)) {
    files.push({
      id: uuid(),
      dataRoomId: 'air-worldwide',
      folderId,
      name: `AIR_${modelType.replace(/-/g, '_')}_Portfolio_Analysis_2025.xlsx`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 20,
    });
  }
}

// RMS files
const rmsModelTypes = ['hurricane-models', 'earthquake-models', 'wildfire-models', 'aggregate-results'];
for (const modelType of rmsModelTypes) {
  const folderId = `rms-2025-${modelType}`;
  if (folders.find((f) => f.id === folderId)) {
    files.push({
      id: uuid(),
      dataRoomId: 'rms',
      folderId,
      name: `RMS_${modelType.replace(/-/g, '_')}_Results_Jan2025.csv`,
      uploadedBy: uploaders[Math.floor(Math.random() * uploaders.length)].id,
      daysAgo: 18,
    });
  }
}

// Milliman files
files.push({
  id: uuid(),
  dataRoomId: 'milliman',
  folderId: 'milliman-reserve-studies',
  name: 'ACME_Re_Reserve_Study_YE2024_Final.pdf',
  uploadedBy: uploaders[0].id,
  daysAgo: 30,
});
files.push({
  id: uuid(),
  dataRoomId: 'milliman',
  folderId: 'milliman-reserve-studies',
  name: 'Reserve_Triangle_Data_YE2024.xlsx',
  uploadedBy: uploaders[0].id,
  daysAgo: 35,
});
files.push({
  id: uuid(),
  dataRoomId: 'milliman',
  folderId: 'milliman-ldti-valuations',
  name: 'LDTI_Transition_Analysis_Q4_2024.xlsx',
  uploadedBy: uploaders[1].id,
  daysAgo: 25,
});

// Internal Actuarial files
files.push({
  id: uuid(),
  dataRoomId: 'internal-actuarial',
  folderId: 'internal-actuarial-reserving',
  name: 'Quarterly_Reserve_Analysis_Q1_2025.xlsx',
  uploadedBy: uploaders[2].id,
  daysAgo: 8,
});
files.push({
  id: uuid(),
  dataRoomId: 'internal-actuarial',
  folderId: 'internal-actuarial-capital-modeling',
  name: 'Economic_Capital_Model_2025.xlsm',
  uploadedBy: uploaders[2].id,
  daysAgo: 60,
});
files.push({
  id: uuid(),
  dataRoomId: 'internal-actuarial',
  folderId: 'internal-actuarial-pricing',
  name: 'Property_Cat_Pricing_Model_2025.xlsx',
  uploadedBy: uploaders[3].id,
  daysAgo: 45,
});

// Internal Finance files
files.push({
  id: uuid(),
  dataRoomId: 'internal-finance',
  folderId: 'internal-finance-statutory-filings',
  name: 'Annual_Statement_2024_Blank.pdf',
  uploadedBy: uploaders[4].id,
  daysAgo: 20,
});
files.push({
  id: uuid(),
  dataRoomId: 'internal-finance',
  folderId: 'internal-finance-gaap-reports',
  name: 'GAAP_Financial_Statements_Q4_2024.pdf',
  uploadedBy: uploaders[4].id,
  daysAgo: 28,
});
files.push({
  id: uuid(),
  dataRoomId: 'internal-finance',
  folderId: 'internal-finance-board-materials',
  name: 'Board_Meeting_Deck_Q1_2025.pptx',
  uploadedBy: uploaders[4].id,
  daysAgo: 5,
});

for (const file of files) {
  const createdAt = daysAgo(file.daysAgo);
  db.run(`
    INSERT OR REPLACE INTO files (id, data_room_id, folder_id, name, created_at, updated_at)
    VALUES ('${file.id}', '${file.dataRoomId}', '${file.folderId}', '${esc(file.name)}', '${createdAt}', '${createdAt}')
  `);
}

// ============================================================================
// FILE VERSIONS
// ============================================================================
interface FileVersion {
  id: string;
  fileId: string;
  storageUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

const fileVersions: FileVersion[] = [];

for (const file of files) {
  // Create 1-3 versions per file
  const numVersions = Math.floor(Math.random() * 3) + 1;

  for (let v = 0; v < numVersions; v++) {
    const versionId = uuid();
    const versionDaysAgo = file.daysAgo + (numVersions - v - 1) * 5;
    fileVersions.push({
      id: versionId,
      fileId: file.id,
      storageUrl: `/storage/${file.dataRoomId}/${file.id}/${versionId}`,
      uploadedBy: file.uploadedBy,
      uploadedAt: daysAgo(versionDaysAgo),
    });
  }
}

for (const version of fileVersions) {
  db.run(`
    INSERT OR REPLACE INTO file_versions (id, file_id, storage_url, uploaded_by, uploaded_at, created_at, updated_at)
    VALUES ('${version.id}', '${version.fileId}', '${version.storageUrl}', '${version.uploadedBy}', '${version.uploadedAt}', '${version.uploadedAt}', '${version.uploadedAt}')
  `);
}

// ============================================================================
// PIPELINES
// ============================================================================
interface Pipeline {
  id: string;
  dataRoomId: string;
  datasetKind: string;
  steps: string[];
}

const pipelines: Pipeline[] = [];

// Premium bordereau pipeline for cedant rooms
for (const roomId of cedantRooms) {
  const config = cedantCadenceConfig[roomId];

  // Quarterly pipelines (all cedants)
  pipelines.push({
    id: `${roomId}-premium-pipeline`,
    dataRoomId: roomId,
    datasetKind: 'premium_bordereau',
    steps: ['malware_scan', 'pii_scan', 'data_validation', 'ingestion', 'control_checks'],
  });
  pipelines.push({
    id: `${roomId}-claims-pipeline`,
    dataRoomId: roomId,
    datasetKind: 'claims_bordereau',
    steps: ['malware_scan', 'pii_scan', 'pii_review', 'data_validation', 'ingestion'],
  });
  pipelines.push({
    id: `${roomId}-exposure-pipeline`,
    dataRoomId: roomId,
    datasetKind: 'exposure_data',
    steps: ['malware_scan', 'data_validation', 'ingestion'],
  });

  // Daily pipelines (for cedants with daily cadence)
  if (config.daily) {
    pipelines.push({
      id: `${roomId}-cat-event-pipeline`,
      dataRoomId: roomId,
      datasetKind: 'cat_event',
      steps: ['malware_scan', 'data_validation', 'ingestion', 'alert_routing'],
    });
    pipelines.push({
      id: `${roomId}-market-rates-pipeline`,
      dataRoomId: roomId,
      datasetKind: 'market_rates',
      steps: ['malware_scan', 'data_validation', 'ingestion'],
    });
    pipelines.push({
      id: `${roomId}-claims-alert-pipeline`,
      dataRoomId: roomId,
      datasetKind: 'claims_alert',
      steps: ['malware_scan', 'pii_scan', 'ingestion', 'alert_routing'],
    });
  }

  // Weekly pipelines (for cedants with weekly cadence)
  if (config.weekly) {
    pipelines.push({
      id: `${roomId}-claims-summary-pipeline`,
      dataRoomId: roomId,
      datasetKind: 'claims_summary',
      steps: ['malware_scan', 'pii_scan', 'data_validation', 'ingestion'],
    });
    pipelines.push({
      id: `${roomId}-exposure-update-pipeline`,
      dataRoomId: roomId,
      datasetKind: 'exposure_update',
      steps: ['malware_scan', 'data_validation', 'ingestion'],
    });
    pipelines.push({
      id: `${roomId}-loss-development-pipeline`,
      dataRoomId: roomId,
      datasetKind: 'loss_development',
      steps: ['malware_scan', 'data_validation', 'ingestion', 'control_checks'],
    });
  }

  // Monthly pipelines (for cedants with monthly cadence)
  if (config.monthly) {
    pipelines.push({
      id: `${roomId}-monthly-bordereau-pipeline`,
      dataRoomId: roomId,
      datasetKind: 'monthly_bordereau',
      steps: ['malware_scan', 'pii_scan', 'data_validation', 'ingestion', 'control_checks'],
    });
    pipelines.push({
      id: `${roomId}-account-statement-pipeline`,
      dataRoomId: roomId,
      datasetKind: 'account_statement',
      steps: ['malware_scan', 'data_validation', 'reconciliation'],
    });
    pipelines.push({
      id: `${roomId}-reconciliation-pipeline`,
      dataRoomId: roomId,
      datasetKind: 'reconciliation',
      steps: ['malware_scan', 'data_validation', 'control_checks'],
    });
  }

  // Annual pipelines (all cedants)
  pipelines.push({
    id: `${roomId}-treaty-renewal-pipeline`,
    dataRoomId: roomId,
    datasetKind: 'treaty_renewal',
    steps: ['malware_scan', 'pii_scan', 'versioning'],
  });
  pipelines.push({
    id: `${roomId}-annual-statement-pipeline`,
    dataRoomId: roomId,
    datasetKind: 'annual_statement',
    steps: ['malware_scan', 'data_validation', 'versioning'],
  });
  pipelines.push({
    id: `${roomId}-reserve-certificate-pipeline`,
    dataRoomId: roomId,
    datasetKind: 'reserve_certificate',
    steps: ['malware_scan', 'versioning'],
  });
  pipelines.push({
    id: `${roomId}-audit-report-pipeline`,
    dataRoomId: roomId,
    datasetKind: 'audit_report',
    steps: ['malware_scan', 'pii_scan', 'versioning'],
  });
}

// Cat model pipelines
pipelines.push({
  id: 'air-cat-pipeline',
  dataRoomId: 'air-worldwide',
  datasetKind: 'cat_model_output',
  steps: ['malware_scan', 'data_validation', 'ingestion', 'control_checks'],
});
pipelines.push({
  id: 'rms-cat-pipeline',
  dataRoomId: 'rms',
  datasetKind: 'cat_model_output',
  steps: ['malware_scan', 'data_validation', 'ingestion', 'control_checks'],
});

// Milliman pipelines
pipelines.push({
  id: 'milliman-reserve-pipeline',
  dataRoomId: 'milliman',
  datasetKind: 'reserve_analysis',
  steps: ['malware_scan', 'pii_scan', 'versioning', 'ingestion'],
});
pipelines.push({
  id: 'milliman-valuation-pipeline',
  dataRoomId: 'milliman',
  datasetKind: 'valuation_data',
  steps: ['malware_scan', 'data_validation', 'ingestion'],
});

// Internal pipelines
pipelines.push({
  id: 'internal-finance-pipeline',
  dataRoomId: 'internal-finance',
  datasetKind: 'financial_statement',
  steps: ['malware_scan', 'pii_scan', 'versioning'],
});
pipelines.push({
  id: 'internal-actuarial-pipeline',
  dataRoomId: 'internal-actuarial',
  datasetKind: 'reserve_analysis',
  steps: ['malware_scan', 'data_validation', 'versioning'],
});

for (const pipeline of pipelines) {
  db.run(`
    INSERT OR REPLACE INTO pipelines (id, data_room_id, name, dataset_kind, steps, created_at, updated_at)
    VALUES ('${pipeline.id}', '${pipeline.dataRoomId}', '${pipeline.datasetKind}', '${pipeline.datasetKind}', '${JSON.stringify(pipeline.steps)}', '${daysAgo(180)}', '${now}')
  `);
}

// ============================================================================
// PIPELINE RUNS & STEPS
// ============================================================================
interface PipelineRun {
  id: string;
  pipelineId: string;
  fileVersionId: string;
  status: 'processing' | 'processed' | 'errored';
  steps: string[];
  createdAt: string;
}

const pipelineRuns: PipelineRun[] = [];

// Create pipeline runs for file versions, matching by folder type to appropriate pipeline
for (const version of fileVersions) {
  const file = files.find((f) => f.id === version.fileId);
  if (!file) continue;

  const folder = folders.find((f) => f.id === file.folderId);
  if (!folder) continue;

  // Extract data type slug from folder ID (e.g., "liberty-mutual-2024-Q4-premium-bordereaux" -> "premium-bordereaux")
  const folderIdParts = folder.id.split('-');
  const dataTypeSlug = folderIdParts.slice(-2).join('-'); // Get last two parts (e.g., "premium-bordereaux")

  // Map folder type to dataset kind
  const datasetKind = folderNameToDatasetKind(dataTypeSlug);
  if (!datasetKind) continue;

  // Find pipeline matching both data room and dataset kind
  const matchingPipeline = findMatchingPipeline(pipelines, file.dataRoomId, datasetKind);
  if (!matchingPipeline) continue;

  // Determine status based on randomness
  const rand = Math.random();
  let status: 'processing' | 'processed' | 'errored';
  if (rand < 0.7) {
    status = 'processed';
  } else if (rand < 0.9) {
    status = 'processing';
  } else {
    status = 'errored';
  }

  const runId = uuid();
  pipelineRuns.push({
    id: runId,
    pipelineId: matchingPipeline.id,
    fileVersionId: version.id,
    status,
    steps: matchingPipeline.steps,
    createdAt: version.uploadedAt,
  });
}

for (const run of pipelineRuns) {
  db.run(`
    INSERT OR REPLACE INTO pipeline_runs (id, pipeline_id, file_version_id, status, created_at, updated_at)
    VALUES ('${run.id}', '${run.pipelineId}', '${run.fileVersionId}', '${run.status}', '${run.createdAt}', '${now}')
  `);

  // Create step records
  const runStartTime = new Date(run.createdAt);
  let stepTime = runStartTime;

  for (let i = 0; i < run.steps.length; i++) {
    const step = run.steps[i];
    const stepId = uuid();
    let stepStatus: string;
    let errorMessage: string | null = null;

    if (run.status === 'processed') {
      stepStatus = 'processed';
    } else if (run.status === 'errored') {
      // Error on one of the later steps
      if (i < run.steps.length - 2) {
        stepStatus = 'processed';
      } else if (i === run.steps.length - 2) {
        stepStatus = 'errored';
        if (step === 'data_validation') {
          errorMessage = 'Validation failed: Missing required columns [policy_number, effective_date]';
        } else if (step === 'pii_scan') {
          errorMessage = 'PII detected: 127 SSN patterns found in column "customer_id"';
        } else if (step === 'control_checks') {
          errorMessage = 'Control check failed: Premium total mismatch - expected $1,234,567, found $1,234,566';
        } else {
          errorMessage = 'Processing failed: Unexpected error during step execution';
        }
      } else {
        stepStatus = 'processing';
      }
    } else {
      // Processing - some steps done, current one in progress
      if (i < Math.floor(run.steps.length / 2)) {
        stepStatus = 'processed';
      } else if (i === Math.floor(run.steps.length / 2)) {
        stepStatus = 'processing';
      } else {
        stepStatus = 'processing'; // Still pending
      }
    }

    // Add some time for each step
    const stepStartTime = new Date(stepTime);
    stepTime = new Date(stepTime.getTime() + Math.random() * 60000 + 30000); // 30s - 1.5min per step
    const stepEndTime = stepStatus === 'processed' || stepStatus === 'errored' ? stepTime : null;

    db.run(`
      INSERT OR REPLACE INTO pipeline_run_steps (id, pipeline_run_id, step, status, error_message, created_at, updated_at)
      VALUES ('${stepId}', '${run.id}', '${step}', '${stepStatus}', ${errorMessage ? `'${errorMessage.replace(/'/g, "''")}'` : 'NULL'}, '${stepStartTime.toISOString()}', '${stepEndTime ? stepEndTime.toISOString() : stepStartTime.toISOString()}')
    `);
  }
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('Database seeded successfully!');
console.log(`  - ${users.length} users`);
console.log(`  - ${tenants.length} tenants`);
console.log(`  - ${dataRooms.length} data rooms`);
console.log(`  - ${folders.length} folders`);
console.log(`  - ${files.length} files`);
console.log(`  - ${fileVersions.length} file versions`);
console.log(`  - ${pipelines.length} pipelines`);
console.log(`  - ${pipelineRuns.length} pipeline runs`);

close();
