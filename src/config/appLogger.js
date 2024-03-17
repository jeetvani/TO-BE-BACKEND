const winston = require("winston");
const { colorize, combine, timestamp, printf } = winston.format;

// Define log format
const myFormat = printf(({ level, message, timestamp }) => {
  return `[${process.env.APP_NAME} - ${timestamp}] ${level}: ${message}`;
});

// Define logger instance
const appLogger = winston.createLogger({
  level: "info",
  format: combine(timestamp(), colorize(), myFormat),
  transports: [new winston.transports.Console()],
});


module.exports = { appLogger };