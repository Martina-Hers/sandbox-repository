import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';

const roots = ['src', 'test', 'scripts'];
const files = [];

function walk(path) {
  for (const entry of readdirSync(path)) {
    const fullPath = join(path, entry);
    if (statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (extname(fullPath) === '.js' || extname(fullPath) === '.mjs') {
      files.push(fullPath);
    }
  }
}

for (const root of roots) walk(root);

for (const file of files) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}

console.log(`Syntax check passed for ${files.length} JavaScript files.`);
