#!/usr/bin/env node
'use strict';

const { Command } = require('commander');
const { run }     = require('./lib/core');
const { loadConfig } = require('./lib/config');

const BANNER = `
+----------------------------------------------------+
|         easy-obfuscator  v1.0.0                    |
|  CSS/HTML obfuscation with config file support     |
|  github.com/r-skrylnyk/easy-obfuscator             |
+----------------------------------------------------+
`;

process.argv[1] = 'easy-obfuscator';

const program = new Command();

program
  .name('easy-obfuscator')
  .description('CSS/HTML class & ID obfuscator with config file and multi-format support')
  .version('1.0.0')
  .argument('[include]', '.css file(s) to read classes/IDs from (comma-separated or glob)')
  .option('-a, --apply <files>',        'HTML/PHP/Vue/JSX files to apply obfuscation to')
  .option('-o, --output <dir>',         'output directory')
  .option('-e, --exclude <files>',      '.css file(s) whose classes should NOT be obfuscated')
  .option('-x, --exclude-list <file>',  'path to .json or .txt file with class/ID names to skip')
  .option('-s, --seed <number>',        'integer seed for reproducible obfuscation')
  .option('-c, --config <file>',        'path to config file (default: easy-obfuscator.config.js)')
  .action(async (include, opts) => {
    console.log(BANNER);

    const config = loadConfig(opts.config);

    const seed = opts.seed != null
      ? parseInt(opts.seed, 10)
      : (config.seed != null ? config.seed : Date.now());

    const finalOpts = {
      include:     include            || config.include,
      apply:       opts.apply         || config.apply,
      output:      opts.output        || config.output  || '',
      exclude:     opts.exclude       || config.exclude,
      excludeList: opts.excludeList   || config.excludeList,
      seed,
    };

    if (!finalOpts.include) {
      console.error('[error] No CSS files specified. Pass a file argument or create easy-obfuscator.config.js\n');
      program.help({ error: true });
      return;
    }

    await run(finalOpts);
  })
  .parse(process.argv);
