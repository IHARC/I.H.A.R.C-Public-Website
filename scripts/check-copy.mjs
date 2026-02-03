#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const flaggedTermsPath = path.join(repoRoot, 'src', 'lib', 'copy', 'flagged-terms.json');
const flaggedTermsSource = JSON.parse(await readFile(flaggedTermsPath, 'utf8'));
const flaggedTerms = flaggedTermsSource.terms.map((term) => term.toLowerCase());

const allowedExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.mdx',
  '.yml',
  '.yaml',
  '.css',
  '.html'
]);

const ignoredDirectories = new Set([
  '.git',
  '.husky/_',
  '.next',
  '.vercel',
  'coverage',
  'dist',
  'node_modules',
  'out',
  'public/fonts'
]);

const ignoredFiles = new Set([
  path.join(repoRoot, 'scripts', 'check-copy.mjs'),
  path.join(repoRoot, 'src', 'lib', 'copy', 'flagged-terms.json'),
  path.join(repoRoot, 'AGENTS.md')
]);

const matches = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        continue;
      }

      await walk(entryPath);
      continue;
    }

    if (ignoredFiles.has(entryPath)) {
      continue;
    }

    const extension = path.extname(entry.name);
    if (!allowedExtensions.has(extension)) {
      continue;
    }

    await scanFile(entryPath);
  }
}

async function scanFile(filePath) {
  const fileContents = await readFile(filePath, 'utf8');
  const lines = fileContents.split(/\r?\n/);

  lines.forEach((line, index) => {
    const normalized = line.toLowerCase();
    flaggedTerms.forEach((term) => {
      if (!term || !normalized.includes(term)) {
        return;
      }

      matches.push({
        filePath: path.relative(repoRoot, filePath),
        lineNumber: index + 1,
        term,
        line: line.trim()
      });
    });
  });
}

try {
  await walk(repoRoot);

  if (matches.length > 0) {
    console.error('Flagged terminology detected. Please replace or rewrite the following instances:');
    matches.forEach((match) => {
      console.error(` - ${match.filePath}:${match.lineNumber} → “${match.term}” (line: ${match.line})`);
    });
    process.exit(1);
  }

  console.log('✔︎ No flagged terminology found.');
} catch (error) {
  console.error('Failed to complete copy check:', error);
  process.exit(1);
}
