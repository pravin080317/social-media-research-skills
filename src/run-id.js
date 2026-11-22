import {createHash} from 'node:crypto';

export function createRunId({startedAt, configurationDigest, trigger, attempt = 1}) {
  const instant = new Date(startedAt);
  if (Number.isNaN(instant.valueOf())) throw new Error('startedAt must be a valid date');
  const timestamp = instant.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const suffix = createHash('sha256')
    .update(`${instant.toISOString()}|${configurationDigest}|${trigger}|${attempt}`)
    .digest('hex')
    .slice(0, 12);
  return `${timestamp}-${suffix}`;
}
