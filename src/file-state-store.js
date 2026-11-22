import {mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';

export class FileStateStore {
  constructor(directory) {
    this.directory = directory;
  }

  async get(key) {
    try {
      return JSON.parse(await readFile(this.#path(key), 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    }
  }

  async put(key, value) {
    await mkdir(this.directory, {recursive: true});
    const target = this.#path(key);
    const temporary = `${target}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {encoding: 'utf8', mode: 0o600});
    await rename(temporary, target);
  }

  #path(key) {
    if (!/^[a-zA-Z0-9._-]+$/.test(key)) throw new Error('Invalid state key');
    return path.join(this.directory, `${key}.json`);
  }
}
