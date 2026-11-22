const SENSITIVE_KEY = /(authorization|api[-_]?key|token|secret|password|cookie)/i;

export function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, SENSITIVE_KEY.test(key) ? '[REDACTED]' : redact(item)]));
  }
  return value;
}

export function createLogger({runId, write = (line) => process.stdout.write(`${line}\n`)}) {
  const emit = (level, event, data = {}) => write(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    run_id: runId,
    ...redact(data),
  }));
  return {
    info: (event, data) => emit('info', event, data),
    warn: (event, data) => emit('warn', event, data),
    error: (event, data) => emit('error', event, data),
  };
}
