'use strict';

/**
 * Structured logger.
 *
 * - Development: human-readable single-line output, colourised.
 * - Production: JSON lines to stdout (scraped by the container runtime) and
 *   a daily-rotated file under LOG_DIR.
 *
 * We expose a `.stream` that morgan can pipe HTTP access logs through so
 * everything flows to the same place.
 */

const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

const {
  NODE_ENV = 'development',
  LOG_LEVEL = NODE_ENV === 'production' ? 'info' : 'debug',
  LOG_DIR = path.join(__dirname, '..', 'logs'),
} = process.env;

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, ...rest }) => {
    const meta = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
    return `${timestamp} ${level} ${message}${meta}`;
  })
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: NODE_ENV === 'production' ? prodFormat : devFormat,
    handleExceptions: true,
  }),
];

if (NODE_ENV === 'production') {
  transports.push(
    new winston.transports.DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'aspm-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: prodFormat,
    })
  );
}

const logger = winston.createLogger({
  level: LOG_LEVEL,
  transports,
  exitOnError: false,
});

// morgan-compatible stream
logger.stream = {
  write: (message) => logger.info(message.trim()),
};

module.exports = logger;
