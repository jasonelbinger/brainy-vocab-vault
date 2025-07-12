#!/usr/bin/env node

// Production startup script for Replit deployment
// This ensures proper module resolution and environment setup

import { spawn } from 'child_process';
import path from 'path';

// Set production environment
process.env.NODE_ENV = 'production';

// Use tsx to run the TypeScript server directly
const serverPath = path.join(process.cwd(), 'server', 'index.ts');
const child = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => {
  process.exit(code);
});