import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import YAML from 'yaml';

export async function loadConfig(configPath, schemaPath = new URL('../schemas/publication.schema.json', import.meta.url)) {
  const [source, schemaSource] = await Promise.all([
    readFile(configPath, 'utf8'),
    readFile(schemaPath, 'utf8'),
  ]);
  const config = YAML.parse(source);
  const schema = JSON.parse(schemaSource);
  const ajv = new Ajv2020({allErrors: true, strict: true});
  const validate = ajv.compile(schema);
  if (!validate(config)) {
    const detail = validate.errors.map(({instancePath, message}) => `${instancePath || '/'} ${message}`).join('; ');
    throw new Error(`Invalid publication configuration: ${detail}`);
  }

  const topicIds = config.topics.map(({id}) => id);
  if (new Set(topicIds).size !== topicIds.length) {
    throw new Error('Invalid publication configuration: topic IDs must be unique');
  }

  return {
    config,
    digest: createHash('sha256').update(source).digest('hex'),
  };
}
