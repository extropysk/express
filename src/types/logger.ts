export interface LogFn {
  <T extends object>(obj: T, msg?: string, ...args: any[]): void
  (obj: unknown, msg?: string, ...args: any[]): void
  (msg: string, ...args: any[]): void
}

export interface Logger {
  debug: LogFn
  error: LogFn
  fatal: LogFn
  info: LogFn
  level: string
  silent: LogFn
  trace: LogFn
  warn: LogFn
}
