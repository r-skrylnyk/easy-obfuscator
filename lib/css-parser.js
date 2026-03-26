'use strict';

const _ = require('lodash');

// Captures .className and #idName
const DEFINITIONS_CAP = /([#.][\w-]+)/g;

// Strip everything that is NOT a selector
const STRIP = {
  defs:     /\{[^\}]*?\}/g,      // rule bodies  { ... }
  comments: /\/\*[\s\S]*?\*\//g, // block comments /* ... */
  scope:    /\([\s\S]*?\)/g,     // @media conditions (...)
  query:    /\[[\s\S]*?\]/g,     // attribute selectors [...]
};

/**
 * Extract all unique class and ID selectors from a CSS string.
 *
 * @param {string}   cssString  - raw CSS content
 * @param {string[]} skipTerms  - plain-text substrings to strip before parsing
 *                                (project-specific names that must never be obfuscated)
 * @returns {string[]} unique selectors, e.g. ['.foo', '#bar']
 */
function getDefinitions(cssString, skipTerms = []) {
  let s = cssString;

  // Strip rule bodies, comments, media conditions and attribute selectors
  for (const key in STRIP) {
    s = s.replace(STRIP[key], '');
  }

  // Strip caller-supplied terms so they are never captured
  if (skipTerms.length > 0) {
    const escaped = skipTerms.map(t => _.escapeRegExp(t));
    s = s.replace(new RegExp(escaped.join('|'), 'g'), '');
  }

  // Reset global regex state before every call (required for /g regexes)
  DEFINITIONS_CAP.lastIndex = 0;

  const found = [];
  let m;
  while ((m = DEFINITIONS_CAP.exec(s)) !== null) {
    found.push(m[1]);
  }

  return _.uniq(found);
}

module.exports = { getDefinitions };
