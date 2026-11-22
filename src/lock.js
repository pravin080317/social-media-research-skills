import {mkdir, open, rm} from 'node:fs/promises';
import path from 'node:path';

export async function acquireRunLock(stateDirectory) {
  await mkdir(stateDirectory, {recursive: true});
  const lockPath = path.join(stateDirectory, 'runner.lock');
  let handle;
  try {
    handle = await open(lockPath, 'wx', 0o600);
    await handle.writeFile(JSON.stringify({pid: process.pid, acquired_at: new Date().toISOString()}));
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Another publication run owns ${lockPath}`);
    throw error;
  }
  return async () => {
    await handle.close();
    await rm(lockPath, {force: true});
  };
}
