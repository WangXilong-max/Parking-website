#!/usr/bin/env node



import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

console.log('🚀 Starting Melbourne Parking Map...');

const distPath = path.join(__dirname, 'dist');
if (!existsSync(distPath)) {
  console.log('📦 Building frontend...');
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Frontend build completed!');
      startBackend();
    } else {
      console.error('❌ Frontend build failed!');
      process.exit(1);
    }
  });
} else {
  console.log('📦 Frontend already built, starting backend...');
  startBackend();
}

function startBackend() {
  console.log('🌐 Starting backend server...');
  const backendProcess = spawn('npm', ['start'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, 'backend')
  });
  
  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    process.exit(code);
  });
  

  process.on('SIGINT', () => {
    console.log('\n🛑 Gracefully shutting down...');
    backendProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Gracefully shutting down...');
    backendProcess.kill('SIGTERM');
  });
}
