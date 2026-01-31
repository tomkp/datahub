import { createDb } from './index';

const dbUrl = process.env.DATABASE_URL || './data/datahub.db';

console.log(`Initializing database at ${dbUrl}...`);

const { db, close } = createDb(dbUrl);

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    token_id TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS data_rooms (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    storage_url TEXT NOT NULL,
    public_url TEXT,
    description TEXT,
    feature_flags TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    data_room_id TEXT NOT NULL REFERENCES data_rooms(id),
    parent_id TEXT,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    data_room_id TEXT NOT NULL REFERENCES data_rooms(id),
    folder_id TEXT NOT NULL REFERENCES folders(id),
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS file_versions (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL REFERENCES files(id),
    pipeline_id TEXT REFERENCES pipelines(id),
    storage_url TEXT NOT NULL,
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    uploaded_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS pipelines (
    id TEXT PRIMARY KEY,
    data_room_id TEXT NOT NULL REFERENCES data_rooms(id),
    name TEXT NOT NULL,
    dataset_kind TEXT,
    steps TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS pipeline_runs (
    id TEXT PRIMARY KEY,
    pipeline_id TEXT NOT NULL REFERENCES pipelines(id),
    file_version_id TEXT NOT NULL REFERENCES file_versions(id),
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS pipeline_run_steps (
    id TEXT PRIMARY KEY,
    pipeline_run_id TEXT NOT NULL REFERENCES pipeline_runs(id),
    step TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS pipeline_run_expected_events (
    pipeline_run_id TEXT NOT NULL REFERENCES pipeline_runs(id),
    event_type TEXT NOT NULL,
    event_ref TEXT NOT NULL,
    event_received_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS pipeline_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT,
    handling_error TEXT,
    created_at TEXT NOT NULL
  )
`);

// Create a default user for development
const now = new Date().toISOString();
db.run(`
  INSERT OR IGNORE INTO users (id, name, email, token_id, created_at)
  VALUES ('dev-user', 'Dev User', 'dev@example.com', 'dev-token', '${now}')
`);

// Create a default tenant
db.run(`
  INSERT OR IGNORE INTO tenants (id, name, created_at, updated_at)
  VALUES ('default', 'Default Tenant', '${now}', '${now}')
`);

// Seed data rooms
const dataRooms = [
  { id: 'aphex', name: 'APHEX', description: 'Third-party actuarial and asset management services.' },
  { id: 'factset', name: 'FACTSET', description: 'Investment research, portfolio management, and analytics.' },
  { id: 'betamax', name: 'BETAMAX', description: 'Betamax Reinsurance Company, Ltd. as a reinsurance cedant.' },
  { id: 'delorean', name: 'DELOREAN', description: 'Third-party regulatory and financial reporting services.' },
  { id: 'kodak', name: 'KODAK', description: 'Third-party actuarial modeling & valuation services.' },
  { id: 'crockett', name: 'CROCKETT', description: 'Crockett as a reinsurance cedant.' },
  { id: 'tubbs', name: 'TUBBS', description: 'Tubbs Life Assurance as a reinsurance cedant.' },
  { id: 'internal', name: 'INTERNAL', description: 'Internal file sharing and storage.' },
];

for (const room of dataRooms) {
  db.run(`
    INSERT OR IGNORE INTO data_rooms (id, tenant_id, name, storage_url, description, created_at, updated_at)
    VALUES ('${room.id}', 'default', '${room.name}', '/storage/${room.id}', '${room.description}', '${now}', '${now}')
  `);

  // Create a root folder for each data room (named after the data room)
  db.run(`
    INSERT OR IGNORE INTO folders (id, data_room_id, name, path, created_at, updated_at)
    VALUES ('${room.id}-root', '${room.id}', '${room.name}', '/', '${now}', '${now}')
  `);
}

console.log('Database initialized successfully!');
console.log(`Created ${dataRooms.length} data rooms.`);
close();
