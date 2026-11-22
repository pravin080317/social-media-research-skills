import {readFile} from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export function createEmptyManifest({runId, trigger, startedAt, completedAt, configurationDigest}) {
  return {
    schema_version: '1.0',
    run_id: runId,
    trigger,
    started_at: startedAt,
    completed_at: completedAt,
    status: 'no_content',
    configuration_digest: configurationDigest,
    stages: [
      {name: 'configuration', status: 'succeeded'},
      {name: 'foundation', status: 'succeeded'},
    ],
    counts: {collected: 0, duplicates: 0, selected: 0, drafted: 0},
    outputs: [],
    errors: [],
  };
}

export async function validateManifest(manifest, schemaPath = new URL('../schemas/run.schema.json', import.meta.url)) {
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  const ajv = new Ajv2020({allErrors: true, strict: true});
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(manifest)) throw new Error(`Invalid run manifest: ${ajv.errorsText(validate.errors)}`);
  return manifest;
}
