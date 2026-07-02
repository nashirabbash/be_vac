import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "trace",
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});