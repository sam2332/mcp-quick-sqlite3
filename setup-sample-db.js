#!/usr/bin/env node

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create sample database
const db = new Database('sample.db');

// Read and execute the SQL file
const sqlContent = readFileSync(resolve(__dirname, 'sample.sql'), 'utf-8');
const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);

console.log('Creating sample database...');

statements.forEach((statement, index) => {
  try {
    db.exec(statement);
    console.log(`✓ Executed statement ${index + 1}`);
  } catch (error) {
    console.error(`✗ Error in statement ${index + 1}:`, error.message);
  }
});

db.close();
console.log('✓ Sample database created as sample.db');
