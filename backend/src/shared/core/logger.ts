import type { Context } from 'aws-lambda';
import { LOG_LEVEL, STAGE } from './env.js';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LEVEL_ORDER: Record<LogLevel, number> = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const MIN_LEVEL: LogLevel = (LOG_LEVEL as LogLevel | undefined) ?? 'INFO';

function shouldEmit(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[MIN_LEVEL];
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      errorName: err.name,
      errorMessage: err.message,
      stack: err.stack?.split('\n').map((line) => line.trim()) ?? [],
    };
  }
  return { rawError: String(err) };
}

interface LogEntry {
  readonly level: LogLevel;
  readonly timestamp: string;
  readonly message: string;
  readonly fn: string;
  readonly stage: string;
  readonly requestId: string;
  readonly remainingMs?: number;
  readonly memoryMb?: number;
  readonly [key: string]: unknown;
}

function buildEntry(
  level: LogLevel,
  message: string,
  base: Record<string, unknown>,
  extra: Record<string, unknown>,
  ctx: Context | undefined,
): LogEntry {
  return {
    level,
    timestamp: new Date().toISOString(),
    message,
    fn: String(base['fn'] ?? 'unknown'),
    stage: STAGE,
    requestId: String(base['requestId'] ?? ctx?.awsRequestId ?? 'local'),
    ...(ctx !== undefined && {
      remainingMs: ctx.getRemainingTimeInMillis(),
      memoryMb: Number(ctx.memoryLimitInMB),
    }),
    ...base,
    ...extra,
  };
}

function emit(entry: LogEntry): void {
  const line = JSON.stringify(entry);
  if (entry.level === 'ERROR' || entry.level === 'WARN') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export interface Logger {
  readonly debug: (message: string, extra?: Record<string, unknown>) => void;
  readonly info: (message: string, extra?: Record<string, unknown>) => void;
  readonly warn: (message: string, extra?: Record<string, unknown>) => void;
  readonly error: (message: string, err?: unknown, extra?: Record<string, unknown>) => void;
  readonly timer: () => (label: string, extra?: Record<string, unknown>) => void;
  readonly child: (extra: Record<string, unknown>) => Logger;
}

export function createLogger(functionName: string, ctx?: Context): Logger {
  const base: Record<string, unknown> = {
    fn: functionName,
    ...(ctx !== undefined && { requestId: ctx.awsRequestId }),
  };

  function write(level: LogLevel, message: string, extra: Record<string, unknown> = {}): void {
    if (!shouldEmit(level)) return;
    emit(buildEntry(level, message, base, extra, ctx));
  }

  return makeLogger(base, ctx, write);
}

function makeLogger(
  base: Record<string, unknown>,
  ctx: Context | undefined,
  write: (level: LogLevel, msg: string, extra?: Record<string, unknown>) => void,
): Logger {
  return {
    debug: (message, extra) => write('DEBUG', message, extra),
    info: (message, extra) => write('INFO', message, extra),
    warn: (message, extra) => write('WARN', message, extra),
    error: (message, err, extra) =>
      write('ERROR', message, {
        ...extra,
        ...(err !== undefined ? serializeError(err) : {}),
      }),
    timer: () => {
      const start = Date.now();
      return (label, extra) =>
        write('INFO', label, { ...extra, durationMs: Date.now() - start });
    },
    child: (extra) => {
      const childBase = { ...base, ...extra };
      function childWrite(level: LogLevel, message: string, childExtra: Record<string, unknown> = {}): void {
        if (!shouldEmit(level)) return;
        emit(buildEntry(level, message, childBase, childExtra, ctx));
      }
      return makeLogger(childBase, ctx, childWrite);
    },
  };
}
