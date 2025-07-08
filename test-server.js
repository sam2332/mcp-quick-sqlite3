#!/usr/bin/env node

// Simple test script to verify the MCP server works
import { spawn } from 'child_process';
import { resolve } from 'path';

console.log('Testing SQLite MCP Server...');

const serverPath = resolve('./dist/index.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Test initialize request
const initRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "test-client",
      version: "1.0.0"
    }
  }
};

// Test list tools request
const listToolsRequest = {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/list",
  params: {}
};

let responseCount = 0;
let output = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  
  // Look for complete JSON responses
  const lines = output.split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('{')) {
      try {
        const response = JSON.parse(line.trim());
        console.log('Response:', JSON.stringify(response, null, 2));
        responseCount++;
        
        if (responseCount === 1) {
          // Send list tools request after initialization
          server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
        } else if (responseCount === 2) {
          // Done testing
          server.kill();
          process.exit(0);
        }
      } catch (e) {
        // Not a complete JSON response yet
      }
    }
  }
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Send initialize request
server.stdin.write(JSON.stringify(initRequest) + '\n');

// Timeout after 10 seconds
setTimeout(() => {
  console.log('Test timeout');
  server.kill();
  process.exit(1);
}, 10000);
