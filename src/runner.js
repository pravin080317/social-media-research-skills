import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {loadConfig} from './config.js';
import {createRunId} from './run-id.js';
import {createLogger} from './logger.js';
import {FileStateStore} from './file-state-store.js';
import {acquireRunLock} from './lock.js';
import {createEmptyManifest, validateManifest} from './manifest.js';

export async function runPublication({configPath, startedAt = new Date().toISOString(), trigger = 'manual', attempt = 1, writeLog}) {
  const {config, digest} = await loadConfig(configPath);
  const runId = createRunId({startedAt, configurationDigest: digest, trigger, attempt});
  const logger = createLogger({runId, write: writeLog});
  const release = await acquireRunLock(config.runtime.state_directory);
  try {
    logger.info('run.started', {trigger, configuration_digest: digest});
    const completedAt = new Date().toISOString();
    const manifest = await validateManifest(createEmptyManifest({
      runId,
      trigger,
      startedAt: new Date(startedAt).toISOString(),
      completedAt,
      configurationDigest: digest,
    }));
    await mkdir(config.runtime.artifacts_directory, {recursive: true});
    const manifestPath = path.join(config.runtime.artifacts_directory, `${runId}.manifest.json`);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await new FileStateStore(config.runtime.state_directory).put('last-run', manifest);
    logger.info('run.completed', {status: manifest.status, manifest_path: manifestPath});
    return {manifest, manifestPath};
  } finally {
    await release();
  }
}
