#!/usr/bin/env node
import {resolve} from 'node:path';
import {loadConfig} from './config.js';
import {runPublication} from './runner.js';

function valueAfter(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const configPath = resolve(valueAfter('--config') || 'config/publication.yml');

try {
  if (process.argv.includes('--validate-only')) {
    const {digest} = await loadConfig(configPath);
    process.stdout.write(`${JSON.stringify({status: 'valid', config: configPath, digest})}\n`);
  } else {
    const result = await runPublication({
      configPath,
      startedAt: valueAfter('--started-at') || new Date().toISOString(),
      trigger: valueAfter('--trigger') || process.env.PUBLICATION_TRIGGER || 'manual',
      attempt: Number(valueAfter('--attempt') || process.env.GITHUB_RUN_ATTEMPT || 1),
    });
    process.stdout.write(`${JSON.stringify({status: result.manifest.status, run_id: result.manifest.run_id, manifest: result.manifestPath})}\n`);
  }
} catch (error) {
  process.stderr.write(`${JSON.stringify({status: 'failed', error: error.message})}\n`);
  process.exitCode = 1;
}
