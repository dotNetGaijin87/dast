import pino from 'pino';
import type { Logger } from '../../application/ports/Logger';

export function createPino(opts: { level: string; pretty: boolean }): pino.Logger {
  return pino({
    level: opts.level,
    ...(opts.pretty
      ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } } }
      : {}),
  });
}

export function toLogger(p: pino.Logger): Logger {
  return {
    info: (obj, msg) => p.info(obj as object, msg),
    warn: (obj, msg) => p.warn(obj as object, msg),
    error: (obj, msg) => p.error(obj as object, msg),
    debug: (obj, msg) => p.debug(obj as object, msg),
    child: (bindings) => toLogger(p.child(bindings)),
  };
}
