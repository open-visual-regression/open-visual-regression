import pino from "pino";
import pretty from "pino-pretty";

export type LoggerOptions = {
  level?: pino.LevelOrString;
  filePath?: string;
  production?: boolean;
};

export const createRootLogger = (options: LoggerOptions = {}): pino.Logger => {
  const level = options.level ?? process.env.LOG_LEVEL ?? "info";
  const filePath = options.filePath ?? process.env.LOG_FILE_PATH;
  const production = options.production ?? process.env.NODE_ENV === "production";

  const streams: pino.StreamEntry<pino.LevelOrString>[] = [
    { level, stream: production ? process.stdout : pretty({ colorize: true }) },
  ];

  if (filePath) {
    streams.push({ level, stream: pino.destination({ dest: filePath, mkdir: true, sync: true }) });
  }

  return pino({ level }, pino.multistream(streams));
};

const root = createRootLogger();

export const logger = root;

export const createLogger = (name: string) => root.child({ name });
