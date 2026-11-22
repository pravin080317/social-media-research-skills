import test from 'node:test';
import assert from 'node:assert/strict';
import {redact, createLogger} from '../src/logger.js';

test('redacts secrets recursively', () => {
  assert.deepEqual(redact({apiKey: 'secret', nested: {authorization: 'bearer', value: 2}}), {
    apiKey: '[REDACTED]', nested: {authorization: '[REDACTED]', value: 2},
  });
});

test('writes structured JSON logs', () => {
  const lines = [];
  createLogger({runId: 'run-1', write: (line) => lines.push(line)}).info('test.event', {count: 1});
  const parsed = JSON.parse(lines[0]);
  assert.equal(parsed.run_id, 'run-1');
  assert.equal(parsed.event, 'test.event');
  assert.equal(parsed.count, 1);
});
