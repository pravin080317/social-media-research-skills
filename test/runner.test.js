import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {runPublication} from '../src/runner.js';

test('produces a deterministic schema-valid empty-run manifest', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'publication-run-'));
  const source = await readFile('config/publication.yml', 'utf8');
  const configPath = path.join(directory, 'publication.yml');
  await writeFile(configPath, source
    .replace('artifacts_directory: artifacts', `artifacts_directory: ${path.join(directory, 'artifacts')}`)
    .replace('state_directory: .state', `state_directory: ${path.join(directory, 'state')}`));

  const logs = [];
  const result = await runPublication({
    configPath,
    startedAt: '2026-11-22T08:00:00.000Z',
    trigger: 'test',
    writeLog: (line) => logs.push(JSON.parse(line)),
  });

  assert.equal(result.manifest.status, 'no_content');
  assert.equal(result.manifest.counts.collected, 0);
  assert.equal(logs.at(-1).event, 'run.completed');
  assert.deepEqual(JSON.parse(await readFile(result.manifestPath, 'utf8')), result.manifest);
});
