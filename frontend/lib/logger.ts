type LogContext = Record<string, string | number | boolean | undefined>;

function write(level: "info" | "warn" | "error", message: string, context?: LogContext): void {
  const entry = { level, message, ...context };
  // Server-side only: Server Actions/Route Handlers run on the server, so
  // this lands in the server process log, never the browser console.
  console[level](JSON.stringify(entry));
}

export const logger = {
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context),
};
