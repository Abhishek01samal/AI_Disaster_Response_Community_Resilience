import swaggerAutogen from "swagger-autogen";
import { ENV } from "./env.js";

const doc = {
  info: {
    title: "ResQ API",
    description:
      "API documentation for ResQ — an AI-powered flood intelligence and emergency response platform.",
    version: "1.0.0",
  },

  host: `${ENV.BACKEND_URL}`,
};

const outputFile = "../../swagger-output.json";
const endpointsFiles = ["./src/app.ts"];

/*
 * NOTE: If you are using the Express Router, you must pass in the
 * root file where the routes start, such as index.js, app.js,
 * routes.js, etc.
 */

swaggerAutogen()(outputFile, endpointsFiles, doc);
