#!/usr/bin/env node
// Checks that every `spec:<doc>#<id>` citation found in the given roots points at
// an anchor that exists in this repository, and that every relative link between
// documents here resolves. Exits 1 when something is broken.
//
//   node tools/check-refs.mjs [root ...]
//
// With no roots, scans the sibling repositories of this one.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const store = resolve(here, '..');
const notDocs = new Set(['tools', 'openspec', 'node_modules', '_retired']);
const docDirs = readdirSync(store, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('.') && !notDocs.has(e.name))
  .map((e) => e.name);
const skip = new Set(['node_modules', '.git', 'build', 'dist', 'out', '.serena', 'openspec', '_retired']);
const textExt = /\.(md|ts|tsx|js|mjs|kt|java|json|yml|yaml)$/;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) yield* walk(path);
    else if (textExt.test(name)) yield path;
  }
}

// A document is known by its path under the store without extension
// ("flows/eventflow"), and also by its bare name when that is unique.
const docs = new Map();
const byName = new Map();
const problems = [];
for (const d of docDirs) {
  for (const path of walk(join(store, d))) {
    if (!path.endsWith('.md')) continue;
    const key = relative(store, path).replaceAll('\\', '/').replace(/\.md$/, '');
    const text = readFileSync(path, 'utf8');
    const anchors = new Set([...text.matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1]));
    const doc = { path, anchors, text, key };
    docs.set(key, doc);
    const name = basename(key);
    byName.set(name, byName.has(name) ? null : doc); // null: ambiguous
  }
}
const lookup = (ref) => docs.get(ref) ?? byName.get(ref);
const byPath = new Map([...docs.values()].map((d) => [d.path, d]));

// relative links between documents in the store
for (const doc of docs.values()) {
  for (const m of doc.text.matchAll(/\]\((\.{1,2}\/[^)#\s]+\.md)(?:#([^)\s]+))?\)/g)) {
    const target = resolve(dirname(doc.path), m[1]);
    if (!existsSync(target)) {
      problems.push(`${doc.path}: link to missing file ${m[1]}`);
      continue;
    }
    const other = byPath.get(target);
    if (m[2] && other && !other.anchors.has(m[2])) {
      problems.push(`${doc.path}: link to missing anchor ${m[1]}#${m[2]}`);
    }
  }
}

// citations from code and docs elsewhere
const roots = process.argv.length > 2
  ? process.argv.slice(2).map((r) => resolve(r))
  : readdirSync(resolve(store, '..'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && resolve(store, '..', e.name) !== store)
      .map((e) => resolve(store, '..', e.name));

let cited = 0;
for (const root of roots) {
  if (!existsSync(root)) continue;
  for (const path of walk(root)) {
    const text = readFileSync(path, 'utf8');
    for (const m of text.matchAll(/spec:([a-z0-9/-]+)#([a-z0-9-]+)/g)) {
      cited++;
      const doc = lookup(m[1]);
      if (doc === null) problems.push(`${path}: "${m[1]}" names more than one document; use folder/name (${m[0]})`);
      else if (!doc) problems.push(`${path}: cites unknown document "${m[1]}" (${m[0]})`);
      else if (!doc.anchors.has(m[2])) problems.push(`${path}: cites missing anchor (${m[0]})`);
    }
  }
}

console.log(`${docs.size} documents, ${cited} citations in ${roots.length} repositories`);
if (problems.length) {
  for (const p of problems) console.error(`BROKEN  ${p}`);
  process.exit(1);
}
console.log('ok');
