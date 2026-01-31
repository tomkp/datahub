import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Global CSS', () => {
  const cssContent = fs.readFileSync(join(__dirname, 'index.css'), 'utf-8');

  it('applies tabular-nums globally to body for consistent numeric alignment', () => {
    expect(cssContent).toContain('font-variant-numeric: tabular-nums');
  });
});
