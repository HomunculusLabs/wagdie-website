/**
 * Environment utilities for migration framework
 */

import { config } from 'dotenv';

export function loadDotenv(): void {
  config({
    path: '.env.local'
  });

  config({
    path: '.env'
  });
}