/**
 * Environment utilities for migration framework
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

export function loadDotenv(): void {
  const explicit = process.env.MIGRATION_ENV_FILE;
  if (explicit) {
    config({ path: explicit });
    return;
  }

  const cwd = process.cwd();
  const paths = [
    resolve(cwd, '.env.local'),
    resolve(cwd, '.env'),
    resolve(cwd, '../.env.local'),
    resolve(cwd, '../.env'),
  ];

  for (const path of paths) {
    if (existsSync(path)) {
      config({ path });
    }
  }
}