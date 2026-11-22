import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {FileStateStore} from '../src/file-state-store.js';

test('stores and retrieves state atomically', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'publication-state-'));
  const store = new FileStateStore(directory);
  assert.equal(await store.get('last-run'), undefined);
  await store.put('last-run', {status: 'no_content'});
  assert.deepEqual(await store.get('last-run'), {status: 'no_content'});
});

test('rejects unsafe state keys', async () => {
  const store = new FileStateStore('/tmp/not-used');
  await assert.rejects(store.put('../escape', {}), /Invalid state key/);
});
