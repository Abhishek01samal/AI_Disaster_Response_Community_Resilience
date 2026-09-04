import morgan from "morgan";
import logger from "../lib/logger.js";

const morganFormat = ":method :url :status :response-time ms";

const morganMiddleware = morgan(morganFormat, {
  stream: {
    write: (message) => {
      const [method, url, status, responseTime] = message.trim().split(" ");

      logger.info(`${method} ${url} ${status} - ${responseTime}ms`);
    },
  },
});

export default morganMiddleware;
