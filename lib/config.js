'use strict';

const fs   = require('fs');
const path = require('path');

/**
 * Load use-obfuscator config file.
 * Looks for: explicit path → use-obfuscator.config.js → use-obfuscator.config.json
 * Returns empty object if no config found.
 */
function loadConfig(configPath) {
  const candidates = [
    configPath,
    'use-obfuscator.config.js',
    'use-obfuscator.config.json',
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (fs.existsSync(resolved)) {
      console.log(`[config] Loaded: ${resolved}\n`);
      if (resolved.endsWith('.json')) {
        return JSON.parse(fs.readFileSync(resolved, 'utf8'));
      }
      return require(resolved);
    }
  }

  return {};
}

module.exports = { loadConfig };
