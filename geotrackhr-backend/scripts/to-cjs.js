/**
 * Rename compiled migration & seed files from .js to .cjs.
 *
 * Why: knex loads migration/seed files with require(). On modern Node
 * (>=22.7 and some 20.x backports), ESM syntax detection can misclassify
 * plain CommonJS .js files — e.g. migrations whose bodies contain `await`
 * on their own line — and the deploy dies with
 * "SyntaxError: Unexpected token '{'" inside knex's import-file.js.
 * A .cjs extension is ALWAYS treated as CommonJS by Node, regardless of
 * package.json "type" or detection heuristics, so this is bulletproof.
 * The knexfile production config uses extension: 'cjs' to match.
 *
 * Runs as the last step of the Render buildCommand (after tsc && tsc-alias),
 * so the emitted .js files are renamed before the server boots.
 */
const fs = require('fs');
const path = require('path');

const dirs = [
  path.resolve(__dirname, '../dist/database/migrations'),
  path.resolve(__dirname, '../dist/database/seeds'),
];

let renamed = 0;
for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (file.endsWith('.js')) {
      const from = path.join(dir, file);
      const to = path.join(dir, file.slice(0, -3) + '.cjs');
      fs.renameSync(from, to);
      renamed++;
    }
  }
}

console.log(`[to-cjs] renamed ${renamed} compiled migration/seed file(s) to .cjs`);
if (renamed === 0) {
  console.error('[to-cjs] ERROR: no .js migration/seed files found to rename — build layout changed?');
  process.exit(1);
}
