import test from 'node:test';
import assert from 'node:assert/strict';
import {createRunId} from '../src/run-id.js';

test('creates a deterministic run ID', () => {
  const input = {startedAt: '2026-11-22T08:00:00.000Z', configurationDigest: 'a'.repeat(64), trigger: 'schedule', attempt: 1};
  assert.equal(createRunId(input), createRunId(input));
  assert.match(createRunId(input), /^20261122T080000Z-[a-f0-9]{12}$/);
});

test('changes the run ID for a new attempt', () => {
  const base = {startedAt: '2026-11-22T08:00:00.000Z', configurationDigest: 'a'.repeat(64), trigger: 'schedule'};
  assert.notEqual(createRunId({...base, attempt: 1}), createRunId({...base, attempt: 2}));
});
