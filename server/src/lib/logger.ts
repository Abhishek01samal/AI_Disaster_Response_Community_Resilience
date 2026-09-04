import { createLogger, format, transports } from "winston";
import { ENV } from "./env.js";

const { combine, timestamp, json, colorize, printf } = format;

// Console format
const consoleLogFormat = combine(
  colorize(),
  timestamp(),
  printf(({ level, message, timestamp, service }) => {
    return `[${timestamp}] [${service}] ${level}: ${message}`;
  })
);

const logger = createLogger({
  level: ENV.LOG_LEVEL,
  defaultMeta: {
    service: ENV.SERVICE_NAME,
  },
  format: combine(timestamp(), json()),
  transports: [
    new transports.Console({
      format: consoleLogFormat,
    }),
  ],
});

export default logger;
