import express, { type Express } from "express";
import { rootRouter } from "./routes/root.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger-output.json" with { type: "json" };
import cookieParser from "cookie-parser";
import { rateLimiter } from "./middlewares/rate-limit-middleware.js";
import { userRouter } from "./routes/user.routes.js";
import cors from "cors";
import { ENV } from "./lib/env.js";
import errorMiddleware from "./middlewares/error-middleware.js";
import morganMiddleware from "./middlewares/morgan-middleware.js";

const app: Express = express();

app.use(
  cors({
    origin: `${ENV.FRONTEND_URL}`,
    methods: ["POST", "GET", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options(/.*/, cors());

app.use(morganMiddleware);

app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);
app.use(rateLimiter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("", rootRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);

app.use(errorMiddleware);

export default app;
