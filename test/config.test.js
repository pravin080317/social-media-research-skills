import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {loadConfig} from '../src/config.js';

test('loads the production configuration', async () => {
  const result = await loadConfig('config/publication.yml');
  assert.equal(result.config.publication.auto_publish, false);
  assert.equal(result.config.editor.human_approval_required, true);
  assert.equal(result.config.topics.length, 5);
  assert.match(result.digest, /^[a-f0-9]{64}$/);
});

test('rejects configuration that enables automatic publication', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'publication-config-'));
  const source = await import('node:fs/promises').then(({readFile}) => readFile('config/publication.yml', 'utf8'));
  const configPath = path.join(directory, 'invalid.yml');
  await writeFile(configPath, source.replace('auto_publish: false', 'auto_publish: true'));
  await assert.rejects(loadConfig(configPath), /Invalid publication configuration/);
});
