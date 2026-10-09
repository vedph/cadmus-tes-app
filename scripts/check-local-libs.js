#!/usr/bin/env node
// Guards against a local @myrmidon/<lib> library resolving to a published
// npm copy under node_modules instead of the workspace's own dist/ build.
// In this workspace local libraries resolve through exactly one mechanism,
// tsconfig.json's compilerOptions.paths -> ./dist/myrmidon/<lib>. Any entry
// for them under node_modules (a published copy, or even a symlink) would
// give plain Node resolution and Vite's dependency pre-bundling a second
// route which can silently serve stale code, so its mere presence fails.
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const libsDir = path.join(repoRoot, 'projects', 'myrmidon');
const localLibs = fs
  .readdirSync(libsDir)
  .map((dir) => path.join(libsDir, dir, 'package.json'))
  .filter((file) => fs.existsSync(file))
  .map((file) => JSON.parse(fs.readFileSync(file, 'utf8')).name);

// tsconfig.json has comments: parse it as TypeScript does
const ts = require('typescript');
const tsconfigPath = path.join(repoRoot, 'tsconfig.json');
const tsconfig = ts.parseConfigFileTextToJson(
  tsconfigPath,
  fs.readFileSync(tsconfigPath, 'utf8'),
).config;
const paths = tsconfig.compilerOptions.paths || {};

let failed = false;
for (const name of localLibs) {
  const expected = `./dist/${name.slice(1)}`;
  if (!(paths[name] || []).includes(expected)) {
    console.error(
      `[check-local-libs] tsconfig.json paths must map ${name} to ${expected}.`,
    );
    failed = true;
  }
  const copy = path.join(repoRoot, 'node_modules', ...name.split('/'));
  let present = false;
  try {
    fs.lstatSync(copy);
    present = true;
  } catch {
    // not present: fine
  }
  if (present) {
    console.error(
      `[check-local-libs] node_modules/${name} exists: a local library must ` +
        'resolve only through tsconfig paths to dist/. Remove it from ' +
        'package.json if listed there, delete the directory and reinstall.',
    );
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
console.log(
  `[check-local-libs] OK: ${localLibs.length} local libraries resolve only ` +
    'via tsconfig paths (none in node_modules).',
);
