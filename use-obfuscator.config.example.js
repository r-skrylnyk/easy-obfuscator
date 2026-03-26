// use-obfuscator.config.js
//
// Place this file in your project root.
// CLI flags always override config file values.

module.exports = {

  // ── Input ──────────────────────────────────────────────────────────────────
  // CSS file(s) to read class/ID definitions from.
  // Accepts: string, comma-separated string, array, or glob pattern.
  include: 'style.css',
  // include: ['style.css', 'components/*.css'],

  // ── Apply ──────────────────────────────────────────────────────────────────
  // Files to apply obfuscation to.
  // Supported: .html, .htm, .php, .vue, .jsx, .tsx
  apply: 'index.html',
  // apply: ['index.html', 'about.html', 'partials/*.php'],

  // ── Output ─────────────────────────────────────────────────────────────────
  // Directory to write obfuscated files into.
  // Default: same location as source files (in-place).
  output: './dist',

  // ── Seed ───────────────────────────────────────────────────────────────────
  // Fixed seed for reproducible builds (same seed → same obfuscated names).
  // Omit or set to null to use Date.now() (different result each run).
  seed: 42,

  // ── Exclude CSS ────────────────────────────────────────────────────────────
  // CSS file(s) whose classes/IDs should NOT be obfuscated.
  // Useful for third-party libraries (e.g. Bootstrap, Tailwind).
  // exclude: 'node_modules/bootstrap/dist/css/bootstrap.min.css',

  // ── Exclude List ───────────────────────────────────────────────────────────
  // Path to a .json or .txt file listing class/ID names to skip.
  //
  // JSON format:  ["navbar", "active", "show", "collapse"]
  // TXT format:   one name per line (leading . or # optional):
  //                 navbar
  //                 .active
  //                 #sidebar
  //
  // excludeList: 'exclude-classes.json',

};
