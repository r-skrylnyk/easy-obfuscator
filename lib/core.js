'use strict';

const fs   = require('fs');
const path = require('path');
const _    = require('lodash');
const { globSync } = require('glob');
const cheerio      = require('cheerio');
const Hashids      = require('hashids/cjs');

const { getDefinitions } = require('./css-parser');

const hashids    = new Hashids('easy-obfuscator-v1', 5);
const SAFE_PREFIX = 'r';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Expand a comma-separated string, array, or glob pattern into a flat file list. */
function globlist(input) {
  if (!input) return [];
  const patterns = Array.isArray(input) ? input : String(input).split(',');
  return _.uniq(_.flatten(patterns.map(p => globSync(p.trim()))));
}

/**
 * Load an exclusion list from a .json or .txt file.
 * JSON: array of strings  ["navbar", "active"]
 * TXT:  one term per line  (leading . or # are stripped)
 */
function loadExcludeList(filePath) {
  if (!filePath) return [];
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.warn(`[warn] exclude-list not found: ${resolved}`);
    return [];
  }
  const raw = fs.readFileSync(resolved, 'utf8').trim();
  if (resolved.endsWith('.json')) {
    return JSON.parse(raw);
  }
  return raw.split('\n')
    .map(l => l.trim().replace(/^[.#]/, ''))
    .filter(Boolean);
}

/** Write file, creating parent directories as needed. */
function safeWrite(fd, buffer) {
  fs.mkdirSync(path.dirname(fd), { recursive: true });
  fs.writeFileSync(fd, buffer, 'utf8');
}

/**
 * Build the output file path.
 * - No output dir → write back to source (in-place).
 * - Relative input → join output + relative path (preserves structure).
 * - Absolute input → join output + basename only (avoids path nesting).
 */
function toOutputPath(filePath, output) {
  if (!output) return filePath;
  const relative = path.isAbsolute(filePath) ? path.basename(filePath) : filePath;
  return path.join(output, relative);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function run(opts) {
  // Normalise output path (always ends with / if set)
  const output = opts.output
    ? (/[/\\]$/.test(opts.output) ? opts.output : opts.output + '/')
    : '';

  if (output) fs.mkdirSync(output, { recursive: true });

  console.log(` * Seed:   ${opts.seed}`);
  console.log(` * Output: ${output || '(same directories as source)'}\n`);

  // 1. Load project-specific skip terms from external file
  const skipTerms = loadExcludeList(opts.excludeList);
  if (skipTerms.length > 0) {
    console.log(`[exclude-list] ${skipTerms.length} term(s) loaded from: ${opts.excludeList}`);
  }

  // 2. Build exclusion set from --exclude CSS files
  const excludedSelectors = new Set();
  for (const f of globlist(opts.exclude)) {
    getDefinitions(fs.readFileSync(f, 'utf8'), skipTerms)
      .forEach(s => excludedSelectors.add(s));
  }
  if (excludedSelectors.size > 0) {
    console.log(`[exclude] ${excludedSelectors.size} selector(s) excluded via: ${opts.exclude}`);
  }

  // 3. Build obfuscation map from include CSS files
  console.log('Building obfuscation map...');
  const includeFiles = globlist(opts.include);
  if (includeFiles.length === 0) {
    console.error(`[error] No CSS files matched pattern: ${opts.include}`);
    process.exit(1);
  }

  const csss = {};  // filePath → raw CSS string (mutated in place)
  const map  = {};  // '.className' or '#id' → { sym, origin, obfused }

  let globalIndex = 0;
  for (const filePath of includeFiles) {
    const css  = fs.readFileSync(filePath, 'utf8');
    const defs = getDefinitions(css, skipTerms);
    csss[filePath] = css;

    for (const selector of defs) {
      if (!excludedSelectors.has(selector) && !map[selector]) {
        map[selector] = {
          sym:     selector[0],
          origin:  selector.slice(1),
          obfused: SAFE_PREFIX + hashids.encode(globalIndex + opts.seed),
        };
        globalIndex++;
      }
    }
  }

  console.log(` - ${Object.keys(map).length} unique selector(s) across ${includeFiles.length} CSS file(s)\n`);

  // 4. Load HTML/PHP/Vue/JSX apply files as cheerio DOMs
  const applyFiles = globlist(opts.apply);
  const doms = {};
  if (applyFiles.length > 0) {
    console.log('Loading apply files...');
    for (const filePath of applyFiles) {
      console.log(`  ${filePath}`);
      const html    = fs.readFileSync(filePath, 'utf8');
      // xmlMode for non-HTML files (PHP, Vue, JSX) to prevent tag normalisation
      const xmlMode = !/\.(html|htm)$/i.test(filePath);
      doms[filePath] = cheerio.load(html, { decodeEntities: false, xmlMode });
    }
    console.log();
  }

  // 5. Apply obfuscation to CSS strings and DOM trees
  console.log('Obfuscating...');
  for (const [, obj] of Object.entries(map)) {
    // CSS: regex replace — lookahead ensures only selector positions are matched
    const re = new RegExp(
      `\\${obj.sym}${_.escapeRegExp(obj.origin)}(?=[#.,{\\[\\(\\s]|$)`,
      'g'
    );
    for (const f of Object.keys(csss)) {
      csss[f] = csss[f].replace(re, obj.sym + obj.obfused);
    }

    // HTML-like: cheerio DOM replacement
    for (const f of Object.keys(doms)) {
      const $ = doms[f];
      if (obj.sym === '#') {
        $(`#${obj.origin}`).attr('id', obj.obfused);
      } else {
        $(`.${obj.origin}`).removeClass(obj.origin).addClass(obj.obfused);
      }
    }
  }

  // 6. Write output files
  console.log('Writing output files...');
  const written = [];

  for (const [f, content] of Object.entries(csss)) {
    const dest = toOutputPath(f, output);
    safeWrite(dest, content);
    written.push(dest);
  }
  for (const [f, $] of Object.entries(doms)) {
    const dest = toOutputPath(f, output);
    safeWrite(dest, $.html());
    written.push(dest);
  }

  // 7. Write map with metadata
  const mapPath = output
    ? path.join(output, 'easy-obfuscator.map.json')
    : 'easy-obfuscator.map.json';
  const report  = {
    tool:      'easy-obfuscator',
    version:   '1.0.0',
    generated: new Date().toISOString(),
    seed:      opts.seed,
    stats: {
      obfuscated: Object.keys(map).length,
      skipped:    excludedSelectors.size,
      files:      written.length,
    },
    map,
  };
  safeWrite(mapPath, JSON.stringify(report, null, 2));

  const line = '-'.repeat(52);
  console.log(`\n${line}`);
  console.log(`  Selectors obfuscated : ${report.stats.obfuscated}`);
  console.log(`  Selectors skipped    : ${report.stats.skipped}`);
  console.log(`  Files written        : ${report.stats.files}`);
  console.log(`  Map                  : ${mapPath}`);
  console.log(`${line}\n`);
}

module.exports = { run };
